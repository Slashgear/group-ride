import { Bot, session } from "grammy"
import { conversations } from "@grammyjs/conversations"
import type { BotContext } from "./context"

export function createBot(token: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(token)
  bot.use(session({ initial: () => ({}) }))
  bot.use(conversations())
  return bot
}
