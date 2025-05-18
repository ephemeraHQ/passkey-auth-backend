const config = require('../config');
const webauthnService = require('../services/webauthn.service');
const jwtService = require('../services/jwt.service');
const crypto = require('crypto');
const redisService = require('../services/redis.service');

class AuthController {
  async getRegistrationChallenge(req, res) {
    try {
      const { displayName } = req.query;

      if (!displayName) {
        return res.status(400).json({
          error: 'displayName is required as a query parameter',
          receivedParams: req.query,
        });
      }

      const options = await webauthnService.generateRegistrationOptions(displayName);
      return res.status(200).json(options);
    } catch (error) {
      console.error('Error in getRegistrationChallenge:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  async registerPasskey(req, res) {
    try {
      const { attestationResponse } = req.body;

      const { userID, credentialID, publicKey } = await webauthnService.verifyRegistration(attestationResponse);

      // Generate JWT token using the new service
      const token = await jwtService.sign({
        sub: userID, // Using 'sub' claim as required by Privy
        credentialID,
      });

      res.json({
        success: true,
        token,
        userID,
        publicKey,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getLoginChallenge(req, res) {
    try {
      const options = await webauthnService.generateAuthenticationOptions();
      res.json(options);
    } catch (error) {
      console.error('Error in getLoginChallenge:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async loginPasskey(req, res) {
    try {
      const { authenticationResponse } = req.body;

      const { userID, credentialID, publicKey } = await webauthnService.verifyAuthentication(authenticationResponse);

      // Generate JWT using the new service
      const token = await jwtService.sign({
        sub: userID, // Using 'sub' claim as required by Privy
        credentialID,
      });

      res.json({
        success: true,
        token,
        userID,
        publicKey,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  getAppleAppSiteAssociation(req, res) {
    try {
      const aasaContent = {
        applinks: {
          apps: [],
          details: [
            {
              appID: config.app.appId,
              paths: ['*'],
              components: [
                {
                  '/': '/*',
                  comment: 'Matches all URLs',
                },
              ],
            },
          ],
        },
        webcredentials: {
          apps: [config.app.appId],
        },
      };

      res.set('Content-Type', 'application/json');
      res.set('Cache-Control', 'no-store');
      res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

      res.json(aasaContent);
    } catch (error) {
      console.error('Error serving AASA file:', error);
      res.status(500).json({ error: 'Error serving AASA file' });
    }
  }

  async refreshCertificate(req, res) {
    try {
      const { currentCertificate } = req.body;

      // Validate the current certificate
      if (!currentCertificate) {
        return res.status(400).json({ error: 'Current certificate is required' });
      }

      // Get the current server certificate
      const serverCertificate = await this.getServerCertificate();

      // Compare certificates
      if (currentCertificate === serverCertificate) {
        return res.status(200).json({
          success: true,
          message: 'Certificate is current',
          certificate: serverCertificate
        });
      }

      // If certificates don't match, return the new certificate
      res.json({
        success: true,
        message: 'New certificate available',
        certificate: serverCertificate
      });
    } catch (error) {
      console.error('Certificate refresh error:', error);
      res.status(500).json({ error: 'Failed to refresh certificate' });
    }
  }

  async getServerCertificate() {
    // In a production environment, this would fetch the actual SSL certificate
    // For now, we'll return a mock certificate hash
    return crypto.createHash('sha256')
      .update(process.env.JWT_SECRET || 'default-secret')
      .digest('hex');
  }

  async getInitialCertificate(req, res) {
    try {
      // Generate a new certificate
      const certificate = await this.generateNewCertificate();

      // Store the certificate hash with a timestamp
      const certificateData = {
        hash: certificate,
        issuedAt: Date.now(),
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year validity
      };

      // Store in Redis with a specific key for initial certificates
      await redisService.setInitialCertificate(certificateData);

      res.json({
        success: true,
        certificate,
        expiresAt: certificateData.expiresAt
      });
    } catch (error) {
      console.error('Initial certificate generation error:', error);
      res.status(500).json({ error: 'Failed to generate initial certificate' });
    }
  }

  async generateNewCertificate() {
    // Generate a random certificate hash
    const randomBytes = crypto.randomBytes(32);
    const certificate = crypto.createHash('sha256')
      .update(randomBytes)
      .digest('hex');

    return certificate;
  }
}

module.exports = new AuthController();
