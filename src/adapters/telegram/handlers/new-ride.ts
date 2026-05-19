import type { Bot } from "grammy"
import type { BotContext } from "../context"

export function registerNewRideCommand(bot: Bot<BotContext>): void {
  bot.command("newride", async (ctx) => {
    await ctx.conversation.enter("createRide")
  })
}
