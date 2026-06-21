const DISCORD_REQUIRED = [
  "DISCORD_TOKEN",
  "DISCORD_CLIENT_ID",
  "DISCORD_GUILD_ID",
  "DISCORD_ANNOUNCEMENT_CHANNEL_ID",
  "DISCORD_FORUM_CHANNEL_ID",
] as const

const TELEGRAM_REQUIRED = ["TELEGRAM_TOKEN", "TELEGRAM_GROUP_CHAT_ID"] as const

export function validateConfig(): { warnings: string[] } {
  const adapter = (process.env.ADAPTER ?? "discord").toLowerCase()
  const isTelegram = adapter === "telegram"
  const required = isTelegram ? TELEGRAM_REQUIRED : DISCORD_REQUIRED
  const unused = isTelegram ? DISCORD_REQUIRED : TELEGRAM_REQUIRED

  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`)
  }

  const warnings: string[] = []
  const spurious = unused.filter((key) => process.env[key])
  if (spurious.length > 0) {
    warnings.push(
      `The following variables are set but will be ignored (active adapter: ${adapter}): ${spurious.join(", ")}`,
    )
  }

  return { warnings }
}
