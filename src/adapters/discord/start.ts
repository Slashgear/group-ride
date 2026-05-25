import { createClient } from "./client"
import { deployCommands } from "./deploy-commands"
import { registerHelpCommand } from "./commands/help"
import { registerNewRideCommand } from "./commands/new-ride"
import { registerRidesCommand } from "./commands/rides"
import { registerJoinRideHandler } from "./handlers/join-ride"
import { registerMemberJoinedHandler } from "./handlers/member-joined"
import { registerMemberLeftHandler } from "./handlers/member-left"
import { registerLeaveCancelHandler } from "./handlers/leave-cancel"
import { registerEditRideHandler } from "./handlers/edit-ride"
import { registerParticipantsHandler } from "./handlers/participants"
import { DiscordMessaging } from "./messaging"
import type { RideRepository } from "../../domain/ports/ride.repository"
import { RideService } from "../../services/ride.service"
import { SchedulerService } from "../../services/scheduler.service"
import { logger } from "../../logger"

export async function startDiscord(rideRepo: RideRepository): Promise<void> {
  const token = process.env.DISCORD_TOKEN
  const clientId = process.env.DISCORD_CLIENT_ID
  const guildId = process.env.DISCORD_GUILD_ID
  const announcementChannelId = process.env.DISCORD_ANNOUNCEMENT_CHANNEL_ID
  const forumChannelId = process.env.DISCORD_FORUM_CHANNEL_ID

  if (token == null) throw new Error("DISCORD_TOKEN is required")
  if (clientId == null) throw new Error("DISCORD_CLIENT_ID is required")
  if (guildId == null) throw new Error("DISCORD_GUILD_ID is required")
  if (announcementChannelId == null) throw new Error("DISCORD_ANNOUNCEMENT_CHANNEL_ID is required")
  if (forumChannelId == null) throw new Error("DISCORD_FORUM_CHANNEL_ID is required")

  const client = createClient()
  const messaging = new DiscordMessaging(client, guildId, announcementChannelId, forumChannelId)
  const rideService = new RideService(rideRepo, messaging)
  const scheduler = new SchedulerService(rideRepo, messaging)

  await deployCommands(token, clientId, guildId)

  registerHelpCommand(client)
  registerNewRideCommand(client, rideService)
  registerRidesCommand(client, rideRepo)
  registerJoinRideHandler(client, rideService)
  registerMemberJoinedHandler(client)
  registerMemberLeftHandler(client, rideService)
  registerLeaveCancelHandler(client, rideService)
  registerEditRideHandler(client, rideRepo, rideService)
  registerParticipantsHandler(client, rideRepo)

  client.once("clientReady", () => {
    logger.info({ username: client.user?.tag, adapter: "discord" }, "Group Ride bot is running")
    scheduler.start()
  })

  client.on("error", (err) => {
    logger.error({ err }, "Unhandled Discord client error")
  })

  await client.login(token)
}
