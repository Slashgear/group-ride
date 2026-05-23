import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js"

export function buildConfirmRow(payload: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`ride-confirm:${payload}`)
      .setLabel("✅ Create ride")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId("ride-cancel")
      .setLabel("❌ Cancel")
      .setStyle(ButtonStyle.Danger),
  )
}
