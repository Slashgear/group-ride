import type { Bot } from "grammy"
import type { RideService } from "../../../services/ride.service"
import type { BotContext } from "../bot"

export function registerJoinRideHandler(bot: Bot<BotContext>, rideService: RideService): void {
  bot.callbackQuery(/^join:(.+)$/u, async (ctx) => {
    const rideId = ctx.match[1] ?? ""
    const { id: userId } = ctx.from
    await rideService.join(rideId, userId)
    await ctx.answerCallbackQuery({ text: "You're in! Check the ride topic." })
  })
}
