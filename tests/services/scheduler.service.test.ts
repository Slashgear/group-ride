import { describe, expect, jest, mock, test, beforeEach, afterEach } from "bun:test"
import type { MessagingPort } from "../../src/domain/ports/messaging.port"
import type { RideRepository } from "../../src/domain/ports/ride.repository"
import type { Ride } from "../../src/domain/ride"
import { SchedulerService } from "../../src/services/scheduler.service"

function mockRepo(): RideRepository {
  return {
    save: mock(async () => {}),
    findById: mock(async () => null),
    findActive: mock(async () => []),
    findActiveByMember: mock(async () => []),
    findPast: mock(async () => []),
    update: mock(async () => {}),
    addMember: mock(async () => {}),
    hasMember: mock(async () => false),
    removeMember: mock(async () => {}),
    getMembers: mock(async () => []),
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
    proposerId: "u1",
    proposerName: "Alice",
    date: new Date("2026-07-01T10:00:00"),
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
    pinnedMessageId: "msg-1",
    reminderDaySent: false,
    reminderHourSent: false,
    createdAt: new Date(),
    ...overrides,
  }
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe("SchedulerService.closeRide", () => {
  test("closes a ride whose date + 24h has passed", async () => {
    // Ride date: 2026-07-01T10:00:00. 24h later = 2026-07-02T10:00:00.
    // Set now to just after that.
    jest.setSystemTime(new Date("2026-07-02T10:00:01"))

    const ride = makeRide({ date: new Date("2026-07-01T10:00:00") })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(repo.update).toHaveBeenCalledTimes(1)
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ status: "closed" }))
    expect(messaging.notifyThread).toHaveBeenCalledWith("thread-1", expect.any(String))
    expect(messaging.closeThread).toHaveBeenCalledWith("thread-1")
  })

  test("does not close a ride when now equals ride.date (24h not yet elapsed)", async () => {
    jest.setSystemTime(new Date("2026-07-01T10:00:00"))

    const ride = makeRide({ date: new Date("2026-07-01T10:00:00") })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.closeThread).not.toHaveBeenCalled()
    expect(repo.update).not.toHaveBeenCalledWith(expect.objectContaining({ status: "closed" }))
  })
})

describe("SchedulerService.maybeSendDayBeforeReminder", () => {
  test("sends day-before reminder when ride is tomorrow", async () => {
    // Now: 2026-07-01T08:00:00. Tomorrow = 2026-07-02. Ride date = 2026-07-02T10:00:00.
    jest.setSystemTime(new Date("2026-07-01T08:00:00"))

    const ride = makeRide({ date: new Date("2026-07-02T10:00:00"), reminderDaySent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).toHaveBeenCalledWith(
      "thread-1",
      expect.stringContaining("Reminder"),
    )
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ reminderDaySent: true }))
  })

  test("does not send day-before reminder when ride is today", async () => {
    // Now: 2026-07-01T08:00:00. Ride date = 2026-07-01T10:00:00 (today).
    jest.setSystemTime(new Date("2026-07-01T08:00:00"))

    const ride = makeRide({ date: new Date("2026-07-01T10:00:00"), reminderDaySent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).not.toHaveBeenCalled()
  })

  test("does not send day-before reminder when ride is in 2 days", async () => {
    // Now: 2026-07-01T08:00:00. Ride date = 2026-07-03T10:00:00 (in 2 days).
    jest.setSystemTime(new Date("2026-07-01T08:00:00"))

    const ride = makeRide({ date: new Date("2026-07-03T10:00:00"), reminderDaySent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).not.toHaveBeenCalled()
  })

  test("does not send day-before reminder when reminderDaySent is already true", async () => {
    // Now: 2026-07-01T08:00:00. Ride date = 2026-07-02 (tomorrow), but already sent.
    jest.setSystemTime(new Date("2026-07-01T08:00:00"))

    const ride = makeRide({ date: new Date("2026-07-02T10:00:00"), reminderDaySent: true })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).not.toHaveBeenCalled()
  })
})

describe("SchedulerService.maybeSendHourBeforeReminder", () => {
  // Ride date: 2026-07-01, meetingTime: "10:00" → ride starts at 2026-07-01T10:00:00

  test("sends reminder when now is 45 min before meetingTime (09:15)", async () => {
    jest.setSystemTime(new Date("2026-07-01T09:15:00"))

    const ride = makeRide({ meetingTime: "10:00", reminderHourSent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).toHaveBeenCalledWith(
      "thread-1",
      expect.stringContaining("1 hour to go"),
    )
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ reminderHourSent: true }))
  })

  test("sends reminder when now is exactly 60 min before meetingTime (09:00)", async () => {
    jest.setSystemTime(new Date("2026-07-01T09:00:00"))

    const ride = makeRide({ meetingTime: "10:00", reminderHourSent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).toHaveBeenCalledWith(
      "thread-1",
      expect.stringContaining("1 hour to go"),
    )
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ reminderHourSent: true }))
  })

  test("sends reminder when now is 75 min before meetingTime (08:45)", async () => {
    jest.setSystemTime(new Date("2026-07-01T08:45:00"))

    const ride = makeRide({ meetingTime: "10:00", reminderHourSent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).toHaveBeenCalledWith(
      "thread-1",
      expect.stringContaining("1 hour to go"),
    )
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ reminderHourSent: true }))
  })

  test("does NOT send reminder when now is 76 min before meetingTime (08:44)", async () => {
    jest.setSystemTime(new Date("2026-07-01T08:44:00"))

    const ride = makeRide({ meetingTime: "10:00", reminderHourSent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).not.toHaveBeenCalled()
  })

  test("does NOT send reminder when now is 44 min before meetingTime (09:16)", async () => {
    jest.setSystemTime(new Date("2026-07-01T09:16:00"))

    const ride = makeRide({ meetingTime: "10:00", reminderHourSent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).not.toHaveBeenCalled()
  })

  test("does NOT send reminder when reminderHourSent is already true", async () => {
    jest.setSystemTime(new Date("2026-07-01T09:00:00"))

    const ride = makeRide({ meetingTime: "10:00", reminderHourSent: true })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).not.toHaveBeenCalled()
  })

  test("does NOT send reminder when meetingTime is null", async () => {
    jest.setSystemTime(new Date("2026-07-01T09:00:00"))

    const ride = makeRide({ meetingTime: null, reminderHourSent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).not.toHaveBeenCalled()
  })
})
