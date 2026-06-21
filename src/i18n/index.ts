import { messages as en } from "./en"
import { messages as fr } from "./fr"

export type Messages = typeof en

const LOCALES: Record<string, Messages> = { en, fr }

export function getMessages(): Messages {
  const lang = (process.env.LANG ?? "en").toLowerCase().slice(0, 2)
  return LOCALES[lang] ?? en
}
