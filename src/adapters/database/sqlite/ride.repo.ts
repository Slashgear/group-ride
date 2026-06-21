import type { Database } from "bun:sqlite"
import type { RideRepository } from "../../../domain/ports/ride.repository"
import type { Ride, RideId, UserId } from "../../../domain/ride"

interface RideRow {
  id: string
  thread_id: string | null
  proposer_id: number
  proposer_name: string
  name: string | null
  date: string
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
  pinned_message_id: string | number | null
  reminder_day_sent: number
  reminder_hour_sent: number
  created_at: string
  max_participants: number | null
}

function rowToRide(row: RideRow): Ride {
  return {
    id: row.id,
    threadId: row.thread_id,
    proposerId: String(row.proposer_id),
    proposerName: row.proposer_name,
    name: row.name,
    date: new Date(row.date),
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
    pinnedMessageId: row.pinned_message_id == null ? null : String(row.pinned_message_id),
    reminderDaySent: row.reminder_day_sent !== 0,
    reminderHourSent: row.reminder_hour_sent !== 0,
    createdAt: new Date(row.created_at),
    maxParticipants: row.max_participants,
  }
}

export class SqliteRideRepository implements RideRepository {
  constructor(private readonly db: Database) {}

  save(ride: Ride): Promise<void> {
    this.db.run(
      `INSERT INTO rides
        (id, thread_id, proposer_id, proposer_name, name, date, meeting_time, meeting_point,
         distance_km, elevation_gain, elevation_loss, level, gpx_url, external_url, notes,
         status, pinned_message_id, reminder_day_sent, reminder_hour_sent, created_at, max_participants)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ride.id,
        ride.threadId,
        ride.proposerId,
        ride.proposerName,
        ride.name,
        ride.date.toISOString(),
        ride.meetingTime,
        ride.meetingPoint,
        ride.distanceKm,
        ride.elevationGain,
        ride.elevationLoss,
        ride.level,
        ride.gpxUrl,
        ride.externalUrl,
        ride.notes,
        ride.status,
        ride.pinnedMessageId,
        ride.reminderDaySent ? 1 : 0,
        ride.reminderHourSent ? 1 : 0,
        ride.createdAt.toISOString(),
        ride.maxParticipants,
      ],
    )
    return Promise.resolve()
  }

  findById(id: RideId): Promise<Ride | null> {
    const row = this.db.query("SELECT * FROM rides WHERE id = ?").get(id) as RideRow | null
    return Promise.resolve(row == null ? null : rowToRide(row))
  }

  findActive(): Promise<Ride[]> {
    const rows = this.db
      .query("SELECT * FROM rides WHERE status = 'active' ORDER BY date ASC")
      .all() as RideRow[]
    return Promise.resolve(rows.map(rowToRide))
  }

  findActiveByMember(userId: UserId): Promise<Ride[]> {
    const rows = this.db
      .query(`
      SELECT r.* FROM rides r
      JOIN ride_members rm ON rm.ride_id = r.id
      WHERE r.status = 'active' AND rm.user_id = ?
    `)
      .all(userId) as RideRow[]
    return Promise.resolve(rows.map(rowToRide))
  }

  update(ride: Ride): Promise<void> {
    this.db.run(
      `UPDATE rides SET
        thread_id = ?, name = ?, date = ?, meeting_time = ?, meeting_point = ?,
        distance_km = ?, elevation_gain = ?, elevation_loss = ?, level = ?,
        gpx_url = ?, external_url = ?, notes = ?, status = ?, pinned_message_id = ?,
        reminder_day_sent = ?, reminder_hour_sent = ?, max_participants = ?
       WHERE id = ?`,
      [
        ride.threadId,
        ride.name,
        ride.date.toISOString(),
        ride.meetingTime,
        ride.meetingPoint,
        ride.distanceKm,
        ride.elevationGain,
        ride.elevationLoss,
        ride.level,
        ride.gpxUrl,
        ride.externalUrl,
        ride.notes,
        ride.status,
        ride.pinnedMessageId,
        ride.reminderDaySent ? 1 : 0,
        ride.reminderHourSent ? 1 : 0,
        ride.maxParticipants,
        ride.id,
      ],
    )
    return Promise.resolve()
  }

  addMember(rideId: RideId, userId: UserId, waitlisted = false): Promise<void> {
    this.db.run(
      "INSERT OR IGNORE INTO ride_members (ride_id, user_id, joined_at, waitlisted) VALUES (?, ?, ?, ?)",
      [rideId, userId, new Date().toISOString(), waitlisted ? 1 : 0],
    )
    return Promise.resolve()
  }

  hasMember(rideId: RideId, userId: UserId): Promise<boolean> {
    const row = this.db
      .query("SELECT 1 FROM ride_members WHERE ride_id = ? AND user_id = ?")
      .get(rideId, userId)
    return Promise.resolve(row != null)
  }

  removeMember(rideId: RideId, userId: UserId): Promise<void> {
    this.db.run("DELETE FROM ride_members WHERE ride_id = ? AND user_id = ?", [rideId, userId])
    return Promise.resolve()
  }

  getMembers(rideId: RideId): Promise<UserId[]> {
    const rows = this.db
      .query("SELECT user_id FROM ride_members WHERE ride_id = ? AND waitlisted = 0")
      .all(rideId) as {
      user_id: number
    }[]
    return Promise.resolve(rows.map((r) => String(r.user_id)))
  }

  countConfirmed(rideId: RideId): Promise<number> {
    const row = this.db
      .query("SELECT COUNT(*) as count FROM ride_members WHERE ride_id = ? AND waitlisted = 0")
      .get(rideId) as { count: number }
    return Promise.resolve(row.count)
  }

  getWaitlist(rideId: RideId): Promise<UserId[]> {
    const rows = this.db
      .query(
        "SELECT user_id FROM ride_members WHERE ride_id = ? AND waitlisted = 1 ORDER BY joined_at ASC",
      )
      .all(rideId) as { user_id: number }[]
    return Promise.resolve(rows.map((r) => String(r.user_id)))
  }

  promoteFromWaitlist(rideId: RideId): Promise<UserId | null> {
    const row = this.db
      .query(
        "SELECT user_id FROM ride_members WHERE ride_id = ? AND waitlisted = 1 ORDER BY joined_at ASC LIMIT 1",
      )
      .get(rideId) as { user_id: number } | null
    if (row == null) return Promise.resolve(null)
    this.db.run("UPDATE ride_members SET waitlisted = 0 WHERE ride_id = ? AND user_id = ?", [
      rideId,
      row.user_id,
    ])
    return Promise.resolve(String(row.user_id))
  }

  findPast(limit = 10): Promise<Ride[]> {
    const rows = this.db
      .query("SELECT * FROM rides WHERE date < datetime('now') ORDER BY date DESC LIMIT ?")
      .all(limit) as RideRow[]
    return Promise.resolve(rows.map(rowToRide))
  }
}
