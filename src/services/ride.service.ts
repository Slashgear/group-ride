import type { MessagingPort } from "../domain/ports/messaging.port"
import type { RideRepository } from "../domain/ports/ride.repository"
import type { CreateRideInput, Ride, RideId, UserId } from "../domain/ride"
import { AlreadyMemberError, RideNotActiveError, RideNotFoundError } from "../domain/errors"
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
      proposerName: input.proposerName,
      name: input.name ?? null,
      date: input.date,
      meetingTime: input.meetingTime ?? null,
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
      reminderDaySent: false,
      reminderHourSent: false,
      createdAt: new Date(),
    }

    await this.rides.save(ride)
    await this.rides.addMember(ride.id, ride.proposerId)
    const threadId = await this.messaging.createThread(ride)
    ride.threadId = threadId
    // Pass initial members to pinSummary so the pinned message is correct from the start
    // (avoids an immediate redundant updatePinnedSummary call).
    const initialMembers = await this.rides.getMembers(ride.id)
    ride.pinnedMessageId = await this.messaging.pinSummary(threadId, ride, initialMembers)
    await this.rides.update(ride)
    // silent = true: proposer auto-joins but doesn't need a "You're in!" notification
    await this.messaging.addMemberToThread(threadId, ride.proposerId, true)
    await this.messaging.announce(ride)
    log.info({ rideId: ride.id, proposerId: ride.proposerId, date: ride.date }, "Ride proposed")
    return ride
  }

  async join(rideId: RideId, userId: UserId): Promise<void> {
    const ride = await this.rides.findById(rideId)
    if (ride == null || ride.threadId == null) throw new RideNotFoundError()
    if (ride.status !== "active") throw new RideNotActiveError()
    if (await this.rides.hasMember(rideId, userId)) throw new AlreadyMemberError()
    await this.rides.addMember(rideId, userId)
    await this.messaging.addMemberToThread(ride.threadId, userId)
    const members = await this.rides.getMembers(rideId)
    await this.messaging.updatePinnedSummary(ride.threadId, ride, members)
    log.info({ rideId, userId }, "Member joined ride")
  }

  async leave(rideId: RideId, userId: UserId): Promise<void> {
    const ride = await this.rides.findById(rideId)
    if (ride == null || ride.threadId == null) throw new RideNotFoundError()
    if (ride.status !== "active") throw new RideNotActiveError()
    await this.rides.removeMember(rideId, userId)
    await this.messaging.removeMemberFromThread(ride.threadId, userId)
    await this.messaging.notifyThread(ride.threadId, "A member left the ride.")
    const members = await this.rides.getMembers(rideId)
    await this.messaging.updatePinnedSummary(ride.threadId, ride, members)
    log.info({ rideId, userId }, "Member left ride")
  }

  async cancel(rideId: RideId): Promise<void> {
    const ride = await this.rides.findById(rideId)
    if (ride == null || ride.threadId == null) throw new RideNotFoundError()
    if (ride.status !== "active") throw new RideNotActiveError()
    ride.status = "cancelled"
    await this.rides.update(ride)
    const members = await this.rides.getMembers(rideId)
    await this.messaging.updatePinnedSummary(ride.threadId, ride, members)
    await this.messaging.notifyMainChannel(
      `The ride on ${ride.date.toDateString()} (${ride.meetingPoint}) has been cancelled.`,
    )
    await this.messaging.closeThread(ride.threadId)
    log.info({ rideId }, "Ride cancelled")
  }

  async update(rideId: RideId, changes: Partial<CreateRideInput>): Promise<void> {
    const ride = await this.rides.findById(rideId)
    if (ride == null) throw new RideNotFoundError()
    if (ride.status !== "active") throw new RideNotActiveError()
    // Exclude identity fields — proposer should never change via an update
    const { proposerId: _pid, proposerName: _pname, ...safeChanges } = changes
    Object.assign(ride, safeChanges)
    await this.rides.update(ride)
    if (ride.threadId != null) {
      const members = await this.rides.getMembers(rideId)
      await this.messaging.updatePinnedSummary(ride.threadId, ride, members)
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
