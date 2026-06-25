import {
  type ButtonInteraction,
  type Client,
  type Interaction,
  LabelBuilder,
  MessageFlags,
  type ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import type { Ride } from "../../../../domain/ride"
import { RideNotActiveError, RideNotFoundError } from "../../../../domain/errors"
import type { RideService } from "../../../../services/ride.service"
import { formatDate } from "../format"
import { logger } from "../../../../logger"
import { getMessages } from "../../../../i18n"

const log = logger.child({ module: "discord-edit-ride" })
import {
  formatDateTimeValue,
  formatStatsValue,
  parseDateAndTime,
  parseStats,
} from "../../shared/parse"

const MODAL_PREFIX = "edit-ride:"

export function registerEditRideHandler(
  client: Client,
  rideRepo: RideRepository,
  rideService: RideService,
): void {
  client.on("interactionCreate", (interaction) => {
    void onEditRide(interaction, rideRepo, rideService).catch((err) => {
      log.error({ err }, "Unhandled error in edit ride interaction")
    })
  })
}

async function onEditRide(
  interaction: Interaction,
  rideRepo: RideRepository,
  rideService: RideService,
): Promise<void> {
  if (interaction.isButton() && interaction.customId.startsWith("edit:")) {
    await handleEditButton(interaction, rideRepo)
    return
  }
  if (interaction.isModalSubmit() && interaction.customId.startsWith(MODAL_PREFIX)) {
    await handleEditModalSubmit(interaction, rideService)
  }
}

async function handleEditButton(
  interaction: ButtonInteraction,
  rideRepo: RideRepository,
): Promise<void> {
  const rideId = interaction.customId.replace("edit:", "")
  const ride = await rideRepo.findById(rideId)
  if (ride == null || ride.status !== "active") {
    await interaction.reply({
      content: "❌ Ride not found or already closed.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }
  await interaction.showModal(buildEditModal(rideId, ride))
}

export function buildEditModal(rideId: string, ride: Ride): ModalBuilder {
  const field = (labelText: string, input: TextInputBuilder) =>
    new LabelBuilder().setLabel(labelText).setTextInputComponent(input)
  return new ModalBuilder()
    .setCustomId(`${MODAL_PREFIX}${rideId}`)
    .setTitle("Edit ride")
    .addLabelComponents(
      field(
        "Date & time (DD/MM/YYYY or +HH:MM)",
        new TextInputBuilder()
          .setCustomId("dateTime")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(formatDateTimeValue(ride)),
      ),
      field(
        "Meeting point",
        new TextInputBuilder()
          .setCustomId("meetingPoint")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setValue(ride.meetingPoint),
      ),
      field(
        "Stats: distance km / D+ m / D- m — optional",
        new TextInputBuilder()
          .setCustomId("stats")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(formatStatsValue(ride)),
      ),
      field(
        "Route URL — optional",
        new TextInputBuilder()
          .setCustomId("externalUrl")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setValue(ride.externalUrl ?? ""),
      ),
      field(
        "Notes — optional",
        new TextInputBuilder()
          .setCustomId("notes")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setValue(ride.notes ?? ""),
      ),
    )
}

async function handleEditModalSubmit(
  interaction: ModalSubmitInteraction,
  rideService: RideService,
): Promise<void> {
  const rideId = interaction.customId.replace(MODAL_PREFIX, "")
  const fields = interaction.fields

  const parsed = parseDateAndTime(fields.getTextInputValue("dateTime").trim())
  if (parsed == null) {
    await interaction.reply({
      content: "❌ Invalid date format. Please use DD/MM/YYYY or DD/MM/YYYY HH:MM.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (parsed.date < today) {
    await interaction.reply({
      content: "❌ The ride date must be in the future.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const meetingPoint = fields.getTextInputValue("meetingPoint").trim()
  const { distanceKm, elevationGain, elevationLoss } = parseStats(
    fields.getTextInputValue("stats").trim(),
  )
  const rawExternal = fields.getTextInputValue("externalUrl").trim()
  const rawNotes = fields.getTextInputValue("notes").trim()

  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const m = getMessages()
  try {
    await rideService.update(rideId, {
      date: parsed.date,
      meetingTime: parsed.meetingTime,
      meetingPoint,
      distanceKm,
      elevationGain,
      elevationLoss,
      externalUrl: rawExternal === "" ? undefined : rawExternal,
      notes: rawNotes === "" ? undefined : rawNotes,
    })
    await interaction.editReply({ content: m.rideUpdatedConfirm(formatDate(parsed.date)) })
  } catch (err) {
    const message =
      err instanceof RideNotActiveError
        ? m.rideAlreadyCancelled
        : err instanceof RideNotFoundError
          ? m.rideNotFound
          : m.unexpectedError
    await interaction.editReply({ content: `❌ ${message}` })
    if (!(err instanceof RideNotActiveError || err instanceof RideNotFoundError)) {
      log.error({ err, rideId }, "Unexpected error in edit-ride handler")
    }
  }
}
