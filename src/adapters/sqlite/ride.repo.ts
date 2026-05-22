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
  created_at: string
}

function rowToRide(row: RideRow): Ride {
  return {
    id: row.id,
    threadId: row.thread_id,
    proposerId: row.proposer_id,
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
    createdAt: new Date(row.created_at),
  }
}

export class SqliteRideRepository implements RideRepository {
  async save(ride: Ride): Promise<void> {
    db.run(
      `INSERT INTO rides
        (id, thread_id, proposer_id, proposer_name, name, date, meeting_time, meeting_point, distance_km, elevation_gain, elevation_loss, level, gpx_url, external_url, notes, status, pinned_message_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
        ride.createdAt.toISOString(),
      ],
    )
  }

  async findById(id: RideId): Promise<Ride | null> {
    const row = db.query("SELECT * FROM rides WHERE id = ?").get(id) as RideRow | null
    return row ? rowToRide(row) : null
  }

  async findActive(): Promise<Ride[]> {
    const rows = db.query("SELECT * FROM rides WHERE status = 'active'").all() as RideRow[]
    return rows.map(rowToRide)
  }

  async findActiveByMember(userId: UserId): Promise<Ride[]> {
    const rows = db
      .query(`
      SELECT r.* FROM rides r
      JOIN ride_members rm ON rm.ride_id = r.id
      WHERE r.status = 'active' AND rm.user_id = ?
    `)
      .all(userId) as RideRow[]
    return rows.map(rowToRide)
  }

  async update(ride: Ride): Promise<void> {
    db.run(
      `UPDATE rides SET
        thread_id = ?, date = ?, meeting_point = ?, distance_km = ?,
        elevation_gain = ?, elevation_loss = ?, level = ?,
        gpx_url = ?, external_url = ?, notes = ?, status = ?, pinned_message_id = ?
       WHERE id = ?`,
      [
        ride.threadId,
        ride.date.toISOString(),
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
        ride.id,
      ],
    )
  }

  async addMember(rideId: RideId, userId: UserId): Promise<void> {
    db.run("INSERT OR IGNORE INTO ride_members (ride_id, user_id, joined_at) VALUES (?, ?, ?)", [
      rideId,
      userId,
      new Date().toISOString(),
    ])
  }

  async removeMember(rideId: RideId, userId: UserId): Promise<void> {
    db.run("DELETE FROM ride_members WHERE ride_id = ? AND user_id = ?", [rideId, userId])
  }

  async getMembers(rideId: RideId): Promise<UserId[]> {
    const rows = db.query("SELECT user_id FROM ride_members WHERE ride_id = ?").all(rideId) as {
      user_id: number
    }[]
    return rows.map((r) => r.user_id)
  }
}
