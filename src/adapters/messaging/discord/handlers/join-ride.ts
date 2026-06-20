import { MessageFlags, type Client, type Interaction } from "discord.js"
import {
  AlreadyMemberError,
  RideNotActiveError,
  RideNotFoundError,
} from "../../../../domain/errors"
import type { RideService } from "../../../../services/ride.service"

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
  try {
    await rideService.join(rideId, userId)
    await interaction.editReply({ content: "You're in! Check the ride thread. 🚴" })
  } catch (err) {
    const message =
      err instanceof AlreadyMemberError
        ? "You're already registered for this ride."
        : err instanceof RideNotActiveError
          ? "This ride has been cancelled."
          : err instanceof RideNotFoundError
            ? "This ride no longer exists."
            : "Something went wrong. Please try again."
    await interaction.editReply({ content: `❌ ${message}` })
    if (
      !(
        err instanceof AlreadyMemberError ||
        err instanceof RideNotActiveError ||
        err instanceof RideNotFoundError
      )
    )
      throw err
  }
}
