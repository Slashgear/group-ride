import { createConversation } from "@grammyjs/conversations"
import type { Bot } from "grammy"
import type { RideService } from "../../../services/ride.service"
import type { BotContext } from "../bot"
import { CREATE_RIDE_CONVERSATION, buildCreateRideConversation } from "../conversations/create-ride"

export function registerNewRideCommand(
  bot: Bot<BotContext>,
  rideService: RideService,
  telegramToken: string,
): void {
  bot.use(
    createConversation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buildCreateRideConversation(rideService, telegramToken) as any,
      CREATE_RIDE_CONVERSATION,
    ),
  )
  bot.command("newride", async (ctx) => {
    await ctx.conversation.enter(CREATE_RIDE_CONVERSATION)
  })
}
