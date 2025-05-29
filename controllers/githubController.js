const Integration = require('../models/Integration');
const Organization = require('../models/Organization');
const Repository = require('../models/Repository');
const Commit = require('../models/Commit');
const PullRequest = require('../models/PullRequest');
const Issue = require('../models/Issue');
const User = require('../models/User');
const GitHubHelper = require('../helpers/githubHelper');

class GitHubController {
  // Sync all GitHub data for a user
  static async syncAllData(req, res) {
    try {
      const { userId } = req.params;

      const integration = await Integration.findOne({ userId, isActive: true });
      if (!integration) {
        return res.status(404).json({
          error: 'Integration not found',
          message: 'No active GitHub integration found for this user'
        });
      }

      const githubHelper = new GitHubHelper(integration.accessToken);

      console.log(`Starting data sync for user: ${userId}`);
      const syncResults = {
        organizations: 0,
        repositories: 0,
        commits: 0,
        pullRequests: 0,
        issues: 0,
        users: 0
      };
      // Get organizations
      const organizations = await githubHelper.getUserOrganizations(userId);
      console.log(`Found ${organizations.length} organizations`);

      for (const orgData of organizations) {
        await GitHubController.syncOrganization(integration, githubHelper, orgData, syncResults);
      }

      // Update last sync time
      integration.lastSyncAt = new Date();
      await integration.save();

      res.json({
        message: 'GitHub data sync completed successfully',
        syncResults,
        lastSyncAt: integration.lastSyncAt
      });

    } catch (error) {
      console.error('Sync all data error:', error);
      res.status(500).json({
        error: 'Failed to sync GitHub data',
        message: error.message
      });
    }
  }

  static async syncOrganization(integration, githubHelper, orgData, syncResults) {
    try {
      // Get full organization details
      const fullOrgData = await githubHelper.getOrganization(orgData.login);

      // Save organization
      const organization = await Organization.findOneAndUpdate(
        { githubId: fullOrgData.id },
        {
          githubId: fullOrgData.id,
          login: fullOrgData.login,
          name: fullOrgData.name,
          description: fullOrgData.description,
          url: fullOrgData.url,
          htmlUrl: fullOrgData.html_url,
          avatarUrl: fullOrgData.avatar_url,
          location: fullOrgData.location,
          email: fullOrgData.email,
          blog: fullOrgData.blog,
          company: fullOrgData.company,
          publicRepos: fullOrgData.public_repos,
          publicGists: fullOrgData.public_gists,
          followers: fullOrgData.followers,
          following: fullOrgData.following,
          createdAt: fullOrgData.created_at,
          updatedAt: fullOrgData.updated_at,
          integrationId: integration._id
        },
        { upsert: true, new: true }
      );

      syncResults.organizations++;
      console.log(`Synced organization: ${fullOrgData.login}`);

      // Sync organization members (users)
      await GitHubController.syncOrganizationUsers(integration, githubHelper, organization, syncResults);

      // Sync repositories
      await GitHubController.syncOrganizationRepositories(integration, githubHelper, organization, syncResults);

    } catch (error) {
      console.error(`Error syncing organization ${orgData.login}:`, error);
    }
  }

