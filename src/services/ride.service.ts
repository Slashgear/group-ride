import type { MessagingPort } from "../domain/ports/messaging.port"
import type { RideRepository } from "../domain/ports/ride.repository"
import type { CreateRideInput, Ride, RideId, UserId } from "../domain/ride"
import { logger } from "../logger"

const log = logger.child({ module: "ride-service" })

export class RideService {
  constructor(
    private readonly rides: RideRepository,
    private readonly messaging: MessagingPort,
  ) {}

  async propose(input: CreateRideInput): Promise<Ride> {
    const ride: Ride = {
      id: crypto.randomUUID(),
      threadId: null,
      proposerId: input.proposerId,
      date: input.date,
      meetingPoint: input.meetingPoint,
      distanceKm: input.distanceKm ?? null,
      elevationGain: input.elevationGain ?? null,
      elevationLoss: input.elevationLoss ?? null,
      level: input.level ?? null,
      gpxUrl: input.gpxUrl ?? null,
      externalUrl: input.externalUrl ?? null,
      notes: input.notes ?? null,
      status: "active",
      pinnedMessageId: null,
      createdAt: new Date(),
    }

    await this.rides.save(ride)
    const threadId = await this.messaging.createThread(ride)
    ride.threadId = threadId
    ride.pinnedMessageId = await this.messaging.pinSummary(threadId, ride)
    await this.rides.update(ride)
    await this.messaging.announce(ride)
    log.info({ rideId: ride.id, proposerId: ride.proposerId, date: ride.date }, "Ride proposed")
    return ride
  }

  async join(rideId: RideId, userId: UserId): Promise<void> {
    const ride = await this.rides.findById(rideId)
    if (!ride || ride.status !== "active" || !ride.threadId) return
    await this.rides.addMember(rideId, userId)
    await this.messaging.addMemberToThread(ride.threadId, userId)
    log.info({ rideId, userId }, "Member joined ride")
  }

  async leave(rideId: RideId, userId: UserId): Promise<void> {
    const ride = await this.rides.findById(rideId)
    if (!ride || ride.status !== "active" || !ride.threadId) return
    await this.rides.removeMember(rideId, userId)
    await this.messaging.removeMemberFromThread(ride.threadId, userId)
    await this.messaging.notifyThread(ride.threadId, "A member left the ride.")
    log.info({ rideId, userId }, "Member left ride")
  }

  async cancel(rideId: RideId): Promise<void> {
    const ride = await this.rides.findById(rideId)
    if (!ride || ride.status !== "active" || !ride.threadId) return
    ride.status = "cancelled"
    await this.rides.update(ride)
    await this.messaging.notifyMainChannel(
      `The ride on ${ride.date.toDateString()} (${ride.meetingPoint}) has been cancelled.`,
    )
    await this.messaging.closeThread(ride.threadId)
    log.info({ rideId }, "Ride cancelled")
  }

  async update(rideId: RideId, changes: Partial<CreateRideInput>): Promise<void> {
    const ride = await this.rides.findById(rideId)
    if (!ride || ride.status !== "active") return
    Object.assign(ride, changes)
    await this.rides.update(ride)
    if (ride.threadId) {
      await this.messaging.updatePinnedSummary(ride.threadId, ride)
      await this.messaging.notifyThread(ride.threadId, "Ride details have been updated.")
    }
    log.info({ rideId, changes: Object.keys(changes) }, "Ride updated")
  }

  async removeMemberFromAllActiveRides(userId: UserId): Promise<void> {
    const activeRides = await this.rides.findActiveByMember(userId)
    log.info({ userId, count: activeRides.length }, "Removing member from all active rides")
    await Promise.all(activeRides.map((ride) => this.leave(ride.id, userId)))
  }
}
