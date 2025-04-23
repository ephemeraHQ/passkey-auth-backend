const jwtService = require('../services/jwt.service');

class JWKSController {
  getJWKS(req, res) {
    try {
      const jwks = jwtService.getJWKS();
      res.json(jwks);
    } catch (error) {
      console.error('Error serving JWKS:', error);
      res.status(500).json({ error: 'Error serving JWKS' });
    }
  }
}

module.exports = new JWKSController(); 