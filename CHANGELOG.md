# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Unit Testing**: Added `tests/readme_test.html` to verify `fetchGitHubReadme` functionality including retries and branch fallbacks.
- **Monitoring**: Implemented `logErrorToService` in `assets/js/main.js` to structure error logging and dispatch `app:error` events.
- **Validation**: Added `scripts/validate-config.js` to ensure Vercel configuration validity.
- **Mobile Optimization**:
  - Added z-index management for navbar (`nav.fixed { z-index: 100; }`).
  - Adjusted top margin for mobile devices to prevent content overlap.
  - Optimized viewport meta tag.
  - Reduced glassmorphism blur intensity on mobile for better performance.

### Changed
- **Directory Structure**:
  - Moved PHP files to `api/ACRO PREMIUM/` to align with Vercel Serverless Functions.
  - Updated `vercel.json` to use correct pattern `api/ACRO PREMIUM/*.php`.
  - Updated `netlify.toml` redirect rules.
- **Frontend Logic**:
  - Refactored `fetchGitHubReadme` to include retry logic (max 2 retries).
  - Added fallback to `master` branch if `main` branch 404s.
  - Added cache-busting parameter to GitHub API requests.
  - Improved error handling and user feedback in the UI.
- **Documentation**:
  - Rewrote `README.md` to remove open-source details and highlight proprietary status.
  - Updated `SETUP.md` with new webhook URL paths.

### Fixed
- **405 Method Not Allowed**: Fixed CORS issues in `webhook.php` and `check-status.php` by handling OPTIONS requests and adding correct headers.
- **GitHub README 404**: Addressed by adding branch fallback logic.
- **Mobile Layout**: Fixed header overlapping content on small screens.
