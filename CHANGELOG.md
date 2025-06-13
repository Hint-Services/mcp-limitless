# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-06-13

### Added
- **Enhanced `searchFiles` tool** with `searchIn` parameter supporting `filename`, `path`, `content`, `all` modes
- Filename search using GitHub's `filename:` qualifier for exact filename matching
- Path search using `in:path` qualifier for file path matching
- Comprehensive search mode using `in:file,path` qualifier (new default)
- Match type indicators in search results (📝 filename, 📁 path, 📄 content)
- Search tips displayed when no results found

### Changed
- Default search behavior now searches across filenames, paths, and content
- Improved GitHub search query construction with proper qualifiers
- Enhanced result formatting with match reasoning

### Fixed
- Issue where filename searches like "OKR 2025" required content matches

## [0.2.0] - 2025-05-26

### Added

- **New Tool: `getCommitHistory`** - Get commit history and file changes/diffs for the last X days
  - Diff-focused approach with `includeDiffs: true` by default
  - Rich commit metadata with GitHub URLs for linking
  - Author filtering and pagination support
  - Performance-balanced defaults (25 max commits, 8000 char diff limit)
  - Comprehensive error handling and input validation

### Changed

- Updated documentation with commit history tool examples and usage patterns
- Added new examples directory with detailed commit history examples
- Enhanced getting started guide with commit history workflows

### Documentation

- Added `docs/examples/commit-history-examples.md` with comprehensive usage examples
- Updated all documentation files to include the new tool
- Added testing guidelines for the commit history tool
- Updated contributing guidelines with commit history tool considerations

## [0.1.1] - Previous Release

### Features

- GitHub repository search functionality
- File content retrieval
- Issue search capabilities
- Type-safe implementation with Zod validation
- Rate limiting and error handling
