import { describe, expect, test } from "bun:test"
import { ExtractionFailedError } from "../../../src/services/importer/errors"
import { importFromGarmin } from "../../../src/services/importer/garmin"

describe("importFromGarmin", () => {
  test("returns canonical externalUrl from a valid course URL", async () => {
    const result = await importFromGarmin("https://connect.garmin.com/course/123456")
    expect(result).toEqual({ externalUrl: "https://connect.garmin.com/app/course/123456" })
  })

  test("ignores extra path segments and returns canonical URL", async () => {
    const result = await importFromGarmin("https://connect.garmin.com/course/789012?ref=something")
    expect(result).toEqual({ externalUrl: "https://connect.garmin.com/app/course/789012" })
  })

  test("throws ExtractionFailedError when course ID cannot be extracted", async () => {
    let error: unknown
    try {
      await importFromGarmin("https://connect.garmin.com/modern/activity/123456")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(ExtractionFailedError)
  })

  test("throws ExtractionFailedError for a URL without numeric course ID", async () => {
    let error: unknown
    try {
      await importFromGarmin("https://connect.garmin.com/course/")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(ExtractionFailedError)
  })
})
