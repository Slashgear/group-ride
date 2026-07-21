import { describe, expect, mock, test } from "bun:test"
import type { MessagingPort } from "../../src/domain/ports/messaging.port"
import type { RideRepository } from "../../src/domain/ports/ride.repository"
import type { Ride } from "../../src/domain/ride"
import { NotProposerError, RideNotActiveError, RideNotFoundError } from "../../src/domain/errors"
import { RideService } from "../../src/services/ride.service"

const SIMPLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Test Route</name>
    <trkseg>
      <trkpt lat="48.8566" lon="2.3522"><ele>35</ele></trkpt>
      <trkpt lat="48.8600" lon="2.3550"><ele>40</ele></trkpt>
      <trkpt lat="48.8650" lon="2.3600"><ele>30</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`

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
    startLat: null,
    startLon: null,
    weatherCity: null,
    ...overrides,
  }
}

describe("RideService.propose — GPX upload invite", () => {
  test("invites the proposer to upload a GPX when none was provided", async () => {
    const repo = mockRepo()
    const messaging = mockMessaging()
    const service = new RideService(repo, messaging)

    await service.propose({
      proposerId: "123",
      proposerName: "Test User",
      date: new Date("2026-06-01"),
      meetingPoint: "Place de la République",
    })

    expect(messaging.notifyThread).toHaveBeenCalledWith(
      "thread-1",
      expect.stringContaining("<@123>"),
    )
  })

  test("skips the GPX invite when a GPX was already provided", async () => {
    const repo = mockRepo()
    const messaging = mockMessaging()
    const service = new RideService(repo, messaging)

    await service.propose({
      proposerId: "123",
      proposerName: "Test User",
      date: new Date("2026-06-01"),
      meetingPoint: "Place de la République",
      gpxUrl: "https://example.com/route.gpx",
    })

    expect(messaging.notifyThread).not.toHaveBeenCalled()
  })
})

describe("RideService.attachGpx", () => {
  test("fills in start point and stats, updates summary, and reposts the map", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide({ proposerId: "123" }))
    const messaging = mockMessaging()
    const service = new RideService(repo, messaging)
    const mapImage = Buffer.from("fake-png")

    const ride = await service.attachGpx(
      "ride-1",
      "123",
      SIMPLE_GPX,
      "https://cdn.discordapp.com/route.gpx",
      mapImage,
    )

    expect(ride.gpxUrl).toBe("https://cdn.discordapp.com/route.gpx")
    expect(ride.startLon).toBe(2.3522)
    expect(ride.startLat).toBe(48.8566)
    expect(ride.distanceKm).toBeGreaterThan(0)
    expect(repo.update).toHaveBeenCalledTimes(1)
    expect(messaging.updatePinnedSummary).toHaveBeenCalledTimes(1)
    expect(messaging.notifyThread).toHaveBeenCalledWith("thread-1", expect.any(String), mapImage)
  })

  test("does not overwrite distance/elevation already set manually", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide({ proposerId: "123", distanceKm: 42 }))
    const service = new RideService(repo, mockMessaging())

    const ride = await service.attachGpx("ride-1", "123", SIMPLE_GPX, "https://example.com/r.gpx")

    expect(ride.distanceKm).toBe(42)
  })

  test("throws NotProposerError if the uploader isn't the proposer", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide({ proposerId: "123" }))
    const service = new RideService(repo, mockMessaging())

    let error: unknown
    try {
      await service.attachGpx("ride-1", "999", SIMPLE_GPX, "https://example.com/r.gpx")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(NotProposerError)
  })

  test("throws RideNotActiveError if ride is cancelled", async () => {
    const repo = mockRepo()
    repo.findById = mock(async () => makeRide({ proposerId: "123", status: "cancelled" }))
    const service = new RideService(repo, mockMessaging())

    let error: unknown
    try {
      await service.attachGpx("ride-1", "123", SIMPLE_GPX, "https://example.com/r.gpx")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotActiveError)
  })

  test("throws RideNotFoundError if ride is not found", async () => {
    const repo = mockRepo()
    const service = new RideService(repo, mockMessaging())

    let error: unknown
    try {
      await service.attachGpx("ride-1", "123", SIMPLE_GPX, "https://example.com/r.gpx")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(RideNotFoundError)
  })
})
