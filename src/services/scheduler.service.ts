import type { MessagingPort } from "../domain/ports/messaging.port"
import type { RideRepository } from "../domain/ports/ride.repository"
import type { Ride } from "../domain/ride"
import { logger } from "../logger"

const log = logger.child({ module: "scheduler" })
const CLOSE_DELAY_MS = 24 * 60 * 60 * 1000

export class SchedulerService {
  constructor(
    private readonly rides: RideRepository,
    private readonly messaging: MessagingPort,
  ) {}

  async tick(): Promise<void> {
    const activeRides = await this.rides.findActive()
    const now = Date.now()

    const todayMidnight = new Date(now)
    todayMidnight.setHours(0, 0, 0, 0)
    const tomorrowMidnight = new Date(todayMidnight)
    tomorrowMidnight.setDate(tomorrowMidnight.getDate() + 1)
    const dayAfterMidnight = new Date(tomorrowMidnight)
    dayAfterMidnight.setDate(dayAfterMidnight.getDate() + 1)

    for (const ride of activeRides) {
      if (now >= ride.date.getTime() + CLOSE_DELAY_MS) {
        await this.closeRide(ride)
        continue
      }
      await this.maybeSendDayBeforeReminder(ride, tomorrowMidnight, dayAfterMidnight)
      await this.maybeSendHourBeforeReminder(ride, now)
    }
  }

  private async closeRide(ride: Ride): Promise<void> {
    ride.status = "closed"
    await this.rides.update(ride)
    if (ride.threadId != null) {
      await this.messaging.updatePinnedSummary(ride.threadId, ride)
      await this.messaging.notifyThread(ride.threadId, "The ride is over. This thread is now read-only.")
      await this.messaging.closeThread(ride.threadId)
    }
    log.info({ rideId: ride.id }, "Ride thread closed by scheduler")
  }

  private async maybeSendDayBeforeReminder(
    ride: Ride,
    tomorrowMidnight: Date,
    dayAfterMidnight: Date,
  ): Promise<void> {
    if (ride.reminderDaySent || ride.threadId == null) return
    const rideDay = new Date(ride.date)
    rideDay.setHours(0, 0, 0, 0)
    if (rideDay < tomorrowMidnight || rideDay >= dayAfterMidnight) return
    const timeInfo = ride.meetingTime == null ? "" : ` at **${ride.meetingTime}**`
    await this.messaging.notifyThread(
      ride.threadId,
      `🚴 **Reminder** — tomorrow's ride${timeInfo}! Meeting point: **${ride.meetingPoint}**`,
    )
    ride.reminderDaySent = true
    await this.rides.update(ride)
    log.info({ rideId: ride.id }, "Day-before reminder sent")
  }

  private async maybeSendHourBeforeReminder(ride: Ride, now: number): Promise<void> {
    if (ride.reminderHourSent || ride.threadId == null || ride.meetingTime == null) return
    const [h, m] = ride.meetingTime.split(":").map(Number) as [number, number]
    const rideDateTime = new Date(ride.date)
    rideDateTime.setHours(h, m, 0, 0)
    const timeUntil = rideDateTime.getTime() - now
    if (timeUntil <= 0 || timeUntil > 75 * 60_000 || timeUntil < 45 * 60_000) return
    await this.messaging.notifyThread(
      ride.threadId,
      `⏰ **1 hour to go!** See you at **${ride.meetingPoint}** at **${ride.meetingTime}**. 🚴`,
    )
    ride.reminderHourSent = true
    await this.rides.update(ride)
    log.info({ rideId: ride.id }, "Hour-before reminder sent")
  }

  start(): void {
    setInterval(() => {
      void this.tick()
    }, 60_000)
  }
}
