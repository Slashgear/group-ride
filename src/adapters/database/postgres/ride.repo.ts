import { SQL } from "bun"
import type { RideRepository } from "../../../domain/ports/ride.repository"
import type { Ride, RideId, UserId } from "../../../domain/ride"

interface RideRow {
  id: string
  thread_id: string | null
  proposer_id: string
  proposer_name: string
  name: string | null
  date: Date
  meeting_time: string | null
  meeting_point: string
  distance_km: number | null
  elevation_gain: number | null
  elevation_loss: number | null
  level: string | null
  gpx_url: string | null
  external_url: string | null
  notes: string | null
  status: string
  pinned_message_id: string | null
  reminder_day_sent: boolean
  reminder_hour_sent: boolean
  created_at: Date
  max_participants: number | null
}

function rowToRide(row: RideRow): Ride {
  return {
    id: row.id,
    threadId: row.thread_id,
    proposerId: row.proposer_id,
    proposerName: row.proposer_name,
    name: row.name,
    date: row.date,
    meetingTime: row.meeting_time,
    meetingPoint: row.meeting_point,
    distanceKm: row.distance_km,
    elevationGain: row.elevation_gain,
    elevationLoss: row.elevation_loss,
    level: row.level as Ride["level"],
    gpxUrl: row.gpx_url,
    externalUrl: row.external_url,
    notes: row.notes,
    status: row.status as Ride["status"],
    pinnedMessageId: row.pinned_message_id,
    reminderDaySent: row.reminder_day_sent,
    reminderHourSent: row.reminder_hour_sent,
    createdAt: row.created_at,
    maxParticipants: row.max_participants,
  }
}

export class PostgresRideRepository implements RideRepository {
  private readonly sql: SQL

  constructor(databaseUrl: string) {
    this.sql = new SQL({ url: databaseUrl })
  }

  async save(ride: Ride): Promise<void> {
    await this.sql`
      INSERT INTO rides
        (id, thread_id, proposer_id, proposer_name, name, date, meeting_time, meeting_point,
         distance_km, elevation_gain, elevation_loss, level, gpx_url, external_url, notes,
         status, pinned_message_id, reminder_day_sent, reminder_hour_sent, created_at, max_participants)
      VALUES (
        ${ride.id}, ${ride.threadId}, ${ride.proposerId}, ${ride.proposerName}, ${ride.name},
        ${ride.date}, ${ride.meetingTime}, ${ride.meetingPoint},
        ${ride.distanceKm}, ${ride.elevationGain}, ${ride.elevationLoss}, ${ride.level},
        ${ride.gpxUrl}, ${ride.externalUrl}, ${ride.notes}, ${ride.status},
        ${ride.pinnedMessageId}, ${ride.reminderDaySent}, ${ride.reminderHourSent},
        ${ride.createdAt}, ${ride.maxParticipants}
      )
    `
  }

  async findById(id: RideId): Promise<Ride | null> {
    const rows = await this.sql<RideRow[]>`SELECT * FROM rides WHERE id = ${id}`
    return rows[0] == null ? null : rowToRide(rows[0])
  }

  async findByThreadId(threadId: string): Promise<Ride | null> {
    const rows = await this.sql<RideRow[]>`SELECT * FROM rides WHERE thread_id = ${threadId}`
    return rows[0] == null ? null : rowToRide(rows[0])
  }

  async findActive(): Promise<Ride[]> {
    const rows = await this.sql<
      RideRow[]
    >`SELECT * FROM rides WHERE status = 'active' ORDER BY date ASC`
    return rows.map(rowToRide)
  }

  async findActiveByMember(userId: UserId): Promise<Ride[]> {
    const rows = await this.sql<RideRow[]>`
      SELECT r.* FROM rides r
      JOIN ride_members rm ON rm.ride_id = r.id
      WHERE r.status = 'active' AND rm.user_id = ${userId}
    `
    return rows.map(rowToRide)
  }

  async update(ride: Ride): Promise<void> {
    await this.sql`
      UPDATE rides SET
        thread_id = ${ride.threadId},
        name = ${ride.name},
        date = ${ride.date},
        meeting_time = ${ride.meetingTime},
        meeting_point = ${ride.meetingPoint},
        distance_km = ${ride.distanceKm},
        elevation_gain = ${ride.elevationGain},
        elevation_loss = ${ride.elevationLoss},
        level = ${ride.level},
        gpx_url = ${ride.gpxUrl},
        external_url = ${ride.externalUrl},
        notes = ${ride.notes},
        status = ${ride.status},
        pinned_message_id = ${ride.pinnedMessageId},
        reminder_day_sent = ${ride.reminderDaySent},
        reminder_hour_sent = ${ride.reminderHourSent},
        max_participants = ${ride.maxParticipants}
      WHERE id = ${ride.id}
    `
  }

  async addMember(rideId: RideId, userId: UserId, waitlisted = false): Promise<void> {
    await this.sql`
      INSERT INTO ride_members (ride_id, user_id, joined_at, waitlisted)
      VALUES (${rideId}, ${userId}, ${new Date()}, ${waitlisted})
      ON CONFLICT DO NOTHING
    `
  }

  async hasMember(rideId: RideId, userId: UserId): Promise<boolean> {
    const rows = await this.sql`
      SELECT 1 FROM ride_members WHERE ride_id = ${rideId} AND user_id = ${userId}
    `
    return rows.length > 0
  }

  async removeMember(rideId: RideId, userId: UserId): Promise<void> {
    await this.sql`DELETE FROM ride_members WHERE ride_id = ${rideId} AND user_id = ${userId}`
  }

  async getMembers(rideId: RideId): Promise<UserId[]> {
    const rows = await this.sql<{ user_id: string }[]>`
      SELECT user_id FROM ride_members WHERE ride_id = ${rideId} AND waitlisted = FALSE
    `
    return rows.map((r) => r.user_id)
  }

  async countConfirmed(rideId: RideId): Promise<number> {
    const rows = await this.sql<{ count: string }[]>`
      SELECT COUNT(*) as count FROM ride_members WHERE ride_id = ${rideId} AND waitlisted = FALSE
    `
    return Number(rows[0]?.count ?? 0)
  }

  async getWaitlist(rideId: RideId): Promise<UserId[]> {
    const rows = await this.sql<{ user_id: string }[]>`
      SELECT user_id FROM ride_members WHERE ride_id = ${rideId} AND waitlisted = TRUE ORDER BY joined_at ASC
    `
    return rows.map((r) => r.user_id)
  }

  async promoteFromWaitlist(rideId: RideId): Promise<UserId | null> {
    const rows = await this.sql<{ user_id: string }[]>`
      SELECT user_id FROM ride_members WHERE ride_id = ${rideId} AND waitlisted = TRUE ORDER BY joined_at ASC LIMIT 1
    `
    if (rows[0] == null) return null
    const userId = rows[0].user_id
    await this.sql`
      UPDATE ride_members SET waitlisted = FALSE WHERE ride_id = ${rideId} AND user_id = ${userId}
    `
    return userId
  }

  async findPast(limit = 10): Promise<Ride[]> {
    const rows = await this.sql<
      RideRow[]
    >`SELECT * FROM rides WHERE date < NOW() ORDER BY date DESC LIMIT ${limit}`
    return rows.map(rowToRide)
  }

  async end(): Promise<void> {
    await this.sql.end()
  }
}
