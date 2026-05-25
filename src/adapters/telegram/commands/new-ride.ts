import { createConversation } from "@grammyjs/conversations"
import type { Bot } from "grammy"
import type { RideService } from "../../../services/ride.service"
import type { BotContext } from "../bot"
import { CREATE_RIDE_CONVERSATION, buildCreateRideConversation } from "../conversations/create-ride"

export function registerNewRideCommand(bot: Bot<BotContext>, rideService: RideService): void {
  bot.use(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    createConversation(buildCreateRideConversation(rideService) as any, CREATE_RIDE_CONVERSATION),
  )
  bot.command("newride", async (ctx) => {
    await ctx.conversation.enter(CREATE_RIDE_CONVERSATION)
  })
}
