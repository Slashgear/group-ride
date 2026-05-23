import { MessageFlags, type Client, type Interaction } from "discord.js"
import type { RideService } from "../../../services/ride.service"

export function registerLeaveCancelHandler(client: Client, rideService: RideService): void {
  client.on("interactionCreate", (interaction) => {
    void onLeaveCancel(interaction, rideService)
  })
}

async function onLeaveCancel(interaction: Interaction, rideService: RideService): Promise<void> {
  if (!interaction.isButton()) return

  const leaveMatch = interaction.customId.match(/^leave:(.+)$/u)
  if (leaveMatch?.[1] != null) {
    const rideId = leaveMatch[1]
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    await rideService.leave(rideId, Number(interaction.user.id))
    await interaction.editReply({ content: "You've left the ride." })
    return
  }

  const cancelMatch = interaction.customId.match(/^cancel:(.+)$/u)
  if (cancelMatch?.[1] != null) {
    const rideId = cancelMatch[1]
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    await rideService.cancel(rideId)
    await interaction.editReply({ content: "Ride cancelled." })
  }
}