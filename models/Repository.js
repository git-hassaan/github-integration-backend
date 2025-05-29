const mongoose = require('mongoose');

const repositorySchema = new mongoose.Schema({
  githubId: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
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
  cloneUrl: {
    type: String
  },
  gitUrl: {
    type: String
  },
  sshUrl: {
    type: String
  },
  language: {
    type: String
  },
  defaultBranch: {
    type: String
  },
  size: {
    type: Number
  },
  stargazersCount: {
    type: Number
  },
  watchersCount: {
    type: Number
  },
  forksCount: {
    type: Number
  },
  openIssuesCount: {
    type: Number
  },
  isPrivate: {
    type: Boolean
  },
  isFork: {
    type: Boolean
  },
  isArchived: {
    type: Boolean
  },
  isDisabled: {
    type: Boolean
  },
  hasIssues: {
    type: Boolean
  },
  hasProjects: {
    type: Boolean
  },
  hasWiki: {
    type: Boolean
  },
  hasPages: {
    type: Boolean
  },
  hasDownloads: {
    type: Boolean
  },
  topics: [{
    type: String
  }],
  license: {
    key: String,
    name: String,
    url: String
  },
  pushedAt: {
    type: Date
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  integrationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Integration',
    required: true
  }
}, {
  timestamps: true,
  collection: 'github-repositories'
});

repositorySchema.index({ githubId: 1 });
repositorySchema.index({ organizationId: 1 });
repositorySchema.index({ integrationId: 1 });
repositorySchema.index({ fullName: 1 });
repositorySchema.index({ language: 1 });

module.exports = mongoose.model('Repository', repositorySchema);
