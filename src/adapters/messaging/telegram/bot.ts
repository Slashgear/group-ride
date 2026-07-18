import { Bot, type Context, type SessionFlavor, session } from "grammy"
import { type ConversationFlavor, conversations } from "@grammyjs/conversations"

interface SessionData {
  /** rideId selected in /edit before entering the edit conversation */
  editRideId?: string
}
export type BotContext = Context &
  SessionFlavor<SessionData> &
  ConversationFlavor<Context & SessionFlavor<SessionData>>

export function createBot(token: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(token)
  bot.use(session({ initial: (): SessionData => ({}) }))
  bot.use(conversations())
  return bot
}
