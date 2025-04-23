const express = require('express');
const router = express.Router();
const jwksController = require('../../controllers/jwks.controller');

// Serve JWKS
router.get('/', jwksController.getJWKS);

module.exports = router; 