import type { Bot } from "grammy"
import type { BotContext } from "../context"

export function registerMemberJoinedHandler(bot: Bot<BotContext>): void {
  bot.on("chat_member", async (ctx) => {
    const { new_chat_member } = ctx.chatMember
    if (new_chat_member.status === "member" || new_chat_member.status === "administrator") {
      await ctx.reply(`Welcome to Group Ride, ${new_chat_member.user.first_name}!`)
    }
  })
}
