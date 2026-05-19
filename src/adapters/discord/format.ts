import type { Ride, RideLevel } from "../../domain/ride"

const LEVEL_LABEL: Record<string, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
}

export interface SummaryFields {
  date: Date
  meetingPoint: string
  distanceKm?: number | null
  elevationGain?: number | null
  elevationLoss?: number | null
  level?: RideLevel | null
  gpxUrl?: string | null
  externalUrl?: string | null
  notes?: string | null
}

function buildSummaryLines(fields: SummaryFields): string[] {
  const lines = [
    `🚴 **Ride – ${formatDate(fields.date)}**`,
    "",
    `📍 **Meeting point:** ${fields.meetingPoint}`,
  ]
  if (fields.distanceKm != null) lines.push(`📏 **Distance:** ${fields.distanceKm} km`)
  if (fields.elevationGain != null) lines.push(`⬆️ **D+:** ${fields.elevationGain} m`)
  if (fields.elevationLoss != null) lines.push(`⬇️ **D-:** ${fields.elevationLoss} m`)
  if (fields.level) lines.push(`💪 **Level:** ${LEVEL_LABEL[fields.level]}`)
  if (fields.gpxUrl) lines.push(`🗺️ [GPX track](${fields.gpxUrl})`)
  if (fields.externalUrl) lines.push(`🔗 [View on platform](${fields.externalUrl})`)
  if (fields.notes) lines.push("", `📝 ${fields.notes}`)
  return lines
}

export function formatThreadTitle(ride: Ride): string {
  return `Ride – ${formatDate(ride.date)}`
}

export function formatAnnouncement(ride: Ride): string {
  const lines = [
    "🚴 **New ride proposed!**",
    "",
    `📅 **Date:** ${formatDate(ride.date)}`,
    `📍 **Meeting point:** ${ride.meetingPoint}`,
  ]
  if (ride.distanceKm != null) lines.push(`📏 **Distance:** ${ride.distanceKm} km`)
  if (ride.elevationGain != null) lines.push(`⬆️ **D+:** ${ride.elevationGain} m`)
  if (ride.elevationLoss != null) lines.push(`⬇️ **D-:** ${ride.elevationLoss} m`)
  if (ride.level) lines.push(`💪 **Level:** ${LEVEL_LABEL[ride.level]}`)
  if (ride.externalUrl) lines.push(`🔗 [View route](${ride.externalUrl})`)
  return lines.join("\n")
}

export function formatSummary(ride: Ride): string {
  return buildSummaryLines(ride).join("\n")
}

export function formatDraftSummary(fields: SummaryFields): string {
  return buildSummaryLines(fields).join("\n")
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}
