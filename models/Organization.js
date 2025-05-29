const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  githubId: {
    type: Number,
    required: true
  },
  login: {
    type: String,
    required: true
  },
  name: {
    type: String
  },
  description: {
    type: String
  },
  url: {
    type: String
  },
  htmlUrl: {
    type: String
  },
  avatarUrl: {
    type: String
  },
  location: {
    type: String
  },
  email: {
    type: String
  },
  blog: {
    type: String
  },
  company: {
    type: String
  },
  publicRepos: {
    type: Number
  },
  publicGists: {
    type: Number
  },
  followers: {
    type: Number
  },
  following: {
    type: Number
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  integrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Integration',
    required: true
  }
}, {
  timestamps: true,
  collection: 'github-organizations'
});

organizationSchema.index({ githubId: 1 });
organizationSchema.index({ integrationId: 1 });
organizationSchema.index({ login: 1 });

module.exports = mongoose.model('Organization', organizationSchema);
