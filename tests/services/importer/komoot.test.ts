import { describe, expect, mock, test } from "bun:test"
import { ExtractionFailedError } from "../../../src/services/importer/errors"
import { importFromKomoot } from "../../../src/services/importer/komoot"

function mockFetch(status: number, body: unknown): typeof fetch {
  return mock(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch
}

describe("importFromKomoot", () => {
  test("returns ride data for a well-formed public tour", async () => {
    const tourPayload = {
      name: "Col de la Colombière",
      distance: 80_500,
      elevation_up: 1800,
      elevation_down: 1750,
      difficulty: { grade: "difficult" },
      sport: "touringbicycle",
    }
    globalThis.fetch = mockFetch(200, tourPayload)

    const result = await importFromKomoot("https://www.komoot.com/tour/123456")

    expect(result.name).toBe("Col de la Colombière")
    expect(result.distanceKm).toBe(80.5)
    expect(result.elevationGain).toBe(1800)
    expect(result.elevationLoss).toBe(1750)
    expect(result.level).toBe("hard")
    expect(result.externalUrl).toBe("https://www.komoot.com/tour/123456")
  })

  test("maps 'easy' difficulty to easy level", async () => {
    globalThis.fetch = mockFetch(200, {
      name: "Easy ride",
      distance: 30_000,
      elevation_up: 200,
      elevation_down: 200,
      difficulty: { grade: "easy" },
      sport: "touringbicycle",
    })

    const result = await importFromKomoot("https://www.komoot.com/tour/111")
    expect(result.level).toBe("easy")
  })

  test("maps 'moderate' difficulty to moderate level", async () => {
    globalThis.fetch = mockFetch(200, {
      name: "Medium ride",
      distance: 50_000,
      elevation_up: 600,
      elevation_down: 600,
      difficulty: { grade: "moderate" },
      sport: "touringbicycle",
    })

    const result = await importFromKomoot("https://www.komoot.com/tour/222")
    expect(result.level).toBe("moderate")
  })

  test("maps null difficulty to undefined level", async () => {
    globalThis.fetch = mockFetch(200, {
      name: "No difficulty",
      distance: 40_000,
      elevation_up: 400,
      elevation_down: 400,
      difficulty: null,
      sport: "touringbicycle",
    })

    const result = await importFromKomoot("https://www.komoot.com/tour/333")
    expect(result.level).toBeUndefined()
  })

  test("passes share_token in API request when present in URL", async () => {
    const fetchMock = mockFetch(200, {
      name: "Shared tour",
      distance: 60_000,
      elevation_up: 800,
      elevation_down: 800,
      difficulty: { grade: "easy" },
      sport: "touringbicycle",
    })
    globalThis.fetch = fetchMock

    await importFromKomoot("https://www.komoot.com/tour/999?share_token=abc123")

    const calledUrl = (fetchMock as unknown as ReturnType<typeof mock>).mock.calls[0]?.[0] as URL
    expect(calledUrl.searchParams.get("share_token")).toBe("abc123")
  })

  test("throws ExtractionFailedError when URL has no tour ID", async () => {
    let error: unknown
    try {
      await importFromKomoot("https://www.komoot.com/discover")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(ExtractionFailedError)
  })

  test("throws ExtractionFailedError when API returns 401 (private tour)", async () => {
    globalThis.fetch = mockFetch(401, {})

    let error: unknown
    try {
      await importFromKomoot("https://www.komoot.com/tour/123456")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(ExtractionFailedError)
  })

  test("throws ExtractionFailedError when API returns 403 (forbidden)", async () => {
    globalThis.fetch = mockFetch(403, {})

    let error: unknown
    try {
      await importFromKomoot("https://www.komoot.com/tour/123456")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(ExtractionFailedError)
  })

  test("throws ExtractionFailedError when API returns non-ok status", async () => {
    globalThis.fetch = mockFetch(500, {})

    let error: unknown
    try {
      await importFromKomoot("https://www.komoot.com/tour/123456")
    } catch (err) {
      error = err
    }
    expect(error).toBeInstanceOf(ExtractionFailedError)
  })
})
