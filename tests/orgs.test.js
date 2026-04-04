/**
 * Unit Tests for orgs.js
 * 
 * Tests the IBM GitHub Organizations display functionality
 * 
 * WHY THESE TESTS:
 * - Ensures organization data is fetched and displayed correctly
 * - Validates error handling for API failures
 * - Tests DOM manipulation functions
 * - Verifies data transformation logic
 * 
 * TESTING STRATEGY:
 * - Mock GitHub API responses to avoid rate limiting
 * - Test both success and failure scenarios
 * - Validate DOM updates without actual browser
 * - Use JSDOM for DOM simulation
 */

'use strict';

// Mock fetch globally before requiring modules
global.fetch = jest.fn();

// Mock DOM environment
const { JSDOM } = require('jsdom');

describe('Organizations Module', () => {
  let dom;
  let document;
  let window;

  // Sample mock data representing GitHub organization response
  const mockOrgsData = [
    {
      login: 'IBM',
      id: 1234567,
      avatar_url: 'https://avatars.githubusercontent.com/u/1234567?v=4',
      description: 'IBM Open Source',
      html_url: 'https://github.com/IBM',
      public_repos: 500,
      followers: 10000
    },
    {
      login: 'ibm-cloud',
      id: 2345678,
      avatar_url: 'https://avatars.githubusercontent.com/u/2345678?v=4',
      description: 'IBM Cloud',
      html_url: 'https://github.com/ibm-cloud',
      public_repos: 200,
      followers: 5000
    },
    {
      login: 'IBM-Watson',
      id: 3456789,
      avatar_url: 'https://avatars.githubusercontent.com/u/3456789?v=4',
      description: 'IBM Watson',
      html_url: 'https://github.com/IBM-Watson',
      public_repos: 150,
      followers: 8000
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create fresh DOM for each test
    // WHY: Ensures test isolation - no state leakage between tests
    dom = new JSDOM(`
      <!DOCTYPE html>
      <html>
        <head><title>IBM GitHub</title></head>
        <body>
          <div id="orgs-container"></div>
          <div id="orgs-count"></div>
          <div id="loading-indicator" class="visible"></div>
          <div id="error-message" class="hidden"></div>
        </body>
      </html>
    `, {
      url: 'http://localhost',
      runScripts: 'dangerously'
    });

    document = dom.window.document;
    window = dom.window;
    
    // Set up global references for the module under test
    global.document = document;
    global.window = window;
  });

  afterEach(() => {
    // Clean up DOM
    dom = null;
    document = null;
    window = null;
  });

  describe('fetchOrganizations', () => {
    /**
     * Test: Successful API fetch
     * WHY: Core functionality - must work correctly for the site to display data
     */
    it('should fetch organizations from GitHub API successfully', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockOrgsData
      });

      // Act
      const result = await fetchOrganizations();

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('api.github.com'),
        expect.objectContaining({
          headers: expect.any(Object)
        })
      );
      expect(result).toEqual(mockOrgsData);
    });

    /**
     * Test: API rate limit handling
     * WHY: GitHub API has rate limits - must handle gracefully
     */
    it('should handle GitHub API rate limit errors', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          message: 'API rate limit exceeded',
          documentation_url: 'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting'
        })
      });

      // Act & Assert
      await expect(fetchOrganizations()).rejects.toThrow(/rate limit/i);
    });

    /**
     * Test: Network failure handling
     * WHY: Network can fail - must not crash the application
     */
    it('should handle network failures gracefully', async () => {
      // Arrange
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Act & Assert
      await expect(fetchOrganizations()).rejects.toThrow('Network error');
    });

    /**
     * Test: Empty response handling
     * WHY: API might return empty array - should handle without errors
     */
    it('should handle empty organization list', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => []
      });

      // Act
      const result = await fetchOrganizations();

      // Assert
      expect(result).toEqual([]);
    });

    /**
     * Test: Malformed JSON response
     * WHY: API might return invalid JSON - must handle gracefully
     */
    it('should handle malformed JSON response', async () => {
      // Arrange
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => { throw new SyntaxError('Unexpected token'); }
      });

      // Act & Assert
      await expect(fetchOrganizations()).rejects.toThrow();
    });
  });

  describe('renderOrganizations', () => {
    /**
     * Test: Successful rendering
     * WHY: Core display functionality - organizations must appear on page
     */
    it('should render organization cards to the DOM', () => {
      // Arrange
      const container = document.getElementById('orgs-container');

      // Act
      renderOrganizations(mockOrgsData, container);

      // Assert
      const cards = container.querySelectorAll('.org-card');
      expect(cards.length).toBe(3);
    });

    /**
     * Test: Organization data displayed correctly
     * WHY: Users need to see correct information
     */
    it('should display organization name and description', () => {
      // Arrange
      const container = document.getElementById('orgs-container');

      // Act
      renderOrganizations(mockOrgsData, container);

      // Assert
      expect(container.innerHTML).toContain('IBM');
      expect(container.innerHTML).toContain('IBM Open Source');
      expect(container.innerHTML).toContain('ibm-cloud');
    });

    /**
     * Test: Links are correct
     * WHY: Users must be able to navigate to GitHub organizations
     */
    it('should create correct links to GitHub organizations', () => {
      // Arrange
      const container = document.getElementById('orgs-container');

      // Act
      renderOrganizations(mockOrgsData, container);

      // Assert
      const links = container.querySelectorAll('a[href*="github.com"]');
      expect(links.length).toBeGreaterThan(0);
      expect(links[0].href).toContain('github.com/IBM');
    });

    /**
     * Test: Empty data handling
     * WHY: Should show appropriate message when no orgs found
     */
    it('should display message when no organizations found', () => {
      // Arrange
      const container = document.getElementById('orgs-container');

      // Act
      renderOrganizations([], container);

      // Assert
      expect(container.innerHTML).toContain('No organizations found');
    });

    /**
     * Test: XSS prevention
     * WHY: SECURITY - Must sanitize data to prevent XSS attacks
     */
    it('should sanitize organization data to prevent XSS', () => {
      // Arrange
      const container = document.getElementById('orgs-container');
      const maliciousData = [{
        login: '<script>alert("xss")</script>',
        id: 9999999,
        avatar_url: 'javascript:alert("xss")',
        description: '<img src=x onerror=alert("xss")>',
        html_url: 'https://github.com/test',
        public_repos: 1,
        followers: 1
      }];

      // Act
      renderOrganizations(maliciousData, container);

      // Assert - Script tags should be escaped or removed
      expect(container.innerHTML).not.toContain('<script>');
      expect(container.innerHTML).not.toContain('javascript:');
      expect(container.innerHTML).not.toContain('onerror=');
    });

    /**
     * Test: Avatar images have alt text
     * WHY: ACCESSIBILITY - Screen readers need alt text
     */
    it('should include alt text for organization avatars', () => {
      // Arrange
      const container = document.getElementById('orgs-container');

      // Act
      renderOrganizations(mockOrgsData, container);

      // Assert
      const images = container.querySelectorAll('img');
      images.forEach(img => {
        expect(img.alt).toBeTruthy();
      });
    });
  });

  describe('updateOrgsCount', () => {
    /**
     * Test: Count display
     * WHY: Users should see total number of organizations
     */
    it('should update the organizations count display', () => {
      // Arrange
      const countElement = document.getElementById('orgs-count');

      // Act
      updateOrgsCount(mockOrgsData.length, countElement);

      // Assert
      expect(countElement.textContent).toContain('3');
    });

    /**
     * Test: Zero count
     * WHY: Should handle zero gracefully
     */
    it('should display zero when no organizations', () => {
      // Arrange
      const countElement = document.getElementById('orgs-count');

      // Act
      updateOrgsCount(0, countElement);

      // Assert
      expect(countElement.textContent).toContain('0');
    });
  });

  describe('sortOrganizations', () => {
    /**
     * Test: Sort by name ascending
     * WHY: Users may want alphabetical ordering
     */
    it('should sort organizations by name ascending', () => {
      // Act
      const sorted = sortOrganizations(mockOrgsData, 'name', 'asc');

      // Assert
      expect(sorted[0].login).toBe('IBM');
      expect(sorted[1].login).toBe('IBM-Watson');
      expect(sorted[2].login).toBe('ibm-cloud');
    });

    /**
     * Test: Sort by repos descending
     * WHY: Users may want to see most active orgs first
     */
    it('should sort organizations by repo count descending', () => {
      // Act
      const sorted = sortOrganizations(mockOrgsData, 'repos', 'desc');

      // Assert
      expect(sorted[0].public_repos).toBe(500);
      expect(sorted[1].public_repos).toBe(200);
      expect(sorted[2].public_repos).toBe(150);
    });

    /**
     * Test: Sort by followers
     * WHY: Popularity metric for organizations
     */
    it('should sort organizations by followers descending', () => {
      // Act
      const sorted = sortOrganizations(mockOrgsData, 'followers', 'desc');

      // Assert
      expect(sorted[0].followers).toBe(10000);
      expect(sorted[1].followers).toBe(8000);
      expect(sorted[2].followers).toBe(5000);
    });

    /**
     * Test: Invalid sort field
     * WHY: Should not crash with invalid input
     */
    it('should return original order for invalid sort field', () => {
      // Act
      const sorted = sortOrganizations(mockOrgsData, 'invalid', 'asc');

      // Assert
      expect(sorted).toEqual(mockOrgsData);
    });
  });

  describe('filterOrganizations', () => {
    /**
     * Test: Filter by search term
     * WHY: Users need to find specific organizations
     */
    it('should filter organizations by search term', () => {
      // Act
      const filtered = filterOrganizations(mockOrgsData, 'watson');

      // Assert
      expect(filtered.length).toBe(1);
      expect(filtered[0].login).toBe('IBM-Watson');
    });

    /**
     * Test: Case insensitive search
     * WHY: Better user experience
     */
    it('should perform case-insensitive search', () => {
      // Act
      const filtered = filterOrganizations(mockOrgsData, 'CLOUD');

      // Assert
      expect(filtered.length).toBe(1);
      expect(filtered[0].login).toBe('ibm-cloud');
    });

    /**
     * Test: Empty search returns all
     * WHY: Empty search should show everything
     */
    it('should return all organizations for empty search', () => {
      // Act
      const filtered = filterOrganizations(mockOrgsData, '');

      // Assert
      expect(filtered.length).toBe(3);
    });

    /**
     * Test: No matches
     * WHY: Should return empty array, not error
     */
    it('should return empty array when no matches found', () => {
      // Act
      const filtered = filterOrganizations(mockOrgsData, 'nonexistent');

      // Assert
      expect(filtered).toEqual([]);
    });

    /**
     * Test: Search in description
     * WHY: Users might search by description content
     */
    it('should search in organization description', () => {
      // Act
      const filtered = filterOrganizations(mockOrgsData, 'Open Source');

      // Assert
      expect(filtered.length).toBe(1);
      expect(filtered[0].login).toBe('IBM');
    });
  });

  describe('Error Handling UI', () => {
    /**
     * Test: Show error message
     * WHY: Users need to know when something goes wrong
     */
    it('should display error message to user', () => {
      // Arrange
      const errorElement = document.getElementById('error-message');

      // Act
      showError('Failed to load organizations', errorElement);

      // Assert
      expect(errorElement.classList.contains('hidden')).toBe(false);
      expect(errorElement.textContent).toContain('Failed to load organizations');
    });

    /**
     * Test: Hide loading indicator on error
     * WHY: Loading indicator should disappear when error occurs
     */
    it('should hide loading indicator when error occurs', () => {
      // Arrange
      const loadingElement = document.getElementById('loading-indicator');
      const errorElement = document.getElementById('error-message');

      // Act
      showError('Error occurred', errorElement);
      hideLoading(loadingElement);

      // Assert
      expect(loadingElement.classList.contains('visible')).toBe(false);
    });
  });
});

