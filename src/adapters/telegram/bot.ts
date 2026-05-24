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
  // Casts needed because grammY's complex intersection types don't align perfectly
  // with strict TypeScript variance rules — runtime behaviour is correct.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bot.use(session({ initial: (): SessionData => ({}) }) as any)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bot.use(conversations() as any)
  return bot
}
