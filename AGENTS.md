# Repository Guidelines

## Project Structure & Module Organization
WinLux is a Tauri 2 desktop app with a React + TypeScript frontend.

- `src/`: frontend UI (`App.tsx`, `main.tsx`, `styles.css`) and Tauri bridge code in `src/lib/tauri.ts`.
- `src-tauri/src/`: Rust backend (`main.rs`, `commands.rs`, `models.rs`, `tray.rs`).
- `src-tauri/icons/`: app icons used for bundling.
- `dist/`: frontend build output consumed by Tauri packaging.
- Root configs: `package.json`, `vite.config.ts`, `tsconfig.json`, `src-tauri/tauri.conf.json`.

## Build, Test, and Development Commands
Use Bun as the primary package manager (matches `bun.lock` and Tauri hooks).

- `bun install`: install frontend and Tauri CLI dependencies.
- `bun run dev`: run the Vite web UI at `http://localhost:5173`.
- `bun run build`: type-check and build frontend assets into `dist/`.
- `bun run tauri:dev`: run the desktop app in development mode.
- `bun run tauri:build`: produce distributable desktop bundles.
- `bun run typecheck`: run TypeScript strict checks without emitting files.

## Coding Style & Naming Conventions
- TypeScript: 2-space indentation, single quotes, strict typing enabled.
- React: function components in `PascalCase`; hooks/state/helpers in `camelCase`.
- Rust: follow `rustfmt` defaults (4-space indentation), modules in `snake_case`.
- Tauri command names exposed to frontend should remain stable (e.g., `get_theme_state`).
- Keep frontend/backend contract types aligned (`ThemeState` in TS and Rust).

## Testing Guidelines
No automated test suite is currently checked in.

- Minimum gate before PR: `bun run typecheck` and `cargo test -p winlux`.
- Validate key flows manually on Windows: read theme state, apply light/dark, tray show/hide/quit.
- When adding tests later, place TS tests under `src/**/__tests__` and Rust tests near modules with `#[cfg(test)]`.

## Commit & Pull Request Guidelines
Use Conventional Commits and require GPG-signed commits.

- Commit format: `type(scope): summary` (e.g., `feat(tray): add left-click restore`).
- All commits must be GPG signed (`git commit -S ...`); unsigned commits should be amended with `git commit --amend -S`.
- Keep commits focused and atomic; avoid mixing UI and backend refactors.
- PRs should include: purpose, key changes, verification steps, and screenshots/GIFs for UI updates.
- Link related issues and call out Windows-specific behavior or registry impacts.

## Security & Configuration Notes
- Theme changes write to `HKCU\Software\Microsoft\Windows\CurrentVersion\Themes\Personalize`; never hardcode elevated paths.
- Keep `app.security` settings in `src-tauri/tauri.conf.json` intentionally scoped; review before release builds.
