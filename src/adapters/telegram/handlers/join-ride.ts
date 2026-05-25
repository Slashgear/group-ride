import type { Bot } from "grammy"
import { AlreadyMemberError, RideNotActiveError, RideNotFoundError } from "../../../domain/errors"
import type { RideService } from "../../../services/ride.service"
import type { BotContext } from "../bot"

export function registerJoinRideHandler(bot: Bot<BotContext>, rideService: RideService): void {
  bot.callbackQuery(/^join:(.+)$/u, async (ctx) => {
    const rideId = ctx.match[1] ?? ""
    const userId = String(ctx.from.id)
    try {
      await rideService.join(rideId, userId)
      await ctx.answerCallbackQuery({ text: "You're in! Check the ride topic. 🚴" })
    } catch (err) {
      const text =
        err instanceof AlreadyMemberError
          ? "You're already registered for this ride."
          : err instanceof RideNotActiveError
            ? "This ride has been cancelled."
            : err instanceof RideNotFoundError
              ? "This ride no longer exists."
              : "Something went wrong. Please try again."
      await ctx.answerCallbackQuery({ text, show_alert: true })
      if (!(err instanceof AlreadyMemberError || err instanceof RideNotActiveError || err instanceof RideNotFoundError)) throw err
    }
  })
}
