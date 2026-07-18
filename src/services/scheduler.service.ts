import type { MessagingPort } from "../domain/ports/messaging.port"
import type { RideRepository } from "../domain/ports/ride.repository"
import type { Ride } from "../domain/ride"
import { logger } from "../logger"
import { getMessages } from "../i18n"
import type { WeatherService } from "./weather.service"

const log = logger.child({ module: "scheduler" })
const CLOSE_DELAY_MS = 24 * 60 * 60 * 1000
const DAY_BEFORE_REMINDER_START_HOUR = 9
const DAY_BEFORE_REMINDER_END_HOUR = 22

export class SchedulerService {
  constructor(
    private readonly rides: RideRepository,
    private readonly messaging: MessagingPort,
    private readonly weather?: WeatherService,
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
      try {
        if (now >= ride.date.getTime() + CLOSE_DELAY_MS) {
          await this.closeRide(ride)
          continue
        }
        await this.maybeSendDayBeforeReminder(ride, tomorrowMidnight, dayAfterMidnight, now)
        await this.maybeSendHourBeforeReminder(ride, now)
      } catch (err) {
        log.error({ err, rideId: ride.id }, "Scheduler error processing ride")
      }
    }
  }

  private async closeRide(ride: Ride): Promise<void> {
    ride.status = "closed"
    await this.rides.update(ride)
    if (ride.threadId != null) {
      const members = await this.rides.getMembers(ride.id)
      await this.messaging.updatePinnedSummary(ride.threadId, ride, members)
      const m = getMessages()
      await this.messaging.notifyThread(ride.threadId, m.rideOver)
      await this.messaging.closeThread(ride.threadId)
    }
    log.info({ rideId: ride.id }, "Ride thread closed by scheduler")
  }

  private async maybeSendDayBeforeReminder(
    ride: Ride,
    tomorrowMidnight: Date,
    dayAfterMidnight: Date,
    now: number,
  ): Promise<void> {
    if (ride.reminderDaySent || ride.threadId == null) return
    const rideDay = new Date(ride.date)
    rideDay.setHours(0, 0, 0, 0)
    if (rideDay < tomorrowMidnight || rideDay >= dayAfterMidnight) return
    const currentHour = new Date(now).getHours()
    if (currentHour < DAY_BEFORE_REMINDER_START_HOUR || currentHour >= DAY_BEFORE_REMINDER_END_HOUR)
      return
    const dayM = getMessages()
    await this.messaging.notifyThread(
      ride.threadId,
      dayM.dayBeforeReminder(ride.meetingPoint, ride.meetingTime ?? undefined),
    )
    ride.reminderDaySent = true
    await this.rides.update(ride)
    log.info({ rideId: ride.id }, "Day-before reminder sent")

    if (this.weather != null) {
      await this.sendWeatherForecast(ride)
    }
  }

  private async sendWeatherForecast(ride: Ride): Promise<void> {
    if (ride.threadId == null || this.weather == null) return
    try {
      const data = await this.weather.getWeather(
        ride.meetingPoint,
        ride.date,
        ride.meetingTime ?? undefined,
      )
      if (data == null) return
      const m = getMessages()
      await this.messaging.notifyThread(
        ride.threadId,
        m.weatherForecast(
          data.tempMinC,
          data.tempMaxC,
          data.description,
          data.windSpeedKmph,
          data.precipitationChancePct,
        ),
      )
      log.info({ rideId: ride.id }, "Weather forecast sent with day-before reminder")
    } catch (err) {
      log.warn({ err, rideId: ride.id }, "Weather forecast failed — skipping")
    }
  }

  private async maybeSendHourBeforeReminder(ride: Ride, now: number): Promise<void> {
    if (ride.reminderHourSent || ride.threadId == null || ride.meetingTime == null) return
    const parts = ride.meetingTime.split(":")
    const h = Number(parts[0])
    const m = Number(parts[1])
    if (!Number.isFinite(h) || !Number.isFinite(m)) return
    const rideDateTime = new Date(ride.date)
    rideDateTime.setHours(h, m, 0, 0)
    const timeUntil = rideDateTime.getTime() - now
    if (timeUntil <= 0 || timeUntil > 75 * 60_000 || timeUntil < 45 * 60_000) return
    const hourM = getMessages()
    await this.messaging.notifyThread(
      ride.threadId,
      hourM.hourBeforeReminder(ride.meetingPoint, ride.meetingTime),
    )
    ride.reminderHourSent = true
    await this.rides.update(ride)
    log.info({ rideId: ride.id }, "Hour-before reminder sent")
  }

  start(): void {
    setInterval(() => {
      void this.tick().catch((err) => {
        log.error({ err }, "Unhandled error in scheduler tick")
      })
    }, 60_000)
  }
}
