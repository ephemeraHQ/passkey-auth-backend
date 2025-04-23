const express = require('express');
const router = express.Router();
const docsController = require('../../controllers/docs.controller');

// API documentation in OpenAPI format
router.get('/', docsController.getApiDocs);

module.exports = router; 