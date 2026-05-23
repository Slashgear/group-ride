import type { Ride } from "../../domain/ride"

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