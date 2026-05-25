import { createConversation } from "@grammyjs/conversations"
import { InlineKeyboard } from "grammy"
import type { Bot } from "grammy"
import type { RideRepository } from "../../../domain/ports/ride.repository"
import type { RideService } from "../../../services/ride.service"
import type { BotContext } from "../bot"
import { formatDate } from "../format"
import { EDIT_RIDE_CONVERSATION, buildEditRideConversation } from "../conversations/edit-ride"

export function registerEditCommand(
  bot: Bot<BotContext>,
  rideRepo: RideRepository,
  rideService: RideService,
): void {
  bot.use(
    createConversation(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      buildEditRideConversation(rideService, rideRepo) as any,
      EDIT_RIDE_CONVERSATION,
    ),
  )

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
}
