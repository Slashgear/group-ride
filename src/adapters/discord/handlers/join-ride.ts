import { MessageFlags, type Client } from "discord.js"
import type { RideService } from "../../../services/ride.service"

export function registerJoinRideHandler(client: Client, rideService: RideService): void {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return
    const match = interaction.customId.match(/^join:(.+)$/)
    if (!match) return

    const rideId = match[1]!
    const userId = Number(interaction.user.id)
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    await rideService.join(rideId, userId)
    await interaction.editReply({ content: "You're in! Check the ride thread. 🚴" })
  })
}
