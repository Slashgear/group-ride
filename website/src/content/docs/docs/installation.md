---
title: Installation
description: Step-by-step guide to set up group-ride on Discord or Telegram
---

This guide walks you through setting up group-ride from scratch. Choose your platform below — the bot supports **Discord** (default) and **Telegram**, configured via the `ADAPTER` environment variable.

## Prerequisites

- [Bun](https://bun.sh) >= 1.1 (or Docker)
- A Discord **or** Telegram account

---

## Discord

### Step 1 — Create a Discord application and bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**
2. Give it a name (e.g. "Group Ride") and confirm
3. Go to the **Bot** tab and click **Add Bot**
4. Under **Token**, click **Reset Token** and copy it — you will need it in Step 5
5. Still on the Bot tab, enable **Server Members Intent** under Privileged Gateway Intents

### Step 2 — Get the Client ID

1. Go to the **OAuth2** tab
2. Copy the **Client ID**

### Step 3 — Create the required channels

group-ride requires two channels:

1. **An announcement text channel** (e.g. `#announcements`) — where ride announcements are posted
2. **A Forum channel** (e.g. `#rides`) — where one thread is created per ride

To create the Forum channel: click **+** next to the channel list → **Create Channel** → select **Forum**.

### Step 4 — Invite the bot and collect IDs

**Invite the bot:**

1. In the Developer Portal, go to **OAuth2 → URL Generator**
2. Under **Scopes**, check `bot` and `applications.commands`
3. Under **Bot Permissions**, check:
   - **Manage Threads** — create and archive forum threads
   - **Send Messages** — post announcements and thread messages
   - **Read Message History** — fetch the starter message for updates
4. Copy the generated URL and open it in your browser to invite the bot

**Collect the IDs** (enable Developer Mode in Discord Settings → Advanced → Developer Mode, then right-click to copy):

| Value                       | How to get it                                   |
| --------------------------- | ----------------------------------------------- |
| **Guild ID**                | Right-click the server name → Copy Server ID    |
| **Announcement channel ID** | Right-click the channel → Copy Channel ID       |
| **Forum channel ID**        | Right-click the forum channel → Copy Channel ID |

### Step 5 — Configure and run

```bash
cp .env.example .env
# Fill in your values — see Configuration
bun install
bun run start
```

See [Configuration](/docs/configuration/) for all available variables.

---

## Telegram

Telegram requires a **supergroup** with **Topics** enabled.

### Step A — Create a bot

1. Open [@BotFather](https://t.me/BotFather) and send `/newbot`
2. Follow the prompts to choose a name and username
3. Copy the **token** BotFather gives you

### Step B — Create the supergroup and enable Topics

1. Create a new Telegram group (or use an existing one)
2. Open **Group Info → Edit → Group Type** → make it a **Supergroup**
3. In **Group Info → Edit**, enable **Topics**

### Step C — Add the bot and grant admin rights

1. In the group, go to **Add Members** and search for your bot's username
2. Give the bot admin rights with at least:
   - **Manage topics** — create and close forum topics
   - **Pin messages** — pin the ride summary in each topic
   - **Send messages**

### Step D — Get the group chat ID

Send any message in the group, then open:

```
https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

Find `"chat": { "id": -100XXXXXXXXX }` — that negative number is your `TELEGRAM_GROUP_CHAT_ID`.

### Step E — Configure and run

```bash
cp .env.example .env
# Fill in ADAPTER=telegram and your Telegram values
bun install
bun run start
```

---

## Docker Compose (recommended for production)

```yaml
services:
  bot:
    image: ghcr.io/slashgear/group-ride:latest
    restart: unless-stopped
    env_file: .env
    volumes:
      - data:/usr/src/app/data

volumes:
  data:
```

```bash
docker compose up -d
docker compose logs -f bot
```

---

## Verify

**Discord:** Type `/newride` in any channel. A modal should appear with fields for import URL, date & time, meeting point, stats, and notes.

**Telegram:** Send `/newride` in the group. The bot will guide you step by step.

---

## Troubleshooting

**`/newride` command does not appear**
Guild-scoped slash commands register immediately on startup. Make sure `DISCORD_GUILD_ID` matches the server where you're typing the command.

**Bot does not respond to member join/leave events**
The **Server Members Intent** must be enabled in the Developer Portal (Bot tab → Privileged Gateway Intents).

**Import URL not working**
The activity must be public on the source platform. Komoot tours with a `share_token` in the URL work even if the tour is set to private.
