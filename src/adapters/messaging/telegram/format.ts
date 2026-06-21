import type { Ride, RideLevel, UserId } from "../../../domain/ride"

const LEVEL_LABEL: Record<string, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
}

export interface SummaryFields {
  date: Date
  meetingTime?: string | null
  meetingPoint: string
  name?: string | null
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
  const title =
    fields.name == null
      ? `🚴 <b>Ride – ${formatDate(fields.date)}</b>`
      : `🚴 <b>Ride – ${formatDate(fields.date)} — ${esc(fields.name)}</b>`
  const lines = [title, ""]
  if (fields.meetingTime != null) lines.push(`🕐 <b>Time:</b> ${fields.meetingTime}`)
  lines.push(`📍 <b>Meeting point:</b> ${esc(fields.meetingPoint)}`)
  if (fields.distanceKm != null) lines.push(`📏 <b>Distance:</b> ${fields.distanceKm} km`)
  if (fields.elevationGain != null) lines.push(`⬆️ <b>D+:</b> ${fields.elevationGain} m`)
  if (fields.elevationLoss != null) lines.push(`⬇️ <b>D-:</b> ${fields.elevationLoss} m`)
  if (fields.level != null) lines.push(`💪 <b>Level:</b> ${LEVEL_LABEL[fields.level]}`)
  if (fields.gpxUrl != null) lines.push(`🗺️ <a href="${fields.gpxUrl}">GPX track</a>`)
  if (fields.externalUrl != null)
    lines.push(`🔗 <a href="${fields.externalUrl}">View on platform</a>`)
  if (fields.notes != null) lines.push("", `📝 ${esc(fields.notes)}`)
  if (fields.proposerName != null)
    lines.push("", `👤 <b>Organised by:</b> ${esc(fields.proposerName)}`)
  return lines
}

export function formatTopicTitle(ride: Ride): string {
  const base = `Ride – ${formatDate(ride.date)}`
  return ride.name == null ? base : `${base} – ${ride.name}`
}

export function formatAnnouncement(ride: Ride): string {
  const title =
    ride.name == null
      ? `🚴 <b>${esc(ride.proposerName)}</b> is organising a ride for <b>${formatDate(ride.date)}</b>`
      : `🚴 <b>${esc(ride.proposerName)}</b> is organising a ride for <b>${formatDate(ride.date)}</b> — ${esc(ride.name)}`
  const lines = [title, ""]
  if (ride.meetingTime != null) lines.push(`🕐 <b>Time:</b> ${ride.meetingTime}`)
  lines.push(`📍 <b>Meeting point:</b> ${esc(ride.meetingPoint)}`)
  if (ride.distanceKm != null) lines.push(`📏 <b>Distance:</b> ${ride.distanceKm} km`)
  if (ride.elevationGain != null) lines.push(`⬆️ <b>D+:</b> ${ride.elevationGain} m`)
  if (ride.elevationLoss != null) lines.push(`⬇️ <b>D-:</b> ${ride.elevationLoss} m`)
  if (ride.level != null) lines.push(`💪 <b>Level:</b> ${LEVEL_LABEL[ride.level]}`)
  if (ride.externalUrl != null) lines.push(`🔗 <a href="${ride.externalUrl}">View route</a>`)
  return lines.join("\n")
}

export function formatSummary(
  ride: Ride,
  participants: UserId[] = [],
  waitlist: UserId[] = [],
): string {
  const lines = buildSummaryLines(ride)
  lines.push("")
  const cap = ride.maxParticipants
  if (participants.length === 0) {
    const capLabel = cap == null ? "" : ` (cap: ${cap})`
    lines.push(`👥 <i>No participants yet</i>${capLabel}`)
  } else {
    const countLabel = cap == null ? `${participants.length}` : `${participants.length}/${cap}`
    lines.push(
      `👥 <b>Participants (${countLabel}):</b> ${participants.map((id) => `<a href="tg://user?id=${id}">rider</a>`).join(", ")}`,
    )
  }
  if (waitlist.length > 0) {
    lines.push(
      `⏳ <b>Waitlist (${waitlist.length}):</b> ${waitlist.map((id) => `<a href="tg://user?id=${id}">rider</a>`).join(", ")}`,
    )
  }
  return lines.join("\n")
}

export function formatDraftSummary(fields: SummaryFields): string {
  return buildSummaryLines(fields).join("\n")
}

export function topicLink(groupChatId: number, threadId: string): string {
  const internalId = String(groupChatId).replace(/-100/u, "")
  return `https://t.me/c/${internalId}/${threadId}`
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function esc(text: string): string {
  return text.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;")
}
