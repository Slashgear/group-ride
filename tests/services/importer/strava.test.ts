import { describe, expect, test } from "bun:test"
import { ExtractionFailedError } from "../../../src/services/importer/errors"
import { importFromStrava } from "../../../src/services/importer/strava"

describe("importFromStrava", () => {
  test("returns canonical externalUrl from a valid activity URL", async () => {
    const result = await importFromStrava("https://www.strava.com/activities/123456789")
    expect(result).toEqual({ externalUrl: "https://www.strava.com/activities/123456789" })
  })

  test("ignores extra query params and returns canonical URL", async () => {
    const result = await importFromStrava(
      "https://www.strava.com/activities/987654321?utm_source=share",
    )
    expect(result).toEqual({ externalUrl: "https://www.strava.com/activities/987654321" })
  })

  test("throws ExtractionFailedError when activity ID cannot be extracted", async () => {
    let error: unknown
    try {
      await importFromStrava("https://www.strava.com/dashboard")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(ExtractionFailedError)
  })

  test("throws ExtractionFailedError for a URL without numeric activity ID", async () => {
    let error: unknown
    try {
      await importFromStrava("https://www.strava.com/activities/")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(ExtractionFailedError)
  })
})
