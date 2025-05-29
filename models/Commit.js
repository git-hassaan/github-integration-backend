const mongoose = require('mongoose');

const commitSchema = new mongoose.Schema({
  sha: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  author: {
    name: String,
    email: String,
    date: Date
  },
  committer: {
    name: String,
    email: String,
    date: Date
  },
  url: {
    type: String
  },
  htmlUrl: {
    type: String
  },
  tree: {
    sha: String,
    url: String
  },
  parents: [{
    sha: String,
    url: String,
    htmlUrl: String
  }],
  stats: {
    total: Number,
    additions: Number,
    deletions: Number
  },
  files: [{
    sha: String,
    filename: String,
    status: String,
    additions: Number,
    deletions: Number,
    changes: Number,
    blobUrl: String,
    rawUrl: String,
    contentsUrl: String,
    patch: String
  }],
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Repository',
    required: true
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
  collection: 'github-commits'
});

commitSchema.index({ sha: 1 });
commitSchema.index({ repositoryId: 1 });
commitSchema.index({ organizationId: 1 });
commitSchema.index({ integrationId: 1 });
commitSchema.index({ 'author.email': 1 });
commitSchema.index({ 'author.date': -1 });

module.exports = mongoose.model('Commit', commitSchema);
