---
title: Discord Adapter
description: How the Discord adapter works in group-ride
---

The Discord adapter implements `MessagingPort` using [discord.js](https://discord.js.org). It is the default adapter (`ADAPTER=discord`).

## Channel structure

The Discord adapter uses two channels:

| Channel              | Type                | Purpose                                             |
| -------------------- | ------------------- | --------------------------------------------------- |
| Announcement channel | Text channel        | Receives the ride announcement with a "Join" button |
| Forum channel        | Forum (GUILD_FORUM) | One thread is created per ride                      |

## How a ride flows

1. **`/newride`** — a modal collects the ride details (or imports them from a Komoot/Strava/Garmin URL)
2. The bot creates a **forum thread** and pins the ride summary in the starter message
3. An **announcement** is posted in the main channel with a **Join this ride** button
4. When a member clicks **Join**, they are added to the thread and the pinned summary updates
5. The bot sends a **day-before reminder** (between 9am and 10pm local time) and an **hour-before reminder** on the day of the ride

## Slash commands

| Command    | Description                                                 |
| ---------- | ----------------------------------------------------------- |
| `/newride` | Open the ride creation modal                                |
| `/rides`   | List upcoming rides with a join button                      |
| `/weather` | Get the weather forecast for a ride (use inside its thread) |
| `/help`    | Show how the bot works (ephemeral)                          |

## Button interactions

All buttons are handled via Discord's interaction system:

| Custom ID               | Action                                   |
| ----------------------- | ---------------------------------------- |
| `join:<rideId>`         | Add the user to the ride and thread      |
| `leave:<rideId>`        | Remove the user from the ride and thread |
| `cancel:<rideId>`       | Cancel the ride (proposer only)          |
| `edit:<rideId>`         | Open the edit modal                      |
| `participants:<rideId>` | Show the current participant list        |

## Member events

| Event               | Behaviour                                                                                             |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| `guildMemberAdd`    | Sends a welcome DM explaining how to use the bot (falls back to the system channel if DMs are closed) |
| `guildMemberRemove` | Removes the member from all active rides they had joined                                              |

## Required bot permissions

| Permission             | Why                                                  |
| ---------------------- | ---------------------------------------------------- |
| `Send Messages`        | Post announcements and thread messages               |
| `Manage Threads`       | Create and archive forum threads                     |
| `Read Message History` | Fetch the starter message to edit the pinned summary |

**Privileged Gateway Intents** required: **Server Members Intent** (to detect member leaves).
