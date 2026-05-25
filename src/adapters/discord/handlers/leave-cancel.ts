import { MessageFlags, type Client, type Interaction } from "discord.js"
import { RideNotActiveError, RideNotFoundError } from "../../../domain/errors"
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
    try {
      await rideService.leave(rideId, interaction.user.id)
      await interaction.editReply({ content: "You've left the ride." })
    } catch (err) {
      await interaction.editReply({ content: `❌ ${rideErrorMessage(err)}` })
      if (!isRideDomainError(err)) throw err
    }
    return
  }

  const cancelMatch = interaction.customId.match(/^cancel:(.+)$/u)
  if (cancelMatch?.[1] != null) {
    const rideId = cancelMatch[1]
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    try {
      await rideService.cancel(rideId)
      await interaction.editReply({ content: "Ride cancelled." })
    } catch (err) {
      await interaction.editReply({ content: `❌ ${rideErrorMessage(err)}` })
      if (!isRideDomainError(err)) throw err
    }
  }
}

function isRideDomainError(err: unknown): boolean {
  return err instanceof RideNotFoundError || err instanceof RideNotActiveError
}

function rideErrorMessage(err: unknown): string {
  if (err instanceof RideNotActiveError) return "This ride has already been cancelled."
  if (err instanceof RideNotFoundError) return "This ride no longer exists."
  return "Something went wrong. Please try again."
}
