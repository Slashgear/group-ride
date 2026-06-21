import {
  type ChatInputCommandInteraction,
  type Client,
  type Interaction,
  MessageFlags,
} from "discord.js"
import { CapConflictError, RideNotActiveError, RideNotFoundError } from "../../../../domain/errors"
import type { RideService } from "../../../../services/ride.service"
import { getMessages } from "../../../../i18n"
import { logger } from "../../../../logger"

const log = logger.child({ module: "discord-setcap" })

export function registerSetCapCommand(client: Client, rideService: RideService): void {
  client.on("interactionCreate", (interaction) => {
    void onSetCap(interaction, rideService)
  })
}

async function onSetCap(interaction: Interaction, rideService: RideService): Promise<void> {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "setcap") return
  await handleSetCap(interaction, rideService)
}

async function handleSetCap(
  interaction: ChatInputCommandInteraction,
  rideService: RideService,
): Promise<void> {
  const rideId = interaction.options.getString("ride", true)
  const maxRaw = interaction.options.getInteger("max", true)
  const maxParticipants = maxRaw === 0 ? undefined : maxRaw

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const m = getMessages()
  try {
    await rideService.update(rideId, { maxParticipants })
    const label =
      maxParticipants == null
        ? "Participant cap removed."
        : `Participant cap set to ${maxParticipants}.`
    await interaction.editReply({ content: `✅ ${label}` })
  } catch (err) {
    const message =
      err instanceof CapConflictError
        ? m.capConflict
        : err instanceof RideNotActiveError
          ? m.rideAlreadyCancelled
          : err instanceof RideNotFoundError
            ? m.rideNotFound
            : m.unexpectedError
    await interaction.editReply({ content: `❌ ${message}` })
    if (
      !(
        err instanceof CapConflictError ||
        err instanceof RideNotActiveError ||
        err instanceof RideNotFoundError
      )
    ) {
      log.error({ err, rideId }, "Unexpected error in setcap handler")
      throw err
    }
  }
}
