# WinLux

English | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md) | [한국어](./README.ko.md)

WinLux is a lightweight, Windows-only desktop utility built with Tauri 2 + React.
It lets you quickly switch Windows light/dark themes, stay in the system tray, manage app language preferences, and use Sunrise/Sunset Auto Theme Switching.

## Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Lazy Window Lifecycle](#lazy-window-lifecycle)
- [Scripts](#scripts)
- [Validation](#validation)
- [Project Structure](#project-structure)
- [Sunrise/Sunset Auto Theme Notes](#sunrisesunset-auto-theme-notes)
- [OpenStreetMap Attribution](#openstreetmap-attribution)
- [Language Notes](#language-notes)
- [License](#license)

## Features

- One-click switch between dark and light mode (for both Apps and System).
- Reads and writes Windows theme settings from:
  - `HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize`
- System tray support:
  - Open main window
  - Quick switch to dark/light mode
  - Toggle Sunrise/Sunset Auto Theme
  - Change language preference
  - Quit app
- Close-to-tray behavior (closing the window hides it instead of exiting).
- Language preference support (`auto` follow-system or manual selection).
- Sunrise/Sunset settings panel:
  - Resolve address to coordinates for Sunrise/Sunset Auto Theme setup (OpenStreetMap Nominatim)
  - Save a location and query sunrise/sunset for a target date
  - Automatically switch Apps/System theme by local sunrise/sunset transitions
- NSIS installer language selection with 30 language options.

## Screenshots

| Main Window | Tray Menu |
| --- | --- |
| ![Main Window](docs/screenshots/main-window.png) | ![Tray Menu](docs/screenshots/tray-menu.png) |
| Main interface | Tray quick actions |

## Tech Stack

- Frontend: React 18 + TypeScript + Vite
- Desktop runtime: Tauri 2
- Backend: Rust + `winreg` + `reqwest` + `sunrise` + `tokio`
- Package manager: Bun

## Requirements

- Windows 10 or Windows 11
- Bun (recommended latest stable)
- Rust stable toolchain (MSVC target)
- Tauri prerequisites for Windows (WebView2 / build tools)
- Internet access (only required for address geocoding via OpenStreetMap Nominatim)

## Quick Start

```bash
bun install
bun run tauri:dev
```

The app starts without rendering the main window and can be controlled from the tray icon.

## Lazy Window Lifecycle

- On startup, WinLux does not create the main WebView window (tray + background features only).
- Clicking tray left button or "Open Main Window" creates and shows the UI on demand.
- Closing the main window hides it first, then destroys the window instance after 3 minutes.
- Reopening from tray within 3 minutes cancels pending destroy and keeps the window alive.

## Scripts

| Command | Description |
| --- | --- |
| `bun run dev` | Run Vite frontend only (`http://localhost:5173`) |
| `bun run build` | Type-check and build frontend assets into `dist/` |
| `bun run typecheck` | Run TypeScript checks only |
| `bun run i18n:check` | Validate locale keys and placeholders |
| `bun run tauri:dev` | Run the Tauri desktop app in development mode |
| `bun run tauri:build` | Build desktop distributables (NSIS target) |
| `bun run release` | Build release with version inferred from latest Git tag |
| `bun run icon:gen` | Generate Windows icon assets |

## Validation

Before opening a PR, run at least:

```bash
bun run typecheck
cargo test -p winlux
```

## Project Structure

```text
.
├─ src/                 # React frontend and Tauri bridge
│  └─ lib/tauri.ts      # invoke wrappers + shared TS contracts
├─ src-tauri/src/       # Rust backend (commands, tray, i18n)
├─ src-tauri/icons/     # App/package icons
├─ scripts/             # Build/release helper scripts
└─ dist/                # Frontend output consumed by Tauri builds
```

## Sunrise/Sunset Auto Theme Notes

- Geocoding endpoint:
  - `https://nominatim.openstreetmap.org/search`
- Sunrise/Sunset Auto Theme worker:
  - Runs in the background and applies light/dark based on local sunrise/sunset at saved coordinates.
  - If Sunrise/Sunset Auto Theme is enabled but no location is saved, the app reports a configuration-required error.
- Settings stored in:
  - `HKCU\Software\WinLux\SolarAddress`
  - `HKCU\Software\WinLux\SolarDisplayName`
  - `HKCU\Software\WinLux\SolarLatitude`
  - `HKCU\Software\WinLux\SolarLongitude`
  - `HKCU\Software\WinLux\SolarAutoThemeEnabled`

## OpenStreetMap Attribution

- WinLux uses OpenStreetMap Nominatim (`https://nominatim.openstreetmap.org/search`) to convert user-entered addresses into coordinates for the Sunrise/Sunset Auto Theme feature.
- Geocoding data is © OpenStreetMap contributors, licensed under ODbL 1.0.
- Copyright and license details: `https://www.openstreetmap.org/copyright`

## Language Notes

- Supported language options (30):
  - English, Simplified Chinese, Traditional Chinese, Japanese, Korean, Thai, Vietnamese, Indonesian, French, German, Italian, Spanish (Spain), Spanish (International), Portuguese (Portugal), Portuguese (Brazil), Russian, Polish, Turkish, Ukrainian, Czech, Hungarian, Greek, Bulgarian, Romanian, Arabic, Dutch, Danish, Finnish, Norwegian, Swedish
- Main-window UI strings are localized for all supported language options above.
- Tray menu strings are loaded from `src/locales/tray-texts.json`.
- Language preference is stored at:
  - `HKCU\Software\WinLux\LanguagePreference`

## License

MIT. See `LICENSE`.
