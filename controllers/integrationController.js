const Integration = require('../models/Integration');
const GitHubHelper = require('../helpers/githubHelper');

class IntegrationController {
  // Get OAuth URL for GitHub
  static getOAuthUrl(req, res) {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/api/auth/github/callback';
    const scope = 'read:org,repo,read:user,user:email';
    const state = req.query.state || 'default_state';

    if (!clientId) {
      return res.status(500).json({
        error: 'GitHub OAuth not configured',
        message: 'GITHUB_CLIENT_ID environment variable is not set'
      });
    }

    const oauthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;

    res.json({
      oauthUrl,
      clientId,
      redirectUri,
      scope
    });
  }

  // Handle OAuth callback and create integration
  static async handleOAuthCallback(req, res) {
    try {
      const { code, state } = req.query;

      if (!code) {
        return res.status(400).json({
          error: 'Authorization code missing',
          message: 'GitHub did not provide an authorization code'
        });
      }

      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
        }),
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return res.status(400).json({
          error: 'OAuth token exchange failed',
          message: tokenData.error_description || tokenData.error
        });
      }

      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;
      const scopes = tokenData.scope ? tokenData.scope.split(',') : [];

      // Get user info from GitHub
      const githubHelper = new GitHubHelper(accessToken);
      const githubUser = await githubHelper.getCurrentUser();

      // Create or update integration
      const integration = await Integration.findOneAndUpdate(
        { githubUserId: githubUser.id.toString() },
        {
          userId: githubUser.login, // Using GitHub login as userId for now
          platform: 'github',
          accessToken,
          refreshToken,
          githubUserId: githubUser.id.toString(),
          githubUsername: githubUser.login,
          githubEmail: githubUser.email,
          avatarUrl: githubUser.avatar_url,
          connectedAt: new Date(),
          isActive: true,
          scopes
        },
        { upsert: true, new: true }
      );

      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      res.redirect(`${frontendUrl}/integration/success?id=${integration._id}`);

    } catch (error) {
      console.error('OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
      res.redirect(`${frontendUrl}/integration/error?message=${encodeURIComponent(error.message)}`);
    }
  }

  // Get integration status
  static async getIntegrationStatus(req, res) {
    try {
      const { userId } = req.params;

      const integration = await Integration.findOne({ 
        userId,
        isActive: true 
      });

      if (!integration) {
        return res.json({
          isConnected: false,
          integration: null
        });
      }

      res.json({
        isConnected: true,
        integration: {
          id: integration._id,
          githubUsername: integration.githubUsername,
          githubEmail: integration.githubEmail,
          avatarUrl: integration.avatarUrl,
          connectedAt: integration.connectedAt,
          lastSyncAt: integration.lastSyncAt,
          scopes: integration.scopes
        }
      });

    } catch (error) {
      console.error('Get integration status error:', error);
      res.status(500).json({
        error: 'Failed to get integration status',
        message: error.message
      });
    }
  }

  // Remove integration
  static async removeIntegration(req, res) {
    try {
      const { userId } = req.params;

      const integration = await Integration.findOne({ userId, isActive: true });

      if (!integration) {
        return res.status(404).json({
          error: 'Integration not found',
          message: 'No active GitHub integration found for this user'
        });
      }

      // Mark as inactive instead of deleting
      integration.isActive = false;
      await integration.save();

      res.json({
        message: 'GitHub integration removed successfully',
        removedAt: new Date()
      });

    } catch (error) {
      console.error('Remove integration error:', error);
      res.status(500).json({
        error: 'Failed to remove integration',
        message: error.message
      });
    }
  }

  // Get all integrations (admin endpoint)
  static async getAllIntegrations(req, res) {
    try {
      const integrations = await Integration.find({ isActive: true })
        .select('-accessToken -refreshToken')
        .sort({ connectedAt: -1 });

      res.json({
        count: integrations.length,
        integrations
      });

    } catch (error) {
      console.error('Get all integrations error:', error);
      res.status(500).json({
        error: 'Failed to get integrations',
        message: error.message
      });
    }
  }
}

module.exports = IntegrationController;
