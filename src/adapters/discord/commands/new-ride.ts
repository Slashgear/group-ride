import {
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Client,
  type Interaction,
  LabelBuilder,
  MessageFlags,
  type ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js"
import {
  ExtractionFailedError,
  UnsupportedPlatformError,
  importFromUrl,
} from "../../../services/importer/index"
import type { RideService } from "../../../services/ride.service"
import { formatDate, formatDraftSummary } from "../format"
import { parseDateAndTime, parseStats } from "../parse"
import { buildConfirmRow } from "./shared"

const MODAL_ID = "create-ride-modal"

const pendingRides = new Map<string, RidePayload>()

export function buildNewRideModal(): ModalBuilder {
  const field = (labelText: string, input: TextInputBuilder) =>
    new LabelBuilder().setLabel(labelText).setTextInputComponent(input)

  return new ModalBuilder()
    .setCustomId(MODAL_ID)
    .setTitle("Propose a ride")
    .addLabelComponents(
      field(
        "Import URL (Komoot/Strava/Garmin)",
        new TextInputBuilder()
          .setCustomId("importUrl")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder("https://www.komoot.com/tour/…"),
      ),
      field(
        "Date & time (DD/MM/YYYY or +HH:MM)",
        new TextInputBuilder()
          .setCustomId("dateTime")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setPlaceholder("25/05/2025 08:00"),
      ),
      field(
        "Meeting point",
        new TextInputBuilder()
          .setCustomId("meetingPoint")
          .setStyle(TextInputStyle.Short)
          .setRequired(true),
      ),
      field(
        "Stats: distance km / D+ m / D- m — optional",
        new TextInputBuilder()
          .setCustomId("stats")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder("100 / 2500 / 2000"),
      ),
      field(
        "Notes — optional",
        new TextInputBuilder()
          .setCustomId("notes")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false),
      ),
    )
}

export function registerNewRideCommand(client: Client, rideService: RideService): void {
  client.on("interactionCreate", (interaction) => {
    void onNewRideInteraction(interaction, rideService)
  })
}

async function onNewRideInteraction(
  interaction: Interaction,
  rideService: RideService,
): Promise<void> {
  if (interaction.isChatInputCommand() && interaction.commandName === "newride") {
    await handleNewRideCommand(interaction)
    return
  }

  if (interaction.isModalSubmit() && interaction.customId === MODAL_ID) {
    await handleModalSubmit(interaction, rideService)
    return
  }

  if (interaction.isButton() && interaction.customId.startsWith("ride-confirm:")) {
    await handleConfirm(interaction, rideService)
    return
  }

  if (interaction.isButton() && interaction.customId === "ride-cancel") {
    await interaction.update({ content: "Ride creation cancelled.", components: [] })
  }
}

async function handleNewRideCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.showModal(buildNewRideModal())
}

async function handleModalSubmit(
  interaction: ModalSubmitInteraction,
  _rideService: RideService,
): Promise<void> {
  const fields = interaction.fields
  const rawDateTime = fields.getTextInputValue("dateTime").trim()
  const meetingPoint = fields.getTextInputValue("meetingPoint").trim()
  const rawStats = fields.getTextInputValue("stats").trim()
  const rawNotes = fields.getTextInputValue("notes").trim()
  const rawUrl = fields.getTextInputValue("importUrl").trim()

  const parsed = parseDateAndTime(rawDateTime)
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

  const { date, meetingTime } = parsed
  const manualStats = parseStats(rawStats)
  const { importedFields, importWarning } = await resolveImport(rawUrl, manualStats)

  const notes = importedFields.notes ?? (rawNotes === "" ? undefined : rawNotes)
  const summary = formatDraftSummary({
    date,
    meetingTime,
    meetingPoint,
    proposerName: interaction.user.displayName,
    ...importedFields,
    notes,
  })
  const payload = encodePayload({
    dateTime: rawDateTime,
    name: importedFields.name,
    meetingTime,
    meetingPoint,
    distanceKm: importedFields.distanceKm,
    elevationGain: importedFields.elevationGain,
    elevationLoss: importedFields.elevationLoss,
    level: importedFields.level,
    externalUrl: importedFields.externalUrl,
    notes,
    proposerId: interaction.user.id,
    proposerName: interaction.user.displayName,
  })
  await interaction.reply({
    content: `Ready to create:${importWarning}\n\n${summary}`,
    components: [buildConfirmRow(payload)],
    flags: MessageFlags.Ephemeral,
  })
}

