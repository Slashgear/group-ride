import { Database } from "bun:sqlite"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, test, beforeEach } from "bun:test"
import { SqliteRideRepository } from "../../src/adapters/database/sqlite/ride.repo"
import type { Ride } from "../../src/domain/ride"

const MIGRATIONS_DIR = join(import.meta.dir, "../../src/adapters/database/sqlite/migrations")
const MIGRATION_FILES = [
  "001_initial.sql",
  "002_add_pinned_message_id.sql",
  "003_add_proposer_name.sql",
  "004_add_meeting_time.sql",
  "005_add_ride_name.sql",
  "006_add_reminder_flags.sql",
  "007_add_max_participants.sql",
  "008_add_waitlist.sql",
  "009_user_ids_as_text.sql",
  "010_add_weather_location.sql",
]

function makeDb(): Database {
  const db = new Database(":memory:")
  db.run("PRAGMA foreign_keys = ON;")
  for (const file of MIGRATION_FILES) {
    db.run(readFileSync(join(MIGRATIONS_DIR, file), "utf-8"))
  }
  return db
}

function makeRide(overrides: Partial<Ride> = {}): Ride {
  return {
    id: crypto.randomUUID(),
    threadId: null,
    proposerId: "u1",
    proposerName: "Alice",
    date: new Date("2026-07-01T00:00:00Z"),
    name: null,
    meetingTime: null,
    meetingPoint: "Place de la République",
    distanceKm: null,
    elevationGain: null,
    elevationLoss: null,
    level: null,
    gpxUrl: null,
    externalUrl: null,
    notes: null,
    status: "active",
    pinnedMessageId: null,
    reminderDaySent: false,
    reminderHourSent: false,
    createdAt: new Date(),
    maxParticipants: null,
    startLat: null,
    startLon: null,
    weatherCity: null,
    ...overrides,
  }
}

describe("SqliteRideRepository — weather location fields", () => {
  let repo: SqliteRideRepository

  beforeEach(() => {
    repo = new SqliteRideRepository(makeDb())
  })

  test("round-trips startLat/startLon/weatherCity through save and findById", async () => {
    const ride = makeRide({ startLat: 48.8566, startLon: 2.3522, weatherCity: "Paris" })
    await repo.save(ride)

    const result = await repo.findById(ride.id)

    expect(result?.startLat).toBe(48.8566)
    expect(result?.startLon).toBe(2.3522)
    expect(result?.weatherCity).toBe("Paris")
  })

  test("update persists changes to weather location fields", async () => {
    const ride = makeRide()
    await repo.save(ride)

    await repo.update({ ...ride, startLat: 45.75, startLon: 4.85, weatherCity: "Lyon" })
    const result = await repo.findById(ride.id)

    expect(result?.startLat).toBe(45.75)
    expect(result?.startLon).toBe(4.85)
    expect(result?.weatherCity).toBe("Lyon")
  })
})

describe("SqliteRideRepository.findPast", () => {
  let repo: SqliteRideRepository

  beforeEach(() => {
    repo = new SqliteRideRepository(makeDb())
  })

  test("returns rides whose date is in the past", async () => {
    const past = makeRide({ date: new Date("2020-01-01T00:00:00Z"), status: "closed" })
    const future = makeRide({ date: new Date("2099-01-01T00:00:00Z"), status: "active" })
    await repo.save(past)
    await repo.save(future)

    const result = await repo.findPast()

    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe(past.id)
  })

  test("returns rides sorted by date DESC", async () => {
    const older = makeRide({ date: new Date("2019-01-01T00:00:00Z"), status: "closed" })
    const newer = makeRide({ date: new Date("2021-01-01T00:00:00Z"), status: "closed" })
    await repo.save(older)
    await repo.save(newer)

    const result = await repo.findPast()

    expect(result[0]?.id).toBe(newer.id)
    expect(result[1]?.id).toBe(older.id)
  })

  test("respects the limit parameter", async () => {
    for (let i = 1; i <= 5; i++) {
      await repo.save(makeRide({ date: new Date(`202${i}-01-01T00:00:00Z`), status: "closed" }))
    }

    const result = await repo.findPast(3)

    expect(result).toHaveLength(3)
  })

  test("defaults to limit 10", async () => {
    for (let i = 0; i < 12; i++) {
      await repo.save(makeRide({ date: new Date("2020-01-01T00:00:00Z"), status: "closed" }))
    }

    const result = await repo.findPast()

    expect(result).toHaveLength(10)
  })

  test("returns empty array when no past rides", async () => {
    await repo.save(makeRide({ date: new Date("2099-01-01T00:00:00Z") }))

    const result = await repo.findPast()

    expect(result).toHaveLength(0)
  })
})
