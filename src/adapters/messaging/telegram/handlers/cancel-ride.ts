import { InlineKeyboard, type Bot } from "grammy"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import { RideNotActiveError, RideNotFoundError } from "../../../../domain/errors"
import type { RideService } from "../../../../services/ride.service"
import type { BotContext } from "../bot"
import { formatDate } from "../format"
import { logger } from "../../../../logger"
import { getMessages } from "../../../../i18n"

const log = logger.child({ module: "telegram-cancel-ride" })

export function registerCancelRideHandler(
  bot: Bot<BotContext>,
  rideRepo: RideRepository,
  rideService: RideService,
): void {
  bot.command("cancel", async (ctx) => {
    const active = await rideRepo.findActive()
    if (active.length === 0) {
      await ctx.reply("No active rides to cancel.")
      return
    }
    const kb = new InlineKeyboard()
    for (const ride of active) {
      const label = `${formatDate(ride.date)} — ${ride.meetingPoint}`
      kb.text(`❌ ${label}`, `cancel-ride:${ride.id}`).row()
    }
    await ctx.reply("Which ride do you want to cancel?", { reply_markup: kb })
  })

  bot.callbackQuery(/^cancel-ride:(.+)$/u, async (ctx) => {
    const rideId = ctx.match[1] ?? ""
    const ride = await rideRepo.findById(rideId)
    if (ride == null || ride.status !== "active") {
      await ctx.answerCallbackQuery({ text: "Ride not found or already closed." })
      await ctx.editMessageReplyMarkup({ reply_markup: undefined })
      return
    }
    // Confirmation step
    const kb = new InlineKeyboard()
      .text("Yes, cancel it", `cancel-confirm:${rideId}`)
      .text("No, keep it", "cancel-abort")
    await ctx.editMessageText(
      `Cancel <b>${formatDate(ride.date)}</b> — ${ride.meetingPoint}? This will notify the group.`,
      { reply_markup: kb, parse_mode: "HTML" },
    )
    await ctx.answerCallbackQuery()
  })

  bot.callbackQuery(/^cancel-confirm:(.+)$/u, async (ctx) => {
    const rideId = ctx.match[1] ?? ""
    const m = getMessages()
    try {
      await rideService.cancel(rideId)
      await ctx.editMessageText(m.rideCancelledTelegram)
    } catch (err) {
      const text =
        err instanceof RideNotActiveError
          ? m.rideAlreadyCancelled
          : err instanceof RideNotFoundError
            ? m.rideNotFound
            : m.unexpectedError
      await ctx.editMessageText(`❌ ${text}`)
      if (!(err instanceof RideNotActiveError || err instanceof RideNotFoundError)) {
        log.error({ err, rideId }, "Unexpected error in cancel-ride handler")
        throw err
      }
    }
    await ctx.answerCallbackQuery()
  })

  bot.callbackQuery("cancel-abort", async (ctx) => {
    await ctx.editMessageText("OK, ride kept.")
    await ctx.answerCallbackQuery()
  })
}
