import { type Client, MessageFlags, type Interaction } from "discord.js"
import type { RideRepository } from "../../../domain/ports/ride.repository"

export function registerParticipantsHandler(client: Client, rideRepo: RideRepository): void {
  client.on("interactionCreate", (interaction) => {
    void onParticipants(interaction, rideRepo)
  })
}

async function onParticipants(interaction: Interaction, rideRepo: RideRepository): Promise<void> {
  if (!interaction.isButton() || !interaction.customId.startsWith("participants:")) return
  const rideId = interaction.customId.replace("participants:", "")
  await interaction.deferReply({ flags: MessageFlags.Ephemeral })
  const members = await rideRepo.getMembers(rideId)
  if (members.length === 0) {
    await interaction.editReply({ content: "No participants yet." })
    return
  }
  const list = members.map((id) => `<@${id}>`).join(", ")
  await interaction.editReply({ content: `👥 **Participants (${members.length}):** ${list}` })
}
