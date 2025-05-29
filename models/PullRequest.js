const mongoose = require('mongoose');

const pullRequestSchema = new mongoose.Schema({
  githubId: {
    type: Number,
    required: true
  },
  number: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  body: {
    type: String
  },
  state: {
    type: String,
    enum: ['open', 'closed'],
    required: true
  },
  url: {
    type: String
  },
  htmlUrl: {
    type: String
  },
  diffUrl: {
    type: String
  },
  patchUrl: {
    type: String
  },
  issueUrl: {
    type: String
  },
  user: {
    id: Number,
    login: String,
    avatarUrl: String,
    url: String,
    htmlUrl: String,
    type: String
  },
  assignee: {
    id: Number,
    login: String,
    avatarUrl: String,
    url: String,
    htmlUrl: String
  },
  assignees: [{
    id: Number,
    login: String,
    avatarUrl: String,
    url: String,
    htmlUrl: String
  }],
  requestedReviewers: [{
    id: Number,
    login: String,
    avatarUrl: String,
    url: String,
    htmlUrl: String
  }],
  labels: [{
    id: Number,
    name: String,
    color: String,
    description: String,
    url: String
  }],
  milestone: {
    id: Number,
    number: Number,
    title: String,
    description: String,
    state: String,
    createdAt: Date,
    updatedAt: Date,
    dueOn: Date,
    closedAt: Date
  },
  head: {
    label: String,
    ref: String,
    sha: String,
    user: {
      id: Number,
      login: String,
      avatarUrl: String
    },
    repo: {
      id: Number,
      name: String,
      fullName: String,
      htmlUrl: String
    }
  },
  base: {
    label: String,
    ref: String,
    sha: String,
    user: {
      id: Number,
      login: String,
      avatarUrl: String
    },
    repo: {
      id: Number,
      name: String,
      fullName: String,
      htmlUrl: String
    }
  },
  draft: {
    type: Boolean
  },
  merged: {
    type: Boolean
  },
  mergeable: {
    type: Boolean
  },
  mergedBy: {
    id: Number,
    login: String,
    avatarUrl: String,
    url: String,
    htmlUrl: String
  },
  mergedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  additions: {
    type: Number
  },
  deletions: {
    type: Number
  },
  changedFiles: {
    type: Number
  },
  commits: {
    type: Number
  },
  comments: {
    type: Number
  },
  reviewComments: {
    type: Number
  },
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
  collection: 'github-pull-requests'
});

pullRequestSchema.index({ githubId: 1 });
pullRequestSchema.index({ repositoryId: 1 });
pullRequestSchema.index({ organizationId: 1 });
pullRequestSchema.index({ integrationId: 1 });
pullRequestSchema.index({ number: 1, repositoryId: 1 });
pullRequestSchema.index({ state: 1 });
pullRequestSchema.index({ 'user.login': 1 });
pullRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PullRequest', pullRequestSchema);
