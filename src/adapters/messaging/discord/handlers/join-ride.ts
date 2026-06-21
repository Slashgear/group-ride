import { MessageFlags, type Client, type Interaction } from "discord.js"
import {
  AlreadyMemberError,
  RideNotActiveError,
  RideNotFoundError,
} from "../../../../domain/errors"
import type { RideService } from "../../../../services/ride.service"
import { logger } from "../../../../logger"
import { getMessages } from "../../../../i18n"

const log = logger.child({ module: "discord-join" })

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
  const m = getMessages()
  try {
    const result = await rideService.join(rideId, userId)
    const content = result.waitlisted ? m.joinWaitlist(result.position) : m.joinSuccess
    await interaction.editReply({ content })
  } catch (err) {
    const message =
      err instanceof AlreadyMemberError
        ? m.alreadyMember
        : err instanceof RideNotActiveError
          ? m.rideNotActive
          : err instanceof RideNotFoundError
            ? m.rideNotFound
            : m.unexpectedError
    await interaction.editReply({ content: `❌ ${message}` })
    if (
      !(
        err instanceof AlreadyMemberError ||
        err instanceof RideNotActiveError ||
        err instanceof RideNotFoundError
      )
    ) {
      log.error({ err, rideId, userId }, "Unexpected error in join handler")
      throw err
    }
  }
}
