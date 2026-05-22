import {
  ActionRowBuilder,
  type Client,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js"
import type { RideRepository } from "../../../domain/ports/ride.repository"
import type { RideService } from "../../../services/ride.service"
import { formatDate } from "../format"

const MODAL_PREFIX = "edit-ride:"

export function registerEditRideHandler(
  client: Client,
  rideRepo: RideRepository,
  rideService: RideService,
): void {
  client.on("interactionCreate", async (interaction) => {
    if (interaction.isButton() && interaction.customId.startsWith("edit:")) {
      const rideId = interaction.customId.replace("edit:", "")
      const ride = await rideRepo.findById(rideId)
      if (!ride || ride.status !== "active") {
        await interaction.reply({
          content: "❌ Ride not found or already closed.",
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      const rawDate = `${String(ride.date.getDate()).padStart(2, "0")}/${String(ride.date.getMonth() + 1).padStart(2, "0")}/${ride.date.getFullYear()}`

      const modal = new ModalBuilder()
        .setCustomId(`${MODAL_PREFIX}${rideId}`)
        .setTitle("Edit ride")
        .addComponents(
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("date")
              .setLabel("Date (DD/MM/YYYY)")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setValue(rawDate),
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("meetingTime")
              .setLabel("Meeting time — optional")
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setValue(ride.meetingTime ?? ""),
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("meetingPoint")
              .setLabel("Meeting point")
              .setStyle(TextInputStyle.Short)
              .setRequired(true)
              .setValue(ride.meetingPoint),
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("externalUrl")
              .setLabel("Route URL — optional")
              .setStyle(TextInputStyle.Short)
              .setRequired(false)
              .setValue(ride.externalUrl ?? ""),
          ),
          new ActionRowBuilder<TextInputBuilder>().addComponents(
            new TextInputBuilder()
              .setCustomId("notes")
              .setLabel("Notes — optional")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
              .setValue(ride.notes ?? ""),
          ),
        )

      await interaction.showModal(modal)
      return
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith(MODAL_PREFIX)) {
      const rideId = interaction.customId.replace(MODAL_PREFIX, "")
      const fields = interaction.fields

      const rawDate = fields.getTextInputValue("date").trim()
      const parts = rawDate.split("/").map(Number)
      if (parts.length !== 3) {
        await interaction.reply({
          content: "❌ Invalid date format.",
          flags: MessageFlags.Ephemeral,
        })
        return
      }
      const [day, month, year] = parts as [number, number, number]
      const date = new Date(year, month - 1, day)
      if (isNaN(date.getTime())) {
        await interaction.reply({ content: "❌ Invalid date.", flags: MessageFlags.Ephemeral })
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

      const meetingTime = fields.getTextInputValue("meetingTime").trim() || undefined
      const meetingPoint = fields.getTextInputValue("meetingPoint").trim()
      const externalUrl = fields.getTextInputValue("externalUrl").trim() || undefined
      const notes = fields.getTextInputValue("notes").trim() || undefined

      await interaction.deferReply({ flags: MessageFlags.Ephemeral })
      await rideService.update(rideId, { date, meetingTime, meetingPoint, externalUrl, notes })
      await interaction.editReply({ content: `✅ Ride updated for ${formatDate(date)}!` })
    }
  })
}
