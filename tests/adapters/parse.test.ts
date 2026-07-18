import { describe, expect, test } from "bun:test"
import type { Ride } from "../../src/domain/ride"
import {
  formatDateTimeValue,
  formatStatsValue,
  parseDateAndTime,
  parseStats,
  parseWeatherArgs,
} from "../../src/adapters/messaging/shared/parse"

function makeRide(overrides: Partial<Ride> = {}): Ride {
  return {
    id: "ride-1",
    threadId: "thread-1",
    proposerId: "123",
    proposerName: "Test User",
    date: new Date(2026, 5, 15),
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

describe("parseDateAndTime", () => {
  test("parses a valid date DD/MM/YYYY", () => {
    const result = parseDateAndTime("15/06/2026")
    expect(result).not.toBeNull()
    expect(result?.date).toEqual(new Date(2026, 5, 15))
    expect(result?.meetingTime).toBeUndefined()
  })

  test("parses a valid date with time HH:MM", () => {
    const result = parseDateAndTime("15/06/2026 08:30")
    expect(result).not.toBeNull()
    expect(result?.date).toEqual(new Date(2026, 5, 15))
    expect(result?.meetingTime).toBe("08:30")
  })

  test("returns null for invalid format (not enough parts)", () => {
    const result = parseDateAndTime("15/06")
    expect(result).toBeNull()
  })

  test("returns null for invalid time format", () => {
    const result = parseDateAndTime("15/06/2026 8h30")
    expect(result).toBeNull()
  })

  test("returns null for non-numeric date parts", () => {
    const result = parseDateAndTime("aa/bb/cccc")
    expect(result).toBeNull()
  })
})

describe("parseWeatherArgs", () => {
  test("returns empty object for empty string", () => {
    expect(parseWeatherArgs("")).toEqual({})
    expect(parseWeatherArgs("   ")).toEqual({})
  })

  test("parses location only", () => {
    expect(parseWeatherArgs("Paris, France")).toEqual({ location: "Paris, France" })
  })

  test("parses date only", () => {
    const result = parseWeatherArgs("15/06/2026")
    expect(result?.date).toEqual(new Date(2026, 5, 15))
    expect(result?.meetingTime).toBeUndefined()
    expect(result?.location).toBeUndefined()
  })

  test("parses date and time only", () => {
    const result = parseWeatherArgs("15/06/2026 08:30")
    expect(result?.date).toEqual(new Date(2026, 5, 15))
    expect(result?.meetingTime).toBe("08:30")
    expect(result?.location).toBeUndefined()
  })

  test("parses date and location", () => {
    const result = parseWeatherArgs("15/06/2026 Place de la République")
    expect(result?.date).toEqual(new Date(2026, 5, 15))
    expect(result?.meetingTime).toBeUndefined()
    expect(result?.location).toBe("Place de la République")
  })

  test("parses date, time, and location", () => {
    const result = parseWeatherArgs("15/06/2026 08:30 Place de la République")
    expect(result?.date).toEqual(new Date(2026, 5, 15))
    expect(result?.meetingTime).toBe("08:30")
    expect(result?.location).toBe("Place de la République")
  })

  test("treats a non-date-shaped leading token as part of the location", () => {
    expect(parseWeatherArgs("15/06 Paris")).toEqual({ location: "15/06 Paris" })
  })
})

describe("parseStats", () => {
  test("returns empty object for empty string", () => {
    const result = parseStats("")
    expect(result).toEqual({})
  })

  test("parses distance only", () => {
    const result = parseStats("80")
    expect(result).toEqual({ distanceKm: 80, elevationGain: undefined, elevationLoss: undefined })
  })

  test("parses distance and elevation gain", () => {
    const result = parseStats("80 / 1200")
    expect(result).toEqual({ distanceKm: 80, elevationGain: 1200, elevationLoss: undefined })
  })

  test("parses distance, elevation gain and loss", () => {
    const result = parseStats("80 / 1200 / 950")
    expect(result).toEqual({ distanceKm: 80, elevationGain: 1200, elevationLoss: 950 })
  })

  test("returns undefined for non-numeric values", () => {
    const result = parseStats("abc / def / ghi")
    expect(result).toEqual({
      distanceKm: undefined,
      elevationGain: undefined,
      elevationLoss: undefined,
    })
  })

  test("parses decimal distance", () => {
    const result = parseStats("42.5")
    expect(result).toEqual({ distanceKm: 42.5, elevationGain: undefined, elevationLoss: undefined })
  })
})

describe("formatDateTimeValue", () => {
  test("formats date without meetingTime", () => {
    const ride = makeRide({ date: new Date(2026, 5, 15), meetingTime: null })
    expect(formatDateTimeValue(ride)).toBe("15/06/2026")
  })

  test("formats date with meetingTime", () => {
    const ride = makeRide({ date: new Date(2026, 5, 15), meetingTime: "08:30" })
    expect(formatDateTimeValue(ride)).toBe("15/06/2026 08:30")
  })

  test("pads single-digit day and month", () => {
    const ride = makeRide({ date: new Date(2026, 0, 5), meetingTime: null })
    expect(formatDateTimeValue(ride)).toBe("05/01/2026")
  })
})

describe("formatStatsValue", () => {
  test("formats all values present", () => {
    const ride = makeRide({ distanceKm: 80, elevationGain: 1200, elevationLoss: 950 })
    expect(formatStatsValue(ride)).toBe("80 / 1200 / 950")
  })

  test("trims trailing nulls (distance only)", () => {
    const ride = makeRide({ distanceKm: 80, elevationGain: null, elevationLoss: null })
    expect(formatStatsValue(ride)).toBe("80")
  })

  test("trims trailing nulls (distance + gain)", () => {
    const ride = makeRide({ distanceKm: 80, elevationGain: 1200, elevationLoss: null })
    expect(formatStatsValue(ride)).toBe("80 / 1200")
  })

  test("returns empty string when all values are null", () => {
    const ride = makeRide({ distanceKm: null, elevationGain: null, elevationLoss: null })
    expect(formatStatsValue(ride)).toBe("")
  })

  test("includes middle null as empty slot when trailing value is present", () => {
    const ride = makeRide({ distanceKm: 80, elevationGain: null, elevationLoss: 950 })
    expect(formatStatsValue(ride)).toBe("80 /  / 950")
  })
})
