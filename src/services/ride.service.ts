import type { MessagingPort } from "../domain/ports/messaging.port"
import type { RideRepository } from "../domain/ports/ride.repository"
import type { CreateRideInput, Ride, RideId, UserId } from "../domain/ride"
import {
  AlreadyMemberError,
  CapConflictError,
  RideNotActiveError,
  RideNotFoundError,
} from "../domain/errors"
import { logger } from "../logger"
import { getMessages } from "../i18n"

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
      maxParticipants: input.maxParticipants ?? null,
    }

    const mapImage = input.mapImageBuffer

    await this.rides.save(ride)
    await this.rides.addMember(ride.id, ride.proposerId)
    const threadId = await this.messaging.createThread(ride, mapImage)
    ride.threadId = threadId
    // Pass initial members to pinSummary so the pinned message is correct from the start
    // (avoids an immediate redundant updatePinnedSummary call).
    const initialMembers = await this.rides.getMembers(ride.id)
    ride.pinnedMessageId = await this.messaging.pinSummary(threadId, ride, initialMembers, [])
    await this.rides.update(ride)
    // silent = true: proposer auto-joins but doesn't need a "You're in!" notification
    await this.messaging.addMemberToThread(threadId, ride.proposerId, true)
    try {
      await this.messaging.announce(ride, mapImage)
    } catch (err) {
      log.error({ err, rideId: ride.id }, "Failed to post announcement — ride was created but check bot channel permissions")
    }
    log.info({ rideId: ride.id, proposerId: ride.proposerId, date: ride.date }, "Ride proposed")
    return ride
  }

  async join(rideId: RideId, userId: UserId): Promise<{ waitlisted: boolean; position: number }> {
    const ride = await this.rides.findById(rideId)
    if (ride == null || ride.threadId == null) throw new RideNotFoundError()
    if (ride.status !== "active") throw new RideNotActiveError()
    if (await this.rides.hasMember(rideId, userId)) throw new AlreadyMemberError()

    const isFull =
      ride.maxParticipants != null &&
      (await this.rides.countConfirmed(rideId)) >= ride.maxParticipants

    await this.rides.addMember(rideId, userId, isFull)

    const members = await this.rides.getMembers(rideId)
    const waitlist = await this.rides.getWaitlist(rideId)
    await this.messaging.updatePinnedSummary(ride.threadId, ride, members, waitlist)

    if (isFull) {
      const position = waitlist.length
      log.info({ rideId, userId, position }, "Member added to waitlist")
      return { waitlisted: true, position }
    }

    await this.messaging.addMemberToThread(ride.threadId, userId)
    log.info({ rideId, userId }, "Member joined ride")
    return { waitlisted: false, position: 0 }
  }

  async leave(rideId: RideId, userId: UserId): Promise<void> {
    const ride = await this.rides.findById(rideId)
    if (ride == null || ride.threadId == null) throw new RideNotFoundError()
    if (ride.status !== "active") throw new RideNotActiveError()
    await this.rides.removeMember(rideId, userId)
    await this.messaging.removeMemberFromThread(ride.threadId, userId)
    const m = getMessages()
    await this.messaging.notifyThread(ride.threadId, m.memberLeft)

    const promoted = await this.rides.promoteFromWaitlist(rideId)
    if (promoted != null) {
      await this.messaging.addMemberToThread(ride.threadId, promoted)
      await this.messaging.notifyThread(ride.threadId, m.promotedFromWaitlist)
      log.info({ rideId, userId: promoted }, "Member promoted from waitlist")
    }

    const members = await this.rides.getMembers(rideId)
    const waitlist = await this.rides.getWaitlist(rideId)
    await this.messaging.updatePinnedSummary(ride.threadId, ride, members, waitlist)
    log.info({ rideId, userId }, "Member left ride")
  }

  async cancel(rideId: RideId): Promise<void> {
    const ride = await this.rides.findById(rideId)
    if (ride == null || ride.threadId == null) throw new RideNotFoundError()
    if (ride.status !== "active") throw new RideNotActiveError()
    ride.status = "cancelled"
    await this.rides.update(ride)
    const members = await this.rides.getMembers(rideId)
    const waitlist = await this.rides.getWaitlist(rideId)
    await this.messaging.updatePinnedSummary(ride.threadId, ride, members, waitlist)
    const cancelMsg = getMessages()
    await this.messaging.notifyMainChannel(
      cancelMsg.rideCancelled(ride.date.toDateString(), ride.meetingPoint),
    )
    await this.messaging.closeThread(ride.threadId)
    log.info({ rideId }, "Ride cancelled")
  }

  async update(rideId: RideId, changes: Partial<CreateRideInput>): Promise<void> {
    const ride = await this.rides.findById(rideId)
    if (ride == null) throw new RideNotFoundError()
    if (ride.status !== "active") throw new RideNotActiveError()

    if (changes.maxParticipants != null) {
      const confirmed = await this.rides.countConfirmed(rideId)
      if (changes.maxParticipants < confirmed) throw new CapConflictError()
    }

    // Exclude identity fields — proposer should never change via an update
    const { proposerId: _pid, proposerName: _pname, ...safeChanges } = changes
    Object.assign(ride, safeChanges)
    await this.rides.update(ride)
    if (ride.threadId != null) {
      const members = await this.rides.getMembers(rideId)
      const waitlist = await this.rides.getWaitlist(rideId)
      await this.messaging.updatePinnedSummary(ride.threadId, ride, members, waitlist)
      const updateMsg = getMessages()
      await this.messaging.notifyThread(ride.threadId, updateMsg.rideUpdated)
    }
    log.info({ rideId, changes: Object.keys(changes) }, "Ride updated")
  }

  async removeMemberFromAllActiveRides(userId: UserId): Promise<void> {
    const activeRides = await this.rides.findActiveByMember(userId)
    log.info({ userId, count: activeRides.length }, "Removing member from all active rides")
    await Promise.all(activeRides.map((ride) => this.leave(ride.id, userId)))
  }
}
