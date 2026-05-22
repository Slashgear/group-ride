import { MessageFlags, type Client } from "discord.js"
import type { RideService } from "../../../services/ride.service"

export function registerLeaveCancelHandler(client: Client, rideService: RideService): void {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return

    const leaveMatch = interaction.customId.match(/^leave:(.+)$/)
    if (leaveMatch) {
      const rideId = leaveMatch[1]!
      await interaction.deferReply({ flags: MessageFlags.Ephemeral })
      await rideService.leave(rideId, Number(interaction.user.id))
      await interaction.editReply({ content: "You've left the ride." })
      return
    }

    const cancelMatch = interaction.customId.match(/^cancel:(.+)$/)
    if (cancelMatch) {
      const rideId = cancelMatch[1]!
      await interaction.deferReply({ flags: MessageFlags.Ephemeral })
      await rideService.cancel(rideId)
      await interaction.editReply({ content: "Ride cancelled." })
    }
  })
}
