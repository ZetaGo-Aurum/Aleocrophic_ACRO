# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Free Tier Implementation**:
  - Added "FREE Edition" card to `index.html` with a direct link to the GitHub repository.
  - Updated `README.md` comparison table to include the Free tier.
  - Configured automatic redirect via button link to the relevant GitHub repo.
- **Backend Refactoring**: 
  - Implemented environment variable management with `.env` loader in `db.php`.
  - Added `api/premium/config.php` for centralized configuration (auto-approval, logging).
  - Introduced auto-approval mechanism for VIP emails and domains.
- **Documentation**: Added `API_SPEC.md` for detailed endpoint documentation.

### Changed
- **Directory Structure**:
  - Renamed `api/ACRO PREMIUM/` to `api/premium/` to resolve URL encoding issues and 404 errors.
  - Updated all references in `assets/js/main.js`, `vercel.json`, and `netlify.toml`.
- **Backend Improvements**:
  - Enhanced error handling in `check-status.php` with structured JSON responses and server-side logging.
  - Standardized license key generation format (`ACRO-ULT-*` and `ACRO-PP-*`).

### Fixed
- **API 404/500 Errors**: Resolved by correcting directory paths and improving database connection error handling.
- **Mobile Layout**: (Previous fixes preserved) z-index management and overflow issues.

