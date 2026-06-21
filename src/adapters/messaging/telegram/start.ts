import type { RideRepository } from "../../../domain/ports/ride.repository"
import { RideService } from "../../../services/ride.service"
import { SchedulerService } from "../../../services/scheduler.service"
import { logger } from "../../../logger"
import { createBot } from "./bot"
import { TelegramMessaging } from "./messaging"
import { registerHelpCommand } from "./commands/help"
import { registerNewRideCommand } from "./commands/new-ride"
import { registerPastRidesCommand } from "./commands/past-rides"
import { registerRidesCommand } from "./commands/rides"
import { registerEditCommand } from "./commands/edit"
import { registerJoinRideHandler } from "./handlers/join-ride"
import { registerCancelRideHandler } from "./handlers/cancel-ride"
import { registerMemberJoinedHandler } from "./handlers/member-joined"
import { registerMemberLeftHandler } from "./handlers/member-left"

export async function startTelegram(rideRepo: RideRepository): Promise<void> {
  const token = process.env.TELEGRAM_TOKEN as string
  const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID as string

  const bot = createBot(token)
  const messaging = new TelegramMessaging(bot.api, Number(groupChatId))
  const rideService = new RideService(rideRepo, messaging)
  const scheduler = new SchedulerService(rideRepo, messaging)

  registerHelpCommand(bot)
  registerNewRideCommand(bot, rideService, token)
  registerRidesCommand(bot, rideRepo)
  registerPastRidesCommand(bot, rideRepo)
  registerEditCommand(bot, rideRepo, rideService)
  registerJoinRideHandler(bot, rideService)
  registerCancelRideHandler(bot, rideRepo, rideService)
  registerMemberJoinedHandler(bot)
  registerMemberLeftHandler(bot, rideService)

  bot.catch((err) => {
    logger.error({ err: err.error }, "Unhandled Telegram bot error")
  })

  await bot.api.setMyCommands([
    { command: "help", description: "How to use the Group Ride bot" },
    { command: "newride", description: "Propose a new group ride" },
    { command: "rides", description: "List upcoming rides" },
    { command: "pastrides", description: "List past rides" },
    { command: "edit", description: "Edit a ride you proposed" },
  ])

  logger.info({ adapter: "telegram" }, "Group Ride bot is running")
  scheduler.start()
  await bot.start({ allowed_updates: ["message", "callback_query", "chat_member", "inline_query"] })
}
