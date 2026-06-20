import type { Ride } from "../domain/ride"

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function formatDateLocal(date: Date): string {
  return String(date.getFullYear()) + pad2(date.getMonth() + 1) + pad2(date.getDate())
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(":")
  return { hours: Number(parts[0]), minutes: Number(parts[1]) }
}

function formatDateTimeLocal(date: Date, timeStr: string): string {
  const { hours, minutes } = parseTime(timeStr)
  return (
    String(date.getFullYear()) +
    pad2(date.getMonth() + 1) +
    pad2(date.getDate()) +
    "T" +
    pad2(hours) +
    pad2(minutes) +
    "00"
  )
}

function formatDateTimeUtc(date: Date): string {
  return (
    String(date.getUTCFullYear()) +
    pad2(date.getUTCMonth() + 1) +
    pad2(date.getUTCDate()) +
    "T" +
    pad2(date.getUTCHours()) +
    pad2(date.getUTCMinutes()) +
    pad2(date.getUTCSeconds()) +
    "Z"
  )
}

function formatDateDisplay(date: Date): string {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

function escapeIcs(value: string): string {
  return value
    .replace(/\\/gu, "\\\\")
    .replace(/;/gu, "\\;")
    .replace(/,/gu, "\\,")
    .replace(/\n/gu, "\\n")
}

function nextDay(date: Date): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  return next
}

function addHoursToTime(date: Date, hoursToAdd: number, timeStr: string): string {
  const { hours, minutes } = parseTime(timeStr)
  const result = new Date(date)
  result.setHours(hours + hoursToAdd, minutes, 0, 0)
  return (
    String(result.getFullYear()) +
    pad2(result.getMonth() + 1) +
    pad2(result.getDate()) +
    "T" +
    pad2(result.getHours()) +
    pad2(result.getMinutes()) +
    "00"
  )
}

export function generateIcal(ride: Ride): Buffer {
  const lines: string[] = []

  const dtstart =
    ride.meetingTime == null
      ? `DTSTART;VALUE=DATE:${formatDateLocal(ride.date)}`
      : `DTSTART:${formatDateTimeLocal(ride.date, ride.meetingTime)}`

  const dtend =
    ride.meetingTime == null
      ? `DTEND;VALUE=DATE:${formatDateLocal(nextDay(ride.date))}`
      : `DTEND:${addHoursToTime(ride.date, 3, ride.meetingTime)}`

  const summaryParts = [`Group Ride – ${formatDateDisplay(ride.date)}`]
  if (ride.name != null) summaryParts.push(ride.name)
  const summary = summaryParts.join(" – ")

  const descParts: string[] = []
  if (ride.distanceKm != null) descParts.push(`Distance: ${ride.distanceKm} km`)
  if (ride.elevationGain != null) descParts.push(`D+: ${ride.elevationGain} m`)
  if (ride.elevationLoss != null) descParts.push(`D-: ${ride.elevationLoss} m`)
  const description = escapeIcs(descParts.join(", "))

  lines.push("BEGIN:VCALENDAR")
  lines.push("VERSION:2.0")
  lines.push("PRODID:-//group-ride//group-ride//EN")
  lines.push("CALSCALE:GREGORIAN")
  lines.push("BEGIN:VEVENT")
  lines.push(`UID:${ride.id}@group-ride`)
  lines.push(`DTSTAMP:${formatDateTimeUtc(new Date())}`)
  lines.push(dtstart)
  lines.push(dtend)
  lines.push(`SUMMARY:${escapeIcs(summary)}`)
  lines.push(`LOCATION:${escapeIcs(ride.meetingPoint)}`)
  if (description.length > 0) lines.push(`DESCRIPTION:${description}`)
  lines.push("END:VEVENT")
  lines.push("END:VCALENDAR")

  return Buffer.from(lines.join("\r\n") + "\r\n", "utf-8")
}
