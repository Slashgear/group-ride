import { describe, expect, mock, test } from "bun:test"
import {
  ExtractionFailedError,
  UnsupportedPlatformError,
} from "../../../src/services/importer/errors"

// Mock fetch globally before importing the module under test so that
// komoot (the only HTTP-calling importer) does not hit the network.
globalThis.fetch = mock(async () => ({
  ok: true,
  status: 200,
  json: async () => ({
    name: "Test Tour",
    distance: 50_000,
    elevation_up: 500,
    elevation_down: 500,
    difficulty: null,
    sport: "touringbicycle",
  }),
})) as unknown as typeof fetch

const { importFromUrl } = await import("../../../src/services/importer/index")

describe("importFromUrl", () => {
  test("routes komoot.com URLs to the Komoot importer", async () => {
    const result = await importFromUrl("https://www.komoot.com/tour/123456")
    // Komoot importer returns these fields from the API response
    expect(result.externalUrl).toBe("https://www.komoot.com/tour/123456")
    expect(result.name).toBe("Test Tour")
  })

  test("routes strava.com URLs to the Strava importer", async () => {
    const result = await importFromUrl("https://www.strava.com/activities/123456")
    expect(result.externalUrl).toBe("https://www.strava.com/activities/123456")
  })

  test("routes garmin.com URLs to the Garmin importer", async () => {
    const result = await importFromUrl("https://connect.garmin.com/course/123456")
    expect(result.externalUrl).toBe("https://connect.garmin.com/app/course/123456")
  })

  test("throws UnsupportedPlatformError for unknown hostname", async () => {
    let error: unknown
    try {
      await importFromUrl("https://www.unknown-platform.com/route/123")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(UnsupportedPlatformError)
  })

  test("propagates ExtractionFailedError from sub-importer (invalid strava URL)", async () => {
    let error: unknown
    try {
      await importFromUrl("https://www.strava.com/dashboard")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(ExtractionFailedError)
  })
})
