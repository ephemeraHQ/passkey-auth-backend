const {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');
const { isoBase64URL } = require('@simplewebauthn/server/helpers');
const crypto = require('crypto');
const config = require('../config');
const redisService = require('./redis.service');

class WebAuthnService {
  async generateRegistrationOptions(displayName) {
    const userID = crypto.randomBytes(32);
    
    const options = await generateRegistrationOptions({
      rpName: config.webauthn.rpName,
      rpID: config.webauthn.rpID,
      userID,
      userName: displayName,
      attestationType: config.webauthn.attestationType,
      authenticatorSelection: config.webauthn.authenticatorSelection,
    });

    await redisService.storeChallenge(options.challenge, {
      userID: userID.toString('base64url'),
      displayName,
    });

    return options;
  }

  async verifyRegistration(attestationResponse) {
    const clientDataJSON = JSON.parse(
      Buffer.from(attestationResponse.response.clientDataJSON, 'base64').toString()
    );
    const challenge = clientDataJSON.challenge;
    
    const storedData = await redisService.getChallenge(challenge);
    if (!storedData) {
      throw new Error('Challenge not found or expired');
    }

    const { userID, displayName } = storedData;
    const userIDBuffer = Buffer.from(userID, 'base64url');

    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge: challenge,
      expectedOrigin: config.webauthn.origin,
      expectedRPID: config.webauthn.rpID,
      requireUserVerification: false,
      supportedAlgorithmIDs: [-7, -257],
    });

    if (!verification.verified) {
      throw new Error('Registration verification failed');
    }

    const credentialPublicKey = verification.registrationInfo.credential.publicKey;

    // Store the credential in Redis
    await redisService.storeCredential(attestationResponse.id, {
      userID,
      displayName,
      credentialPublicKey: isoBase64URL.fromBuffer(Buffer.from(credentialPublicKey)),
      counter: 0,
    });

    await redisService.deleteChallenge(challenge);

    return {
      userID,
      credentialID: attestationResponse.id,
    };
  }

  async generateAuthenticationOptions() {
    const options = await generateAuthenticationOptions({
      rpID: config.webauthn.rpID,
      userVerification: 'preferred',
    });

    await redisService.storeChallenge(options.challenge, { type: 'login' });
    return options;
  }

  async verifyAuthentication(authenticationResponse) {
    const clientDataJSON = JSON.parse(
      Buffer.from(authenticationResponse.response.clientDataJSON, 'base64').toString()
    );
    const challenge = clientDataJSON.challenge;
    
    const storedChallenge = await redisService.getChallenge(challenge);
    if (!storedChallenge || storedChallenge.type !== 'login') {
      throw new Error('Challenge not found - please try logging in again');
    }

    const storedCredential = await redisService.getCredential(authenticationResponse.id);
    if (!storedCredential) {
      throw new Error('Credential not found');
    }

    const credentialPublicKey = isoBase64URL.toBuffer(storedCredential.credentialPublicKey);

    const verification = await verifyAuthenticationResponse({
      response: authenticationResponse,
      expectedChallenge: challenge,
      expectedOrigin: config.webauthn.origin,
      expectedRPID: config.webauthn.rpID,
      credential: {
        id: authenticationResponse.id,
        publicKey: credentialPublicKey,
        counter: storedCredential.counter,
      },
    });

    await redisService.deleteChallenge(challenge);

    if (!verification.verified) {
      throw new Error('Login verification failed');
    }

    // Update stored counter in Redis
    await redisService.updateCredentialCounter(
      authenticationResponse.id,
      verification.authenticationInfo.newCounter
    );

    return {
      userID: storedCredential.userID,
      credentialID: authenticationResponse.id,
    };
  }
}

module.exports = new WebAuthnService(); 