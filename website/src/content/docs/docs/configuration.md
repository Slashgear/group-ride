---
title: Configuration
description: Environment variables reference for group-ride
---

All configuration is done through environment variables. Copy `.env.example` to `.env` and fill in your values.

## Discord

```bash
ADAPTER=discord                                      # "discord" or "telegram"
DISCORD_TOKEN=your_bot_token                         # Bot tab → Reset Token
DISCORD_CLIENT_ID=your_client_id                     # OAuth2 tab → Client ID
DISCORD_GUILD_ID=your_server_id                      # Right-click server → Copy Server ID
DISCORD_ANNOUNCEMENT_CHANNEL_ID=your_channel_id      # Announcement text channel
DISCORD_FORUM_CHANNEL_ID=your_forum_channel_id       # Forum channel for ride threads
```

## Telegram

```bash
ADAPTER=telegram
TELEGRAM_TOKEN=your_bot_token                        # From @BotFather
TELEGRAM_GROUP_CHAT_ID=-100XXXXXXXXX                 # Negative number from getUpdates
```

## Database

```bash
DATABASE_PATH=./data/group-ride.db                   # SQLite file path (default)
# DATABASE_URL=postgres://user:password@host:5432/db  # Set this to use PostgreSQL instead
```

When `DATABASE_URL` is set, the bot uses PostgreSQL. When unset, it uses SQLite.

For PostgreSQL, run migrations manually before the first start:

```bash
psql $DATABASE_URL -f src/adapters/database/postgres/migrations/001_initial.sql
```

## Timezone

```bash
TZ=Europe/Paris   # Must match your group's local timezone
```

The `TZ` variable controls when reminders fire. The day-before reminder sends at **20:00** local time, and the hour-before reminder sends **1 hour before the ride start** on the day of the ride.

Set it to your group's timezone — e.g. `Europe/London`, `America/New_York`, `Asia/Tokyo`.

## Language

```bash
LANG=fr   # "en" (default) or "fr"
```

Controls the language of all user-facing bot messages — notifications, reminders, and command replies. Log messages always stay in English regardless of this setting.

| Value | Language          |
| ----- | ----------------- |
| `en`  | English (default) |
| `fr`  | French            |

## Weather forecasts

```bash
WEATHER_ENABLED=false   # Set to "false" to disable weather forecasts (default: enabled)
```

When enabled, the day-before reminder includes a weather forecast for the ride's meeting point. The forecast shows temperature range, sky conditions, wind speed, and precipitation chance for the ride day, using the [wttr.in](https://wttr.in) service — no API key required.

If the weather service is unavailable, the reminder is still sent without a forecast.

## Summary

| Variable                          | Required | Default                | Description                                |
| --------------------------------- | -------- | ---------------------- | ------------------------------------------ |
| `ADAPTER`                         | No       | `discord`              | `discord` or `telegram`                    |
| `DISCORD_TOKEN`                   | Discord  | —                      | Bot token                                  |
| `DISCORD_CLIENT_ID`               | Discord  | —                      | Application client ID                      |
| `DISCORD_GUILD_ID`                | Discord  | —                      | Server (guild) ID                          |
| `DISCORD_ANNOUNCEMENT_CHANNEL_ID` | Discord  | —                      | Text channel for announcements             |
| `DISCORD_FORUM_CHANNEL_ID`        | Discord  | —                      | Forum channel for ride threads             |
| `TELEGRAM_TOKEN`                  | Telegram | —                      | Bot token from BotFather                   |
| `TELEGRAM_GROUP_CHAT_ID`          | Telegram | —                      | Supergroup chat ID                         |
| `DATABASE_PATH`                   | No       | `./data/group-ride.db` | SQLite file path                           |
| `DATABASE_URL`                    | No       | —                      | PostgreSQL connection URL                  |
| `TZ`                              | No       | System default         | Timezone for reminders                     |
| `LANG`                            | No       | `en`                   | Bot message language (`en` or `fr`)        |
| `WEATHER_ENABLED`                 | No       | `true`                 | Set to `false` to disable weather forecast |
