import { MessageFlags, type Client, type Interaction } from "discord.js"
import type { RideService } from "../../../services/ride.service"

export function registerJoinRideHandler(client: Client, rideService: RideService): void {
  client.on("interactionCreate", (interaction) => {
    void onJoinRide(interaction, rideService)
  })
}

async function onJoinRide(interaction: Interaction, rideService: RideService): Promise<void> {
  if (!interaction.isButton()) return
  const match = interaction.customId.match(/^join:(.+)$/u)
  if (match?.[1] == null) return

  const rideId = match[1]
  const userId = interaction.user.id
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  await rideService.join(rideId, userId)
  await interaction.editReply({ content: "You're in! Check the ride thread. 🚴" })
}
