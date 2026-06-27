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
    precipitationChancePct: number,
  ) =>
    `🌤️ **Tomorrow's forecast:** ${description}, ${tempMinC}–${tempMaxC}°C, 💨 ${windSpeedKmph} km/h, 🌧️ ${precipitationChancePct}% chance of rain`,
}
