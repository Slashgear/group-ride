import {
  ActionRowBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Client,
  MessageFlags,
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
import { buildConfirmRow } from "./shared"

const MODAL_ID = "create-ride-modal"

const pendingRides = new Map<string, RidePayload>()

export function buildNewRideModal(): ModalBuilder {
  const importUrl = new TextInputBuilder()
    .setCustomId("importUrl")
    .setLabel("Import URL (Komoot/Strava/Garmin)")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("https://www.komoot.com/tour/…")

  const date = new TextInputBuilder()
    .setCustomId("date")
    .setLabel("Date (DD/MM/YYYY)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setPlaceholder("25/05/2025")

  const meetingPoint = new TextInputBuilder()
    .setCustomId("meetingPoint")
    .setLabel("Meeting point")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)

  const meetingTime = new TextInputBuilder()
    .setCustomId("meetingTime")
    .setLabel("Meeting time — optional")
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder("08:00")

  const notes = new TextInputBuilder()
    .setCustomId("notes")
    .setLabel("Notes — optional")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)

  return new ModalBuilder()
    .setCustomId(MODAL_ID)
    .setTitle("Propose a ride")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(importUrl),
      new ActionRowBuilder<TextInputBuilder>().addComponents(date),
      new ActionRowBuilder<TextInputBuilder>().addComponents(meetingTime),
      new ActionRowBuilder<TextInputBuilder>().addComponents(meetingPoint),
      new ActionRowBuilder<TextInputBuilder>().addComponents(notes),
    )
}

export function registerNewRideCommand(client: Client, rideService: RideService): void {
  client.on("interactionCreate", async (interaction) => {
    if (interaction.isChatInputCommand() && interaction.commandName === "newride") {
      await handleNewRideCommand(interaction)
      return
    }

    if (interaction.isModalSubmit() && interaction.customId === MODAL_ID) {
      await handleModalSubmit(interaction, rideService)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("ride-confirm:")) {
      await handleConfirm(interaction as ButtonInteraction, rideService)
      return
    }

    if (interaction.isButton() && interaction.customId === "ride-cancel") {
      await interaction.update({ content: "Ride creation cancelled.", components: [] })
      return
    }
  })
}

async function handleNewRideCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  await interaction.showModal(buildNewRideModal())
}

async function handleModalSubmit(
  interaction: Parameters<typeof handleNewRideCommand>[0] & { isModalSubmit(): true },
  _rideService: RideService,
): Promise<void> {
  // @ts-expect-error — interaction type narrowed above
  const fields = interaction.fields

  const rawDate = fields.getTextInputValue("date").trim()
  const rawMeetingTime = fields.getTextInputValue("meetingTime").trim()
  const meetingPoint = fields.getTextInputValue("meetingPoint").trim()
  const rawNotes = fields.getTextInputValue("notes").trim()
  const rawUrl = fields.getTextInputValue("importUrl").trim()

  const date = parseDate(rawDate)
  if (!date) {
    await interaction.reply({
      content: "❌ Invalid date format. Please use DD/MM/YYYY.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) {
    await interaction.reply({
      content: "❌ The ride date must be in the future.",
      flags: MessageFlags.Ephemeral,
    })
    return
  }

  const meetingTime = rawMeetingTime || undefined
  let distanceKm: number | undefined
  let elevationGain: number | undefined
  let elevationLoss: number | undefined
  let level: string | undefined
  let externalUrl: string | undefined
  let notes: string | undefined = rawNotes || undefined
  let rideName: string | undefined
  let importWarning = ""

  if (rawUrl) {
    try {
      const imported = await importFromUrl(rawUrl)
      rideName = imported.name
      distanceKm ??= imported.distanceKm
      elevationGain = imported.elevationGain
      elevationLoss = imported.elevationLoss
      level = imported.level
      externalUrl = imported.externalUrl
      notes ??= imported.notes
      const hostname = new URL(rawUrl).hostname
      if (hostname.includes("garmin.com")) {
        importWarning =
          "\n\n⚠️ Garmin courses are not publicly accessible — only the link was saved. Fill in distance and elevation manually."
      } else if (hostname.includes("strava.com")) {
        importWarning =
          "\n\n⚠️ Strava activities require authentication — only the link was saved. Fill in distance and elevation manually."
      }
    } catch (err) {
      if (err instanceof UnsupportedPlatformError) {
        importWarning = "\n\n⚠️ Import URL not supported — continuing with manual data."
      } else if (err instanceof ExtractionFailedError) {
        importWarning =
          "\n\n⚠️ Could not extract details (activity may be private) — continuing with manual data."
      }
    }
  }

  const summary = formatDraftSummary({
    date,
    meetingTime,
    meetingPoint,
    proposerName: interaction.user.displayName,
    distanceKm,
    elevationGain,
    elevationLoss,
    level: level as never,
    externalUrl,
    notes,
  })

  const payload = encodePayload({
    date: rawDate,
    name: rideName,
    meetingTime,
    meetingPoint,
    distanceKm,
    elevationGain,
    elevationLoss,
    level,
    externalUrl,
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

  const date = parseDate(data.date)
  if (!date) {
    await interaction.update({ content: "❌ Invalid date in payload.", components: [] })
    return
  }

  await interaction.deferUpdate()

  await rideService.propose({
    proposerId: Number(data.proposerId),
    proposerName: data.proposerName,
    name: data.name,
    date,
    meetingTime: data.meetingTime,
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

function parseDate(text: string): Date | null {
  const parts = text.split("/").map(Number)
  if (parts.length !== 3) return null
  const [day, month, year] = parts as [number, number, number]
  const date = new Date(year, month - 1, day)
  return isNaN(date.getTime()) ? null : date
}

interface RidePayload {
  date: string
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
