import { InlineKeyboard } from "grammy"
import type { Bot } from "grammy"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import type { BotContext } from "../bot"
import { formatDate } from "../format"

const MAX_RIDES_SHOWN = 5

export function registerRidesCommand(bot: Bot<BotContext>, rideRepo: RideRepository): void {
  bot.command("rides", async (ctx) => {
    const active = await rideRepo.findActive()
    const now = new Date()
    const upcoming = active
      .filter((r) => r.date >= now)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, MAX_RIDES_SHOWN)

    if (upcoming.length === 0) {
      await ctx.reply("No upcoming rides at the moment.")
      return
    }

    const kb = new InlineKeyboard()
    const lines: string[] = [`<b>Upcoming rides (${upcoming.length})</b>`]
    for (const ride of upcoming) {
      const stats: string[] = []
      if (ride.meetingTime != null) stats.push(`🕐 ${ride.meetingTime}`)
      if (ride.distanceKm != null) stats.push(`📏 ${ride.distanceKm} km`)
      if (ride.elevationGain != null) stats.push(`⬆️ ${ride.elevationGain} m`)
      lines.push("", `📅 <b>${formatDate(ride.date)}</b> — ${ride.meetingPoint}`)
      if (stats.length > 0) lines.push(stats.join(" · "))
      kb.text("🚴 Join", `join:${ride.id}`).row()
    }
    await ctx.reply(lines.join("\n"), { parse_mode: "HTML", reply_markup: kb })
  })
}
