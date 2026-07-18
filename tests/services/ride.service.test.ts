import { describe, expect, mock, test } from "bun:test"
import type { MessagingPort } from "../../src/domain/ports/messaging.port"
import type { RideRepository } from "../../src/domain/ports/ride.repository"
import type { Ride } from "../../src/domain/ride"
import { AlreadyMemberError, RideNotActiveError, RideNotFoundError } from "../../src/domain/errors"
import { RideService } from "../../src/services/ride.service"

function mockRepo(): RideRepository {
  return {
    save: mock(async () => {}),
    findById: mock(async () => null),
    findByThreadId: mock(async () => null),
    findActive: mock(async () => []),
    findActiveByMember: mock(async () => []),
    findPast: mock(async () => []),
    update: mock(async () => {}),
    addMember: mock(async () => {}),
    hasMember: mock(async () => false),
    removeMember: mock(async () => {}),
    getMembers: mock(async () => []),
    countConfirmed: mock(async () => 0),
    getWaitlist: mock(async () => []),
    promoteFromWaitlist: mock(async () => null),
  }
}

function mockMessaging(): MessagingPort {
  return {
    announce: mock(async () => {}),
    createThread: mock(async () => "thread-1"),
    pinSummary: mock(async () => "1"),
    updatePinnedSummary: mock(async () => {}),
    closeThread: mock(async () => {}),
    addMemberToThread: mock(async () => {}),
    removeMemberFromThread: mock(async () => {}),
    notifyThread: mock(async () => {}),
    notifyMainChannel: mock(async () => {}),
  }
}

function makeRide(overrides: Partial<Ride> = {}): Ride {
  return {
    id: "ride-1",
    threadId: "thread-1",
    proposerId: "123",
    proposerName: "Test User",
    date: new Date("2026-06-01"),
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
    ...overrides,
  }
}

describe("RideService.propose", () => {
  test("saves ride, creates thread, pins summary, and announces", async () => {
    const repo = mockRepo()
    const messaging = mockMessaging()
    const service = new RideService(repo, messaging)

    const ride = await service.propose({
      proposerId: "123",
      proposerName: "Test User",
      date: new Date("2026-06-01"),
      meetingPoint: "Place de la République",
    })

    expect(repo.save).toHaveBeenCalledTimes(1)
    expect(messaging.createThread).toHaveBeenCalledTimes(1)
    expect(messaging.pinSummary).toHaveBeenCalledTimes(1)
    expect(messaging.announce).toHaveBeenCalledTimes(1)
    expect(ride.threadId).toBe("thread-1")
  })

  test("auto-joins proposer to ride and thread", async () => {
    const repo = mockRepo()
    const messaging = mockMessaging()
    const service = new RideService(repo, messaging)

    await service.propose({
      proposerId: "123",
      proposerName: "Test User",
      date: new Date("2026-06-01"),
      meetingPoint: "Place de la République",
    })

    expect(repo.addMember).toHaveBeenCalledWith(expect.any(String), "123")
    // silent = true: proposer auto-joins without a "You're in!" notification
    expect(messaging.addMemberToThread).toHaveBeenCalledWith("thread-1", "123", true)
  })
})

describe("RideService.join", () => {
  test("adds member to repo and thread", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide())
    const messaging = mockMessaging()
    const service = new RideService(repo, messaging)

    await service.join("ride-1", "42")

    expect(repo.addMember).toHaveBeenCalledWith("ride-1", "42", false)
    expect(messaging.addMemberToThread).toHaveBeenCalledWith("thread-1", "42")
  })

  test("throws AlreadyMemberError if user is already a member", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide())
    repo.hasMember = mock(async () => true)
    const service = new RideService(repo, mockMessaging())

    let error: unknown
    try {
      await service.join("ride-1", "42")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(AlreadyMemberError)
  })

  test("throws RideNotFoundError if ride is not found", async () => {
    const repo = mockRepo()
    const service = new RideService(repo, mockMessaging())

    let error: unknown
    try {
      await service.join("ride-1", "42")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotFoundError)
  })

  test("throws RideNotActiveError if ride is cancelled", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide({ status: "cancelled" }))
    const service = new RideService(repo, mockMessaging())

    let error: unknown
    try {
      await service.join("ride-1", "42")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotActiveError)
  })
})

describe("RideService.leave", () => {
  test("removes member from repo and thread, notifies thread", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide())
    const messaging = mockMessaging()
    const service = new RideService(repo, messaging)

    await service.leave("ride-1", "42")

    expect(repo.removeMember).toHaveBeenCalledWith("ride-1", "42")
    expect(messaging.removeMemberFromThread).toHaveBeenCalledWith("thread-1", "42")
    expect(messaging.notifyThread).toHaveBeenCalledWith("thread-1", expect.any(String))
  })

  test("throws RideNotActiveError if ride is cancelled", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide({ status: "cancelled" }))
    const service = new RideService(repo, mockMessaging())

    let error: unknown
    try {
      await service.leave("ride-1", "42")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotActiveError)
  })
})

describe("RideService.cancel", () => {
  test("sets status to cancelled, updates pinned summary, notifies main channel, closes thread", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide())
    const messaging = mockMessaging()
    const service = new RideService(repo, messaging)

    await service.cancel("ride-1")

    expect(repo.update).toHaveBeenCalledTimes(1)
    expect(messaging.updatePinnedSummary).toHaveBeenCalledWith(
      "thread-1",
      expect.objectContaining({ status: "cancelled" }),
      expect.any(Array),
      expect.any(Array),
    )
    expect(messaging.notifyMainChannel).toHaveBeenCalledTimes(1)
    expect(messaging.closeThread).toHaveBeenCalledWith("thread-1")
  })

  test("throws RideNotActiveError if ride is already cancelled", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide({ status: "cancelled" }))
    const service = new RideService(repo, mockMessaging())

    let error: unknown
    try {
      await service.cancel("ride-1")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotActiveError)
  })
})

describe("RideService.update", () => {
  test("persists changes and refreshes pinned summary", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide())
    const messaging = mockMessaging()
    const service = new RideService(repo, messaging)

    await service.update("ride-1", { meetingPoint: "Gare du Nord" })

    expect(repo.update).toHaveBeenCalledTimes(1)
    expect(messaging.updatePinnedSummary).toHaveBeenCalledWith(
      "thread-1",
      expect.objectContaining({ meetingPoint: "Gare du Nord" }),
      expect.any(Array),
      expect.any(Array),
    )
    expect(messaging.notifyThread).toHaveBeenCalledWith("thread-1", expect.any(String))
  })

  test("throws RideNotActiveError if ride is cancelled", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide({ status: "cancelled" }))
    const service = new RideService(repo, mockMessaging())

    let error: unknown
    try {
      await service.update("ride-1", { meetingPoint: "Gare du Nord" })
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotActiveError)
  })
})

describe("RideService.removeMemberFromAllActiveRides", () => {
  test("calls leave for each active ride the member is in", async () => {
    const rides = [
      makeRide({ id: "ride-1", threadId: "t-1" }),
      makeRide({ id: "ride-2", threadId: "t-2" }),
    ]
    const repo = mockRepo()
    repo.findActiveByMember = mock(async () => rides)
    repo.findById = mock(async (id: string) => rides.find((r) => r.id === id) ?? null)
    const messaging = mockMessaging()
    const service = new RideService(repo, messaging)

    await service.removeMemberFromAllActiveRides("99")

    expect(messaging.removeMemberFromThread).toHaveBeenCalledTimes(2)
    expect(messaging.notifyThread).toHaveBeenCalledTimes(2)
  })
})
