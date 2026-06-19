---
title: Telegram Adapter
description: How the Telegram adapter works in group-ride
---

The Telegram adapter implements `MessagingPort` using [grammY](https://grammy.dev). Enable it with `ADAPTER=telegram`.

## Group structure

The Telegram adapter requires a **supergroup** with **Topics** enabled. Topics are Telegram's equivalent of Discord forum threads — one topic is created per ride.

## How a ride flows

1. **`/newride`** — a multi-step conversation collects the ride details (or imports from a URL)
2. The bot creates a **forum topic** and pins the ride summary
3. An announcement is posted in the group's general thread with a **Join this ride** button
4. When a member taps **Join**, the bot sends a notification in the ride topic
5. The bot sends a **day-before reminder** at 20:00 local time and an **hour-before reminder** on the day of the ride

## Commands

| Command    | Description                             |
| ---------- | --------------------------------------- |
| `/newride` | Start the multi-step ride creation flow |
| `/rides`   | List upcoming rides with a Join button  |

## Differences from Discord

| Feature                | Discord                             | Telegram                                |
| ---------------------- | ----------------------------------- | --------------------------------------- |
| Thread access          | Bot adds/removes members explicitly | Topics are visible to all group members |
| Join notification      | Sent in the forum thread            | Sent in the ride topic                  |
| Leave notification     | Member removed from thread          | No-op (topic stays visible)             |
| Member leave detection | `guildMemberRemove` event           | Not supported (no equivalent event)     |

## Required bot permissions

The bot must be an **admin** in the supergroup with at least:

| Permission    | Why                                 |
| ------------- | ----------------------------------- |
| Manage topics | Create and close forum topics       |
| Pin messages  | Pin the ride summary in each topic  |
| Send messages | Post announcements and ride updates |
