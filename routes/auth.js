const express = require('express');
const router = express.Router();
const IntegrationController = require('../controllers/integrationController');

// GET /api/auth/github - Get GitHub OAuth URL
router.get('/github', IntegrationController.getOAuthUrl);

// GET /api/auth/github/callback - Handle GitHub OAuth callback
router.get('/github/callback', IntegrationController.handleOAuthCallback);

module.exports = router;
