import { describe, expect, jest, mock, test, beforeEach, afterEach } from "bun:test"
import type { MessagingPort } from "../../src/domain/ports/messaging.port"
import type { RideRepository } from "../../src/domain/ports/ride.repository"
import type { Ride } from "../../src/domain/ride"
import { SchedulerService } from "../../src/services/scheduler.service"

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
    proposerId: "u1",
    proposerName: "Alice",
    date: new Date("2026-07-02T10:00:00"),
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
    maxParticipants: null,
    ...overrides,
  }
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe("SchedulerService.maybeSendDayBeforeReminder — hour-of-day gating", () => {
  test.each([
    [0, false],
    [6, false],
    [8, false],
    [9, true],
    [10, true],
    [14, true],
    [18, true],
    [21, true],
    [22, false],
    [23, false],
  ])("at %i:00, day-before reminder is sent: %s", async (hour, shouldSend) => {
    const now = new Date("2026-07-01T00:00:00")
    now.setHours(hour, 0, 0, 0)
    jest.setSystemTime(now)

    const ride = makeRide({ reminderDaySent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    if (shouldSend) {
      expect(messaging.notifyThread).toHaveBeenCalledWith(
        "thread-1",
        expect.stringContaining("Reminder"),
      )
    } else {
      expect(messaging.notifyThread).not.toHaveBeenCalled()
    }
  })
})
