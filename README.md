# Group Ride — Discord & Telegram bot to organise group cycling rides

[![CI](https://github.com/Slashgear/group-ride/actions/workflows/ci.yml/badge.svg)](https://github.com/Slashgear/group-ride/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/package-json/v/Slashgear/group-ride)](https://github.com/Slashgear/group-ride/releases)
[![Docker Image](https://img.shields.io/badge/docker-ghcr.io-blue)](https://github.com/Slashgear/group-ride/pkgs/container/group-ride)
[![Bun](https://img.shields.io/badge/bun-1.3.14-f9f1e1)](https://bun.sh)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

**[Documentation →](https://group-ride.slashgear.dev)**

## Context and problem

A group of cycling friends communicates via a shared channel (WhatsApp, Signal…). When someone proposes a ride, everyone gets notified — including those who are not interested. The discussion that follows spams the entire group, and the relevant information ends up buried in the feed.

**Group Ride** is a Discord & Telegram bot that solves this problem:

- a single notification in the announcement channel for each proposed ride
- an isolated thread (Discord) or topic (Telegram) per ride, visible to registered participants
- the thread closes automatically 24 hours after the ride

---

## Supported platforms

| Criteria            | Discord                    | Telegram                 | WhatsApp                 |
| ------------------- | -------------------------- | ------------------------ | ------------------------ |
| Official bot API    | ✅ Free                    | ✅ Free                  | ⚠️ Paid + business badge |
| Threads per ride    | ✅ Native (Forum Channels) | ✅ Native (Forum Topics) | ❌                       |
| Native form (modal) | ✅ Yes                     | ❌ Conversation only     | ❌                       |
| Participant limit   | ✅ None                    | ✅ None                  | ⚠️ 8 via API             |
| Integration effort  | Low                        | Low                      | High                     |

Both Discord and Telegram are fully supported. Discord offers native **modals** for structured input; Telegram uses a step-by-step conversation flow. Select the adapter via the `ADAPTER` environment variable.

---

## Channel structure

**Discord** requires two channels:

```
Discord Server
│
├── 📢 #announcements   → ride announcements only, no discussion
├── 🗂️ #rides (Forum)   → one thread per ride
│   ├── 💬 Ride May 25  → isolated discussion for registered members
│   ├── 💬 Ride Jun 1   → isolated discussion for registered members
│   └── ...
└── ...
```

**Telegram** requires a supergroup with Topics enabled:

```
Telegram Supergroup (Topics enabled)
│
├── 📢 General thread   → ride announcements and join notifications
├── 🗂️ Ride May 25      → one topic per ride
├── 🗂️ Ride Jun 1       → one topic per ride
└── ...
```

The bot automatically creates a thread or topic per ride and manages its full lifecycle.

---

## Roles

| Role       | Permissions                                      |
| ---------- | ------------------------------------------------ |
| **Admin**  | Manage server members (add, remove, promote)     |
| **Member** | Propose a ride, join/leave a ride, cancel a ride |

Any member can propose a ride. The organiser is not a fixed role — it is simply the member who proposes.

---

## Ride form

Each ride is described by:

- 📅 Date
- 🕐 Meeting time (optional)
- 📍 Meeting point
- 📏 Distance / D+ / D- (optional, set manually or auto-filled from import)
- 💪 Estimated level (auto-filled from Komoot import)
- 🔗 Link to the source platform (Komoot, Strava, Garmin)
- 📝 Free notes

The form is displayed as the **starter message** of the ride thread and updated automatically on modification.

---

## Import from an external platform

The ride creation modal accepts an optional URL that pre-fills the form automatically:

- **Komoot** — public access; extracts name, distance, D+/D-, level, and link
- **Strava** — requires OAuth; only the link is saved, a warning is shown
- **Garmin Connect** — courses are not publicly accessible; only the link is saved, a warning is shown

If extraction fails (private activity or unavailable), the bot warns the proposer and falls back to the data entered manually in the modal.

---

## Sequence diagram (Discord)

> The Telegram flow is equivalent: `/newride` starts a step-by-step conversation instead of a modal, and threads are Telegram Topics instead of Forum threads.

```mermaid
sequenceDiagram
    actor Admin
    actor Proposer
    participant Bot as Discord Bot
    participant Channel as #announcements
    participant Ride as Ride thread (Forum)
    actor Member

    Note over Admin,Member: Discord Server

    Note over Admin,Channel: Server management — admins only

    alt Add a member
        Admin->>Channel: Adds a member to the server
        Channel->>Bot: Event - guildMemberAdd
        Bot-->>Channel: Welcome message
    else Remove a member
        Admin->>Channel: Removes a member from the server
        Channel->>Bot: Event - guildMemberRemove
        Bot-->>Ride: Removes from all active rides
    end

    Note over Proposer,Member: Proposal — any member can propose

    Proposer->>Bot: /newride
    Bot-->>Proposer: Opens a modal (date, meeting point, import URL, distance, notes)
    Proposer->>Bot: Submits the modal

    alt Import URL provided
        Bot->>Bot: Extracts ride info from URL
        alt Extraction succeeded
            Bot-->>Proposer: Summary with imported data (ephemeral)
        else Extraction failed
            Bot-->>Proposer: Warning + summary with manual data (ephemeral)
        end
    else No import URL
        Bot-->>Proposer: Summary with manual data (ephemeral)
    end

    Proposer->>Bot: ✅ Create ride
    Bot->>Channel: Single notification in #announcements
    Note over Channel: Announcement channel is for ride announcements only

    Bot->>Ride: Creates a dedicated thread in the Forum channel
    Note over Ride: Title, date, meeting point, level, distance, D+, GPX

    Member->>Channel: Clicks "Join this ride 🚴"
    Bot->>Ride: Adds member to thread
    Bot-->>Member: Confirmation (ephemeral)

    alt Member joins from thread
        Member->>Ride: Clicks 🚴 Join
        Bot-->>Member: Confirmation (ephemeral)
    else Member leaves
        Member->>Ride: Clicks 🚪 Leave
        Bot->>Ride: Removes member, notifies thread
    else Edit ride
        Proposer->>Ride: Clicks ✏️ Edit
        Bot-->>Proposer: Pre-filled modal
        Proposer->>Bot: Submits changes
        Bot->>Ride: Updates pinned message
    else Cancel
        Proposer->>Ride: Clicks ❌ Cancel
        Bot->>Channel: Cancellation notice
        Bot->>Ride: Closes thread
    else View participants
        Member->>Ride: Clicks 👥 Participants
        Bot-->>Member: List of members (ephemeral)
    end

    Note over Proposer,Ride: Reminders (if meeting time is set)
    Bot->>Ride: Day-before reminder notification
    Bot->>Ride: 1-hour-before reminder notification

    Note over Proposer,Ride: After the ride (if not cancelled)
    Bot->>Ride: Closes (archives) the thread
```

---

## Business rules

### Announcement channel / General thread

- Reserved for ride announcements. No discussion takes place here.
- On cancellation, the bot posts a notification there (justified exception: non-registered members also need to know).

### Ride thread / Topic

- Created automatically by the bot for each proposal.
- The pinned message is the source of truth for the ride details.
- Any registered member can join, leave, edit, or cancel the ride via the action buttons.
- If a meeting time is set, the bot sends a reminder the day before and 1 hour before.
- The thread/topic closes immediately on cancellation.
- On Discord, the thread becomes read-only 24 hours after the ride.

### Member management

- On Discord, only admins can add or remove members from the server.
- If a member leaves or is removed, the bot automatically removes them from all active rides (both Discord and Telegram).

---

## Stack

- **Runtime**: [Bun](https://bun.sh)
- **Language**: TypeScript
- **Bot framework**: [discord.js](https://discord.js.org) v14 (Discord) · [grammY](https://grammy.dev) (Telegram)
- **Database**: SQLite via `bun:sqlite` (default) or PostgreSQL via Bun's native SQL — set `DATABASE_URL` to use PostgreSQL
- **Architecture**: Ports & Adapters — see [Architecture](https://group-ride.slashgear.dev/docs/architecture/) for diagrams and file map

---

## Open questions

- **Member removal** — are other members registered for that member's active rides notified?
- **OAuth for Strava / Garmin** — should an authentication flow be modelled to enable full data extraction for private activities?
