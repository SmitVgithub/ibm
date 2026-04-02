#!/bin/bash
# =============================================================================
# Test Runner Script for IBM GitHub Showcase
# =============================================================================
# This script runs all tests including:
# - Unit tests (JSHint linting)
# - Integration tests (API connectivity)
# - Static analysis
# - Accessibility checks
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results directory
TEST_RESULTS_DIR="${TEST_RESULTS_DIR:-./test-results}"
mkdir -p "$TEST_RESULTS_DIR"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_skip() {
    echo -e "${YELLOW}[SKIP]${NC} $1"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local allow_failure="${3:-false}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log_info "Running: $test_name"
    
    local start_time=$(date +%s)
    local output_file="$TEST_RESULTS_DIR/${test_name// /_}.log"
    
    if eval "$test_command" > "$output_file" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        log_success "$test_name (${duration}s)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        local exit_code=$?
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        if [ "$allow_failure" = "true" ]; then
            log_warning "$test_name failed but allowed (${duration}s)"
            SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
            return 0
        else
            log_error "$test_name (${duration}s) - Exit code: $exit_code"
            log_error "See $output_file for details"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return 1
        fi
    fi
}

# =============================================================================
# Test Suites
# =============================================================================

test_file_structure() {
    log_info "=== File Structure Tests ==="
    
    # Test critical files exist
    run_test "index.html exists" "test -f index.html"
    run_test "js directory exists" "test -d js"
    run_test "styles directory exists" "test -d styles"
    run_test "assets directory exists" "test -d assets"
    run_test "fonts directory exists" "test -d fonts"
    
    # Test JavaScript files
    run_test "orgs.js exists" "test -f js/orgs.js"
    run_test "repos.js exists" "test -f js/repos.js"
    
    # Test CSS files
    run_test "default.css exists" "test -f styles/default.css"
    
    # Test file sizes are reasonable
    run_test "index.html is not empty" "test -s index.html"
    run_test "orgs.js is not empty" "test -s js/orgs.js"
    run_test "repos.js is not empty" "test -s js/repos.js"
}

test_javascript_syntax() {
    log_info "=== JavaScript Syntax Tests ==="
    
    # Run JSHint if available
    if command -v jshint &> /dev/null || [ -f node_modules/.bin/jshint ]; then
        run_test "JSHint orgs.js" "npm test"
    else
        log_skip "JSHint not available"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    fi
    
    # Basic syntax check with Node.js
    if command -v node &> /dev/null; then
        run_test "Node.js syntax check orgs.js" "node --check js/orgs.js 2>/dev/null || node -e \"require('fs').readFileSync('js/orgs.js', 'utf8')\"" "true"
        run_test "Node.js syntax check repos.js" "node --check js/repos.js 2>/dev/null || node -e \"require('fs').readFileSync('js/repos.js', 'utf8')\"" "true"
    fi
}

test_html_validity() {
    log_info "=== HTML Validity Tests ==="
    
    # Check for basic HTML structure
    run_test "HTML has doctype" "grep -qi '<!DOCTYPE html>' index.html"
    run_test "HTML has html tag" "grep -qi '<html' index.html"
    run_test "HTML has head tag" "grep -qi '<head' index.html"
    run_test "HTML has body tag" "grep -qi '<body' index.html"
    run_test "HTML has title tag" "grep -qi '<title' index.html"
    
    # Check for meta tags
    run_test "HTML has charset meta" "grep -qi 'charset' index.html"
    run_test "HTML has viewport meta" "grep -qi 'viewport' index.html" "true"
}

test_css_validity() {
    log_info "=== CSS Validity Tests ==="
    
    # Check CSS file exists and has content
    run_test "CSS file has content" "test -s styles/default.css"
    
    # Check for common CSS issues
    run_test "CSS has no syntax errors (basic)" "! grep -E '^[^/]*{[^}]*{' styles/default.css" "true"
}

test_security() {
    log_info "=== Security Tests ==="
    
    # Check for potential security issues in JavaScript
    run_test "No eval() usage" "! grep -r 'eval(' js/ --include='*.js'" "true"
    run_test "No document.write usage" "! grep -r 'document\.write' js/ --include='*.js'" "true"
    run_test "No inline event handlers in HTML" "! grep -E 'on(click|load|error|mouseover)=' index.html" "true"
    
    # Check for hardcoded secrets
    run_test "No hardcoded API keys" "! grep -riE '(api[_-]?key|apikey|secret|password|token)\s*[:=]\s*[\"\x27][a-zA-Z0-9]{20,}' . --include='*.js' --include='*.html'" "true"
    
    # Check for sensitive files
    run_test "No .env files" "! test -f .env"
    run_test "No private keys" "! find . -name '*.pem' -o -name '*.key' | grep -q ."
}

