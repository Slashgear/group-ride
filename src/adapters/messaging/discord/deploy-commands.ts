import { REST, Routes, SlashCommandBuilder } from "discord.js"
import type { RESTGetAPIApplicationGuildCommandsResult } from "discord-api-types/v10"
import { logger } from "../../../logger"

const log = logger.child({ module: "discord-deploy" })

const commands = [
  new SlashCommandBuilder().setName("newride").setDescription("Propose a new group ride").toJSON(),
  new SlashCommandBuilder().setName("rides").setDescription("List upcoming rides").toJSON(),
  new SlashCommandBuilder().setName("pastrides").setDescription("List past rides").toJSON(),
  new SlashCommandBuilder()
    .setName("setcap")
    .setDescription("Set or remove the participant cap for a ride (0 = no cap)")
    .addStringOption((opt) => opt.setName("ride").setDescription("Ride ID").setRequired(true))
    .addIntegerOption((opt) =>
      opt
        .setName("max")
        .setDescription("Max participants (0 to remove cap)")
        .setRequired(true)
        .setMinValue(0),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("How to use the Group Ride bot")
    .toJSON(),
]

export async function deployCommands(
  token: string,
  clientId: string,
  guildId: string,
): Promise<void> {
  const rest = new REST().setToken(token)

  const deployed = (await rest.get(
    Routes.applicationGuildCommands(clientId, guildId),
  )) as RESTGetAPIApplicationGuildCommandsResult

  const unchanged =
    deployed.length === commands.length &&
    commands.every((cmd) => {
      const existing = deployed.find((d) => d.name === cmd.name)
      return existing != null && existing.description === cmd.description
    })

  if (unchanged) {
    log.info("Slash commands unchanged, skipping deploy")
    return
  }

  log.info({ guildId }, "Deploying slash commands")
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
  log.info("Slash commands deployed")
}
