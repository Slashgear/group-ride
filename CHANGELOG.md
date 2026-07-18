---
title: Changelog
description: Release history for group-ride
---

# Changelog

## v1.10.0 — 2026-07-18

### Features

- **weather**: Allow /weather to take an explicit location and date
- **weather**: Attach a PNG forecast panel to /weather replies

## v1.9.0 — 2026-07-18

### Bug Fixes

- **scheduler**: Restrict day-before reminders to 9am-10pm
- **weather**: Resolve forecast location from GPX start point or explicit city

### Features

- **weather**: Add on-demand /weather command and richer forecasts

## v1.8.0 — 2026-06-27

### Features

- **weather**: Add weather forecast to day-before reminders

## v1.7.6 — 2026-06-26

### Bug Fixes

- **ci**: Use correct server path and strip v prefix from docker image tag
- **sqlite**: Use CAST(AS TEXT) in queries to prevent Discord snowflake precision loss

## v1.7.5 — 2026-06-26

### Bug Fixes

- **ci**: Pin exact version tag on deploy instead of relying on latest

## v1.7.4 — 2026-06-26

### Bug Fixes

- Prevent bot crash when announcement channel post fails
- Prevent bot crash from unhandled rejections in all Discord handlers
- Use fetchStarterMessage() to reliably edit forum thread starter message
- Isolate scheduler errors per ride and add catch on tick()
- Use exact hostname matching to prevent URL substring bypass (CWE-020)
- Add explicit permissions: read to CI workflow jobs (CWE-275)
- **sqlite**: Store Discord IDs as TEXT to prevent snowflake precision loss

## v1.7.2 — 2026-06-24

### Bug Fixes

- Register missing SQLite migrations 007 and 008 in db.ts

## v1.7.1 — 2026-06-24

### Bug Fixes

- Shorten modal label to stay within Discord's 45-char limit

### Documentation

- Single-source changelog via symlink from docs to root CHANGELOG.md

## v1.7.0 — 2026-06-21

### Bug Fixes

- Harden config validation — unknown adapter, numeric chat ID, remove dead guards
- Resolve all lint warnings in config.ts and config.test.ts

### Documentation

- Add FAQ, migration guide, enrich Telegram troubleshooting; add JSON-LD schema
- **landing**: Add /pastrides to commands ref; rewrite hero sub + add CTA button

### Features

- Validate config at startup and warn on unused adapter vars
- Add findPast() to RideRepository — returns past rides sorted by date DESC
- Add /pastrides command on Discord and Telegram
- Add optional participant cap and waitlist

## v1.6.0 — 2026-06-21

### Documentation

- Enrich llms.txt with architecture, commands, env vars, and tech stack
- Document i18n system in architecture and configuration pages
- Document i18n in architecture and configuration pages

### Features

- Add i18n support (EN/FR) via LANG env var
- Add i18n support (EN/FR) via LANG env var

### style

- Fix formatting in configuration.md

## v1.5.3 — 2026-06-21

### Features

- **observability**: Log unexpected errors in handlers before re-throwing

### test

- Add SchedulerService tests with fake timers

## v1.5.2 — 2026-06-21

### test

- Add PostgreSQL integration tests + CI job with postgres service

## v1.5.1 — 2026-06-20

### test

- Add RideService integration tests with SQLite in-memory

## v1.5.0 — 2026-06-20

### Documentation

- Add status badges to README
- Add commands reference, troubleshooting and changelog pages

### Features

- Attach iCal file to ride announcements
- Attach iCal file to ride announcements

### ci

- Add multi-arch Docker build (amd64 + arm64)
- Add multi-arch Docker build (amd64 + arm64)

### style

- Fix formatting on commands and troubleshooting pages

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

