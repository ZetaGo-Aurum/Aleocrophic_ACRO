# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **PRO tanpa Plus Tier**: 
  - Renamed from "Free Tier" to align with new branding.
  - Added card to `index.html` with direct link to GitHub repository.
  - Updated `README.md` comparison table.
- **Image Fallback System**: Implemented global error handling for images in `assets/js/main.js`.
- **Safe Logging**: Added read-only filesystem check and fallback for PHP error logs.

### Fixed
- **Read-only File System Error**: Fixed `mkdir()` failure on serverless environments by adding write permission checks and fallbacks.
- **Gagal Load Image**: Resolved by implementing a fallback mechanism and adding image error validation.
- **Tier Naming Consistency**: Updated all references of "Free" to "PRO tanpa Plus".
- **API 404/500 Errors**: Resolved by correcting directory paths and improving database connection error handling.
- **Mobile Layout**: (Previous fixes preserved) z-index management and overflow issues.

