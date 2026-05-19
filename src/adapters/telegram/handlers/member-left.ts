import type { Bot } from "grammy"
import type { BotContext } from "../context"
import type { RideService } from "../../../services/ride.service"

export function registerMemberLeftHandler(bot: Bot<BotContext>, rideService: RideService): void {
  bot.on("chat_member", async (ctx) => {
    const { new_chat_member } = ctx.chatMember
    if (new_chat_member.status === "left" || new_chat_member.status === "kicked") {
      await rideService.removeMemberFromAllActiveRides(new_chat_member.user.id)
    }
  })
}
