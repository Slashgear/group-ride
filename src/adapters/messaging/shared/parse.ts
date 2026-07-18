import type { Ride } from "../../../domain/ride"

export function parseDateAndTime(text: string): { date: Date; meetingTime?: string } | null {
  const [datePart, timePart] = text.trim().split(/\s+/u, 2) as [string, string | undefined]
  const pieces = datePart.split("/").map(Number)
  if (pieces.length !== 3) return null
  const [day, month, year] = pieces as [number, number, number]
  const date = new Date(year, month - 1, day)
  if (isNaN(date.getTime())) return null
  if (timePart !== undefined && !/^\d{2}:\d{2}$/u.test(timePart)) return null
  return { date, meetingTime: timePart }
}

/**
 * Parses free-text `/weather` args of the form "[DD/MM/YYYY [HH:MM]] [location]".
 * The date, if present, must come first; anything after it (past an optional time) is
 * treated as the location. Returns null only when a date-shaped leading token is invalid.
 */
export function parseWeatherArgs(text: string): {
  date?: Date
  meetingTime?: string
  location?: string
} {
  const trimmed = text.trim()
  if (trimmed === "") return {}
  const tokens = trimmed.split(/\s+/u)
  const dateToken = tokens[0] as string
  if (!/^\d{2}\/\d{2}\/\d{4}$/u.test(dateToken)) return { location: trimmed }

  const pieces = dateToken.split("/").map(Number)
  const [day, month, year] = pieces as [number, number, number]
  const date = new Date(year, month - 1, day)

  let rest = tokens.slice(1)
  let meetingTime: string | undefined
  if (rest[0] != null && /^\d{2}:\d{2}$/u.test(rest[0])) {
    meetingTime = rest[0]
    rest = rest.slice(1)
  }
  const location = rest.join(" ").trim()
  return { date, meetingTime, location: location === "" ? undefined : location }
}

export function parseStats(text: string): {
  distanceKm?: number
  elevationGain?: number
  elevationLoss?: number
} {
  if (text === "") return {}
  const parts = text.split("/").map((s) => s.trim())
  const n = (s: string | undefined) => {
    if (s == null || s === "") return undefined
    const v = parseFloat(s)
    return isNaN(v) ? undefined : v
  }
  return { distanceKm: n(parts[0]), elevationGain: n(parts[1]), elevationLoss: n(parts[2]) }
}

export function formatDateTimeValue(ride: Ride): string {
  const d = ride.date
  const raw = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  return ride.meetingTime == null ? raw : `${raw} ${ride.meetingTime}`
}

export function formatStatsValue(ride: Ride): string {
  const parts = [ride.distanceKm, ride.elevationGain, ride.elevationLoss].map((v) =>
    v == null ? "" : String(v),
  )
  while (parts.length > 0 && parts[parts.length - 1] === "") parts.pop()
  return parts.join(" / ")
}
