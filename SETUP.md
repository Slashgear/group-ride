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

Group Ride requires a Telegram **supergroup** with **Topics** enabled.

**Create the group and enable Topics:**

1. Create a new Telegram group (any name)
2. Open the group → tap the group name at the top → **Edit**
3. Scroll down to **Topics** and toggle it on
4. Confirm — the group is automatically converted to a supergroup

> On desktop: group info → Edit → Topics toggle.

**Add the bot and grant admin rights:**

5. In the group, open **Members → Add member** and search for your bot's username
6. Once added, go to **Members → [your bot] → Promote to admin**
7. Enable exactly the following rights:

| Permission | Required for |
|---|---|
| **Manage topics** (`can_manage_topics`) | Create and close Forum Topics |
| **Pin messages** (`can_pin_messages`) | Pin the ride summary in each topic |
| **Delete messages** | Optional — clean up bot messages |

Leave all other permissions off.

---

## Step 3 — Get the group chat ID

The bot needs the numeric ID of the group (a negative number like `-1002345678901`).

**Recommended method — `getUpdates`:**

1. Make sure your bot is in the group (done in step 2)
2. Send any message in the group
3. Open the following URL in your browser, replacing `<TOKEN>` with your bot token:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
4. In the JSON response, find `"chat"` and copy the value of `"id"`:
   ```json
   "chat": {
     "id": -1002345678901,
     "type": "supergroup",
     ...
   }
   ```

> Supergroup IDs always start with `-100`. If `getUpdates` returns an empty array, send another message in the group and retry.

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
The Topics toggle only appears once the group has enough history or has been manually converted. Try: group info → Edit → Topics. If the option is missing, make sure you are a group admin.
