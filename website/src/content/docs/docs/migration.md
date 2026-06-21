---
title: Migrating from SQLite to PostgreSQL
description: Step-by-step guide to move group-ride data from SQLite to PostgreSQL
---

This guide covers moving an existing group-ride installation from SQLite to PostgreSQL without losing ride history or members.

## Prerequisites

- `sqlite3` CLI available on the host (or inside the container)
- A running PostgreSQL instance accessible from the bot container
- `psql` CLI for running the migration
- The bot stopped (`docker compose stop bot`)

---

## Step 1 — Stop the bot

```bash
docker compose stop bot
```

Never migrate while the bot is running — a write mid-export corrupts the dump.

## Step 2 — Create the PostgreSQL schema

Connect to your PostgreSQL instance and run the migrations in order:

```bash
psql "$DATABASE_URL" -f src/adapters/database/postgres/migrations/001_initial.sql
psql "$DATABASE_URL" -f src/adapters/database/postgres/migrations/002_add_pinned_message_id.sql
psql "$DATABASE_URL" -f src/adapters/database/postgres/migrations/003_add_proposer_name.sql
psql "$DATABASE_URL" -f src/adapters/database/postgres/migrations/004_add_meeting_time.sql
psql "$DATABASE_URL" -f src/adapters/database/postgres/migrations/005_add_ride_name.sql
psql "$DATABASE_URL" -f src/adapters/database/postgres/migrations/006_add_reminder_flags.sql
```

## Step 3 — Export data from SQLite

Run this from the host where the SQLite file lives (default path: `./data/group-ride.db`):

```bash
sqlite3 ./data/group-ride.db <<'EOF'
.mode csv
.headers on
.output /tmp/rides.csv
SELECT * FROM rides;
.output /tmp/ride_members.csv
SELECT * FROM ride_members;
EOF
```

## Step 4 — Import into PostgreSQL

### Rides

```bash
psql "$DATABASE_URL" -c "\COPY rides FROM '/tmp/rides.csv' CSV HEADER"
```

### Members

```bash
psql "$DATABASE_URL" -c "\COPY ride_members FROM '/tmp/ride_members.csv' CSV HEADER"
```

## Step 5 — Verify the import

```bash
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM rides;"
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM ride_members;"
```

Compare the counts with SQLite:

```bash
sqlite3 ./data/group-ride.db "SELECT COUNT(*) FROM rides;"
sqlite3 ./data/group-ride.db "SELECT COUNT(*) FROM ride_members;"
```

## Step 6 — Update environment variables

In your `.env` or `docker-compose.yml`, add `DATABASE_URL` and remove `DATABASE_PATH`:

```env
DATABASE_URL=postgres://user:password@db:5432/group_ride
```

Remove or comment out:

```env
# DATABASE_PATH=./data/group-ride.db
```

## Step 7 — Restart the bot

```bash
docker compose up -d bot
docker compose logs -f bot
```

The bot should log `Starting Group Ride` with `"database": "postgres://..."` — confirming it is using PostgreSQL.

---

## Known gotchas

### Boolean columns

SQLite stores `reminder_day_sent` and `reminder_hour_sent` as integers (`0` / `1`). The CSV export preserves these as `0`/`1`, which PostgreSQL's `COPY` accepts for `BOOLEAN` columns automatically.

### Date columns

SQLite stores dates as ISO 8601 strings (e.g. `2026-06-15T10:00:00.000Z`). PostgreSQL accepts these via `COPY` and parses them into `TIMESTAMPTZ` correctly.

### proposer_id type

SQLite stores `proposer_id` as `INTEGER`, PostgreSQL as `TEXT`. The CSV export produces the integer, which PostgreSQL accepts and stores as text.

### Large chat IDs (Telegram)

Telegram group IDs are 64-bit integers (e.g. `-1001234567890`). SQLite stores them as `INTEGER`, PostgreSQL as `TEXT`. The CSV round-trip preserves the value without precision loss.

---

## Rolling back

If something goes wrong, restore the SQLite setup:

1. Remove `DATABASE_URL` from your environment
2. Restore `DATABASE_PATH` if you had a custom path
3. Restart the bot — it will use SQLite again

The SQLite file is untouched by the migration.
