---
title: Overview
description: group-ride — a Discord & Telegram bot to organise group cycling rides
---

**group-ride** is an open-source bot for Discord and Telegram that structures your cycling group rides. One command replaces the whole chaotic thread: the bot announces the ride, manages a live participant list, creates a dedicated discussion thread, and sends automatic reminders.

## Features

- **Structured announcements** — date, time, meeting point, distance, elevation and route link in one message
- **Live participant list** — members join/leave with a button; the pinned summary updates in real time
- **Dedicated thread per ride** — detail questions stay in their own thread, keeping the main channel clean
- **Automatic reminders** — notifications the day before and one hour before the ride
- **Komoot, Strava & Garmin import** — paste a link and the bot fills in distance, elevation and title automatically
- **Self-hosted** — your data stays on your infrastructure; no SaaS dependency

## Supported platforms

| Platform | Status                         |
| -------- | ------------------------------ |
| Discord  | ✅ Supported                   |
| Telegram | ✅ Supported                   |
| WhatsApp | ✗ No bot API for groups        |
| Signal   | ✗ No third-party API by design |

## Quick start

1. [Install the bot](/docs/installation/) on your server or group
2. [Configure environment variables](/docs/configuration/)
3. Type `/newride` — the bot handles the rest

## Stack

- **Runtime** — [Bun](https://bun.sh)
- **Discord** — [discord.js](https://discord.js.org)
- **Telegram** — [grammY](https://grammy.dev)
- **Database** — SQLite (default) or PostgreSQL
- **Deployment** — Docker / Docker Compose
