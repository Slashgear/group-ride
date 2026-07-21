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
| `/weather`   | Get the weather forecast for the ride, on demand. Must be used inside that ride's thread. Requires `WEATHER_ENABLED` to be enabled.       |

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

| Command      | Description                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/newride`   | Propose a new group ride. The bot guides you step by step: date, meeting point, time, stats, and an optional import link.          |
| `/rides`     | List the next 5 upcoming rides, each with a **Join** button.                                                                       |
| `/pastrides` | List the 5 most recent past rides with status (completed / cancelled).                                                             |
| `/edit`      | Edit a ride you proposed. Shows a list of your active rides to pick from.                                                          |
| `/help`      | Show a summary of how the bot works.                                                                                               |
| `/weather`   | Get the weather forecast for the ride, on demand. Must be used inside that ride's topic. Requires `WEATHER_ENABLED` to be enabled. |

### Button interactions

| Button          | Where                                | Effect                        |
| --------------- | ------------------------------------ | ----------------------------- |
| **🚴 Join**     | Announcement message / `/rides` list | Register as a participant     |
| **Leave**       | Announcement message                 | Remove yourself from the ride |
| **Cancel ride** | Announcement message                 | Cancel the ride for everyone  |

---

## Message examples

These are the messages the bot posts automatically in a ride thread/topic. Text is the same on both platforms — only the markdown syntax differs slightly (Discord markdown vs. Telegram HTML).

**Day-before reminder** (sent between 9am and 10pm local time, the day before the ride):

```
🚴 Reminder — tomorrow's ride at 09:00! Meeting point: Place de la République
```

**Weather forecast** (appended right after the day-before reminder, or sent on demand via `/weather`):

```
🌤️ Forecast: Sunny, 14–22°C, 💨 15 km/h ↖️ (gusts 22 km/h), 🌧️ 10% chance of rain
```

**Hour-before reminder** (sent 1 hour before the ride's `meetingTime`, if one is set):

```
⏰ 1 hour to go! See you at Place de la République at 09:00. 🚴
```

All these strings are defined in `src/i18n/en.ts` and `src/i18n/fr.ts` — see [Configuration → Language](/docs/configuration/#language) to switch locale.

---

## Route import

Both adapters support pasting a URL from a supported platform during ride creation. The bot fetches the route data and pre-fills name, distance, elevation gain, and elevation loss.

| Platform                                     | URL format                                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [Komoot](https://www.komoot.com)             | `https://www.komoot.com/tour/<id>`                                                                                   |
| [Strava](https://www.strava.com)             | `https://www.strava.com/routes/<id>`                                                                                 |
| [Garmin Connect](https://connect.garmin.com) | `https://connect.garmin.com/modern/course/<id>`                                                                      |
| GPX file                                     | Upload a `.gpx` file directly (Telegram only — Discord modals can't accept file uploads, paste a `.gpx` URL instead) |

All imported fields can be edited before the ride is confirmed.

### GPX upload after creation (Discord)

Discord's ride-creation modal can't accept a file upload, so if no GPX was provided when the ride was created, the bot asks the proposer to post the `.gpx` file directly as a message in the ride's thread. Once posted, the bot:

1. Reacts ✅ to the message
2. Sets the route's start point, used to get an accurate weather forecast (see [Configuration → Which location is used for the forecast?](/docs/configuration/#which-location-is-used-for-the-forecast))
3. Reposts the route map (with a distance/elevation badge and elevation profile)
4. Posts the weather forecast for that location

Only the ride's proposer can trigger this — GPX files posted by other members are ignored.
