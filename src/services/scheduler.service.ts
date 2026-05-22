import type { MessagingPort } from "../domain/ports/messaging.port"
import type { RideRepository } from "../domain/ports/ride.repository"
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

    for (const ride of activeRides) {
      if (now >= ride.date.getTime() + CLOSE_DELAY_MS) {
        ride.status = "closed"
        await this.rides.update(ride)
        if (ride.threadId) {
          await this.messaging.updatePinnedSummary(ride.threadId, ride)
          await this.messaging.notifyThread(
            ride.threadId,
            "The ride is over. This thread is now read-only.",
          )
          await this.messaging.closeThread(ride.threadId)
        }
        log.info({ rideId: ride.id }, "Ride thread closed by scheduler")
      }
    }
  }

  start(): void {
    setInterval(() => this.tick(), 60_000)
  }
}
