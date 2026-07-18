import { type Conversation } from "@grammyjs/conversations"
import { InlineKeyboard } from "grammy"
import type { BotContext } from "../bot"
import type { CreateRideInput, Ride } from "../../../../domain/ride"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import type { RideService } from "../../../../services/ride.service"
import { parseDateAndTime, parseStats } from "../../shared/parse"
import { formatDate, formatDraftSummary } from "../format"
import { CapConflictError } from "../../../../domain/errors"

type Conv = Conversation<BotContext>
type Ctx = BotContext

const TIMEOUT_MS = 5 * 60 * 1000
const SKIP = "/skip"

export const EDIT_RIDE_CONVERSATION = "edit-ride"

async function waitForText(conversation: Conv, ctx: Ctx): Promise<string | null> {
  const msg = await conversation.waitFor("message:text", { maxMilliseconds: TIMEOUT_MS })
  if (msg == null) {
    await ctx.reply("⏱ Edit timed out.")
    return null
  }
  return msg.message.text.trim()
}

async function confirmAndSave(
  conversation: Conv,
  ctx: Ctx,
  confirmText: string,
  save: () => Promise<void>,
): Promise<void> {
  const kb = new InlineKeyboard()
    .text("✅ Save", "edit-confirm:yes")
    .text("❌ Cancel", "edit-confirm:no")
  await ctx.reply(confirmText, { reply_markup: kb, parse_mode: "HTML" })
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
  try {
    await save()
    await ctx.reply("✅ Ride updated!")
  } catch (err) {
    const text =
      err instanceof CapConflictError
        ? "❌ Cap conflict: fewer spots than current confirmed participants."
        : "❌ Something went wrong. Please try again."
    await ctx.reply(text)
  }
}

function buildConfirmText(changes: Partial<CreateRideInput>, ride: Ride, capLabel: string): string {
  return `Ready to update:\n\n${formatDraftSummary({
    date: changes.date ?? ride.date,
    meetingTime: "meetingTime" in changes ? changes.meetingTime : ride.meetingTime,
    meetingPoint: changes.meetingPoint ?? ride.meetingPoint,
    distanceKm: changes.distanceKm ?? ride.distanceKm,
    elevationGain: changes.elevationGain ?? ride.elevationGain,
    elevationLoss: changes.elevationLoss ?? ride.elevationLoss,
    notes: "notes" in changes ? changes.notes : ride.notes,
    proposerName: ride.proposerName,
  })}\n🔢 <b>Max participants:</b> ${capLabel}`
}

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

    const currentDateTime =
      ride.meetingTime == null
        ? formatDate(ride.date)
        : `${formatDate(ride.date)} ${ride.meetingTime}`
    await ctx.reply(`📅 Date & time? (current: <code>${currentDateTime}</code> — /skip)`, {
      parse_mode: "HTML",
    })
    const dateText = await waitForText(conversation, ctx)
    if (dateText == null) return
    if (dateText !== SKIP) {
      const parsed = parseDateAndTime(dateText)
      if (parsed == null) await ctx.reply("❌ Invalid format — keeping current date.")
      else {
        changes.date = parsed.date
        changes.meetingTime = parsed.meetingTime
      }
    }

    await ctx.reply(`📍 Meeting point? (current: <b>${ride.meetingPoint}</b> — /skip)`, {
      parse_mode: "HTML",
    })
    const mpText = await waitForText(conversation, ctx)
    if (mpText == null) return
    if (mpText !== SKIP) changes.meetingPoint = mpText

    await ctx.reply(
      `🌤 Weather city? Used for the forecast when the meeting point isn't a real address (current: ${ride.weatherCity ?? "none"} — /skip to keep, "clear" to remove)`,
    )
    const weatherCityText = await waitForText(conversation, ctx)
    if (weatherCityText == null) return
    if (weatherCityText !== SKIP) {
      changes.weatherCity = weatherCityText === "clear" ? undefined : weatherCityText
    }

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
    const statsText = await waitForText(conversation, ctx)
    if (statsText == null) return
    if (statsText !== SKIP) Object.assign(changes, parseStats(statsText))

    await ctx.reply(
      `📝 Notes? (current: ${ride.notes ?? "none"} — /skip to keep, "clear" to remove)`,
    )
    const notesText = await waitForText(conversation, ctx)
    if (notesText == null) return
    if (notesText !== SKIP) changes.notes = notesText === "clear" ? undefined : notesText

    const currentCap = ride.maxParticipants == null ? "none" : String(ride.maxParticipants)
    await ctx.reply(
      `🔢 Max participants? (current: ${currentCap} — /skip to keep, "0" to remove cap)`,
    )
    const capText = await waitForText(conversation, ctx)
    if (capText == null) return
    if (capText !== SKIP) {
      const capNum = Number(capText)
      if (capText === "0") changes.maxParticipants = undefined
      else if (!Number.isNaN(capNum) && capNum > 0) changes.maxParticipants = capNum
      else await ctx.reply("❌ Invalid number — keeping current cap.")
    }

    if (Object.keys(changes).length === 0) {
      await ctx.reply("No changes made.")
      return
    }

    const capLabel =
      "maxParticipants" in changes
        ? changes.maxParticipants == null
          ? "none"
          : String(changes.maxParticipants)
        : currentCap
    await confirmAndSave(conversation, ctx, buildConfirmText(changes, ride, capLabel), () =>
      conversation.external(() => rideService.update(rideId, changes)),
    )
  }
}
