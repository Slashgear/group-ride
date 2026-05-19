# Contributing

Thanks for your interest in contributing to Group Ride!

## Prerequisites

- [Bun](https://bun.sh) >= 1.1
- [Git](https://git-scm.com)
- A code editor with TypeScript support (VS Code, WebStorm, etc.)

## Local setup

```bash
git clone https://github.com/Slashgear/group-ride.git
cd group-ride
bun install
cp .env.example .env   # fill in your values — see SETUP.md
```

You don't need a real Telegram bot to run the tests or work on business logic. A bot token is only required to run the bot itself.

## Project structure

```
src/
├── domain/
│   ├── ride.ts                  # core types (Ride, CreateRideInput…)
│   └── ports/                   # interfaces the domain depends on
│       ├── messaging.port.ts    # MessagingPort
│       └── ride.repository.ts   # RideRepository
├── services/                    # business logic — no Telegram, no SQLite
│   ├── ride.service.ts
│   ├── scheduler.service.ts
│   └── importer/                # Komoot / Strava / Garmin scrapers
├── adapters/
│   ├── telegram/                # grammY bot, handlers, conversations
│   └── sqlite/                  # SQLite implementation of RideRepository
└── index.ts                     # dependency wiring + bot startup

tests/
└── services/                    # unit tests (no bot, no DB)
```

**Key rule:** `services/` must never import from `adapters/`. Business logic depends only on the port interfaces defined in `domain/ports/`.

## Running tests

```bash
bun test
```

Tests run against in-memory mocks — no bot token or database needed.

## Code style

This project uses [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for formatting and [oxlint](https://oxc.rs/docs/guide/usage/linter.html) for linting.

```bash
bun run fmt          # format all files
bun run fmt:check    # check without modifying (used in CI)
bun run lint         # lint src/
bun run lint:fix     # lint + auto-fix
```

Please run `bun run fmt` and `bun run lint` before opening a pull request. CI will enforce both.

## Adding a new importer

Importers live in `src/services/importer/`. To add support for a new platform:

1. Create `src/services/importer/yourplatform.ts` and implement:
   ```ts
   export async function importFromYourPlatform(url: string): Promise<Partial<CreateRideInput>>
   ```
2. Register the hostname in `src/services/importer/index.ts`
3. Throw `ExtractionFailedError` if the page is private or data cannot be parsed
4. Add tests in `tests/services/importer/`

## Pull request process

1. Branch off `main` — use a descriptive name (`feat/strava-importer`, `fix/scheduler-close`)
2. Keep PRs focused — one concern per PR
3. Make sure `bun test`, `bun run fmt:check` and `bun run lint` all pass
4. Write a clear PR description explaining *why*, not just *what*

## Open questions

Before working on a larger feature, check the [open questions](README.md#open-questions) section in the README — some design decisions are still pending.
