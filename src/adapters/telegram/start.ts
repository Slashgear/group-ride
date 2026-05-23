import { createConversation } from "@grammyjs/conversations"
import { InlineKeyboard } from "grammy"
import type { RideRepository } from "../../domain/ports/ride.repository"
import { RideService } from "../../services/ride.service"
import { SchedulerService } from "../../services/scheduler.service"
import { logger } from "../../logger"
import { createBot } from "./bot"
import { TelegramMessaging } from "./messaging"
import { formatDate } from "./format"
import {
  CREATE_RIDE_CONVERSATION,
  buildCreateRideConversation,
} from "./conversations/create-ride"
import { registerJoinRideHandler } from "./handlers/join-ride"
import { registerMemberJoinedHandler } from "./handlers/member-joined"
import { registerMemberLeftHandler } from "./handlers/member-left"

export async function startTelegram(rideRepo: RideRepository): Promise<void> {
  const token = process.env.TELEGRAM_TOKEN
  const groupChatId = process.env.TELEGRAM_GROUP_CHAT_ID

  if (token == null) throw new Error("TELEGRAM_TOKEN is required")
  if (groupChatId == null) throw new Error("TELEGRAM_GROUP_CHAT_ID is required")

  const bot = createBot(token)
  const messaging = new TelegramMessaging(bot.api, Number(groupChatId))
  const rideService = new RideService(rideRepo, messaging)
  const scheduler = new SchedulerService(rideRepo, messaging)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bot.use(createConversation(buildCreateRideConversation(rideService) as any, CREATE_RIDE_CONVERSATION))

  bot.command("newride", async (ctx) => {
    await ctx.conversation.enter(CREATE_RIDE_CONVERSATION)
  })

  bot.command("rides", async (ctx) => {
    const active = await rideRepo.findActive()
    const now = new Date()
    const upcoming = active
      .filter((r) => r.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5)

    if (upcoming.length === 0) {
      await ctx.reply("No upcoming rides at the moment.")
      return
    }

    const kb = new InlineKeyboard()
    const lines: string[] = [`<b>Upcoming rides (${upcoming.length})</b>`]
    for (const ride of upcoming) {
      const stats: string[] = []
      if (ride.meetingTime != null) stats.push(`🕐 ${ride.meetingTime}`)
      if (ride.distanceKm != null) stats.push(`📏 ${ride.distanceKm} km`)
      if (ride.elevationGain != null) stats.push(`⬆️ ${ride.elevationGain} m`)
      lines.push("", `📅 <b>${formatDate(ride.date)}</b> — ${ride.meetingPoint}`)
      if (stats.length > 0) lines.push(stats.join(" · "))
      kb.text("🚴 Join", `join:${ride.id}`).row()
    }
    await ctx.reply(lines.join("\n"), { parse_mode: "HTML", reply_markup: kb })
  })

  registerJoinRideHandler(bot, rideService)
  registerMemberJoinedHandler(bot)
  registerMemberLeftHandler(bot, rideService)

  bot.catch((err) => {
    logger.error({ err: err.error }, "Unhandled Telegram bot error")
  })

  logger.info({ adapter: "telegram" }, "Group Ride bot is running")
  scheduler.start()
  await bot.start({ allowed_updates: ["message", "callback_query", "chat_member"] })
}
