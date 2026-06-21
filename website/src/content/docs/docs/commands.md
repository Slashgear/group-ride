---
title: Commands reference
description: All bot commands and button interactions for Discord and Telegram
---

## Discord

Discord commands are slash commands — type `/` in any channel to see them.

| Command      | Description                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `/newride`   | Propose a new group ride. Opens a modal form with fields for date, meeting point, time, stats, and an optional Komoot/Strava/Garmin link. |
| `/rides`     | List the next 5 upcoming rides, each with **Join** and **Participants** buttons. Reply is visible only to you.                            |
| `/pastrides` | List the 5 most recent past rides with status (completed / cancelled). Reply is visible only to you.                                      |
| `/help`      | Show a summary of how the bot works. Reply is visible only to you.                                                                        |

### Button interactions

| Button              | Where                         | Effect                            |
| ------------------- | ----------------------------- | --------------------------------- |
| **Join this ride**  | Announcement message          | Register as a participant         |
| **🚴 Join**         | `/rides` list                 | Register as a participant         |
| **👥 Participants** | `/rides` list                 | Show the current participant list |
| **Leave**           | Announcement message / thread | Remove yourself from the ride     |
| **Cancel ride**     | Announcement message / thread | Cancel the ride for everyone      |

---

## Telegram

Telegram commands are sent as messages prefixed with `/`. They also appear in the bot command menu (tap the `/` icon in the message bar).

| Command      | Description                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `/newride`   | Propose a new group ride. The bot guides you step by step: date, meeting point, time, stats, and an optional import link. |
| `/rides`     | List the next 5 upcoming rides, each with a **Join** button.                                                              |
| `/pastrides` | List the 5 most recent past rides with status (completed / cancelled).                                                    |
| `/edit`      | Edit a ride you proposed. Shows a list of your active rides to pick from.                                                 |
| `/help`      | Show a summary of how the bot works.                                                                                      |

### Button interactions

| Button          | Where                                | Effect                        |
| --------------- | ------------------------------------ | ----------------------------- |
| **🚴 Join**     | Announcement message / `/rides` list | Register as a participant     |
| **Leave**       | Announcement message                 | Remove yourself from the ride |
| **Cancel ride** | Announcement message                 | Cancel the ride for everyone  |

---

## Route import

Both adapters support pasting a URL from a supported platform during ride creation. The bot fetches the route data and pre-fills name, distance, elevation gain, and elevation loss.

| Platform                                     | URL format                                      |
| -------------------------------------------- | ----------------------------------------------- |
| [Komoot](https://www.komoot.com)             | `https://www.komoot.com/tour/<id>`              |
| [Strava](https://www.strava.com)             | `https://www.strava.com/routes/<id>`            |
| [Garmin Connect](https://connect.garmin.com) | `https://connect.garmin.com/modern/course/<id>` |
| GPX file                                     | Upload a `.gpx` file directly                   |

All imported fields can be edited before the ride is confirmed.
