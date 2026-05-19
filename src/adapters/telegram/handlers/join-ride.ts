import type { Bot } from "grammy"
import type { RideService } from "../../../services/ride.service"
import type { BotContext } from "../context"

export function registerJoinRideHandler(bot: Bot<BotContext>, rideService: RideService): void {
  bot.callbackQuery(/^join:(.+)$/, async (ctx) => {
    const rideId = ctx.match[1]!
    const userId = ctx.from.id
    await rideService.join(rideId, userId)
    await ctx.answerCallbackQuery({ text: "You're in! Check the ride topic." })
  })
}