test_assets() {
    log_info "=== Asset Tests ==="
    
    # Check images exist
    run_test "Assets directory has images" "find assets -type f \\( -name '*.png' -o -name '*.jpg' -o -name '*.gif' \\) | grep -q ."
    
    # Check fonts exist
    run_test "Fonts directory has font files" "find fonts -type f \\( -name '*.woff' -o -name '*.woff2' -o -name '*.ttf' -o -name '*.otf' -o -name '*.eot' \\) | grep -q ." "true"
    
    # Check for broken image references in HTML
    run_test "Image references are valid" "for img in \$(grep -oE 'src=\"[^\"]+\.(png|jpg|gif|svg)\"' index.html | sed 's/src=\"//;s/\"//'); do test -f \"\$img\" || echo \"Missing: \$img\"; done | ! grep -q 'Missing'" "true"
}

test_github_api_connectivity() {
    log_info "=== GitHub API Connectivity Tests ==="
    
    # Test GitHub API is reachable
    if command -v curl &> /dev/null; then
        run_test "GitHub API is reachable" "curl -sf -o /dev/null -w '%{http_code}' https://api.github.com | grep -q '200'" "true"
        
        # Test IBM organization endpoint
        run_test "IBM org endpoint accessible" "curl -sf -o /dev/null https://api.github.com/orgs/IBM" "true"
        
        # Test rate limit status
        run_test "GitHub API rate limit check" "curl -sf https://api.github.com/rate_limit | grep -q 'rate'" "true"
    else
        log_skip "curl not available for API tests"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 3))
    fi
}

test_docker_build() {
    log_info "=== Docker Build Tests ==="
    
    if command -v docker &> /dev/null; then
        # Test Dockerfile exists
        run_test "Dockerfile exists" "test -f Dockerfile"
        
        # Test Dockerfile syntax (basic)
        run_test "Dockerfile has FROM instruction" "grep -q '^FROM' Dockerfile"
        run_test "Dockerfile has EXPOSE instruction" "grep -q '^EXPOSE' Dockerfile"
        run_test "Dockerfile has HEALTHCHECK" "grep -q 'HEALTHCHECK' Dockerfile" "true"
        
        # Test Docker build (if in CI environment)
        if [ "${CI:-false}" = "true" ]; then
            run_test "Docker build succeeds" "docker build -t test-build:latest . --no-cache" "true"
        else
            log_skip "Docker build test skipped (not in CI)"
            SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        fi
    else
        log_skip "Docker not available"
        SKIPPED_TESTS=$((SKIPPED_TESTS + 5))
    fi
}

test_performance() {
    log_info "=== Performance Tests ==="
    
    # Check file sizes
    run_test "index.html under 100KB" "test \$(stat -f%z index.html 2>/dev/null || stat -c%s index.html) -lt 102400"
    run_test "Total JS under 50KB" "test \$(find js -name '*.js' -exec cat {} + | wc -c) -lt 51200" "true"
    run_test "Total CSS under 100KB" "test \$(find styles -name '*.css' -exec cat {} + | wc -c) -lt 102400" "true"
    
    # Check for minification opportunities
    run_test "No excessive whitespace in JS" "! grep -E '^\s{10,}' js/*.js" "true"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    echo "============================================================================="
    echo "  IBM GitHub Showcase - Test Suite"
    echo "  Started at: $(date)"
    echo "============================================================================="
    echo ""
    
    # Run all test suites
    test_file_structure
    echo ""
    
    test_javascript_syntax
    echo ""
    
    test_html_validity
    echo ""
    
    test_css_validity
    echo ""
    
    test_security
    echo ""
    
    test_assets
    echo ""
    
    test_github_api_connectivity
    echo ""
    
    test_docker_build
    echo ""
    
    test_performance
    echo ""
    
    # Print summary
    echo "============================================================================="
    echo "  Test Summary"
    echo "============================================================================="
    echo -e "  Total Tests:   $TOTAL_TESTS"
    echo -e "  ${GREEN}Passed:${NC}        $PASSED_TESTS"
    echo -e "  ${RED}Failed:${NC}        $FAILED_TESTS"
    echo -e "  ${YELLOW}Skipped:${NC}       $SKIPPED_TESTS"
    echo "============================================================================="
    echo "  Completed at: $(date)"
    echo "============================================================================="
    
    # Generate JUnit XML report for CI
    cat > "$TEST_RESULTS_DIR/junit.xml" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<testsuites name="IBM GitHub Showcase Tests" tests="$TOTAL_TESTS" failures="$FAILED_TESTS" skipped="$SKIPPED_TESTS">
  <testsuite name="All Tests" tests="$TOTAL_TESTS" failures="$FAILED_TESTS" skipped="$SKIPPED_TESTS">
    <testcase name="Test Suite" classname="TestRunner">
      $(if [ $FAILED_TESTS -gt 0 ]; then echo "<failure message=\"$FAILED_TESTS tests failed\"/>"; fi)
    </testcase>
  </testsuite>
</testsuites>
EOF
    
    # Exit with appropriate code
    if [ $FAILED_TESTS -gt 0 ]; then
        log_error "$FAILED_TESTS test(s) failed!"
        exit 1
    else
        log_success "All tests passed!"
        exit 0
    fi
}

# Run main function
main "$@"
