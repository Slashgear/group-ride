import { createConversation } from "@grammyjs/conversations"
import { createBot } from "./adapters/telegram/bot"
import { logger } from "./logger"
import { buildCreateRideConversation } from "./adapters/telegram/conversations/create-ride"
import { registerJoinRideHandler } from "./adapters/telegram/handlers/join-ride"
import { registerMemberJoinedHandler } from "./adapters/telegram/handlers/member-joined"
import { registerMemberLeftHandler } from "./adapters/telegram/handlers/member-left"
import { registerNewRideCommand } from "./adapters/telegram/handlers/new-ride"
import { TelegramMessaging } from "./adapters/telegram/messaging"
import { SqliteRideRepository } from "./adapters/sqlite/ride.repo"
import { RideService } from "./services/ride.service"
import { SchedulerService } from "./services/scheduler.service"

const token = process.env.BOT_TOKEN
const groupChatId = process.env.GROUP_CHAT_ID

if (!token) throw new Error("BOT_TOKEN is required")
if (!groupChatId) throw new Error("GROUP_CHAT_ID is required")

const bot = createBot(token)
const messaging = new TelegramMessaging(bot.api, Number(groupChatId))
const rideRepo = new SqliteRideRepository()
const rideService = new RideService(rideRepo, messaging)
const scheduler = new SchedulerService(rideRepo, messaging)

bot.use(createConversation(buildCreateRideConversation(rideService), "createRide"))

registerNewRideCommand(bot)
registerJoinRideHandler(bot, rideService)
registerMemberJoinedHandler(bot)
registerMemberLeftHandler(bot, rideService)

bot.catch((err) => logger.error({ err }, "Unhandled bot error"))

scheduler.start()

await bot.start({
  allowed_updates: ["message", "callback_query", "chat_member"],
  onStart: () => logger.info("Group Ride bot is running"),
})
