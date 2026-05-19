# Setup Guide

This guide walks you through setting up Group Ride from scratch, including the Discord configuration and local environment.

## Prerequisites

- [Bun](https://bun.sh) >= 1.1
- A Discord account

---

## Step 1 — Create a Discord application and bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**
2. Give it a name (e.g. "Group Ride") and confirm
3. Go to the **Bot** tab and click **Add Bot**
4. Under **Token**, click **Reset Token** and copy it — you will need it in step 5
5. Still on the Bot tab, enable the following **Privileged Gateway Intents**:
   - **Server Members Intent** — required to detect members joining/leaving

---

## Step 2 — Get the Client ID

1. Go to the **OAuth2** tab
2. Copy the **Client ID** — you will need it in step 5

---

## Step 3 — Create the Discord server

Group Ride requires two channels:

1. **An announcement text channel** (e.g. `#announcements`) — where ride announcements are posted
2. **A Forum channel** (e.g. `#rides`) — where one thread is created per ride

To create the Forum channel:
- Click **+** next to the channel list → **Create Channel** → select **Forum**

---

## Step 4 — Invite the bot and collect IDs

**Invite the bot to your server:**

1. In the Developer Portal, go to **OAuth2 → URL Generator**
2. Under **Scopes**, check `bot` and `applications.commands`
3. Under **Bot Permissions**, check:
   - **Manage Threads** — create and archive forum threads
   - **Send Messages** — post announcements and thread messages
   - **Read Message History** — fetch the starter message for updates
4. Copy the generated URL, open it in your browser and invite the bot to your server

**Collect the IDs you need** (enable Developer Mode in Discord settings → Advanced → Developer Mode, then right-click to copy IDs):

| Value | How to get it |
|---|---|
| **Guild ID** | Right-click the server name → Copy Server ID |
| **Announcement channel ID** | Right-click the announcement channel → Copy Channel ID |
| **Forum channel ID** | Right-click the forum channel → Copy Channel ID |

---

## Step 5 — Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```env
DISCORD_TOKEN=your_bot_token                        # from Step 1
DISCORD_CLIENT_ID=your_client_id                    # from Step 2
DISCORD_GUILD_ID=your_server_id                     # from Step 4
DISCORD_ANNOUNCEMENT_CHANNEL_ID=your_channel_id     # from Step 4
DISCORD_FORUM_CHANNEL_ID=your_forum_channel_id      # from Step 4
DATABASE_PATH=./data/group-ride.db                  # SQLite file path
```

---

## Step 6 — Install dependencies and run

```bash
bun install
bun run dev     # watches for file changes
# or
bun run start   # production
```

On startup, the bot will:
1. Register the `/newride` slash command on your server
2. Create the SQLite database and apply migrations automatically
3. Log `Group Ride bot is running` when ready

---

## Step 7 — Verify

Type `/newride` in any channel of your server. A modal should appear with fields for date, meeting point, import URL, distance, and notes.

---

## Troubleshooting

**The `/newride` command does not appear**
Slash commands may take up to an hour to propagate globally, but guild-scoped commands (which this bot uses) should be available immediately. Make sure `DISCORD_GUILD_ID` matches the server where you are typing the command.

**Bot does not respond to member join/leave events**
The **Server Members Intent** must be enabled in the Developer Portal (Bot tab → Privileged Gateway Intents). The bot also needs the **Manage Threads** and **Send Messages** permissions in the relevant channels.

**Import URL not working**
The activity must be public on the source platform. Komoot tours with a `share_token` in the URL work even if the tour is private.
