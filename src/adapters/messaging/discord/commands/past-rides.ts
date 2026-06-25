import {
  type ChatInputCommandInteraction,
  type Client,
  type Interaction,
  MessageFlags,
} from "discord.js"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import type { Ride } from "../../../../domain/ride"
import { formatDate } from "../format"
import { logger } from "../../../../logger"

const log = logger.child({ module: "discord-past-rides" })
const MAX_PAST_RIDES_SHOWN = 5

const STATUS_LABEL: Record<string, string> = {
  closed: "✅ Completed",
  cancelled: "❌ Cancelled",
  active: "⏳ Active",
}

export function registerPastRidesCommand(client: Client, rideRepo: RideRepository): void {
  client.on("interactionCreate", (interaction) => {
    void onPastRides(interaction, rideRepo).catch((err) => {
      log.error({ err }, "Unhandled error in past-rides command")
    })
  })
}

async function onPastRides(interaction: Interaction, rideRepo: RideRepository): Promise<void> {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "pastrides") return
  await handlePastRidesCommand(interaction, rideRepo)
}

async function handlePastRidesCommand(
  interaction: ChatInputCommandInteraction,
  rideRepo: RideRepository,
): Promise<void> {
  const past = await rideRepo.findPast(MAX_PAST_RIDES_SHOWN)

  if (past.length === 0) {
    await interaction.reply({ content: "No past rides yet.", flags: MessageFlags.Ephemeral })
    return
  }

  const lines: string[] = [`**Past rides (${past.length})**`]
  for (const ride of past) {
    lines.push("", formatPastRideLine(ride))
  }

  await interaction.reply({ content: lines.join("\n"), flags: MessageFlags.Ephemeral })
}

function formatPastRideLine(ride: Ride): string {
  const header = `📅 **${formatDate(ride.date)}** — ${ride.meetingPoint}`
  const stats: string[] = []
  if (ride.meetingTime != null) stats.push(`🕐 ${ride.meetingTime}`)
  if (ride.distanceKm != null) stats.push(`📏 ${ride.distanceKm} km`)
  if (ride.elevationGain != null) stats.push(`⬆️ ${ride.elevationGain} m`)
  if (ride.level != null)
    stats.push(`💪 ${ride.level.charAt(0).toUpperCase() + ride.level.slice(1)}`)
  const status = STATUS_LABEL[ride.status] ?? ride.status
  stats.push(status)
  return stats.length > 0 ? `${header}\n${stats.join(" · ")}` : header
}
