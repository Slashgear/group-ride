export const messages = {
  memberLeft: "A member left the ride.",
  rideUpdated: "Ride details have been updated.",
  rideOver: "The ride is over. This thread is now read-only.",
  rideCancelled: (date: string, meetingPoint: string) =>
    `The ride on ${date} (${meetingPoint}) has been cancelled.`,
  dayBeforeReminder: (meetingPoint: string, meetingTime?: string) =>
    `🚴 **Reminder** — tomorrow's ride${meetingTime == null ? "" : ` at **${meetingTime}**`}! Meeting point: **${meetingPoint}**`,
  hourBeforeReminder: (meetingPoint: string, meetingTime: string) =>
    `⏰ **1 hour to go!** See you at **${meetingPoint}** at **${meetingTime}**. 🚴`,
  joinSuccess: "You're in! Check the ride thread. 🚴",
  alreadyMember: "You're already registered for this ride.",
  rideNotActive: "This ride has been cancelled.",
  rideNotFound: "This ride no longer exists.",
  unexpectedError: "Something went wrong. Please try again.",
  leftRide: "You've left the ride.",
  rideCancelledConfirm: "Ride cancelled.",
  rideAlreadyCancelled: "This ride has already been cancelled.",
  rideUpdatedConfirm: (date: string) => `✅ Ride updated for ${date}!`,
  rideCancelledTelegram: "✅ Ride has been cancelled and the group notified.",
  joinSuccessTelegram: "You're in! Check the ride topic. 🚴",
  joinWaitlist: (position: number) =>
    `The ride is full. You've been added to the waitlist at position #${position}. You'll be notified if a spot opens up.`,
  promotedFromWaitlist:
    "A spot opened up! You've been moved from the waitlist and are now confirmed. 🚴",
  rideFull: "This ride is full and has a waitlist.",
  capConflict: "Cannot set cap: fewer spots than current confirmed participants.",
  weatherForecast: (
    tempMinC: number,
    tempMaxC: number,
    description: string,
    windSpeedKmph: number,
    windGustKmph: number,
    windDirection: string,
    precipitationChancePct: number,
    precipitationMm: number,
  ) =>
    `🌤️ **Forecast:** ${description}, ${tempMinC}–${tempMaxC}°C, 💨 ${windSpeedKmph} km/h ${windDirection} (gusts ${windGustKmph} km/h), 🌧️ ${precipitationChancePct}% chance of rain${precipitationMm > 0 ? ` (${precipitationMm} mm)` : ""}`,
  weatherMissingArgs:
    "Provide both a location and a date (DD/MM/YYYY), or use this command inside a ride thread.",
  weatherInvalidDate: "Invalid date format. Please use DD/MM/YYYY or DD/MM/YYYY HH:MM.",
  weatherUnavailable: "Weather forecast is unavailable for that location and date right now.",
  gpxUploadInvite: (proposerMention: string) =>
    `📎 ${proposerMention} once the route is ready, drop the ride's **.gpx** file right here — riders can grab it without needing a Komoot/Strava account, and it'll also be used to pin down the weather forecast location.`,
  gpxProcessed: "📍 Got it! Route map and weather location updated from the GPX.",
  gpxParseFailed: "⚠️ Couldn't read that GPX file — make sure it's a valid track export.",
}
