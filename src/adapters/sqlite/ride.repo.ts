import type { RideRepository } from "../../domain/ports/ride.repository"
import type { Ride, RideId, UserId } from "../../domain/ride"
import { db } from "./db"

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
  pinned_message_id: number | null
  reminder_day_sent: number
  reminder_hour_sent: number
  created_at: string
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
    pinnedMessageId: row.pinned_message_id,
    reminderDaySent: row.reminder_day_sent !== 0,
    reminderHourSent: row.reminder_hour_sent !== 0,
    createdAt: new Date(row.created_at),
  }
}

export class SqliteRideRepository implements RideRepository {
  save(ride: Ride): Promise<void> {
    db.run(
      `INSERT INTO rides
        (id, thread_id, proposer_id, proposer_name, name, date, meeting_time, meeting_point,
         distance_km, elevation_gain, elevation_loss, level, gpx_url, external_url, notes,
         status, pinned_message_id, reminder_day_sent, reminder_hour_sent, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      ],
    )
    return Promise.resolve()
  }

  findById(id: RideId): Promise<Ride | null> {
    const row = db.query("SELECT * FROM rides WHERE id = ?").get(id) as RideRow | null
    return Promise.resolve(row == null ? null : rowToRide(row))
  }

  findActive(): Promise<Ride[]> {
    const rows = db
      .query("SELECT * FROM rides WHERE status = 'active' ORDER BY date ASC")
      .all() as RideRow[]
    return Promise.resolve(rows.map(rowToRide))
  }

  findActiveByMember(userId: UserId): Promise<Ride[]> {
    const rows = db
      .query(`
      SELECT r.* FROM rides r
      JOIN ride_members rm ON rm.ride_id = r.id
      WHERE r.status = 'active' AND rm.user_id = ?
    `)
      .all(userId) as RideRow[]
    return Promise.resolve(rows.map(rowToRide))
  }

  update(ride: Ride): Promise<void> {
    db.run(
      `UPDATE rides SET
        thread_id = ?, name = ?, date = ?, meeting_time = ?, meeting_point = ?,
        distance_km = ?, elevation_gain = ?, elevation_loss = ?, level = ?,
        gpx_url = ?, external_url = ?, notes = ?, status = ?, pinned_message_id = ?,
        reminder_day_sent = ?, reminder_hour_sent = ?
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
        ride.id,
      ],
    )
    return Promise.resolve()
  }

  addMember(rideId: RideId, userId: UserId): Promise<void> {
    db.run("INSERT OR IGNORE INTO ride_members (ride_id, user_id, joined_at) VALUES (?, ?, ?)", [
      rideId,
      userId,
      new Date().toISOString(),
    ])
    return Promise.resolve()
  }

  hasMember(rideId: RideId, userId: UserId): Promise<boolean> {
    const row = db
      .query("SELECT 1 FROM ride_members WHERE ride_id = ? AND user_id = ?")
      .get(rideId, userId)
    return Promise.resolve(row != null)
  }

  removeMember(rideId: RideId, userId: UserId): Promise<void> {
    db.run("DELETE FROM ride_members WHERE ride_id = ? AND user_id = ?", [rideId, userId])
    return Promise.resolve()
  }

  getMembers(rideId: RideId): Promise<UserId[]> {
    const rows = db.query("SELECT user_id FROM ride_members WHERE ride_id = ?").all(rideId) as {
      user_id: number
    }[]
    return Promise.resolve(rows.map((r) => String(r.user_id)))
  }
}
