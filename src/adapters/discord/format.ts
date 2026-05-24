import type { Ride, RideLevel, UserId } from "../../domain/ride"

const LEVEL_LABEL: Record<string, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
}

export interface SummaryFields {
  date: Date
  meetingTime?: string | null
  meetingPoint: string
  proposerName?: string | null
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
  if (fields.meetingTime != null) lines.splice(2, 0, `🕐 **Time:** ${fields.meetingTime}`)
  if (fields.distanceKm != null) lines.push(`📏 **Distance:** ${fields.distanceKm} km`)
  if (fields.elevationGain != null) lines.push(`⬆️ **D+:** ${fields.elevationGain} m`)
  if (fields.elevationLoss != null) lines.push(`⬇️ **D-:** ${fields.elevationLoss} m`)
  if (fields.level != null) lines.push(`💪 **Level:** ${LEVEL_LABEL[fields.level]}`)
  if (fields.gpxUrl != null) lines.push(`🗺️ [GPX track](${fields.gpxUrl})`)
  if (fields.externalUrl != null) lines.push(`🔗 [View on platform](${fields.externalUrl})`)
  if (fields.notes != null) lines.push("", `📝 ${fields.notes}`)
  if (fields.proposerName != null) lines.push("", `👤 **Organised by:** ${fields.proposerName}`)
  return lines
}

export function formatThreadTitle(ride: Ride): string {
  const base = `Ride – ${formatDate(ride.date)}`
  if (ride.name == null) return base
  const full = `${base} – ${ride.name}`
  return full.length <= 100 ? full : full.slice(0, 97) + "…"
}

export function formatAnnouncement(ride: Ride): string {
  const title =
    ride.name == null
      ? `🚴 **${ride.proposerName}** is organising a ride for **${formatDate(ride.date)}**`
      : `🚴 **${ride.proposerName}** is organising a ride for **${formatDate(ride.date)}** — ${ride.name}`
  const lines = [title, ""]
  if (ride.meetingTime != null) lines.push(`🕐 **Time:** ${ride.meetingTime}`)
  lines.push(`📍 **Meeting point:** ${ride.meetingPoint}`)
  if (ride.distanceKm != null) lines.push(`📏 **Distance:** ${ride.distanceKm} km`)
  if (ride.elevationGain != null) lines.push(`⬆️ **D+:** ${ride.elevationGain} m`)
  if (ride.elevationLoss != null) lines.push(`⬇️ **D-:** ${ride.elevationLoss} m`)
  if (ride.level != null) lines.push(`💪 **Level:** ${LEVEL_LABEL[ride.level]}`)
  if (ride.externalUrl != null) lines.push(`🔗 [View route](${ride.externalUrl})`)
  return lines.join("\n")
}

export function formatSummary(ride: Ride, participants: UserId[] = []): string {
  const lines = buildSummaryLines(ride)
  lines.push("")
  if (participants.length > 0) {
    lines.push(
      `👥 **Participants (${participants.length}):** ${participants.map((id) => `<@${id}>`).join(", ")}`,
    )
  } else {
    lines.push("👥 *No participants yet*")
  }
  return lines.join("\n")
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
