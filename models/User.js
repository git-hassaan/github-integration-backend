const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
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
  email: {
    type: String
  },
  bio: {
    type: String
  },
  company: {
    type: String
  },
  blog: {
    type: String
  },
  location: {
    type: String
  },
  hireable: {
    type: Boolean
  },
  avatarUrl: {
    type: String
  },
  gravatarId: {
    type: String
  },
  url: {
    type: String
  },
  htmlUrl: {
    type: String
  },
  followersUrl: {
    type: String
  },
  followingUrl: {
    type: String
  },
  gistsUrl: {
    type: String
  },
  starredUrl: {
    type: String
  },
  subscriptionsUrl: {
    type: String
  },
  organizationsUrl: {
    type: String
  },
  reposUrl: {
    type: String
  },
  eventsUrl: {
    type: String
  },
  receivedEventsUrl: {
    type: String
  },
  type: {
    type: String
  },
  siteAdmin: {
    type: Boolean
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
  collection: 'github-users'
});

userSchema.index({ githubId: 1 });
userSchema.index({ organizationId: 1 });
userSchema.index({ integrationId: 1 });
userSchema.index({ login: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