interface ImportResult {
  importedFields: {
    name?: string
    distanceKm?: number
    elevationGain?: number
    elevationLoss?: number
    level?: string
    externalUrl?: string
    notes?: string
  }
  importWarning: string
}

async function resolveImport(
  rawUrl: string,
  manualStats: { distanceKm?: number; elevationGain?: number; elevationLoss?: number },
): Promise<ImportResult> {
  const base = {
    distanceKm: manualStats.distanceKm,
    elevationGain: manualStats.elevationGain,
    elevationLoss: manualStats.elevationLoss,
  }
  if (rawUrl === "") return { importedFields: base, importWarning: "" }

  try {
    const imported = await importFromUrl(rawUrl)
    const hostname = new URL(rawUrl).hostname
    let importWarning = ""
    if (hostname.includes("garmin.com"))
      importWarning =
        "\n\n⚠️ Garmin courses are not publicly accessible — only the link was saved. Fill in distance and elevation manually."
    else if (hostname.includes("strava.com"))
      importWarning =
        "\n\n⚠️ Strava activities require authentication — only the link was saved. Fill in distance and elevation manually."
    return {
      importedFields: {
        ...base,
        distanceKm: base.distanceKm ?? imported.distanceKm,
        elevationGain: base.elevationGain ?? imported.elevationGain,
        elevationLoss: base.elevationLoss ?? imported.elevationLoss,
        name: imported.name,
        level: imported.level,
        externalUrl: imported.externalUrl,
        notes: imported.notes,
      },
      importWarning,
    }
  } catch (err) {
    const importWarning =
      err instanceof UnsupportedPlatformError
        ? "\n\n⚠️ Import URL not supported — continuing with manual data."
        : err instanceof ExtractionFailedError
          ? "\n\n⚠️ Could not extract details (activity may be private) — continuing with manual data."
          : ""
    return { importedFields: base, importWarning }
  }
}

async function handleConfirm(
  interaction: ButtonInteraction,
  rideService: RideService,
): Promise<void> {
  const id = interaction.customId.replace("ride-confirm:", "")
  const data = decodePayload(id)
  pendingRides.delete(id)
  if (!data) {
    await interaction.update({
      content: "❌ Could not read ride data. Please try again.",
      components: [],
    })
    return
  }

  const parsed = parseDateAndTime(data.dateTime)
  if (!parsed) {
    await interaction.update({ content: "❌ Invalid date in payload.", components: [] })
    return
  }
  const { date, meetingTime: payloadMeetingTime } = parsed

  await interaction.deferUpdate()

  await rideService.propose({
    proposerId: Number(data.proposerId),
    proposerName: data.proposerName,
    name: data.name,
    date,
    meetingTime: data.meetingTime ?? payloadMeetingTime,
    meetingPoint: data.meetingPoint,
    distanceKm: data.distanceKm,
    elevationGain: data.elevationGain,
    elevationLoss: data.elevationLoss,
    level: data.level as never,
    externalUrl: data.externalUrl,
    notes: data.notes,
  })

  await interaction.editReply({
    content: `🎉 Ride created for ${formatDate(date)}! The group has been notified.`,
    components: [],
  })
}

interface RidePayload {
  dateTime: string
  name?: string
  meetingTime?: string
  meetingPoint: string
  proposerId: string
  proposerName: string
  distanceKm?: number
  elevationGain?: number
  elevationLoss?: number
  level?: string
  externalUrl?: string
  notes?: string
}

function encodePayload(data: RidePayload): string {
  const id = Math.random().toString(36).slice(2, 10)
  pendingRides.set(id, data)
  return id
}

function decodePayload(id: string): RidePayload | null {
  return pendingRides.get(id) ?? null
}
