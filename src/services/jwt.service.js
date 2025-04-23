const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const redisService = require('./redis.service');

class JWTService {
  constructor() {
    this.keyPairs = new Map();
    this.currentKeyId = null;
    this.initializeKeys();
  }

  async initializeKeys() {
    // Generate initial key pair
    await this.generateNewKeyPair();
    
    // Schedule key rotation
    setInterval(() => this.rotateKeys(), 24 * 60 * 60 * 1000); // Rotate every 24 hours
  }

  async generateNewKeyPair() {
    const keyPair = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem'
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem'
      }
    });

    // Use JWT_SECRET to derive a deterministic key ID
    const keyId = crypto
      .createHash('sha256')
      .update(config.jwt.secret)
      .digest('hex')
      .slice(0, 32); // Use first 32 chars for a reasonable length
    
    // Store key pair with metadata
    this.keyPairs.set(keyId, {
      keyPair,
      createdAt: Date.now(),
      expiresAt: Date.now() + (48 * 60 * 60 * 1000) // 48 hours validity
    });

    // Set as current key if none exists
    if (!this.currentKeyId) {
      this.currentKeyId = keyId;
    }

    return keyId;
  }

  async rotateKeys() {
    try {
      // Generate new key pair
      const newKeyId = await this.generateNewKeyPair();
      
      // Set as current key
      this.currentKeyId = newKeyId;
      
      // Clean up expired keys (older than 48 hours)
      const now = Date.now();
      for (const [keyId, data] of this.keyPairs.entries()) {
        if (data.expiresAt < now) {
          this.keyPairs.delete(keyId);
        }
      }
    } catch (error) {
      console.error('Error rotating keys:', error);
    }
  }

  getJWKS() {
    const jwks = {
      keys: []
    };

    // Include all valid keys in JWKS
    for (const [keyId, data] of this.keyPairs.entries()) {
      if (data.expiresAt > Date.now()) {
        const publicKey = data.keyPair.publicKey;
        
        // Parse the PEM public key to extract modulus and exponent
        const keyBuffer = crypto.createPublicKey(publicKey).export({ type: 'spki', format: 'der' });
        const asn1 = require('asn1.js');
        
        // Define the ASN.1 structure for RSA public key
        const RSAPublicKey = asn1.define('RSAPublicKey', function() {
          this.seq().obj(
            this.key('algorithm').seq().obj(
              this.key('algorithm').objid(),
              this.key('parameters').null_()
            ),
            this.key('subjectPublicKey').bitstr()
          );
        });

        const SubjectPublicKeyInfo = asn1.define('SubjectPublicKeyInfo', function() {
          this.seq().obj(
            this.key('modulus').int(),
            this.key('publicExponent').int()
          );
        });

        // First decode the outer structure
        const outer = RSAPublicKey.decode(keyBuffer, 'der');
        // Then decode the inner bitstring containing the actual RSA key
        const inner = SubjectPublicKeyInfo.decode(outer.subjectPublicKey.data, 'der');
        
        // Convert to base64url encoding
        const n = Buffer.from(inner.modulus.toArray('be')).toString('base64url');
        const e = Buffer.from(inner.publicExponent.toArray('be')).toString('base64url');

        const jwk = {
          kty: 'RSA',
          kid: keyId,
          n: n,
          e: e,
          alg: 'RS256',
          use: 'sig'
        };

        jwks.keys.push(jwk);
      }
    }

    return jwks;
  }

  async sign(payload) {
    const currentKey = this.keyPairs.get(this.currentKeyId);
    if (!currentKey) {
      throw new Error('No valid signing key available');
    }

    // Add standard claims
    const tokenPayload = {
      ...payload,
      iat: Math.floor(Date.now() / 1000), // Issued at
      jti: crypto.randomBytes(16).toString('hex'), // Unique token ID
    };

    // Sign token
    const token = jwt.sign(tokenPayload, currentKey.keyPair.privateKey, {
      algorithm: 'RS256',
      keyid: this.currentKeyId,
      expiresIn: config.jwt.expiresIn
    });

    const decoded = jwt.decode(token, { complete: true });

    // Calculate expiration time in seconds
    const expiresIn = parseInt(config.jwt.expiresIn.replace('h', '')) * 60 * 60;

    // Store token ID in Redis for revocation checking
    await redisService.redis.set(
      `token:${tokenPayload.jti}`,
      'valid',
      { ex: expiresIn }
    );

    return token;
  }

  async verify(token) {
    try {
      // Get token header to find the key ID
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new Error('Invalid token format');
      }

      // Find the key used to sign the token
      const keyData = this.keyPairs.get(decoded.header.kid);
      if (!keyData) {
        throw new Error('Token signed with unknown key');
      }

      // Verify token signature
      const payload = jwt.verify(token, keyData.keyPair.publicKey, {
        algorithms: ['RS256']
      });

      // Check if token has been revoked
      const isRevoked = await redisService.redis.get(`token:${payload.jti}`);
      if (!isRevoked) {
        throw new Error('Token has been revoked');
      }

      return payload;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async revokeToken(token) {
    try {
      const decoded = jwt.decode(token, { complete: true });
      if (decoded && decoded.payload && decoded.payload.jti) {
        await redisService.redis.del(`token:${decoded.payload.jti}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error revoking token:', error);
      return false;
    }
  }
}

module.exports = new JWTService(); 