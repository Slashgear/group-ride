import { LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js"

export const NEW_RIDE_MODAL_ID = "create-ride-modal"

export function buildNewRideModal(): ModalBuilder {
  const field = (labelText: string, input: TextInputBuilder) =>
    new LabelBuilder().setLabel(labelText).setTextInputComponent(input)

  return new ModalBuilder()
    .setCustomId(NEW_RIDE_MODAL_ID)
    .setTitle("Propose a ride")
    .addLabelComponents(
      field(
        "Import URL (Komoot, Strava, Garmin, or GPX file URL)",
        new TextInputBuilder()
          .setCustomId("importUrl")
          .setStyle(TextInputStyle.Short)
          .setRequired(false)
          .setPlaceholder("https://www.komoot.com/tour/… or https://…/route.gpx"),
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