  static async syncOrganizationUsers(integration, githubHelper, organization, syncResults) {
    try {
      const members = await githubHelper.getOrganizationMembers(organization.login);
      console.log(`Found ${members.length} members in ${organization.login}`);

      for (const memberData of members) {
        try {
          await User.findOneAndUpdate(
            { githubId: memberData.id },
            {
              githubId: memberData.id,
              login: memberData.login,
              avatarUrl: memberData.avatar_url,
              url: memberData.url,
              htmlUrl: memberData.html_url,
              type: memberData.type,
              siteAdmin: memberData.site_admin,
              organizationId: organization._id,
              integrationId: integration._id
            },
            { upsert: true, new: true }
          );
          syncResults.users++;
        } catch (error) {
          console.error(`Error syncing user ${memberData.login}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error syncing users for ${organization.login}:`, error);
    }
  }

  static async syncOrganizationRepositories(integration, githubHelper, organization, syncResults) {
    try {
      const repositories = await githubHelper.getOrganizationRepositories(organization.login);
      console.log(`Found ${repositories.length} repositories in ${organization.login}`);

      for (const repoData of repositories) {
        try {
          const repository = await Repository.findOneAndUpdate(
            { githubId: repoData.id },
            {
              githubId: repoData.id,
              name: repoData.name,
              fullName: repoData.full_name,
              description: repoData.description,
              url: repoData.url,
              htmlUrl: repoData.html_url,
              cloneUrl: repoData.clone_url,
              gitUrl: repoData.git_url,
              sshUrl: repoData.ssh_url,
              language: repoData.language,
              defaultBranch: repoData.default_branch,
              size: repoData.size,
              stargazersCount: repoData.stargazers_count,
              watchersCount: repoData.watchers_count,
              forksCount: repoData.forks_count,
              openIssuesCount: repoData.open_issues_count,
              isPrivate: repoData.private,
              isFork: repoData.fork,
              isArchived: repoData.archived,
              isDisabled: repoData.disabled,
              hasIssues: repoData.has_issues,
              hasProjects: repoData.has_projects,
              hasWiki: repoData.has_wiki,
              hasPages: repoData.has_pages,
              hasDownloads: repoData.has_downloads,
              topics: repoData.topics || [],
              license: repoData.license ? {
                key: repoData.license.key,
                name: repoData.license.name,
                url: repoData.license.url
              } : null,
              pushedAt: repoData.pushed_at,
              createdAt: repoData.created_at,
              updatedAt: repoData.updated_at,
              organizationId: organization._id,
              integrationId: integration._id
            },
            { upsert: true, new: true }
          );

          syncResults.repositories++;
          console.log(`Synced repository: ${repoData.full_name}`);

          // Sync repository data (commits, PRs, issues)
          await GitHubController.syncRepositoryData(integration, githubHelper, organization, repository, syncResults);

        } catch (error) {
          console.error(`Error syncing repository ${repoData.full_name}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error syncing repositories for ${organization.login}:`, error);
    }
  }

  static async syncRepositoryData(integration, githubHelper, organization, repository, syncResults) {
    const [owner, repo] = repository.fullName.split('/');

    // Sync commits
    await GitHubController.syncRepositoryCommits(integration, githubHelper, organization, repository, owner, repo, syncResults);

    // Sync pull requests
    await GitHubController.syncRepositoryPullRequests(integration, githubHelper, organization, repository, owner, repo, syncResults);

    // Sync issues
    await GitHubController.syncRepositoryIssues(integration, githubHelper, organization, repository, owner, repo, syncResults);
  }

  static async syncRepositoryCommits(integration, githubHelper, organization, repository, owner, repo, syncResults) {
    try {
      const commits = await githubHelper.getRepositoryCommits(owner, repo);
      console.log(`Found ${commits.length} commits in ${repository.fullName}`);

      for (const commitData of commits) {
        try {
          await Commit.findOneAndUpdate(
            { sha: commitData.sha },
            {
              sha: commitData.sha,
              message: commitData.commit.message,
              author: {
                name: commitData.commit.author.name,
                email: commitData.commit.author.email,
                date: commitData.commit.author.date
              },
              committer: {
                name: commitData.commit.committer.name,
                email: commitData.commit.committer.email,
                date: commitData.commit.committer.date
              },
              url: commitData.url,
              htmlUrl: commitData.html_url,
              tree: {
                sha: commitData.commit.tree.sha,
                url: commitData.commit.tree.url
              },
              parents: commitData.parents.map(parent => ({
                sha: parent.sha,
                url: parent.url,
                htmlUrl: parent.html_url
              })),
              repositoryId: repository._id,
              organizationId: organization._id,
              integrationId: integration._id
            },
            { upsert: true, new: true }
          );
          syncResults.commits++;
        } catch (error) {
          console.error(`Error syncing commit ${commitData.sha}:`, error);
        }
      }

    } catch (error) {
      console.error(`Error syncing commits for ${repository.fullName}:`, error);
    }
  }

  static async syncRepositoryPullRequests(integration, githubHelper, organization, repository, owner, repo, syncResults) {
    try {
      const pullRequests = await githubHelper.getRepositoryPullRequests(owner, repo);
      console.log(`Found ${pullRequests.length} pull requests in ${repository.fullName}`);

      for (const prData of pullRequests) {
        try {
          await PullRequest.findOneAndUpdate(
            { githubId: prData.id },
            {
              githubId: prData.id,
              number: prData.number,
              title: prData.title,
              body: prData.body,
              state: prData.state,
              url: prData.url,
              htmlUrl: prData.html_url,
              diffUrl: prData.diff_url,
              patchUrl: prData.patch_url,
              issueUrl: prData.issue_url,
              user: prData.user ? {
                id: prData.user.id,
                login: prData.user.login,
                avatarUrl: prData.user.avatar_url,
                url: prData.user.url,
                htmlUrl: prData.user.html_url,
                type: prData.user.type
              } : null,
              assignee: prData.assignee ? {
                id: prData.assignee.id,
                login: prData.assignee.login,
                avatarUrl: prData.assignee.avatar_url,
                url: prData.assignee.url,
                htmlUrl: prData.assignee.html_url
              } : null,
              assignees: prData.assignees.map(assignee => ({
                id: assignee.id,
                login: assignee.login,
                avatarUrl: assignee.avatar_url,
                url: assignee.url,
                htmlUrl: assignee.html_url
              })),
              labels: prData.labels.map(label => ({
                id: label.id,
                name: label.name,
                color: label.color,
                description: label.description,
                url: label.url
              })),
              head: {
                label: prData.head.label,
                ref: prData.head.ref,
                sha: prData.head.sha,
                user: prData.head.user ? {
                  id: prData.head.user.id,
                  login: prData.head.user.login,
                  avatarUrl: prData.head.user.avatar_url
                } : null,
                repo: prData.head.repo ? {
                  id: prData.head.repo.id,
                  name: prData.head.repo.name,
                  fullName: prData.head.repo.full_name,
                  htmlUrl: prData.head.repo.html_url
                } : null
              },
              base: {
                label: prData.base.label,
                ref: prData.base.ref,
                sha: prData.base.sha,
                user: prData.base.user ? {
                  id: prData.base.user.id,
                  login: prData.base.user.login,
                  avatarUrl: prData.base.user.avatar_url
                } : null,
                repo: prData.base.repo ? {
                  id: prData.base.repo.id,
                  name: prData.base.repo.name,
                  fullName: prData.base.repo.full_name,
                  htmlUrl: prData.base.repo.html_url
                } : null
              },
              draft: prData.draft,
              merged: prData.merged,
              mergeable: prData.mergeable,
              mergedAt: prData.merged_at,
              closedAt: prData.closed_at,
              createdAt: prData.created_at,
              updatedAt: prData.updated_at,
              repositoryId: repository._id,
              organizationId: organization._id,
              integrationId: integration._id
            },
            { upsert: true, new: true }
          );
          syncResults.pullRequests++;
        } catch (error) {
          console.error(`Error syncing pull request ${prData.number}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error syncing pull requests for ${repository.fullName}:`, error);
    }
  }

  static async syncRepositoryIssues(integration, githubHelper, organization, repository, owner, repo, syncResults) {
    try {
      const issues = await githubHelper.getRepositoryIssues(owner, repo);
      // Filter out pull requests (GitHub API returns PRs as issues)
      const actualIssues = issues.filter(issue => !issue.pull_request);
      console.log(`Found ${actualIssues.length} issues in ${repository.fullName}`);

      for (const issueData of actualIssues) {
        try {
          await Issue.findOneAndUpdate(
            { githubId: issueData.id },
            {
              githubId: issueData.id,
              number: issueData.number,
              title: issueData.title,
              body: issueData.body,
              state: issueData.state,
              locked: issueData.locked,
              url: issueData.url,
              htmlUrl: issueData.html_url,
              repositoryUrl: issueData.repository_url,
              user: issueData.user ? {
                id: issueData.user.id,
                login: issueData.user.login,
                avatarUrl: issueData.user.avatar_url,
                url: issueData.user.url,
                htmlUrl: issueData.user.html_url,
                type: issueData.user.type
              } : null,
              assignee: issueData.assignee ? {
                id: issueData.assignee.id,
                login: issueData.assignee.login,
                avatarUrl: issueData.assignee.avatar_url,
                url: issueData.assignee.url,
                htmlUrl: issueData.assignee.html_url
              } : null,
              assignees: issueData.assignees.map(assignee => ({
                id: assignee.id,
                login: assignee.login,
                avatarUrl: assignee.avatar_url,
                url: assignee.url,
                htmlUrl: assignee.html_url
              })),
              labels: issueData.labels.map(label => ({
                id: label.id,
                name: label.name,
                color: label.color,
                description: label.description,
                url: label.url
              })),
              comments: issueData.comments,
              authorAssociation: issueData.author_association,
              activeLockReason: issueData.active_lock_reason,
              createdAt: issueData.created_at,
              updatedAt: issueData.updated_at,
              closedAt: issueData.closed_at,
              repositoryId: repository._id,
              organizationId: organization._id,
              integrationId: integration._id
            },
            { upsert: true, new: true }
          );
          syncResults.issues++;
        } catch (error) {
          console.error(`Error syncing issue ${issueData.number}:`, error);
        }
      }
    } catch (error) {
      console.error(`Error syncing issues for ${repository.fullName}:`, error);
    }
  }

  // Get collections for frontend dropdown
  static async getCollections(req, res) {
    try {
      const collections = [
        { name: 'github-integration', displayName: 'Integrations' },
        { name: 'github-organizations', displayName: 'Organizations' },
        { name: 'github-repositories', displayName: 'Repositories' },
        { name: 'github-commits', displayName: 'Commits' },
        { name: 'github-pull-requests', displayName: 'Pull Requests' },
        { name: 'github-issues', displayName: 'Issues' },
        { name: 'github-users', displayName: 'Users' }
      ];

      res.json({ collections });
    } catch (error) {
      console.error('Get collections error:', error);
      res.status(500).json({
        error: 'Failed to get collections',
        message: error.message
      });
    }
  }

  // Get data from a specific collection
  static async getCollectionData(req, res) {
    try {
      const { collection } = req.params;
      const { page = 1, limit = 50, search = '' } = req.query;

      let Model;
      switch (collection) {
        case 'github-integration':
          Model = Integration;
          break;
        case 'github-organizations':
          Model = Organization;
          break;
        case 'github-repositories':
          Model = Repository;
          break;
        case 'github-commits':
          Model = Commit;
          break;
        case 'github-pull-requests':
          Model = PullRequest;
          break;
        case 'github-issues':
          Model = Issue;
          break;
        case 'github-users':
          Model = User;
          break;
        default:
          return res.status(400).json({
            error: 'Invalid collection',
            message: 'Collection not found'
          });
      }

      // Build search query
      let searchQuery = {};
      if (search) {
        // Create a text search across multiple fields
        searchQuery = {
          $or: [
            { name: new RegExp(search, 'i') },
            { title: new RegExp(search, 'i') },
            { login: new RegExp(search, 'i') },
            { fullName: new RegExp(search, 'i') },
            { description: new RegExp(search, 'i') },
            { message: new RegExp(search, 'i') },
            { body: new RegExp(search, 'i') }
          ]
        };
      }

      const skip = (page - 1) * limit;
      const [data, total] = await Promise.all([
        Model.find(searchQuery)
          .select('-accessToken -refreshToken')
          .limit(parseInt(limit))
          .skip(skip)
          .sort({ createdAt: -1 }),
        Model.countDocuments(searchQuery)
      ]);

      // Get field names dynamically
      const sampleDoc = await Model.findOne().select('-accessToken -refreshToken');
      const fields = sampleDoc ? Object.keys(sampleDoc.toObject()) : [];

      res.json({
        data,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        fields
      });

    } catch (error) {
      console.error('Get collection data error:', error);
      res.status(500).json({
        error: 'Failed to get collection data',
        message: error.message
      });
    }
  }
}

module.exports = GitHubController;
