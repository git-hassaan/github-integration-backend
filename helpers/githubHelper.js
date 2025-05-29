const axios = require('axios');

class GitHubHelper {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://api.github.com';
    this.headers = {
      'Authorization': `token ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Integration-App'
    };
  }

  async makeRequest(endpoint, method = 'GET', data = null, params = {}) {
    try {
      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: this.headers,
        params
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`GitHub API Error for ${endpoint}:`, error.response?.data || error.message);
      throw new Error(`GitHub API request failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async getAllPages(endpoint, params = {}) {
    let allData = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const data = await this.makeRequest(endpoint, 'GET', null, {
        ...params,
        page,
        per_page: perPage
      });

      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      allData = allData.concat(data);
      
      if (data.length < perPage) {
        break;
      }

      page++;
    }

    return allData;
  }

  // User methods
  async getCurrentUser() {
    return await this.makeRequest('/user');
  }

  // Organization methods
  async getUserOrganizations(userId) {
    return await this.getAllPages(`/users/${userId}/orgs`);
  }

  async getOrganization(org) {
    return await this.makeRequest(`/orgs/${org}`);
  }

  async getOrganizationMembers(org) {
    return await this.getAllPages(`/orgs/${org}/members`);
  }

  // Repository methods
  async getOrganizationRepositories(org) {
    return await this.getAllPages(`/orgs/${org}/repos`, { type: 'all' });
  }

  async getRepository(owner, repo) {
    return await this.makeRequest(`/repos/${owner}/${repo}`);
  }

  // Commit methods
  async getRepositoryCommits(owner, repo, since = null) {
    const params = {};
    if (since) {
      params.since = since;
    }
    return await this.getAllPages(`/repos/${owner}/${repo}/commits`, params);
  }

  async getCommit(owner, repo, sha) {
    return await this.makeRequest(`/repos/${owner}/${repo}/commits/${sha}`);
  }

  // Pull Request methods
  async getRepositoryPullRequests(owner, repo, state = 'all') {
    return await this.getAllPages(`/repos/${owner}/${repo}/pulls`, { state });
  }

  async getPullRequest(owner, repo, pullNumber) {
    return await this.makeRequest(`/repos/${owner}/${repo}/pulls/${pullNumber}`);
  }

  // Issue methods
  async getRepositoryIssues(owner, repo, state = 'all') {
    return await this.getAllPages(`/repos/${owner}/${repo}/issues`, { state });
  }

  async getIssue(owner, repo, issueNumber) {
    return await this.makeRequest(`/repos/${owner}/${repo}/issues/${issueNumber}`);
  }

  // Rate limit info
  async getRateLimit() {
    return await this.makeRequest('/rate_limit');
  }
}

module.exports = GitHubHelper;
