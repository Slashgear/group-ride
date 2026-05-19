import type { RideLevel } from "../../domain/ride"
import type { Ride } from "../../domain/ride"

const LEVEL_LABEL: Record<string, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
}

interface SummaryFields {
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
    `🚴 <b>Ride – ${formatDate(fields.date)}</b>`,
    "",
    `📍 <b>Meeting point:</b> ${escape(fields.meetingPoint)}`,
  ]
  if (fields.distanceKm != null) lines.push(`📏 <b>Distance:</b> ${fields.distanceKm} km`)
  if (fields.elevationGain != null) lines.push(`⬆️ <b>D+:</b> ${fields.elevationGain} m`)
  if (fields.elevationLoss != null) lines.push(`⬇️ <b>D-:</b> ${fields.elevationLoss} m`)
  if (fields.level) lines.push(`💪 <b>Level:</b> ${LEVEL_LABEL[fields.level]}`)
  if (fields.gpxUrl) lines.push(`🗺️ <a href="${fields.gpxUrl}">GPX track</a>`)
  if (fields.externalUrl) lines.push(`🔗 <a href="${fields.externalUrl}">View on platform</a>`)
  if (fields.notes) lines.push("", `📝 ${escape(fields.notes)}`)
  return lines
}

export function formatTopicTitle(ride: Ride): string {
  return `Ride – ${formatDate(ride.date)}`
}

export function formatAnnouncement(ride: Ride): string {
  const lines = [
    "🚴 <b>New ride proposed!</b>",
    "",
    `📅 <b>Date:</b> ${formatDate(ride.date)}`,
    `📍 <b>Meeting point:</b> ${escape(ride.meetingPoint)}`,
  ]
  if (ride.distanceKm != null) lines.push(`📏 <b>Distance:</b> ${ride.distanceKm} km`)
  if (ride.elevationGain != null) lines.push(`⬆️ <b>D+:</b> ${ride.elevationGain} m`)
  if (ride.elevationLoss != null) lines.push(`⬇️ <b>D-:</b> ${ride.elevationLoss} m`)
  if (ride.level) lines.push(`💪 <b>Level:</b> ${LEVEL_LABEL[ride.level]}`)
  if (ride.externalUrl) lines.push(`🔗 <a href="${ride.externalUrl}">View route</a>`)
  return lines.join("\n")
}

export function formatSummary(ride: Ride): string {
  return buildSummaryLines(ride).join("\n")
}

export function formatDraftSummary(fields: SummaryFields): string {
  return buildSummaryLines(fields).join("\n")
}

export function topicLink(groupChatId: number, threadId: string): string {
  const internalId = String(groupChatId).replace("-100", "")
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

function escape(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
