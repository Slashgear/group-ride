# Changelog

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

