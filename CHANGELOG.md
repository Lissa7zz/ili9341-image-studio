# Changelog

All notable changes to this project will be documented in this file.

## [0.3.0] - 2026-11-11

### Added

- First-screen quick access and Windows download actions.
- Tauri desktop application with native Save As dialogs.
- Windows MSI, NSIS installer, and portable EXE release workflow.
- SHA-256 checksums for all Windows release assets.

## [0.2.0] - 2026-11-10

### Added

- Paired STM32 `.h` and `.c` source export inside a ZIP archive.
- Real Chromium browser tests for image loading, Canvas rendering, responsive
  layout, and source archive downloads.
- GitHub Actions CI for unit, DOM, and browser tests.

### Changed

- Generated headers now contain declarations instead of full image data,
  preventing duplicate definitions when included by multiple source files.

## [0.1.1] - 2026-11-10

### Fixed

- Quoted the Windows launcher command so `start.bat` opens consistently.

## [0.1.0] - 2026-11-10

### Added

- Drag-and-drop image input with local-only browser processing.
- Automatic cover, contain, and stretch fitting.
- Focus positioning, zoom, rotation, custom dimensions, and background color.
- STM32 C header export with RGB565 high-byte-first data.
- Raw RGB565 binary export and PNG-backed ICO project icon export.
- Core encoder tests and zero-dependency local development server.
- MIT License and GitHub Pages deployment workflow.
