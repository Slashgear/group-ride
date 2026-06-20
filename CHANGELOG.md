# Changelog

## v1.5.0 — 2026-06-20

### Features

- Attach iCal (.ics) file to ride announcements (Discord + Telegram)
- Multi-arch Docker build: linux/amd64 + linux/arm64

### Documentation

- Add commands reference, troubleshooting and changelog pages to the website
- Add status badges to README

## v1.4.0 — 2026-06-20

### Bug Fixes

- Update import path in messaging/shared/parse.ts after adapter reorganization
- **typecheck**: Use bunx tsc and resolve grammy type errors
- **typecheck**: Use bunx tsc and resolve grammy type errors
- Resolve remaining lint errors

### Documentation

- **website**: Consolidate documentation into Starlight site
- Remove ARCHITECTURE.md — content lives on the website
- **readme**: Add link to doc site, fix broken ARCHITECTURE.md link, update title
- **readme**: Update all sections to mention Telegram alongside Discord
- **contributing**: Fix broken SETUP.md link, add link to doc site
- **website**: Move adapter installation guides under adapters/
- Update file structure references after adapter reorganization

### Features

- Add GPX file upload + static route map generation
- Add Docker HEALTHCHECK via heartbeat file
- **docker**: Add HEALTHCHECK via heartbeat file

### Refactoring

- Group adapters by type under messaging/ and database/

### ci

- Add typecheck step

### test

- Add tests for importers and shared/parse
- Add tests for importers, gpx parser and shared parse utils

## v1.3.0 — 2026-06-19

### Bug Fixes

- Store pinnedMessageId as string to avoid snowflake precision loss

### Features

- **website**: Add Starlight documentation site with Mermaid support

## v1.2.0 — 2026-06-10

### Features

- Log startup config summary (version, adapter, database, timezone)

## v1.1.0 — 2026-06-10

### Bug Fixes

- Prevent double join
- **lint**: Extend oxlint scope to tests/ and fix await-thenable errors
- **lint**: Resolve all oxlint warnings
- **discord**: Skip deployCommands if slash commands are unchanged
- **docker**: Copy website/package.json so bun workspace resolves during install

### Documentation

- **discord**: Add adapter README with sequence diagrams
- Document TZ env var for reminder timezone configuration

### Features

- **discord**: Add /help command
- **telegram**: Add /help command and register bot commands menu
- Surface domain errors to users instead of silent failures
- **website**: Add landing page deployed to group-ride.slashgear.dev
- **website**: Add Pierre Reynaud as co-creator in footer
- Add git-cliff for changelog generation

### Refactoring

- **telegram**: Extract commands into separate files

## v1.0.0 — 2026-05-24

### Features

- **telegram**: Add /cancel and /edit commands, fix propose() message sequence

## v0.3.0 — 2026-05-24

### Bug Fixes

- UserId as string, NaN guard on scheduler, graceful shutdown, ORDER BY
- Create data dir with correct ownership and fix volume mount path

## v0.1.0 — 2026-05-23

