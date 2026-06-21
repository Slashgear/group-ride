import { SQL } from "bun"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { afterAll, beforeEach, describe, expect, test } from "bun:test"
import { PostgresRideRepository } from "../../src/adapters/database/postgres/ride.repo"
import type { Ride } from "../../src/domain/ride"

const DATABASE_URL = process.env.DATABASE_URL

const MIGRATIONS_DIR = join(import.meta.dir, "../../src/adapters/database/postgres/migrations")
const MIGRATION_FILES = [
  "001_initial.sql",
  "002_add_pinned_message_id.sql",
  "003_add_proposer_name.sql",
  "004_add_meeting_time.sql",
  "005_add_ride_name.sql",
  "006_add_reminder_flags.sql",
]

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
    ...overrides,
  }
}

const sql = DATABASE_URL == null ? null : new SQL({ url: DATABASE_URL })

async function setup(): Promise<void> {
  if (sql == null) return
  for (const file of MIGRATION_FILES) {
    const ddl = readFileSync(join(MIGRATIONS_DIR, file), "utf-8")
    await sql.unsafe(ddl)
  }
}

async function truncate(db: SQL): Promise<void> {
  await db`TRUNCATE ride_members, rides CASCADE`
}

await setup()

afterAll(async () => {
  await sql?.end()
})

let repo: PostgresRideRepository

beforeEach(async () => {
  if (sql == null || DATABASE_URL == null) return
  await truncate(sql)
  repo = new PostgresRideRepository(DATABASE_URL)
})

describe("PostgresRideRepository — save / findById", () => {
  test.skipIf(DATABASE_URL == null)("persists a ride and retrieves it by id", async () => {
    const ride = makeRide()
    await repo.save(ride)

    const found = await repo.findById(ride.id)
    expect(found).not.toBeNull()
    expect(found?.id).toBe(ride.id)
    expect(found?.meetingPoint).toBe("Place de la République")
    expect(found?.proposerId).toBe("u1")
    expect(found?.status).toBe("active")
  })

  test.skipIf(DATABASE_URL == null)("returns null for unknown id", async () => {
    expect(await repo.findById("does-not-exist")).toBeNull()
  })
})

describe("PostgresRideRepository — findActive", () => {
  test.skipIf(DATABASE_URL == null)("returns only active rides ordered by date", async () => {
    const r1 = makeRide({ id: crypto.randomUUID(), date: new Date("2026-07-03T00:00:00Z") })
    const r2 = makeRide({ id: crypto.randomUUID(), date: new Date("2026-07-01T00:00:00Z") })
    const r3 = makeRide({ id: crypto.randomUUID(), status: "cancelled" })
    await repo.save(r1)
    await repo.save(r2)
    await repo.save(r3)

    const active = await repo.findActive()
    expect(active.map((r) => r.id)).toEqual([r2.id, r1.id])
  })
})

describe("PostgresRideRepository — update", () => {
  test.skipIf(DATABASE_URL == null)("persists field changes", async () => {
    const ride = makeRide()
    await repo.save(ride)

    ride.meetingPoint = "Bastille"
    ride.distanceKm = 80
    ride.status = "cancelled"
    await repo.update(ride)

    const found = await repo.findById(ride.id)
    expect(found?.meetingPoint).toBe("Bastille")
    expect(found?.distanceKm).toBe(80)
    expect(found?.status).toBe("cancelled")
  })
})

describe("PostgresRideRepository — members", () => {
  test.skipIf(DATABASE_URL == null)(
    "addMember / hasMember / getMembers / removeMember",
    async () => {
      const ride = makeRide()
      await repo.save(ride)

      expect(await repo.hasMember(ride.id, "u2")).toBe(false)

      await repo.addMember(ride.id, "u2")
      await repo.addMember(ride.id, "u3")

      expect(await repo.hasMember(ride.id, "u2")).toBe(true)

      const members = await repo.getMembers(ride.id)
      expect(members).toContain("u2")
      expect(members).toContain("u3")

      await repo.removeMember(ride.id, "u2")
      expect(await repo.hasMember(ride.id, "u2")).toBe(false)
      expect(await repo.hasMember(ride.id, "u3")).toBe(true)
    },
  )

  test.skipIf(DATABASE_URL == null)(
    "addMember is idempotent (ON CONFLICT DO NOTHING)",
    async () => {
      const ride = makeRide()
      await repo.save(ride)

      await repo.addMember(ride.id, "u2")
      await repo.addMember(ride.id, "u2")

      const members = await repo.getMembers(ride.id)
      expect(members.filter((id) => id === "u2").length).toBe(1)
    },
  )
})

describe("PostgresRideRepository — findActiveByMember", () => {
  test.skipIf(DATABASE_URL == null)(
    "returns only active rides the user is a member of",
    async () => {
      const r1 = makeRide({ id: crypto.randomUUID() })
      const r2 = makeRide({ id: crypto.randomUUID() })
      const r3 = makeRide({ id: crypto.randomUUID() })
      await repo.save(r1)
      await repo.save(r2)
      await repo.save(r3)
      await repo.addMember(r1.id, "u2")
      await repo.addMember(r3.id, "u2")

      const found = await repo.findActiveByMember("u2")
      const ids = found.map((r) => r.id)
      expect(ids).toContain(r1.id)
      expect(ids).toContain(r3.id)
      expect(ids).not.toContain(r2.id)
    },
  )
})
