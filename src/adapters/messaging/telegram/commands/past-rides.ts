import type { Bot } from "grammy"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import type { BotContext } from "../bot"
import type { Ride } from "../../../../domain/ride"
import { formatDate } from "../format"

const MAX_PAST_RIDES_SHOWN = 5

const STATUS_LABEL: Record<string, string> = {
  closed: "✅ Completed",
  cancelled: "❌ Cancelled",
  active: "⏳ Active",
}

export function registerPastRidesCommand(bot: Bot<BotContext>, rideRepo: RideRepository): void {
  bot.command("pastrides", async (ctx) => {
    const past = await rideRepo.findPast(MAX_PAST_RIDES_SHOWN)

    if (past.length === 0) {
      await ctx.reply("No past rides yet.")
      return
    }

    const lines: string[] = [`<b>Past rides (${past.length})</b>`]
    for (const ride of past) {
      lines.push("", formatPastRideLine(ride))
    }

    await ctx.reply(lines.join("\n"), { parse_mode: "HTML" })
  })
}

function formatPastRideLine(ride: Ride): string {
  const stats: string[] = []
  if (ride.meetingTime != null) stats.push(`🕐 ${ride.meetingTime}`)
  if (ride.distanceKm != null) stats.push(`📏 ${ride.distanceKm} km`)
  if (ride.elevationGain != null) stats.push(`⬆️ ${ride.elevationGain} m`)
  const status = STATUS_LABEL[ride.status] ?? ride.status
  stats.push(status)
  const header = `📅 <b>${formatDate(ride.date)}</b> — ${ride.meetingPoint}`
  return stats.length > 0 ? `${header}\n${stats.join(" · ")}` : header
}
