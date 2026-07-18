import { describe, expect, mock, test } from "bun:test"
import { WeatherService, resolveWeatherQuery } from "../../src/services/weather.service"

function makeHourly(time: string, overrides: object = {}) {
  return {
    time,
    tempC: "18",
    weatherDesc: [{ value: "Sunny" }],
    windspeedKmph: "15",
    WindGustKmph: "22",
    winddir16Point: "NW",
    chanceofrain: "10",
    precipMM: "0.0",
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
    WindGustKmph: "30",
    winddir16Point: "SW",
    chanceofrain: "35",
    precipMM: "2.5",
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
    expect(result?.windGustKmph).toBe(30)
    expect(result?.windDirection).toBe("↗️")
    expect(result?.precipitationChancePct).toBe(35)
    expect(result?.precipitationMm).toBe(2.5)
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

describe("WeatherService.getForecastImage", () => {
  test("returns a Buffer for a successful PNG response", async () => {
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
    globalThis.fetch = mock(async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => pngBytes.buffer,
    })) as unknown as typeof fetch

    const service = new WeatherService()
    const result = await service.getForecastImage("Paris")

    expect(result).toBeInstanceOf(Buffer)
    expect(result).toEqual(Buffer.from(pngBytes))
  })

  test("requests the 2pq PNG view for the given location", async () => {
    let capturedUrl = ""
    globalThis.fetch = mock(async (url: string | URL | Request) => {
      capturedUrl = typeof url === "string" ? url : url instanceof URL ? url.href : url.url
      return { ok: true, status: 200, arrayBuffer: async () => new ArrayBuffer(0) }
    }) as unknown as typeof fetch

    const service = new WeatherService()
    await service.getForecastImage("Café du Parc")

    expect(capturedUrl).toBe("https://wttr.in/Caf%C3%A9%20du%20Parc_2pq.png")
  })

  test("returns null when HTTP response is not ok", async () => {
    globalThis.fetch = mock(async () => ({ ok: false, status: 500 })) as unknown as typeof fetch

    const service = new WeatherService()
    const result = await service.getForecastImage("Paris")

    expect(result).toBeNull()
  })

  test("returns null when fetch throws a network error", async () => {
    globalThis.fetch = mock(async () => {
      throw new Error("Network error")
    }) as unknown as typeof fetch

    const service = new WeatherService()
    const result = await service.getForecastImage("Paris")

    expect(result).toBeNull()
  })
})

describe("resolveWeatherQuery", () => {
  test("prefers GPX start coordinates when available", () => {
    const query = resolveWeatherQuery({
      startLat: 48.8566,
      startLon: 2.3522,
      weatherCity: "Lyon",
      meetingPoint: "Devant la boulangerie",
    })
    expect(query).toBe("48.8566,2.3522")
  })

  test("falls back to weatherCity when no coordinates are set", () => {
    const query = resolveWeatherQuery({
      startLat: null,
      startLon: null,
      weatherCity: "Lyon",
      meetingPoint: "Devant la boulangerie",
    })
    expect(query).toBe("Lyon")
  })

  test("falls back to meetingPoint when neither coordinates nor weatherCity are set", () => {
    const query = resolveWeatherQuery({
      startLat: null,
      startLon: null,
      weatherCity: null,
      meetingPoint: "Devant la boulangerie",
    })
    expect(query).toBe("Devant la boulangerie")
  })

  test("falls back to meetingPoint when weatherCity is blank", () => {
    const query = resolveWeatherQuery({
      startLat: null,
      startLon: null,
      weatherCity: "   ",
      meetingPoint: "Devant la boulangerie",
    })
    expect(query).toBe("Devant la boulangerie")
  })

  test("ignores weatherCity when only one coordinate is set", () => {
    const query = resolveWeatherQuery({
      startLat: 48.8566,
      startLon: null,
      weatherCity: "Lyon",
      meetingPoint: "Devant la boulangerie",
    })
    expect(query).toBe("Lyon")
  })
})
