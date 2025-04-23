const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth.controller');

// Registration routes
router.get('/challenge/register', authController.getRegistrationChallenge);
router.post('/register-passkey', authController.registerPasskey);

// Login routes
router.get('/challenge/login', authController.getLoginChallenge);
router.post('/login-passkey', authController.loginPasskey);

// Certificate refresh endpoint
router.post('/refresh-certificate', authController.refreshCertificate);

// Initial certificate endpoint
router.get('/initial-certificate', authController.getInitialCertificate);

module.exports = router;