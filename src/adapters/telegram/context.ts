import type { Context, SessionFlavor } from "grammy"
import type { ConversationFlavor } from "@grammyjs/conversations"

interface SessionData {}

export type BotContext = Context & SessionFlavor<SessionData> & ConversationFlavor
