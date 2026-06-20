import { Database } from "bun:sqlite"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { beforeEach, describe, expect, mock, test } from "bun:test"
import { SqliteRideRepository } from "../../src/adapters/database/sqlite/ride.repo"
import type { MessagingPort } from "../../src/domain/ports/messaging.port"
import { AlreadyMemberError, RideNotActiveError, RideNotFoundError } from "../../src/domain/errors"
import { RideService } from "../../src/services/ride.service"

const MIGRATIONS_DIR = join(import.meta.dir, "../../src/adapters/database/sqlite/migrations")
const MIGRATION_FILES = [
  "001_initial.sql",
  "002_add_pinned_message_id.sql",
  "003_add_proposer_name.sql",
  "004_add_meeting_time.sql",
  "005_add_ride_name.sql",
  "006_add_reminder_flags.sql",
]

function createTestDb(): Database {
  const testDb = new Database(":memory:")
  for (const file of MIGRATION_FILES) {
    testDb.run(readFileSync(join(MIGRATIONS_DIR, file), "utf-8"))
  }
  return testDb
}

let testDb: Database
let repo: SqliteRideRepository

beforeEach(() => {
  testDb = createTestDb()
  repo = new SqliteRideRepository(testDb)
})

function mockMessaging(overrides: Partial<MessagingPort> = {}): MessagingPort {
  return {
    announce: mock(async () => {}),
    createThread: mock(async () => `thread-${crypto.randomUUID()}`),
    pinSummary: mock(async () => "msg-1"),
    updatePinnedSummary: mock(async () => {}),
    closeThread: mock(async () => {}),
    addMemberToThread: mock(async () => {}),
    removeMemberFromThread: mock(async () => {}),
    notifyThread: mock(async () => {}),
    notifyMainChannel: mock(async () => {}),
    ...overrides,
  }
}

const BASE_INPUT = {
  proposerId: "u1",
  proposerName: "Alice",
  date: new Date("2026-07-01"),
  meetingPoint: "Place de la République",
} as const

describe("RideService integration — propose", () => {
  test("persists ride to DB with correct fields", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)

    const found = await repo.findById(ride.id)
    expect(found).not.toBeNull()
    expect(found?.meetingPoint).toBe("Place de la République")
    expect(found?.proposerId).toBe("u1")
    expect(found?.status).toBe("active")
  })

  test("sets threadId returned by messaging adapter", async () => {
    const messaging = mockMessaging({
      createThread: mock(async () => "fixed-thread"),
    })
    const service = new RideService(repo, messaging)
    const ride = await service.propose(BASE_INPUT)

    const found = await repo.findById(ride.id)
    expect(found?.threadId).toBe("fixed-thread")
  })

  test("auto-joins proposer as first member", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)

    expect(await repo.hasMember(ride.id, "u1")).toBe(true)
  })

  test("ride appears in findActive()", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)

    const active = await repo.findActive()
    expect(active.some((r) => r.id === ride.id)).toBe(true)
  })
})

describe("RideService integration — join", () => {
  test("adds new member to DB", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)

    await service.join(ride.id, "u2")

    expect(await repo.hasMember(ride.id, "u2")).toBe(true)
  })

  test("throws AlreadyMemberError when joining twice", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)
    await service.join(ride.id, "u2")

    let error: unknown
    try {
      await service.join(ride.id, "u2")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(AlreadyMemberError)
  })

  test("throws RideNotFoundError for unknown ride", async () => {
    const service = new RideService(repo, mockMessaging())

    let error: unknown
    try {
      await service.join("does-not-exist", "u2")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotFoundError)
  })

  test("throws RideNotActiveError on cancelled ride", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)
    await service.cancel(ride.id)

    let error: unknown
    try {
      await service.join(ride.id, "u2")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotActiveError)
  })
})

describe("RideService integration — leave", () => {
  test("removes member from DB", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)
    await service.join(ride.id, "u2")

    await service.leave(ride.id, "u2")

    expect(await repo.hasMember(ride.id, "u2")).toBe(false)
  })

  test("throws RideNotActiveError on cancelled ride", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)
    await service.join(ride.id, "u2")
    await service.cancel(ride.id)

    let error: unknown
    try {
      await service.leave(ride.id, "u2")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotActiveError)
  })
})

describe("RideService integration — cancel", () => {
  test("sets status to cancelled in DB", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)

    await service.cancel(ride.id)

    const found = await repo.findById(ride.id)
    expect(found?.status).toBe("cancelled")
  })

  test("cancelled ride disappears from findActive()", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)

    await service.cancel(ride.id)

    const active = await repo.findActive()
    expect(active.some((r) => r.id === ride.id)).toBe(false)
  })

  test("throws RideNotActiveError when already cancelled", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)
    await service.cancel(ride.id)

    let error: unknown
    try {
      await service.cancel(ride.id)
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotActiveError)
  })
})

describe("RideService integration — update", () => {
  test("persists field changes to DB", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)

    await service.update(ride.id, { meetingPoint: "Bastille", distanceKm: 80 })

    const found = await repo.findById(ride.id)
    expect(found?.meetingPoint).toBe("Bastille")
    expect(found?.distanceKm).toBe(80)
  })

  test("other fields are preserved after update", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose({ ...BASE_INPUT, distanceKm: 60 })

    await service.update(ride.id, { meetingPoint: "Bastille" })

    const found = await repo.findById(ride.id)
    expect(found?.distanceKm).toBe(60)
  })

  test("throws RideNotActiveError on cancelled ride", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)
    await service.cancel(ride.id)

    let error: unknown
    try {
      await service.update(ride.id, { meetingPoint: "Bastille" })
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotActiveError)
  })
})

describe("RideService integration — removeMemberFromAllActiveRides", () => {
  test("removes user from all active rides", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride1 = await service.propose({ ...BASE_INPUT, meetingPoint: "Bastille" })
    const ride2 = await service.propose({ ...BASE_INPUT, meetingPoint: "République" })

    await service.join(ride1.id, "u2")
    await service.join(ride2.id, "u2")

    await service.removeMemberFromAllActiveRides("u2")

    expect(await repo.hasMember(ride1.id, "u2")).toBe(false)
    expect(await repo.hasMember(ride2.id, "u2")).toBe(false)
  })

  test("does not remove other members", async () => {
    const service = new RideService(repo, mockMessaging())
    const ride = await service.propose(BASE_INPUT)
    await service.join(ride.id, "u2")
    await service.join(ride.id, "u3")

    await service.removeMemberFromAllActiveRides("u2")

    expect(await repo.hasMember(ride.id, "u3")).toBe(true)
  })
})
