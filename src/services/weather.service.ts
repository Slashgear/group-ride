import type { Ride } from "../domain/ride"
import { logger } from "../logger"

const log = logger.child({ module: "weather" })

/**
 * The free-text meeting point is often not a real, geocodable address (e.g. "in front of the
 * bakery"), so wttr.in resolution for it can be unreliable. Prefer the imported GPX track's
 * start coordinates, then an explicit weather city, and only fall back to the meeting point text.
 */
export function resolveWeatherQuery(
  ride: Pick<Ride, "startLat" | "startLon" | "weatherCity" | "meetingPoint">,
): string {
  if (ride.startLat != null && ride.startLon != null) return `${ride.startLat},${ride.startLon}`
  if (ride.weatherCity != null && ride.weatherCity.trim() !== "") return ride.weatherCity
  return ride.meetingPoint
}

export interface WeatherData {
  tempMinC: number
  tempMaxC: number
  description: string
  windSpeedKmph: number
  windGustKmph: number
  windDirection: string
  precipitationChancePct: number
  precipitationMm: number
}

interface WttrHourly {
  time: string
  tempC: string
  weatherDesc: Array<{ value: string }>
  windspeedKmph: string
  WindGustKmph: string
  winddir16Point: string
  chanceofrain: string
  precipMM: string
}

// wttr.in's winddir16Point is the direction the wind blows FROM (met. convention), but the
// arrow should show where it's blowing TO, so each compass point maps to the opposite glyph
// (verified against wttr.in's own PNG rendering: N → ↓, S → ↑, SSE → ↖, NNE → ↓).
// Unicode only has 8 arrow glyphs, so adjacent 16-point compass values share one.
const COMPASS_ARROWS: Record<string, string> = {
  N: "⬇️",
  NNE: "⬇️",
  NE: "↙️",
  ENE: "↙️",
  E: "⬅️",
  ESE: "⬅️",
  SE: "↖️",
  SSE: "↖️",
  S: "⬆️",
  SSW: "⬆️",
  SW: "↗️",
  WSW: "↗️",
  W: "➡️",
  WNW: "➡️",
  NW: "↘️",
  NNW: "↘️",
}

function compassToArrow(point: string): string {
  return COMPASS_ARROWS[point] ?? point
}

interface WttrDay {
  date: string
  maxtempC: string
  mintempC: string
  hourly: WttrHourly[]
}

interface WttrJ1Response {
  weather: WttrDay[]
}

export class WeatherService {
  async getWeather(
    location: string,
    date: Date,
    meetingTime?: string,
  ): Promise<WeatherData | null> {
    const res = await fetchWithTimeout(`https://wttr.in/${encodeURIComponent(location)}?format=j1`)
    if (res == null) return null
    try {
      if (!res.ok) {
        log.warn({ status: res.status, location }, "wttr.in returned non-ok status")
        return null
      }
      const data = (await res.json()) as WttrJ1Response
      const targetDate = formatDateYYYYMMDD(date)
      const day = data.weather.find((d) => d.date === targetDate)
      if (day == null) {
        log.warn({ targetDate, location }, "wttr.in response did not include target date")
        return null
      }
      const hourly = pickHourly(day.hourly, meetingTime)
      if (hourly == null) {
        log.warn({ location }, "wttr.in response had no hourly data")
        return null
      }
      return {
        tempMinC: parseInt(day.mintempC, 10),
        tempMaxC: parseInt(day.maxtempC, 10),
        description: hourly.weatherDesc[0]?.value ?? "N/A",
        windSpeedKmph: parseInt(hourly.windspeedKmph, 10),
        windGustKmph: parseInt(hourly.WindGustKmph, 10),
        windDirection: compassToArrow(hourly.winddir16Point),
        precipitationChancePct: parseInt(hourly.chanceofrain, 10),
        precipitationMm: parseFloat(hourly.precipMM),
      }
    } catch (err) {
      log.warn({ err, location }, "Weather fetch failed")
      return null
    }
  }

  /** Renders a compact forecast panel (current + today + tomorrow) as a PNG. */
  async getForecastImage(location: string): Promise<Buffer | null> {
    const res = await fetchWithTimeout(`https://wttr.in/${encodeURIComponent(location)}_2pq.png`)
    if (res == null) return null
    try {
      if (!res.ok) {
        log.warn({ status: res.status, location }, "wttr.in PNG returned non-ok status")
        return null
      }
      return Buffer.from(await res.arrayBuffer())
    } catch (err) {
      log.warn({ err, location }, "Weather image fetch failed")
      return null
    }
  }
}

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => {
    controller.abort()
  }, 8_000)
  try {
    return await fetch(url, { signal: controller.signal })
  } catch (err) {
    log.warn({ err, url }, "Weather fetch failed")
    return null
  } finally {
    clearTimeout(timeout)
  }
}

function formatDateYYYYMMDD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// wttr.in time field: "900" = 09:00 → convert to minutes-from-midnight
function timeFieldToMinutes(time: string): number {
  const n = parseInt(time, 10)
  return Math.floor(n / 100) * 60 + (n % 100)
}

function meetingTimeToMinutes(meetingTime: string): number {
  const parts = meetingTime.split(":")
  return Number(parts[0]) * 60 + Number(parts[1] ?? "0")
}

function pickHourly(hourly: WttrHourly[], meetingTime?: string): WttrHourly | null {
  if (hourly.length === 0) return null
  const targetMinutes = meetingTime == null ? 12 * 60 : meetingTimeToMinutes(meetingTime)
  let best: WttrHourly | null = null
  let bestDiff = Infinity
  for (const slot of hourly) {
    const diff = Math.abs(timeFieldToMinutes(slot.time) - targetMinutes)
    if (diff < bestDiff) {
      bestDiff = diff
      best = slot
    }
  }
  return best
}
