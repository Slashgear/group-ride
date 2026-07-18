import { describe, expect, jest, mock, test, beforeEach, afterEach } from "bun:test"
import type { MessagingPort } from "../../src/domain/ports/messaging.port"
import type { RideRepository } from "../../src/domain/ports/ride.repository"
import type { Ride } from "../../src/domain/ride"
import { SchedulerService } from "../../src/services/scheduler.service"
import type { WeatherService, WeatherData } from "../../src/services/weather.service"

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
    maxParticipants: null,
    startLat: null,
    startLon: null,
    weatherCity: null,
    ...overrides,
  }
}

const weatherData: WeatherData = {
  tempMinC: 14,
  tempMaxC: 22,
  description: "Sunny",
  windSpeedKmph: 15,
  windGustKmph: 22,
  windDirection: "↖️",
  precipitationChancePct: 10,
  precipitationMm: 0,
}

function mockWeather(returnValue: WeatherData | null): WeatherService {
  return {
    getWeather: mock(async () => returnValue),
    getForecastImage: mock(async () => null),
  }
}

beforeEach(() => {
  jest.useFakeTimers()
})

afterEach(() => {
  jest.useRealTimers()
})

describe("SchedulerService — weather integration", () => {
  test("sends weather message after day-before reminder when WeatherService returns data", async () => {
    jest.setSystemTime(new Date("2026-07-01T10:00:00"))

    const ride = makeRide({ date: new Date("2026-07-02T10:00:00"), reminderDaySent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging, mockWeather(weatherData))

    await service.tick()

    expect(messaging.notifyThread).toHaveBeenCalledTimes(2)
    expect(messaging.notifyThread).toHaveBeenNthCalledWith(
      1,
      "thread-1",
      expect.stringContaining("Reminder"),
    )
    expect(messaging.notifyThread).toHaveBeenNthCalledWith(
      2,
      "thread-1",
      expect.stringContaining("22"),
      undefined,
    )
  })

  test("passes the forecast image through to notifyThread when available", async () => {
    jest.setSystemTime(new Date("2026-07-01T10:00:00"))

    const ride = makeRide({ date: new Date("2026-07-02T10:00:00"), reminderDaySent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const image = Buffer.from([0x89, 0x50, 0x4e, 0x47])
    const weather = {
      getWeather: mock(async () => weatherData),
      getForecastImage: mock(async () => image),
    } as unknown as WeatherService
    const service = new SchedulerService(repo, messaging, weather)

    await service.tick()

    expect(messaging.notifyThread).toHaveBeenNthCalledWith(
      2,
      "thread-1",
      expect.stringContaining("22"),
      image,
    )
  })

  test("does not send weather message when WeatherService returns null", async () => {
    jest.setSystemTime(new Date("2026-07-01T10:00:00"))

    const ride = makeRide({ date: new Date("2026-07-02T10:00:00"), reminderDaySent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging, mockWeather(null))

    await service.tick()

    expect(messaging.notifyThread).toHaveBeenCalledTimes(1)
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ reminderDaySent: true }))
  })

  test("reminder still sends and reminderDaySent is set even when WeatherService throws", async () => {
    jest.setSystemTime(new Date("2026-07-01T10:00:00"))

    const ride = makeRide({ date: new Date("2026-07-02T10:00:00"), reminderDaySent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const throwingWeather = {
      getWeather: mock(async () => {
        throw new Error("Weather API down")
      }),
    } as unknown as WeatherService
    const service = new SchedulerService(repo, messaging, throwingWeather)

    await service.tick()

    expect(messaging.notifyThread).toHaveBeenCalledTimes(1)
    expect(messaging.notifyThread).toHaveBeenCalledWith(
      "thread-1",
      expect.stringContaining("Reminder"),
    )
    expect(repo.update).toHaveBeenCalledWith(expect.objectContaining({ reminderDaySent: true }))
  })

  test("does not send weather message when no weather service is provided", async () => {
    jest.setSystemTime(new Date("2026-07-01T10:00:00"))

    const ride = makeRide({ date: new Date("2026-07-02T10:00:00"), reminderDaySent: false })
    const repo = mockRepo()
    repo.findActive = mock(async () => [ride])
    const messaging = mockMessaging()
    const service = new SchedulerService(repo, messaging)

    await service.tick()

    expect(messaging.notifyThread).toHaveBeenCalledTimes(1)
  })
})
