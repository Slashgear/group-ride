import { REST, Routes, SlashCommandBuilder } from "discord.js"
import { logger } from "../../logger"

const log = logger.child({ module: "discord-deploy" })

const commands = [
  new SlashCommandBuilder().setName("newride").setDescription("Propose a new group ride").toJSON(),
  new SlashCommandBuilder().setName("rides").setDescription("List upcoming rides").toJSON(),
  new SlashCommandBuilder().setName("help").setDescription("How to use the Group Ride bot").toJSON(),
]

export async function deployCommands(
  token: string,
  clientId: string,
  guildId: string,
): Promise<void> {
  const rest = new REST().setToken(token)
  log.info({ guildId }, "Deploying slash commands")
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  log.info("Slash commands deployed")
}
