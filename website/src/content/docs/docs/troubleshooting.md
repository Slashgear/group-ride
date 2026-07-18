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

### Commands don't appear in the Telegram menu

The bot registers commands with Telegram on startup via `setMyCommands`. If the menu is empty or outdated:

1. Restart the bot — it re-registers commands every time it starts.
2. In the chat, type `/` to force Telegram to refresh the command list.
3. If commands still don't appear, check that the bot has **admin rights** in the group (required for `setMyCommands` to apply inside a group).

### The bot was removed from the group — how do I re-add it?

1. Re-invite the bot to the group via its username (`@YourBotName`).
2. Promote it to **admin** with permission to send messages and manage topics (if using a forum group).
3. Restart the bot so it re-registers commands and resumes the scheduler.

Existing ride data is unaffected — the bot reconnects to the same database.

### The `/newride` conversation stopped mid-way

The bot uses stateful conversations (grammY Conversations). Conversation state lives in memory and is lost if the bot restarts. Send `/newride` again to start fresh — no partial data is saved until the last step.

### The bot doesn't receive messages (allowed_updates issue)

The bot subscribes to `message`, `callback_query`, `chat_member`, and `inline_query` updates. If it stops receiving messages after a configuration change:

1. Check that the bot is still a group member: send a message and watch `docker compose logs -f bot`.
2. Verify the bot has not been demoted or silenced by a group admin.
3. Restart the bot — it re-subscribes to updates on startup.

### Reminders are not sent on Telegram

1. Confirm `TZ` is set to your group's timezone (e.g. `TZ=Europe/Paris`). The day-before reminder fires on the first scheduler tick between **9am and 10pm**, and the hour-before fires **1 hour before** `meetingTime`.
2. If `meetingTime` is not set on the ride, the hour-before reminder is skipped.
3. Check that the bot is running at the scheduled time: `docker compose ps`.
4. If the bot was offline at reminder time, it will send the reminder on restart if the ride is still in the future.

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

Set `TZ` to your group's local timezone, e.g. `TZ=Europe/Paris`. The day-before reminder fires on the first scheduler tick between **9am and 10pm** local time (to avoid nighttime notifications), and the hour-before reminder fires **1 hour before the ride start**.

### The bot starts but immediately exits

Check the logs — a missing required environment variable will cause a startup error on boot. The error message lists **all** missing variables at once:

```
Missing required environment variables: DISCORD_TOKEN, DISCORD_CLIENT_ID
```

Run `docker compose logs bot` to see it, then add the missing variables to your `.env` file or `docker-compose.yml`.

### Warning: variables from another adapter are set

If the bot logs a line like:

```
The following variables are set but will be ignored (active adapter: discord): TELEGRAM_TOKEN, TELEGRAM_GROUP_CHAT_ID
```

it means variables for the **inactive** adapter are present in your environment. The bot still runs, but the unused variables have no effect. Either:

- Remove the unused variables, or
- Switch adapters by setting `ADAPTER=telegram` (or `ADAPTER=discord`).

### I updated the image but the bot still runs the old version

```bash
docker compose pull
docker compose up -d
```

`restart: unless-stopped` keeps the old container running until you explicitly recreate it.
