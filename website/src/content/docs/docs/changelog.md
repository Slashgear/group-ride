---
title: Changelog
description: Release history for group-ride
---

## v1.5.1 — 2026-06-20

### Refactoring

- Inject `Database` into `SqliteRideRepository` constructor instead of module-level singleton

### Tests

- Add 18 `RideService` integration tests with SQLite in-memory DB

---

## v1.5.0 — 2026-06-20

### Features

- Attach iCal (`.ics`) file to ride announcements — participants can add the ride directly to their calendar
- Multi-arch Docker build: `linux/amd64` + `linux/arm64` (Raspberry Pi, Scaleway ARM)

### Documentation

- Add commands reference, troubleshooting and changelog pages to the website
- Add status badges to README

---

## v1.4.0 — 2026-06-20

### Features

- Add Docker HEALTHCHECK via heartbeat file
- Add tests for importers and shared parse utils

### Refactoring

- Group adapters by type under `messaging/` and `database/`

### CI

- Add typecheck step to CI pipeline

### Bug Fixes

- Fix import path in `messaging/shared/parse.ts` after adapter reorganisation
- Use `bunx tsc` for typecheck and resolve grammy type errors
- Resolve remaining lint errors

### Documentation

- Consolidate all documentation into Starlight site
- Separate Discord and Telegram installation guides
- Add deployment guide (migrated from DEPLOY.md)
- Update README to mention Telegram throughout

---

## v1.3.0 — 2026-06-19

### Features

- Add Starlight documentation site with Mermaid support

### Bug Fixes

- Store `pinnedMessageId` as string to avoid snowflake precision loss

---

## v1.2.0 — 2026-06-10

### Features

- Log startup config summary (version, adapter, database, timezone)

---

## v1.1.0 — 2026-06-10

### Features

- Add `/help` command for Discord and Telegram
- Surface domain errors to users instead of silent failures
- Add landing page deployed to `group-ride.slashgear.dev`

### Bug Fixes

- Prevent double join
- Skip slash command deploy when commands are unchanged
- Copy `website/package.json` so Bun workspace resolves during Docker install

### Documentation

- Add Discord adapter README with sequence diagrams
- Document `TZ` env var for reminder timezone configuration
