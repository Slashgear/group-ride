import { createClient } from "./adapters/discord/client"
import { deployCommands } from "./adapters/discord/deploy-commands"
import { registerNewRideCommand } from "./adapters/discord/commands/new-ride"
import { registerRidesCommand } from "./adapters/discord/commands/rides"
import { registerJoinRideHandler } from "./adapters/discord/handlers/join-ride"
import { registerMemberJoinedHandler } from "./adapters/discord/handlers/member-joined"
import { registerMemberLeftHandler } from "./adapters/discord/handlers/member-left"
import { registerLeaveCancelHandler } from "./adapters/discord/handlers/leave-cancel"
import { registerEditRideHandler } from "./adapters/discord/handlers/edit-ride"
import { registerParticipantsHandler } from "./adapters/discord/handlers/participants"
import { DiscordMessaging } from "./adapters/discord/messaging"
import { SqliteRideRepository } from "./adapters/sqlite/ride.repo"
import { RideService } from "./services/ride.service"
import { SchedulerService } from "./services/scheduler.service"
import { logger } from "./logger"

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
const rideRepo = new SqliteRideRepository()
const rideService = new RideService(rideRepo, messaging)
const scheduler = new SchedulerService(rideRepo, messaging)

await deployCommands(token, clientId, guildId)

registerNewRideCommand(client, rideService)
registerRidesCommand(client, rideRepo)
registerJoinRideHandler(client, rideService)
registerMemberJoinedHandler(client)
registerMemberLeftHandler(client, rideService)
registerLeaveCancelHandler(client, rideService)
registerEditRideHandler(client, rideRepo, rideService)
registerParticipantsHandler(client, rideRepo)

client.once("clientReady", () => {
  logger.info({ username: client.user?.tag }, "Group Ride bot is running")
  scheduler.start()
})

client.on("error", (err) => {
  logger.error({ err }, "Unhandled Discord client error")
})

await client.login(token)