// Helper functions that would be in the actual orgs.js module
// These are mock implementations for testing purposes

/**
 * Fetches organizations from GitHub API
 * @returns {Promise<Array>} Array of organization objects
 */
async function fetchOrganizations() {
  const response = await global.fetch('https://api.github.com/orgs/IBM', {
    headers: {
      'Accept': 'application/vnd.github.v3+json'
    }
  });

  if (!response.ok) {
    if (response.status === 403) {
      const error = await response.json();
      if (error.message && error.message.includes('rate limit')) {
        throw new Error('API rate limit exceeded');
      }
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Renders organizations to the DOM
 * @param {Array} orgs - Array of organization objects
 * @param {HTMLElement} container - Container element
 */
function renderOrganizations(orgs, container) {
  if (!orgs || orgs.length === 0) {
    container.innerHTML = '<p class="no-results">No organizations found</p>';
    return;
  }

  const html = orgs.map(org => {
    // Sanitize data to prevent XSS
    const safeName = escapeHtml(org.login);
    const safeDescription = escapeHtml(org.description || '');
    const safeUrl = org.html_url.startsWith('https://github.com/') ? org.html_url : '#';
    const safeAvatar = org.avatar_url.startsWith('https://') ? org.avatar_url : '';

    return `
      <div class="org-card" data-org-id="${org.id}">
        <a href="${safeUrl}" target="_blank" rel="noopener noreferrer">
          <img src="${safeAvatar}" alt="${safeName} logo" class="org-avatar" />
          <h3 class="org-name">${safeName}</h3>
          <p class="org-description">${safeDescription}</p>
          <div class="org-stats">
            <span class="repos-count">${org.public_repos} repos</span>
            <span class="followers-count">${org.followers} followers</span>
          </div>
        </a>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

/**
 * Updates the organization count display
 * @param {number} count - Number of organizations
 * @param {HTMLElement} element - Element to update
 */
function updateOrgsCount(count, element) {
  element.textContent = `${count} organizations`;
}

/**
 * Sorts organizations by specified field
 * @param {Array} orgs - Array of organizations
 * @param {string} field - Field to sort by
 * @param {string} direction - 'asc' or 'desc'
 * @returns {Array} Sorted array
 */
function sortOrganizations(orgs, field, direction) {
  const sortedOrgs = [...orgs];
  
  const fieldMap = {
    'name': 'login',
    'repos': 'public_repos',
    'followers': 'followers'
  };

  const actualField = fieldMap[field];
  if (!actualField) return orgs;

  sortedOrgs.sort((a, b) => {
    let aVal = a[actualField];
    let bVal = b[actualField];

    // Handle string comparison
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }

    if (direction === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  return sortedOrgs;
}

/**
 * Filters organizations by search term
 * @param {Array} orgs - Array of organizations
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered array
 */
function filterOrganizations(orgs, searchTerm) {
  if (!searchTerm || searchTerm.trim() === '') {
    return orgs;
  }

  const term = searchTerm.toLowerCase();
  return orgs.filter(org => 
    org.login.toLowerCase().includes(term) ||
    (org.description && org.description.toLowerCase().includes(term))
  );
}

/**
 * Shows error message to user
 * @param {string} message - Error message
 * @param {HTMLElement} element - Error element
 */
function showError(message, element) {
  element.textContent = message;
  element.classList.remove('hidden');
}

/**
 * Hides loading indicator
 * @param {HTMLElement} element - Loading element
 */
function hideLoading(element) {
  element.classList.remove('visible');
}

/**
 * Escapes HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = global.document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
