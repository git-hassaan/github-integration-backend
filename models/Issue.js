const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
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
  locked: {
    type: Boolean
  },
  url: {
    type: String
  },
  htmlUrl: {
    type: String
  },
  repositoryUrl: {
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
  comments: {
    type: Number,
    default: 0
  },
  pullRequest: {
    url: String,
    htmlUrl: String,
    diffUrl: String,
    patchUrl: String
  },
  closedBy: {
    id: Number,
    login: String,
    avatarUrl: String,
    url: String,
    htmlUrl: String
  },
  authorAssociation: {
    type: String
  },
  activeLockReason: {
    type: String
  },
  createdAt: {
    type: Date
  },
  updatedAt: {
    type: Date
  },
  closedAt: {
    type: Date
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
  collection: 'github-issues'
});

issueSchema.index({ githubId: 1 });
issueSchema.index({ repositoryId: 1 });
issueSchema.index({ organizationId: 1 });
issueSchema.index({ integrationId: 1 });
issueSchema.index({ number: 1, repositoryId: 1 });
issueSchema.index({ state: 1 });
issueSchema.index({ 'user.login': 1 });
issueSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Issue', issueSchema);
