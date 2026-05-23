import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type Client,
  type Interaction,
  MessageFlags,
} from "discord.js"
import type { RideRepository } from "../../../domain/ports/ride.repository"
import type { Ride } from "../../../domain/ride"
import { formatDate } from "../format"

const MAX_RIDES_SHOWN = 5

export function registerRidesCommand(client: Client, rideRepo: RideRepository): void {
  client.on("interactionCreate", (interaction) => {
    void onRides(interaction, rideRepo)
  })
}

async function onRides(interaction: Interaction, rideRepo: RideRepository): Promise<void> {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "rides") return
  await handleRidesCommand(interaction, rideRepo)
}

async function handleRidesCommand(
  interaction: ChatInputCommandInteraction,
  rideRepo: RideRepository,
): Promise<void> {
  const active = await rideRepo.findActive()
  const now = new Date()
  const upcoming = active
    .filter((r) => r.date >= now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, MAX_RIDES_SHOWN)

  if (upcoming.length === 0) {
    await interaction.reply({
      content: "No upcoming rides at the moment.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const lines: string[] = [`**Upcoming rides (${upcoming.length})**`]
  const components: ActionRowBuilder<ButtonBuilder>[] = []

  for (const ride of upcoming) {
    lines.push("", formatRideLine(ride))
    components.push(buildRideRow(ride))
  }

  await interaction.reply({ content: lines.join("\n"), components, flags: MessageFlags.Ephemeral })
}

function formatRideLine(ride: Ride): string {
  const header = `📅 **${formatDate(ride.date)}** — ${ride.meetingPoint}`
  const stats: string[] = []
  if (ride.meetingTime != null) stats.push(`🕐 ${ride.meetingTime}`)
  if (ride.distanceKm != null) stats.push(`📏 ${ride.distanceKm} km`)
  if (ride.elevationGain != null) stats.push(`⬆️ ${ride.elevationGain} m`)
  if (ride.level != null)
    stats.push(`💪 ${ride.level.charAt(0).toUpperCase() + ride.level.slice(1)}`)
  return stats.length > 0 ? `${header}\n${stats.join(" · ")}` : header
}

function buildRideRow(ride: Ride): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`join:${ride.id}`)
      .setLabel("🚴 Join")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`participants:${ride.id}`)
      .setLabel("👥 Participants")
      .setStyle(ButtonStyle.Secondary),
  )
}
