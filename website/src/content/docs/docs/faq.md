---
title: FAQ
description: Frequently asked questions about group-ride
---

## General

### Can I delete a ride after it's closed?

No. Closed and cancelled rides are kept in the database for history (accessible via `/pastrides`). There is no delete command by design — it avoids confusion for participants who may have saved the thread. If you need to remove data, you can delete the row directly from the database.

### What happens if the bot is offline when a reminder is due?

The scheduler runs every minute. If the bot was offline at the scheduled time, the reminder is sent as soon as the bot restarts, provided the ride is still in the future. If the ride has already passed by the time the bot comes back up, the reminder is skipped.

### Does the bot support multiple servers / groups?

Each bot instance serves one Discord guild or one Telegram group, set by `DISCORD_GUILD_ID` or `TELEGRAM_GROUP_CHAT_ID`. To serve multiple groups, run one bot instance per group, each with its own configuration and database.

---

## Timezones and reminders

### Reminders fire at the wrong time — why?

The bot uses the `TZ` environment variable (or the system timezone if unset). All reminder times are computed in that timezone:

- Day-before reminder: first scheduler tick between **9am and 10pm** local time, the day before the ride (this window exists to avoid nighttime notifications)
- Hour-before reminder: **1 hour** before the ride's start time (based on `meetingTime`)

If `meetingTime` is not set, the hour-before reminder is not sent. Set `TZ` to your group's timezone, e.g. `TZ=Europe/Paris`.

### Do reminders account for Daylight Saving Time?

Yes. Node.js/Bun resolves DST transitions automatically using the IANA timezone database. As long as `TZ` is set to a named zone (e.g. `Europe/Paris`, not `UTC+2`), DST is handled correctly.

### A participant is in a different timezone — do they get reminders at the right time?

No. Reminders are sent to the thread at a single time based on the server timezone (`TZ`). Individual participants see the message when Telegram/Discord delivers it — the bot has no per-user timezone support.

---

## Commands and features

### Why use `/pastrides` instead of `/past-rides`?

Telegram does not allow hyphens in command names. To keep the command consistent across both platforms, it is `/pastrides` on both Discord and Telegram.

### Can I check the weather without waiting for the reminder?

Yes, use `/weather` inside a ride's thread/topic to fetch the forecast on demand, any time before the ride. It requires `WEATHER_ENABLED` to not be set to `false`.

### Can I edit a ride after it's been announced?

Yes, use `/edit` (Discord) or `/edit` (Telegram). You can change the meeting point, time, distance, elevation, level, and notes. The pinned summary is updated automatically. You cannot change the date — cancel and create a new ride instead.

### GPX / route import failed — what went wrong?

The most common causes:

1. **Private tour** — Komoot tours set to "private" cannot be fetched. Make the tour public first.
2. **Strava activity** — Strava's public API no longer returns route details without OAuth. The bot only extracts the URL; fill in distance and elevation manually.
3. **Garmin course** — Same as Strava: only the link is stored.
4. **Network error** — The bot couldn't reach the external service. Check `docker compose logs bot` for the error. Retry once the service is reachable.
5. **Unsupported URL format** — Only `komoot.com/tour/`, `strava.com/activities/`, and `connect.garmin.com/course/` are supported.

---

## Database

### SQLite or PostgreSQL — which should I use?

|               | SQLite                                  | PostgreSQL                                 |
| ------------- | --------------------------------------- | ------------------------------------------ |
| Setup         | Zero config                             | Requires a running server                  |
| Suitable for  | Single-server, low-traffic groups       | High availability, backups, multi-instance |
| Data location | `./data/group-ride.db` on the host      | External DB, managed or self-hosted        |
| Migration     | See [migration guide](/docs/migration/) | —                                          |

For most cycling groups, SQLite is the right choice. Move to PostgreSQL if you need automated backups, high availability, or plan to run the bot on an ephemeral container (e.g. a serverless platform).

### How do I back up the SQLite database?

Copy the file while the bot is stopped, or use `.dump` with the SQLite CLI:

```bash
docker compose stop bot
cp ./data/group-ride.db ./data/group-ride.db.bak
docker compose start bot
```

For live backups, SQLite's WAL mode (enabled by default) allows safe reads while the bot is running. Use `sqlite3 ./data/group-ride.db .dump > backup.sql`.

---

## Discord-specific

### How do I re-invite the bot after kicking it?

Generate a new invite URL from the [Discord Developer Portal](https://discord.com/developers/applications). The bot needs the `bot` and `application.commands` scopes, and the following permissions: **Send Messages**, **Embed Links**, **Send Messages in Threads**, **Create Public Threads**, **Manage Threads**, **Read Message History**.

### Slash commands disappeared after re-inviting the bot

Restart the bot — it re-deploys slash commands on startup. If commands still don't appear after 5 minutes, kick and re-invite the bot with the `application.commands` scope explicitly checked.

---

## Telegram-specific

### The `/newride` conversation was interrupted — how do I restart it?

Send `/newride` again. The bot uses grammY Conversations, which stores intermediate state in memory. If the bot restarted mid-conversation, the state is lost and `/newride` starts fresh.

### How do I find my `TELEGRAM_GROUP_CHAT_ID`?

Add the bot to the group, then send any message. Call:

```
https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

Look for `result[n].message.chat.id` — it will be a large negative number like `-1001234567890`. Use that value as `TELEGRAM_GROUP_CHAT_ID`.
