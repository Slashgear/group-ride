---
title: Installation — Discord
description: Step-by-step guide to set up group-ride on Discord
---

## Prerequisites

- [Bun](https://bun.sh) >= 1.1 (or Docker)
- A Discord account

---

## Step 1 — Create a Discord application and bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**
2. Give it a name (e.g. "Group Ride") and confirm
3. Go to the **Bot** tab and click **Add Bot**
4. Under **Token**, click **Reset Token** and copy it — you will need it in Step 5
5. Still on the Bot tab, enable **Server Members Intent** under Privileged Gateway Intents

## Step 2 — Get the Client ID

1. Go to the **OAuth2** tab
2. Copy the **Client ID**

## Step 3 — Create the required channels

group-ride requires two channels:

1. **An announcement text channel** (e.g. `#announcements`) — where ride announcements are posted
2. **A Forum channel** (e.g. `#rides`) — where one thread is created per ride

To create the Forum channel: click **+** next to the channel list → **Create Channel** → select **Forum**.

## Step 4 — Invite the bot and collect IDs

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

## Step 5 — Configure and run

```bash
cp .env.example .env
# Fill in your values — see Configuration
bun install
bun run start
```

See [Configuration](/docs/configuration/) for all available variables.

---

## Verify

Type `/newride` in any channel. A modal should appear with fields for import URL, date & time, meeting point, stats, and notes.

---

## Troubleshooting

**`/newride` command does not appear**
Guild-scoped slash commands register immediately on startup. Make sure `DISCORD_GUILD_ID` matches the server where you're typing the command.

**Bot does not respond to member join/leave events**
The **Server Members Intent** must be enabled in the Developer Portal (Bot tab → Privileged Gateway Intents).

**Import URL not working**
The activity must be public on the source platform. Komoot tours with a `share_token` in the URL work even if the tour is set to private.
