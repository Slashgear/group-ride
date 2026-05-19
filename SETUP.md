# Setup Guide

This guide walks you through setting up Group Ride from scratch, including the Telegram configuration and local environment.

## Prerequisites

- [Bun](https://bun.sh) >= 1.1
- A Telegram account

---

## Step 1 — Create a Telegram bot

1. Open Telegram and start a conversation with [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the prompts (name, username)
3. Copy the **bot token** — you will need it in step 4

---

## Step 2 — Create a supergroup with Forum Topics

Group Ride requires a Telegram **supergroup** with **Forum Topics** enabled. This is the feature that creates isolated discussion threads per ride.

1. Create a new Telegram group
2. Open **Group Settings → Group type → Topics** and enable it
   - The group is automatically promoted to a supergroup
3. Add your bot to the group
4. Promote the bot to **admin** with the following permissions:
   - Manage topics
   - Send messages
   - Pin messages
   - Delete messages (optional, for cleanup)

---

## Step 3 — Get the group chat ID

The bot needs to know which group to post in.

1. Add [@userinfobot](https://t.me/userinfobot) temporarily to your group
2. It will print the **group chat ID** (a negative number like `-1001234567890`)
3. Remove @userinfobot from the group

Alternatively, send a message in the group and call:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
```
Look for `"chat": { "id": ... }` in the response.

---

## Step 4 — Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

```env
BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz   # from BotFather
GROUP_CHAT_ID=-1001234567890                        # from step 3
DATABASE_PATH=./data/group-ride.db                 # SQLite file path
```

---

## Step 5 — Install dependencies and run

```bash
bun install
bun run dev     # watches for file changes
# or
bun run start   # production
```

The bot will create the SQLite database and apply migrations automatically on first start.

---

## Step 6 — Verify

Send `/newride` to your bot in a private chat or in the group. You should enter the ride creation flow.

---

## Troubleshooting

**Bot doesn't respond to `chat_member` events (join/leave)**
Make sure the bot is an admin in the group. Telegram only sends `chat_member` updates to admins.

**`GROUP_CHAT_ID` not working**
The ID must include the `-100` prefix for supergroups (e.g. `-1001234567890`).

**Forum Topics not available**
Topics require the group to be a supergroup. Converting an existing group: go to Settings → Group type → enable Topics.
