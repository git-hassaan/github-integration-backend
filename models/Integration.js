const mongoose = require('mongoose');

const integrationSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  platform: {
    type: String,
    required: true,
    default: 'github'
  },
  accessToken: {
    type: String,
    required: true
  },
  refreshToken: {
    type: String
  },
  githubUserId: {
    type: String,
    required: true
  },
  githubUsername: {
    type: String,
    required: true
  },
  githubEmail: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  connectedAt: {
    type: Date,
    default: Date.now
  },
  lastSyncAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scopes: [{
    type: String
  }]
}, {
  timestamps: true,
  collection: 'github-integration'
});

// Index for faster queries
integrationSchema.index({ userId: 1, platform: 1 });
integrationSchema.index({ githubUserId: 1 });

module.exports = mongoose.model('Integration', integrationSchema);
