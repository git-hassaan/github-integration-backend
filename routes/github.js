const express = require('express');
const router = express.Router();
const GitHubController = require('../controllers/githubController');

// POST /api/github/sync/:userId - Sync all GitHub data for a user
router.post('/sync/:userId', GitHubController.syncAllData);

// GET /api/github/collections - Get available collections
router.get('/collections', GitHubController.getCollections);

// GET /api/github/data/:collection - Get data from a specific collection
router.get('/data/:collection', GitHubController.getCollectionData);

module.exports = router;
