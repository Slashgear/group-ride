import { InlineKeyboard, type Bot } from "grammy"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import { RideNotActiveError, RideNotFoundError } from "../../../../domain/errors"
import type { RideService } from "../../../../services/ride.service"
import type { BotContext } from "../bot"
import { formatDate } from "../format"

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
    try {
      await rideService.cancel(rideId)
      await ctx.editMessageText("✅ Ride has been cancelled and the group notified.")
    } catch (err) {
      const text =
        err instanceof RideNotActiveError
          ? "This ride has already been cancelled."
          : err instanceof RideNotFoundError
            ? "This ride no longer exists."
            : "Something went wrong. Please try again."
      await ctx.editMessageText(`❌ ${text}`)
      if (!(err instanceof RideNotActiveError || err instanceof RideNotFoundError)) throw err
    }
    await ctx.answerCallbackQuery()
  })

  bot.callbackQuery("cancel-abort", async (ctx) => {
    await ctx.editMessageText("OK, ride kept.")
    await ctx.answerCallbackQuery()
  })
}
