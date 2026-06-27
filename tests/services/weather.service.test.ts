import { describe, expect, mock, test } from "bun:test"
import { WeatherService } from "../../src/services/weather.service"

function makeHourly(time: string, overrides: object = {}) {
  return {
    time,
    tempC: "18",
    weatherDesc: [{ value: "Sunny" }],
    windspeedKmph: "15",
    chanceofrain: "10",
    ...overrides,
  }
}

const HOURLY = [
  makeHourly("0", { weatherDesc: [{ value: "Clear" }], windspeedKmph: "5", chanceofrain: "2" }),
  makeHourly("300", {
    weatherDesc: [{ value: "Partly cloudy" }],
    windspeedKmph: "8",
    chanceofrain: "5",
  }),
  makeHourly("600", { weatherDesc: [{ value: "Sunny" }], windspeedKmph: "10", chanceofrain: "3" }),
  makeHourly("900", {
    weatherDesc: [{ value: "Light cloud" }],
    windspeedKmph: "12",
    chanceofrain: "8",
  }),
  makeHourly("1200", {
    weatherDesc: [{ value: "Overcast" }],
    windspeedKmph: "20",
    chanceofrain: "35",
  }),
  makeHourly("1500", {
    weatherDesc: [{ value: "Sunny" }],
    windspeedKmph: "18",
    chanceofrain: "15",
  }),
  makeHourly("1800", { weatherDesc: [{ value: "Clear" }], windspeedKmph: "12", chanceofrain: "5" }),
  makeHourly("2100", { weatherDesc: [{ value: "Clear" }], windspeedKmph: "8", chanceofrain: "2" }),
]

const WTTR_FIXTURE = {
  weather: [
    {
      date: "2026-07-01",
      maxtempC: "22",
      mintempC: "14",
      hourly: HOURLY,
    },
    {
      date: "2026-07-02",
      maxtempC: "25",
      mintempC: "16",
      hourly: HOURLY,
    },
    {
      date: "2026-07-03",
      maxtempC: "20",
      mintempC: "13",
      hourly: HOURLY,
    },
  ],
}

function mockFetch(status: number, body: unknown): typeof fetch {
  return mock(async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })) as unknown as typeof fetch
}

describe("WeatherService.getWeather", () => {
  test("returns WeatherData for a valid date, no meetingTime (noon slot)", async () => {
    globalThis.fetch = mockFetch(200, WTTR_FIXTURE)

    const service = new WeatherService()
    const result = await service.getWeather("Paris", new Date("2026-07-02T00:00:00"))

    // No meetingTime → picks noon (1200) slot
    expect(result).not.toBeNull()
    expect(result?.tempMinC).toBe(16)
    expect(result?.tempMaxC).toBe(25)
    expect(result?.description).toBe("Overcast")
    expect(result?.windSpeedKmph).toBe(20)
    expect(result?.precipitationChancePct).toBe(35)
  })

  test("picks the closest hourly slot to meetingTime", async () => {
    globalThis.fetch = mockFetch(200, WTTR_FIXTURE)

    const service = new WeatherService()
    // meetingTime "09:00" → 540 min → closest is "900" (540 min exactly)
    const result = await service.getWeather("Paris", new Date("2026-07-02T00:00:00"), "09:00")

    expect(result).not.toBeNull()
    expect(result?.description).toBe("Light cloud")
    expect(result?.windSpeedKmph).toBe(12)
    expect(result?.precipitationChancePct).toBe(8)
  })

  test("picks nearest slot when meetingTime falls between two slots", async () => {
    globalThis.fetch = mockFetch(200, WTTR_FIXTURE)

    const service = new WeatherService()
    const result = await service.getWeather("Paris", new Date("2026-07-02T00:00:00"), "07:30")

    // meetingTime "07:30" is equidistant between "600" and "900" slots → first one wins
    expect(result).not.toBeNull()
    expect(result?.description).toBe("Sunny")
  })

  test("returns null when HTTP response is not ok", async () => {
    globalThis.fetch = mockFetch(500, {})

    const service = new WeatherService()
    const result = await service.getWeather("Paris", new Date("2026-07-02T00:00:00"))

    expect(result).toBeNull()
  })

  test("returns null when fetch throws a network error", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("Network error")
    }) as unknown as typeof fetch

    const service = new WeatherService()
    const result = await service.getWeather("Paris", new Date("2026-07-02T00:00:00"))

    expect(result).toBeNull()
  })

  test("returns null when target date is not in the response", async () => {
    globalThis.fetch = mockFetch(200, WTTR_FIXTURE)

    const service = new WeatherService()
    // 2026-07-10 is not in the 3-day fixture
    const result = await service.getWeather("Paris", new Date("2026-07-10T00:00:00"))

    expect(result).toBeNull()
  })

  test("returns null when weather array is missing", async () => {
    globalThis.fetch = mockFetch(200, { current_condition: [] })

    const service = new WeatherService()
    const result = await service.getWeather("Paris", new Date("2026-07-02T00:00:00"))

    expect(result).toBeNull()
  })

  test("encodes special characters in location name", async () => {
    let capturedUrl = ""
    globalThis.fetch = mock(async (url: string | URL | Request) => {
      capturedUrl = typeof url === "string" ? url : url instanceof URL ? url.href : url.url
      return {
        ok: true,
        status: 200,
        json: async () => WTTR_FIXTURE,
      }
    }) as unknown as typeof fetch

    const service = new WeatherService()
    await service.getWeather("Café du Parc", new Date("2026-07-02T00:00:00"))

    expect(capturedUrl).toContain("Caf%C3%A9%20du%20Parc")
  })
})
