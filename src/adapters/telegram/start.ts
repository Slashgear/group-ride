import { createConversation } from "@grammyjs/conversations"
import { InlineKeyboard } from "grammy"
import type { RideRepository } from "../../domain/ports/ride.repository"
import { RideService } from "../../services/ride.service"
import { SchedulerService } from "../../services/scheduler.service"
import { logger } from "../../logger"
import { createBot } from "./bot"
import { TelegramMessaging } from "./messaging"
import { formatDate } from "./format"
import { CREATE_RIDE_CONVERSATION, buildCreateRideConversation } from "./conversations/create-ride"
import { EDIT_RIDE_CONVERSATION, buildEditRideConversation } from "./conversations/edit-ride"
import { registerJoinRideHandler } from "./handlers/join-ride"
import { registerCancelRideHandler } from "./handlers/cancel-ride"
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
  bot.use(
    createConversation(buildCreateRideConversation(rideService) as any, CREATE_RIDE_CONVERSATION),
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bot.use(
    createConversation(
      buildEditRideConversation(rideService, rideRepo) as any,
      EDIT_RIDE_CONVERSATION,
    ),
  )

  bot.command("help", async (ctx) => {
    await ctx.reply(
      [
        "<b>🚴 Group Ride — How it works</b>",
        "",
        "<b>Propose a ride</b>",
        "Use /newride and follow the prompts. Paste a Komoot/Strava/Garmin link to auto-fill distance and elevation.",
        "",
        "<b>Join a ride</b>",
        "When a ride is announced, tap the <b>Join</b> button. You can also use /rides to browse upcoming rides.",
        "",
        "<b>Edit a ride</b>",
        "Use /edit to update a ride you proposed.",
        "",
        "<b>Leave or cancel</b>",
        "Use the <b>Leave</b> or <b>Cancel ride</b> buttons on the ride message.",
      ].join("\n"),
      { parse_mode: "HTML" },
    )
  })

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

  bot.command("edit", async (ctx) => {
    const active = await rideRepo.findActive()
    if (active.length === 0) {
      await ctx.reply("No active rides to edit.")
      return
    }
    const kb = new InlineKeyboard()
    for (const ride of active) {
      kb.text(`✏️ ${formatDate(ride.date)} — ${ride.meetingPoint}`, `edit-ride:${ride.id}`).row()
    }
    await ctx.reply("Which ride do you want to edit?", { reply_markup: kb })
  })

  bot.callbackQuery(/^edit-ride:(.+)$/u, async (ctx) => {
    ctx.session.editRideId = ctx.match[1] ?? ""
    await ctx.answerCallbackQuery()
    await ctx.editMessageReplyMarkup({ reply_markup: undefined })
    await ctx.conversation.enter(EDIT_RIDE_CONVERSATION)
  })

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
    { command: "edit", description: "Edit a ride you proposed" },
  ])

  logger.info({ adapter: "telegram" }, "Group Ride bot is running")
  scheduler.start()
  await bot.start({ allowed_updates: ["message", "callback_query", "chat_member", "inline_query"] })
}
