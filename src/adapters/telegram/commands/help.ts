import type { Bot } from "grammy"
import type { BotContext } from "../bot"

const HELP_MESSAGE = [
  "<b>🚴 Group Ride — How it works</b>",
  "",
  "<b>Propose a ride</b>",
  "Use /newride and follow the prompts. Paste a Komoot/Strava/Garmin link to auto-fill distance and elevation.",
  "",
  "<b>Join a ride</b>",
  "When a ride is announced, tap the <b>Join</b> button. You can also use /rides to browse upcoming rides.",
  "",
  "<b>Edit a ride</b>",
  "Use /edit to update a ride you proposed.",
  "",
  "<b>Leave or cancel</b>",
  "Use the <b>Leave</b> or <b>Cancel ride</b> buttons on the ride message.",
].join("\n")

export function registerHelpCommand(bot: Bot<BotContext>): void {
  bot.command("help", async (ctx) => {
    await ctx.reply(HELP_MESSAGE, { parse_mode: "HTML" })
  })
}
