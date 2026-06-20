---
title: Installation — Telegram
description: Step-by-step guide to set up group-ride on Telegram
---

Telegram requires a **supergroup** with **Topics** enabled.

## Prerequisites

- [Bun](https://bun.sh) >= 1.1 (or Docker)
- A Telegram account

---

## Step A — Create a bot

1. Open [@BotFather](https://t.me/BotFather) and send `/newbot`
2. Follow the prompts to choose a name and username
3. Copy the **token** BotFather gives you

## Step B — Create the supergroup and enable Topics

1. Create a new Telegram group (or use an existing one)
2. Open **Group Info → Edit → Group Type** → make it a **Supergroup**
3. In **Group Info → Edit**, enable **Topics**

## Step C — Add the bot and grant admin rights

1. In the group, go to **Add Members** and search for your bot's username
2. Give the bot admin rights with at least:
   - **Manage topics** — create and close forum topics
   - **Pin messages** — pin the ride summary in each topic
   - **Send messages**

## Step D — Get the group chat ID

Send any message in the group, then open:

```
https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

Find `"chat": { "id": -100XXXXXXXXX }` — that negative number is your `TELEGRAM_GROUP_CHAT_ID`.

## Step E — Configure and run

```bash
cp .env.example .env
# Fill in ADAPTER=telegram and your Telegram values
bun install
bun run start
```

See [Configuration](/docs/configuration/) for all available variables.

---

## Verify

Send `/newride` in the group. The bot will guide you step by step.
