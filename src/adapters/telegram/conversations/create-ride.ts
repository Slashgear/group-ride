import type { Conversation } from "@grammyjs/conversations"
import { InlineKeyboard } from "grammy"
import type { RideLevel } from "../../../domain/ride"
import type { RideService } from "../../../services/ride.service"
import {
  ExtractionFailedError,
  UnsupportedPlatformError,
  importFromUrl,
} from "../../../services/importer/index"
import type { BotContext } from "../context"
import { formatDate, formatDraftSummary } from "../format"

type CreateRideConversation = Conversation<BotContext>

export function buildCreateRideConversation(rideService: RideService) {
  return async (conversation: CreateRideConversation, ctx: BotContext): Promise<void> => {
    const proposerId = ctx.from!.id
    let prefill: {
      distanceKm?: number
      elevationGain?: number
      elevationLoss?: number
      externalUrl?: string
    } = {}

    // Step 1: optional link import
    await ctx.reply(
      "Do you have a link to import? (Komoot, Strava, Garmin)\nSend the URL or /skip to fill manually.",
    )
    const linkMsg = await conversation.waitFor("message:text")
    const linkText = linkMsg.message.text

    if (linkText !== "/skip") {
      try {
        prefill = await importFromUrl(linkText)
        await ctx.reply("✅ Details imported. Review and correct them in the next steps.")
      } catch (err) {
        if (err instanceof UnsupportedPlatformError) {
          await ctx.reply("⚠️ This platform is not supported. Switching to manual entry.")
        } else if (err instanceof ExtractionFailedError) {
          await ctx.reply(
            "⚠️ Could not extract details — the activity may be private. Switching to manual entry.",
          )
        }
      }
    }

    // Step 2: date (required, retry until valid)
    await ctx.reply("📅 What is the ride date? (DD/MM/YYYY)")
    let date: Date | null = null
    while (!date) {
      const msg = await conversation.waitFor("message:text")
      date = parseDate(msg.message.text)
      if (!date) await ctx.reply("❌ Invalid format. Please use DD/MM/YYYY.")
    }

    // Step 3: meeting point (required)
    await ctx.reply("📍 Where is the meeting point?")
    const meetingMsg = await conversation.waitFor("message:text")
    const meetingPoint = meetingMsg.message.text

    // Step 4: distance (optional)
    const distPrompt =
      prefill.distanceKm != null
        ? `📏 Distance: <b>${prefill.distanceKm} km</b> — send a new value, /keep or /skip.`
        : "📏 Distance in km? (/skip to leave blank)"
    await ctx.reply(distPrompt, { parse_mode: "HTML" })
    const distMsg = await conversation.waitFor("message:text")
    const distanceKm = parseOptionalNumber(distMsg.message.text, prefill.distanceKm)

    // Step 5: D+ elevation gain (optional)
    const gainPrompt =
      prefill.elevationGain != null
        ? `⬆️ D+: <b>${prefill.elevationGain} m</b> — send a new value, /keep or /skip.`
        : "⬆️ Elevation gain D+ in meters? (/skip to leave blank)"
    await ctx.reply(gainPrompt, { parse_mode: "HTML" })
    const gainMsg = await conversation.waitFor("message:text")
    const elevationGain = parseOptionalNumber(gainMsg.message.text, prefill.elevationGain)

    // Step 6: D- elevation loss (optional)
    const lossPrompt =
      prefill.elevationLoss != null
        ? `⬇️ D-: <b>${prefill.elevationLoss} m</b> — send a new value, /keep or /skip.`
        : "⬇️ Elevation loss D- in meters? (/skip to leave blank)"
    await ctx.reply(lossPrompt, { parse_mode: "HTML" })
    const lossMsg = await conversation.waitFor("message:text")
    const elevationLoss = parseOptionalNumber(lossMsg.message.text, prefill.elevationLoss)

    // Step 7: level (optional, inline keyboard)
    const levelKeyboard = new InlineKeyboard()
      .text("🟢 Easy", "level:easy")
      .text("🟡 Moderate", "level:moderate")
      .text("🔴 Hard", "level:hard")
      .row()
      .text("Skip", "level:skip")
    await ctx.reply("💪 What is the ride level?", { reply_markup: levelKeyboard })
    const levelCbq = await conversation.waitForCallbackQuery(/^level:/)
    await levelCbq.answerCallbackQuery()
    const levelData = levelCbq.callbackQuery.data.split(":")[1]
    const level: RideLevel | undefined = levelData === "skip" ? undefined : (levelData as RideLevel)

    // Step 8: GPX URL (optional)
    await ctx.reply("🗺️ GPX track URL? (/skip to leave blank)")
    const gpxMsg = await conversation.waitFor("message:text")
    const gpxUrl = gpxMsg.message.text === "/skip" ? undefined : gpxMsg.message.text

    // Step 9: notes (optional)
    await ctx.reply("📝 Any notes? (/skip to leave blank)")
    const notesMsg = await conversation.waitFor("message:text")
    const notes = notesMsg.message.text === "/skip" ? undefined : notesMsg.message.text

    // Step 10: confirmation
    const summary = formatDraftSummary({
      date,
      meetingPoint,
      distanceKm,
      elevationGain,
      elevationLoss,
      level,
      gpxUrl,
      externalUrl: prefill.externalUrl,
      notes,
    })
    const confirmKeyboard = new InlineKeyboard()
      .text("✅ Confirm", "confirm:yes")
      .text("❌ Cancel", "confirm:no")
    await ctx.reply(`Here's your ride:\n\n${summary}`, {
      reply_markup: confirmKeyboard,
      parse_mode: "HTML",
    })
    const confirmCbq = await conversation.waitForCallbackQuery(/^confirm:/)
    await confirmCbq.answerCallbackQuery()

    if (confirmCbq.callbackQuery.data === "confirm:no") {
      await ctx.reply("Ride creation cancelled.")
      return
    }

    await rideService.propose({
      proposerId,
      date,
      meetingPoint,
      distanceKm,
      elevationGain,
      elevationLoss,
      level,
      gpxUrl,
      externalUrl: prefill.externalUrl,
      notes,
    })
    await ctx.reply(`🎉 Ride created for ${formatDate(date)}! The group has been notified.`)
  }
}

function parseDate(text: string): Date | null {
  const parts = text.split("/").map(Number)
  if (parts.length !== 3) return null
  const [day, month, year] = parts as [number, number, number]
  const date = new Date(year, month - 1, day)
  return isNaN(date.getTime()) ? null : date
}

function parseOptionalNumber(text: string, prefill?: number): number | undefined {
  if (text === "/keep" && prefill != null) return prefill
  if (text === "/skip") return undefined
  const n = Number(text)
  return isNaN(n) ? undefined : n
}
