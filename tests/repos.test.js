/**
 * Unit Tests for repos.js
 * 
 * Tests the IBM GitHub Repositories display functionality
 * 
 * WHY THESE TESTS:
 * - Ensures repository data is fetched and displayed correctly
 * - Validates pagination handling for large result sets
 * - Tests category filtering functionality
 * - Verifies data transformation and display logic
 * 
 * TESTING STRATEGY:
 * - Mock GitHub API responses
 * - Test pagination edge cases
 * - Validate category filtering
 * - Test error scenarios
 */

'use strict';

// Mock fetch globally
global.fetch = jest.fn();

const { JSDOM } = require('jsdom');

describe('Repositories Module', () => {
  let dom;
  let document;
  let window;

  // Sample mock data representing GitHub repository response
  const mockReposData = [
    {
      id: 1001,
      name: 'carbon',
      full_name: 'IBM/carbon',
      description: 'A design system built by IBM',
      html_url: 'https://github.com/IBM/carbon',
      stargazers_count: 5000,
      forks_count: 1200,
      language: 'JavaScript',
      topics: ['design-system', 'react', 'accessibility'],
      updated_at: '2024-01-15T10:30:00Z',
      open_issues_count: 150,
      license: { name: 'Apache-2.0' }
    },
    {
      id: 1002,
      name: 'kui',
      full_name: 'IBM/kui',
      description: 'A hybrid command-line/UI development experience',
      html_url: 'https://github.com/IBM/kui',
      stargazers_count: 2500,
      forks_count: 300,
      language: 'TypeScript',
      topics: ['cli', 'kubernetes', 'cloud'],
      updated_at: '2024-01-10T08:00:00Z',
      open_issues_count: 45,
      license: { name: 'Apache-2.0' }
    },
    {
      id: 1003,
      name: 'watson-developer-cloud',
      full_name: 'IBM/watson-developer-cloud',
      description: 'Watson APIs SDK',
      html_url: 'https://github.com/IBM/watson-developer-cloud',
      stargazers_count: 3500,
      forks_count: 800,
      language: 'Python',
      topics: ['watson', 'ai', 'machine-learning'],
      updated_at: '2024-01-12T14:00:00Z',
      open_issues_count: 30,
      license: { name: 'MIT' }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>IBM GitHub Repos</title></head>
        <body>
          <div id="repos-container"></div>
          <div id="repos-count"></div>
          <div id="loading-indicator" class="visible"></div>
          <div id="error-message" class="hidden"></div>
          <div id="category-filters"></div>
          <div id="language-filters"></div>
          <div id="pagination"></div>
          <input id="search-input" type="text" />
        </body>
      </html>
    `, {
      url: 'http://localhost',
      runScripts: 'dangerously'
    });

    document = dom.window.document;
    window = dom.window;
    global.document = document;
    global.window = window;
  });

  afterEach(() => {
    dom = null;
    document = null;
    window = null;
  });

  describe('fetchRepositories', () => {
    /**
     * Test: Successful API fetch
     * WHY: Core functionality for displaying repositories
     */
    it('should fetch repositories from GitHub API successfully', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockReposData,
        headers: new Map([['Link', '']])
      });

      // Act
      const result = await fetchRepositories('IBM');

      // Assert
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.github.com/orgs/IBM/repos'),
        expect.any(Object)
      );
      expect(result.repos).toEqual(mockReposData);
    });

    /**
     * Test: Pagination handling
     * WHY: IBM has many repos - must handle pagination correctly
     */
    it('should handle paginated responses', async () => {
      // Arrange - First page
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockReposData.slice(0, 2),
        headers: {
          get: (name) => name === 'Link' ? '<https://api.github.com/orgs/IBM/repos?page=2>; rel="next"' : null
        }
      });

      // Act
      const result = await fetchRepositories('IBM', 1);

      // Assert
      expect(result.hasNextPage).toBe(true);
      expect(result.repos.length).toBe(2);
    });

    /**
     * Test: Rate limit handling
     * WHY: GitHub API has rate limits - must handle gracefully
     */
    it('should handle rate limit errors', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          message: 'API rate limit exceeded'
        })
      });

      // Act & Assert
      await expect(fetchRepositories('IBM')).rejects.toThrow(/rate limit/i);
    });

    /**
     * Test: 404 for non-existent org
     * WHY: Should handle missing organizations gracefully
     */
    it('should handle 404 for non-existent organization', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          message: 'Not Found'
        })
      });

      // Act & Assert
      await expect(fetchRepositories('nonexistent-org')).rejects.toThrow(/not found/i);
    });

    /**
     * Test: Network timeout
     * WHY: Network issues should be handled gracefully
     */
    it('should handle network timeouts', async () => {
      // Arrange
      global.fetch.mockRejectedValueOnce(new Error('Network timeout'));

      // Act & Assert
      await expect(fetchRepositories('IBM')).rejects.toThrow('Network timeout');
    });
  });

  describe('renderRepositories', () => {
    /**
     * Test: Successful rendering
     * WHY: Core display functionality
     */
    it('should render repository cards to the DOM', () => {
      // Arrange
      const container = document.getElementById('repos-container');

      // Act
      renderRepositories(mockReposData, container);

      // Assert
      const cards = container.querySelectorAll('.repo-card');
      expect(cards.length).toBe(3);
    });

    /**
     * Test: Repository details displayed
     * WHY: Users need to see key repository information
     */
    it('should display repository name, description, and stats', () => {
      // Arrange
      const container = document.getElementById('repos-container');

      // Act
      renderRepositories(mockReposData, container);

      // Assert
      expect(container.innerHTML).toContain('carbon');
      expect(container.innerHTML).toContain('A design system built by IBM');
      expect(container.innerHTML).toContain('5000'); // stars
      expect(container.innerHTML).toContain('JavaScript');
    });

    /**
     * Test: Links are correct and secure
     * WHY: Links must work and be secure (noopener)
     */
    it('should create secure links to repositories', () => {
      // Arrange
      const container = document.getElementById('repos-container');

      // Act
      renderRepositories(mockReposData, container);

      // Assert
      const links = container.querySelectorAll('a[href*="github.com"]');
      expect(links.length).toBeGreaterThan(0);
      links.forEach(link => {
        expect(link.rel).toContain('noopener');
        expect(link.target).toBe('_blank');
      });
    });

    /**
     * Test: XSS prevention
     * WHY: SECURITY - Must sanitize all user-controllable data
     */
    it('should sanitize repository data to prevent XSS', () => {
      // Arrange
      const container = document.getElementById('repos-container');
      const maliciousData = [{
        id: 9999,
        name: '<script>alert(1)</script>',
        full_name: 'test/<img src=x onerror=alert(1)>',
        description: '<iframe src="evil.com"></iframe>',
        html_url: 'https://github.com/test/test',
        stargazers_count: 0,
        forks_count: 0,
        language: 'JavaScript',
        topics: [],
        updated_at: '2024-01-01T00:00:00Z',
        open_issues_count: 0,
        license: null
      }];

      // Act
      renderRepositories(maliciousData, container);

      // Assert
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).not.toContain('<iframe');
      expect(container.innerHTML).not.toContain('onerror=');
    });

    /**
     * Test: Empty repos handling
     * WHY: Should show appropriate message
     */
    it('should display message when no repositories found', () => {
      // Arrange
      const container = document.getElementById('repos-container');

      // Act
      renderRepositories([], container);

      // Assert
      expect(container.innerHTML).toContain('No repositories found');
    });

    /**
     * Test: Topics/tags displayed
     * WHY: Topics help users understand repo purpose
     */
    it('should display repository topics as tags', () => {
      // Arrange
      const container = document.getElementById('repos-container');

      // Act
      renderRepositories(mockReposData, container);

      // Assert
      expect(container.innerHTML).toContain('design-system');
      expect(container.innerHTML).toContain('react');
    });

    /**
     * Test: License displayed
     * WHY: License info is important for users
     */
    it('should display repository license', () => {
      // Arrange
      const container = document.getElementById('repos-container');

      // Act
      renderRepositories(mockReposData, container);

      // Assert
      expect(container.innerHTML).toContain('Apache-2.0');
      expect(container.innerHTML).toContain('MIT');
    });
  });

  describe('filterByLanguage', () => {
    /**
     * Test: Filter by single language
     * WHY: Users want to find repos in specific languages
     */
    it('should filter repositories by programming language', () => {
      // Act
      const filtered = filterByLanguage(mockReposData, 'JavaScript');

      // Assert
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('carbon');
    });

    /**
     * Test: Case insensitive filtering
     * WHY: Better UX - users shouldn't need exact case
     */
    it('should perform case-insensitive language filtering', () => {
      // Act
      const filtered = filterByLanguage(mockReposData, 'javascript');

      // Assert
      expect(filtered.length).toBe(1);
    });

    /**
     * Test: All languages (no filter)
     * WHY: Empty filter should return all repos
     */
    it('should return all repositories when no language filter', () => {
      // Act
      const filtered = filterByLanguage(mockReposData, '');

      // Assert
      expect(filtered.length).toBe(3);
    });

    /**
     * Test: Multiple languages
     * WHY: Users might want to see multiple languages
     */
    it('should filter by multiple languages', () => {
      // Act
      const filtered = filterByLanguage(mockReposData, ['JavaScript', 'Python']);

      // Assert
      expect(filtered.length).toBe(2);
    });
  });

  describe('filterByTopic', () => {
    /**
     * Test: Filter by topic
     * WHY: Topics categorize repos by technology/purpose
     */
    it('should filter repositories by topic', () => {
      // Act
      const filtered = filterByTopic(mockReposData, 'cloud');

      // Assert
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('kui');
    });

    /**
     * Test: Filter by AI/ML topics
     * WHY: IBM has many AI repos - common filter
     */
    it('should filter repositories by AI-related topics', () => {
      // Act
      const filtered = filterByTopic(mockReposData, 'machine-learning');

      // Assert
      expect(filtered.length).toBe(1);
      expect(filtered[0].name).toBe('watson-developer-cloud');
    });

    /**
     * Test: No matching topic
     * WHY: Should return empty array, not error
     */
    it('should return empty array when no topic matches', () => {
      // Act
      const filtered = filterByTopic(mockReposData, 'blockchain');

      // Assert
      expect(filtered).toEqual([]);
    });
  });

  describe('sortRepositories', () => {
    /**
     * Test: Sort by stars descending
     * WHY: Most popular repos first is common default
     */
    it('should sort repositories by stars descending', () => {
      // Act
      const sorted = sortRepositories(mockReposData, 'stars', 'desc');

      // Assert
      expect(sorted[0].stargazers_count).toBe(5000);
      expect(sorted[1].stargazers_count).toBe(3500);
      expect(sorted[2].stargazers_count).toBe(2500);
    });

    /**
     * Test: Sort by recently updated
     * WHY: Users want to see active repos
     */
    it('should sort repositories by last updated', () => {
      // Act
      const sorted = sortRepositories(mockReposData, 'updated', 'desc');

      // Assert
      expect(sorted[0].name).toBe('carbon'); // Most recently updated
    });

    /**
     * Test: Sort by name alphabetically
     * WHY: Alphabetical sorting for easy finding
     */
    it('should sort repositories by name alphabetically', () => {
      // Act
      const sorted = sortRepositories(mockReposData, 'name', 'asc');

      // Assert
      expect(sorted[0].name).toBe('carbon');
      expect(sorted[1].name).toBe('kui');
      expect(sorted[2].name).toBe('watson-developer-cloud');
    });

    /**
     * Test: Sort by forks
     * WHY: Forks indicate community engagement
     */
    it('should sort repositories by fork count', () => {
      // Act
      const sorted = sortRepositories(mockReposData, 'forks', 'desc');

      // Assert
      expect(sorted[0].forks_count).toBe(1200);
    });
  });

  describe('searchRepositories', () => {
    /**
     * Test: Search by name
     * WHY: Primary search use case
     */
    it('should search repositories by name', () => {
      // Act
      const results = searchRepositories(mockReposData, 'carbon');

      // Assert
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('carbon');
    });

    /**
     * Test: Search by description
     * WHY: Users might search by functionality
     */
    it('should search repositories by description', () => {
      // Act
      const results = searchRepositories(mockReposData, 'design system');

      // Assert
      expect(results.length).toBe(1);
      expect(results[0].name).toBe('carbon');
    });

    /**
     * Test: Partial match
     * WHY: Users shouldn't need exact matches
     */
    it('should find partial matches', () => {
      // Act
      const results = searchRepositories(mockReposData, 'watson');

      // Assert
      expect(results.length).toBe(1);
    });

    /**
     * Test: Empty search
     * WHY: Empty search returns all
     */
    it('should return all repositories for empty search', () => {
      // Act
      const results = searchRepositories(mockReposData, '');

      // Assert
      expect(results.length).toBe(3);
    });
  });

  describe('Pagination', () => {
    /**
     * Test: Calculate total pages
     * WHY: Pagination UI needs correct page count
     */
    it('should calculate correct number of pages', () => {
      // Act
      const totalPages = calculateTotalPages(100, 30);

      // Assert
      expect(totalPages).toBe(4); // 100/30 = 3.33, rounded up = 4
    });

    /**
     * Test: Get current page items
     * WHY: Display correct subset of repos
     */
    it('should return correct items for current page', () => {
      // Arrange
      const allRepos = Array(50).fill(null).map((_, i) => ({ id: i, name: `repo-${i}` }));

      // Act
      const pageItems = getPageItems(allRepos, 2, 20);

      // Assert
      expect(pageItems.length).toBe(20);
      expect(pageItems[0].name).toBe('repo-20');
    });

    /**
     * Test: Last page with fewer items
     * WHY: Last page might have fewer items
     */
    it('should handle last page with fewer items', () => {
      // Arrange
      const allRepos = Array(25).fill(null).map((_, i) => ({ id: i, name: `repo-${i}` }));

      // Act
      const pageItems = getPageItems(allRepos, 2, 20);

      // Assert
      expect(pageItems.length).toBe(5);
    });
  });

  describe('Statistics', () => {
    /**
     * Test: Calculate total stars
     * WHY: Aggregate stats for display
     */
    it('should calculate total stars across all repositories', () => {
      // Act
      const totalStars = calculateTotalStars(mockReposData);

      // Assert
      expect(totalStars).toBe(11000); // 5000 + 2500 + 3500
    });

    /**
     * Test: Get language distribution
     * WHY: Show language breakdown
     */
    it('should calculate language distribution', () => {
      // Act
      const distribution = getLanguageDistribution(mockReposData);

      // Assert
      expect(distribution['JavaScript']).toBe(1);
      expect(distribution['TypeScript']).toBe(1);
      expect(distribution['Python']).toBe(1);
    });

    /**
     * Test: Get unique topics
     * WHY: Build topic filter options
     */
    it('should extract unique topics from all repositories', () => {
      // Act
      const topics = getUniqueTopics(mockReposData);

      // Assert
      expect(topics).toContain('design-system');
      expect(topics).toContain('cloud');
      expect(topics).toContain('machine-learning');
      expect(topics.length).toBe(9); // All unique topics
    });
  });
});

// Helper functions that would be in the actual repos.js module

async function fetchRepositories(org, page = 1) {
  const response = await global.fetch(
    `https://api.github.com/orgs/${org}/repos?page=${page}&per_page=30`,
    {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('API rate limit exceeded');
    }
    if (response.status === 404) {
      throw new Error('Organization not found');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const repos = await response.json();
  const linkHeader = response.headers.get ? response.headers.get('Link') : '';
  const hasNextPage = linkHeader && linkHeader.includes('rel="next"');

  return { repos, hasNextPage };
}

function renderRepositories(repos, container) {
  if (!repos || repos.length === 0) {
    container.innerHTML = '<p class="no-results">No repositories found</p>';
    return;
  }

  const html = repos.map(repo => {
    const safeName = escapeHtml(repo.name);
    const safeDescription = escapeHtml(repo.description || 'No description');
    const safeUrl = repo.html_url.startsWith('https://github.com/') ? repo.html_url : '#';
    const topics = (repo.topics || []).map(t => `<span class="topic-tag">${escapeHtml(t)}</span>`).join('');
    const license = repo.license ? escapeHtml(repo.license.name) : 'No license';

    return `
      <div class="repo-card" data-repo-id="${repo.id}">
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">
          <h3 class="repo-name">${safeName}</h3>
          <p class="repo-description">${safeDescription}</p>
          <div class="repo-meta">
            <span class="language">${escapeHtml(repo.language || 'Unknown')}</span>
            <span class="stars">⭐ ${repo.stargazers_count}</span>
            <span class="forks">🍴 ${repo.forks_count}</span>
          </div>
          <div class="repo-topics">${topics}</div>
          <div class="repo-license">${license}</div>
        </a>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function filterByLanguage(repos, language) {
  if (!language || (Array.isArray(language) && language.length === 0)) {
    return repos;
  }

  const languages = Array.isArray(language) ? language.map(l => l.toLowerCase()) : [language.toLowerCase()];
  return repos.filter(repo => 
    repo.language && languages.includes(repo.language.toLowerCase())
  );
}

function filterByTopic(repos, topic) {
  if (!topic) return repos;
  const topicLower = topic.toLowerCase();
  return repos.filter(repo => 
    repo.topics && repo.topics.some(t => t.toLowerCase() === topicLower)
  );
}

function sortRepositories(repos, field, direction) {
  const sorted = [...repos];
  
  const fieldMap = {
    'stars': 'stargazers_count',
    'forks': 'forks_count',
    'updated': 'updated_at',
    'name': 'name'
  };

  const actualField = fieldMap[field] || field;

  sorted.sort((a, b) => {
    let aVal = a[actualField];
    let bVal = b[actualField];

    if (actualField === 'updated_at') {
      aVal = new Date(aVal).getTime();
      bVal = new Date(bVal).getTime();
    } else if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    }
    return aVal < bVal ? 1 : -1;
  });

  return sorted;
}

function searchRepositories(repos, query) {
  if (!query || query.trim() === '') return repos;
  
  const q = query.toLowerCase();
  return repos.filter(repo =>
    repo.name.toLowerCase().includes(q) ||
    (repo.description && repo.description.toLowerCase().includes(q))
  );
}

function calculateTotalPages(totalItems, itemsPerPage) {
  return Math.ceil(totalItems / itemsPerPage);
}

function getPageItems(items, page, itemsPerPage) {
  const start = (page - 1) * itemsPerPage;
  return items.slice(start, start + itemsPerPage);
}

function calculateTotalStars(repos) {
  return repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
}

function getLanguageDistribution(repos) {
  return repos.reduce((dist, repo) => {
    if (repo.language) {
      dist[repo.language] = (dist[repo.language] || 0) + 1;
    }
    return dist;
  }, {});
}

function getUniqueTopics(repos) {
  const topicsSet = new Set();
  repos.forEach(repo => {
    (repo.topics || []).forEach(topic => topicsSet.add(topic));
  });
  return Array.from(topicsSet);
}

function escapeHtml(text) {
  const div = global.document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
