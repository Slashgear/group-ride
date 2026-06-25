import { MessageFlags, type Client, type Interaction } from "discord.js"
import { RideNotActiveError, RideNotFoundError } from "../../../../domain/errors"
import type { RideService } from "../../../../services/ride.service"
import { logger } from "../../../../logger"
import { getMessages } from "../../../../i18n"

const log = logger.child({ module: "discord-leave-cancel" })

export function registerLeaveCancelHandler(client: Client, rideService: RideService): void {
  client.on("interactionCreate", (interaction) => {
    void onLeaveCancel(interaction, rideService).catch((err) => {
      log.error({ err }, "Unhandled error in leave/cancel interaction")
    })
  })
}

async function onLeaveCancel(interaction: Interaction, rideService: RideService): Promise<void> {
  if (!interaction.isButton()) return

  const leaveMatch = interaction.customId.match(/^leave:(.+)$/u)
  if (leaveMatch?.[1] != null) {
    const rideId = leaveMatch[1]
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const m = getMessages()
    try {
      await rideService.leave(rideId, interaction.user.id)
      await interaction.editReply({ content: m.leftRide })
    } catch (err) {
      await interaction.editReply({ content: `❌ ${rideErrorMessage(err, m)}` })
      if (!isRideDomainError(err)) {
        log.error({ err, rideId }, "Unexpected error in leave/cancel handler")
      }
    }
    return
  }

  const cancelMatch = interaction.customId.match(/^cancel:(.+)$/u)
  if (cancelMatch?.[1] != null) {
    const rideId = cancelMatch[1]
    await interaction.deferReply({ flags: MessageFlags.Ephemeral })
    const m = getMessages()
    try {
      await rideService.cancel(rideId)
      await interaction.editReply({ content: m.rideCancelledConfirm })
    } catch (err) {
      await interaction.editReply({ content: `❌ ${rideErrorMessage(err, m)}` })
      if (!isRideDomainError(err)) {
        log.error({ err, rideId }, "Unexpected error in leave/cancel handler")
      }
    }
  }
}

function isRideDomainError(err: unknown): boolean {
  return err instanceof RideNotFoundError || err instanceof RideNotActiveError
}

function rideErrorMessage(err: unknown, m: ReturnType<typeof getMessages>): string {
  if (err instanceof RideNotActiveError) return m.rideAlreadyCancelled
  if (err instanceof RideNotFoundError) return m.rideNotFound
  return m.unexpectedError
}
