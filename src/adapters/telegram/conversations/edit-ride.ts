import { type Conversation } from "@grammyjs/conversations"
import { InlineKeyboard } from "grammy"
import type { BotContext } from "../bot"
import type { CreateRideInput } from "../../../domain/ride"
import type { RideRepository } from "../../../domain/ports/ride.repository"
import type { RideService } from "../../../services/ride.service"
import { parseDateAndTime, parseStats } from "../../shared/parse"
import { formatDate, formatDraftSummary } from "../format"

type Conv = Conversation<BotContext>
type Ctx = BotContext

const TIMEOUT_MS = 5 * 60 * 1000
const SKIP = "/skip"

export const EDIT_RIDE_CONVERSATION = "edit-ride"

export function buildEditRideConversation(rideService: RideService, rideRepo: RideRepository) {
  return async (conversation: Conv, ctx: Ctx): Promise<void> => {
    const rideId = ctx.session.editRideId
    if (rideId == null) return
    ctx.session.editRideId = undefined

    const ride = await conversation.external(() => rideRepo.findById(rideId))
    if (ride == null || ride.status !== "active") {
      await ctx.reply("❌ Ride not found or no longer active.")
      return
    }

    await ctx.reply(
      `✏️ Editing: <b>${formatDate(ride.date)}</b> — ${ride.meetingPoint}\nAnswer each question or /skip to keep the current value.`,
      { parse_mode: "HTML" },
    )

    const changes: Partial<CreateRideInput> = {}

    // ── Date & time ────────────────────────────────────────────────────────────
    const currentDateTime =
      ride.meetingTime == null
        ? formatDate(ride.date)
        : `${formatDate(ride.date)} ${ride.meetingTime}`
    await ctx.reply(`📅 Date & time? (current: <code>${currentDateTime}</code> — /skip)`, {
      parse_mode: "HTML",
    })
    const dateMsg = await conversation.waitFor("message:text", { maxMilliseconds: TIMEOUT_MS })
    if (dateMsg == null) {
      await ctx.reply("⏱ Edit timed out.")
      return
    }
    if (dateMsg.message.text.trim() !== SKIP) {
      const parsed = parseDateAndTime(dateMsg.message.text.trim())
      if (parsed == null) {
        await ctx.reply("❌ Invalid format — keeping current date.")
      } else {
        changes.date = parsed.date
        changes.meetingTime = parsed.meetingTime
      }
    }

    // ── Meeting point ──────────────────────────────────────────────────────────
    await ctx.reply(`📍 Meeting point? (current: <b>${ride.meetingPoint}</b> — /skip)`, {
      parse_mode: "HTML",
    })
    const mpMsg = await conversation.waitFor("message:text", { maxMilliseconds: TIMEOUT_MS })
    if (mpMsg == null) {
      await ctx.reply("⏱ Edit timed out.")
      return
    }
    if (mpMsg.message.text.trim() !== SKIP) changes.meetingPoint = mpMsg.message.text.trim()

    // ── Stats ──────────────────────────────────────────────────────────────────
    const currentStats =
      ride.distanceKm != null || ride.elevationGain != null
        ? [
            ride.distanceKm == null ? null : `${ride.distanceKm} km`,
            ride.elevationGain == null ? null : `D+ ${ride.elevationGain} m`,
            ride.elevationLoss == null ? null : `D- ${ride.elevationLoss} m`,
          ]
            .filter(Boolean)
            .join(" / ")
        : "none"
    await ctx.reply(
      `📊 Stats? <code>distance km / D+ m / D- m</code> (current: ${currentStats} — /skip)`,
      { parse_mode: "HTML" },
    )
    const statsMsg = await conversation.waitFor("message:text", { maxMilliseconds: TIMEOUT_MS })
    if (statsMsg == null) {
      await ctx.reply("⏱ Edit timed out.")
      return
    }
    if (statsMsg.message.text.trim() !== SKIP) {
      const stats = parseStats(statsMsg.message.text.trim())
      Object.assign(changes, stats)
    }

    // ── Notes ──────────────────────────────────────────────────────────────────
    await ctx.reply(
      `📝 Notes? (current: ${ride.notes ?? "none"} — /skip to keep, "clear" to remove)`,
    )
    const notesMsg = await conversation.waitFor("message:text", { maxMilliseconds: TIMEOUT_MS })
    if (notesMsg == null) {
      await ctx.reply("⏱ Edit timed out.")
      return
    }
    const notesText = notesMsg.message.text.trim()
    if (notesText !== SKIP) changes.notes = notesText === "clear" ? undefined : notesText

    if (Object.keys(changes).length === 0) {
      await ctx.reply("No changes made.")
      return
    }

    // ── Confirm ────────────────────────────────────────────────────────────────
    const kb = new InlineKeyboard()
      .text("✅ Save", "edit-confirm:yes")
      .text("❌ Cancel", "edit-confirm:no")
    await ctx.reply(
      `Ready to update:\n\n${formatDraftSummary({
        date: changes.date ?? ride.date,
        meetingTime: "meetingTime" in changes ? changes.meetingTime : ride.meetingTime,
        meetingPoint: changes.meetingPoint ?? ride.meetingPoint,
        distanceKm: changes.distanceKm ?? ride.distanceKm,
        elevationGain: changes.elevationGain ?? ride.elevationGain,
        elevationLoss: changes.elevationLoss ?? ride.elevationLoss,
        notes: "notes" in changes ? changes.notes : ride.notes,
        proposerName: ride.proposerName,
      })}`,
      { reply_markup: kb, parse_mode: "HTML" },
    )

    const cbq = await conversation.waitForCallbackQuery(/^edit-confirm:/u, {
      maxMilliseconds: TIMEOUT_MS,
    })
    if (cbq == null) {
      await ctx.reply("⏱ Edit timed out.")
      return
    }
    await cbq.answerCallbackQuery()
    if (cbq.callbackQuery.data === "edit-confirm:no") {
      await ctx.reply("Edit cancelled.")
      return
    }

    await conversation.external(() => rideService.update(rideId, changes))
    await ctx.reply("✅ Ride updated!")
  }
}
