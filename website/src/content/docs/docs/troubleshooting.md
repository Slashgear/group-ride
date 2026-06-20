---
title: Troubleshooting
description: Common issues and fixes for group-ride
---

## Discord

### Slash commands don't appear

The bot registers slash commands on startup. If they don't appear:

1. Make sure `DISCORD_GUILD_ID` matches the server where the bot is installed — commands are guild-scoped, not global.
2. Check the bot logs for a `Deploying slash commands` or `Slash commands unchanged` line.
3. Try kicking and re-inviting the bot with the correct permissions (`application.commands` + `bot` scopes).

### The bot doesn't react to button clicks

The bot must be running to handle button interactions. Check `docker compose ps` and `docker compose logs -f`.

### "Missing Access" error in logs

The bot is missing permissions on the announcement or forum channel. Go to **Server Settings → Roles** and ensure the bot role has:

- **Send Messages** and **Embed Links** on the announcement channel
- **Send Messages in Threads**, **Create Public Threads**, and **Manage Threads** on the forum channel

### Announcement appears but no thread is created

The `DISCORD_FORUM_CHANNEL_ID` must be a **Forum Channel**, not a text channel. Right-click the channel and check its type. Create a new Forum Channel if needed.

---

## Telegram

### The bot doesn't respond to `/newride`

1. Make sure the bot is a member of the group and has permission to send messages.
2. In groups, bot commands must include the bot username: `/newride@YourBotName`. Register the commands via @BotFather to enable the shorthand.
3. Check that `TELEGRAM_TOKEN` is correct — copy it fresh from @BotFather if unsure.

### `TELEGRAM_GROUP_CHAT_ID` is wrong

Send a message in your group, then call:

```
https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

Find your message in the response — the chat ID is in `result[n].message.chat.id`. It will be a negative number (e.g. `-1001234567890`).

### The bot announces in the wrong chat

`TELEGRAM_GROUP_CHAT_ID` must be the supergroup chat ID (negative number). Topic IDs from forum groups are different — use the group's top-level chat ID.

---

## Database

### SQLite: "unable to open database file"

The `data/` directory must exist and be writable by the `bun` user. The Docker image creates `/usr/src/app/data` automatically, but if you bind-mount a host directory, make sure it exists:

```bash
mkdir -p ./data
```

### PostgreSQL: connection refused

1. Check that `DATABASE_URL` is reachable from inside the container.
2. If using Docker Compose, use the service name as the host (e.g. `postgres://user:pass@db:5432/group_ride`), not `localhost`.
3. Run the migration before the first start:

```bash
psql "$DATABASE_URL" -f src/adapters/database/postgres/migrations/001_initial.sql
```

---

## General

### Reminders fire at the wrong time

Set `TZ` to your group's local timezone, e.g. `TZ=Europe/Paris`. The day-before reminder fires at **20:00** local time and the hour-before reminder fires **1 hour before the ride start**.

### The bot starts but immediately exits

Check the logs — a missing required environment variable (`DISCORD_TOKEN`, `TELEGRAM_TOKEN`, etc.) will cause a startup error. Run `docker compose logs bot` to see the error.

### I updated the image but the bot still runs the old version

```bash
docker compose pull
docker compose up -d
```

`restart: unless-stopped` keeps the old container running until you explicitly recreate it.
