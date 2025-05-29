const express = require('express');
const router = express.Router();
const IntegrationController = require('../controllers/integrationController');

// GET /api/integration/status/:userId - Get integration status for a user
router.get('/status/:userId', IntegrationController.getIntegrationStatus);

// DELETE /api/integration/:userId - Remove integration for a user
router.delete('/:userId', IntegrationController.removeIntegration);

// GET /api/integration - Get all integrations (admin endpoint)
router.get('/', IntegrationController.getAllIntegrations);

module.exports = router;
