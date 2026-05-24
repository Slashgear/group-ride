import { type Conversation } from "@grammyjs/conversations"
import { InlineKeyboard } from "grammy"
import type { BotContext } from "../bot"
import type { RideLevel } from "../../../domain/ride"
import type { RideService } from "../../../services/ride.service"
import {
  ExtractionFailedError,
  UnsupportedPlatformError,
  importFromUrl,
} from "../../../services/importer/index"
import { parseDateAndTime, parseStats } from "../../shared/parse"
import { formatDate, formatDraftSummary } from "../format"

type Conv = Conversation<BotContext>
type Ctx = BotContext

const TIMEOUT_MS = 10 * 60 * 1000
const SKIP = "/skip"

export const CREATE_RIDE_CONVERSATION = "create-ride"

type Prefill = {
  name?: string
  distanceKm?: number
  elevationGain?: number
  elevationLoss?: number
  level?: RideLevel
  externalUrl?: string
  notes?: string
}

export function buildCreateRideConversation(rideService: RideService) {
  return async (conversation: Conv, ctx: Ctx): Promise<void> => {
    const from = ctx.from
    if (from == null) return
    const proposerId = String(from.id)
    const proposerName =
      from.last_name != null ? `${from.first_name} ${from.last_name}` : from.first_name

    const prefill = await stepImport(conversation, ctx)
    const dateResult = await stepDate(conversation, ctx)
    if (dateResult == null) return
    const { date, meetingTime } = dateResult

    const meetingPoint = await stepText(conversation, ctx, "📍 Meeting point?")
    if (meetingPoint == null) return

    const name = await askOptionalText(conversation, ctx, "🏷 Ride name? (/skip to leave blank)")

    const stats = await stepStats(conversation, ctx, prefill)
    const level = stats.level ?? (await askLevel(conversation, ctx))
    const notes =
      prefill.notes ??
      (await askOptionalText(conversation, ctx, "📝 Notes? (/skip to leave blank)"))

    const confirmed = await stepConfirm(conversation, ctx, {
      date,
      meetingTime,
      meetingPoint,
      name: name ?? undefined,
      proposerName,
      ...stats,
      notes: notes ?? undefined,
      externalUrl: prefill.externalUrl,
    })
    if (!confirmed) return

    await rideService.propose({
      proposerId,
      proposerName,
      name: name ?? undefined,
      date,
      meetingTime,
      meetingPoint,
      distanceKm: stats.distanceKm,
      elevationGain: stats.elevationGain,
      elevationLoss: stats.elevationLoss,
      level,
      externalUrl: prefill.externalUrl,
      notes: notes ?? undefined,
    })
    await ctx.reply(`🎉 Ride created for ${formatDate(date)}! The group has been notified.`)
  }
}

async function stepImport(conversation: Conv, ctx: Ctx): Promise<Prefill> {
  await ctx.reply("🔗 Paste an import URL (Komoot, Strava, Garmin) or /skip to fill manually.")
  const msg = await conversation.waitFor("message:text", { maxMilliseconds: TIMEOUT_MS })
  if (msg == null || msg.message.text === SKIP) return {}
  try {
    return await importFromUrl(msg.message.text)
  } catch (err) {
    const warning =
      err instanceof UnsupportedPlatformError
        ? "⚠️ Platform not supported — continuing manually."
        : err instanceof ExtractionFailedError
          ? "⚠️ Could not extract details — continuing manually."
          : ""
    if (warning) await ctx.reply(warning)
    return {}
  }
}

async function stepDate(
  conversation: Conv,
  ctx: Ctx,
): Promise<{ date: Date; meetingTime?: string } | null> {
  await ctx.reply("📅 Date? <code>DD/MM/YYYY</code> or <code>DD/MM/YYYY HH:MM</code>", {
    parse_mode: "HTML",
  })
  while (true) {
    const msg = await conversation.waitFor("message:text", { maxMilliseconds: TIMEOUT_MS })
    if (msg == null) {
      await ctx.reply("⏱ Ride creation timed out.")
      return null
    }
    const parsed = parseDateAndTime(msg.message.text)
    if (parsed != null) return parsed
    await ctx.reply(
      "❌ Invalid format. Use <code>DD/MM/YYYY</code> or <code>DD/MM/YYYY HH:MM</code>.",
      {
        parse_mode: "HTML",
      },
    )
  }
}

async function stepStats(
  conversation: Conv,
  ctx: Ctx,
  prefill: Prefill,
): Promise<{
  distanceKm?: number
  elevationGain?: number
  elevationLoss?: number
  level?: RideLevel
}> {
  if (prefill.distanceKm != null || prefill.elevationGain != null) {
    return {
      distanceKm: prefill.distanceKm,
      elevationGain: prefill.elevationGain,
      elevationLoss: prefill.elevationLoss,
      level: prefill.level,
    }
  }
  await ctx.reply(
    "📊 Stats? <code>distance km / D+ m / D- m</code> (/skip)\nExample: <code>80 / 1200 / 1200</code>",
    { parse_mode: "HTML" },
  )
  const msg = await conversation.waitFor("message:text", { maxMilliseconds: TIMEOUT_MS })
  if (msg == null || msg.message.text === SKIP) return {}
  return parseStats(msg.message.text)
}

async function stepConfirm(
  conversation: Conv,
  ctx: Ctx,
  fields: Parameters<typeof formatDraftSummary>[0],
): Promise<boolean> {
  const summary = formatDraftSummary(fields)
  const kb = new InlineKeyboard()
    .text("✅ Create ride", "confirm:yes")
    .text("❌ Cancel", "confirm:no")
  await ctx.reply(`Ready to create:\n\n${summary}`, { reply_markup: kb, parse_mode: "HTML" })
  const cbq = await conversation.waitForCallbackQuery(/^confirm:/u, { maxMilliseconds: TIMEOUT_MS })
  if (cbq == null) {
    await ctx.reply("⏱ Ride creation timed out.")
    return false
  }
  await cbq.answerCallbackQuery()
  if (cbq.callbackQuery.data === "confirm:no") {
    await ctx.reply("Ride creation cancelled.")
    return false
  }
  return true
}

async function stepText(conversation: Conv, ctx: Ctx, prompt: string): Promise<string | null> {
  await ctx.reply(prompt)
  const msg = await conversation.waitFor("message:text", { maxMilliseconds: TIMEOUT_MS })
  if (msg == null) {
    await ctx.reply("⏱ Ride creation timed out.")
    return null
  }
  return msg.message.text
}

async function askOptionalText(
  conversation: Conv,
  ctx: Ctx,
  prompt: string,
): Promise<string | null> {
  await ctx.reply(prompt)
  const msg = await conversation.waitFor("message:text", { maxMilliseconds: TIMEOUT_MS })
  if (msg == null) return null
  return msg.message.text === SKIP ? null : msg.message.text
}

async function askLevel(conversation: Conv, ctx: Ctx): Promise<RideLevel | undefined> {
  const kb = new InlineKeyboard()
    .text("🟢 Easy", "level:easy")
    .text("🟡 Moderate", "level:moderate")
    .text("🔴 Hard", "level:hard")
    .row()
    .text("Skip", "level:skip")
  await ctx.reply("💪 Ride level?", { reply_markup: kb })
  const cbq = await conversation.waitForCallbackQuery(/^level:/u, { maxMilliseconds: TIMEOUT_MS })
  if (cbq == null) return undefined
  await cbq.answerCallbackQuery()
  const val = cbq.callbackQuery.data.split(":")[1]
  return val === "skip" || val == null ? undefined : (val as RideLevel)
}
