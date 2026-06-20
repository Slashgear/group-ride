import { type Conversation } from "@grammyjs/conversations"
import { InlineKeyboard } from "grammy"
import type { BotContext } from "../bot"
import type { RideLevel } from "../../../../domain/ride"
import type { RideService } from "../../../../services/ride.service"
import {
  ExtractionFailedError,
  UnsupportedPlatformError,
  importFromUrl,
} from "../../../../services/importer/index"
import { parseGpx } from "../../../../services/importer/gpx"
import { generateRouteMap } from "../../../../services/map-generator"
import { parseDateAndTime, parseStats } from "../../shared/parse"
import { formatDate, formatDraftSummary } from "../format"
import { logger } from "../../../../logger"

const log = logger.child({ module: "telegram-create-ride" })

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
  gpxUrl?: string
  externalUrl?: string
  notes?: string
}

export function buildCreateRideConversation(rideService: RideService, telegramToken: string) {
  return async (conversation: Conv, ctx: Ctx): Promise<void> => {
    const from = ctx.from
    if (from == null) return
    const proposerId = String(from.id)
    const proposerName =
      from.last_name == null ? from.first_name : `${from.first_name} ${from.last_name}`

    const { prefill, mapImage } = await stepImport(conversation, ctx, telegramToken)
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
      gpxUrl: prefill.gpxUrl,
      externalUrl: prefill.externalUrl,
      notes: notes ?? undefined,
      mapImageBuffer: mapImage,
    })
    await ctx.reply(`🎉 Ride created for ${formatDate(date)}! The group has been notified.`)
  }
}

async function stepImport(
  conversation: Conv,
  ctx: Ctx,
  telegramToken: string,
): Promise<{ prefill: Prefill; mapImage?: Buffer }> {
  await ctx.reply(
    "🔗 Paste an import URL (Komoot, Strava, Garmin), send a 📎 <b>.gpx file</b>, or /skip to fill manually.",
    { parse_mode: "HTML" },
  )
  const update = await conversation.wait({ maxMilliseconds: TIMEOUT_MS })
  if (update == null) return { prefill: {} }

  const text = update.message?.text
  const doc = update.message?.document

  if (text === SKIP) return { prefill: {} }

  if (doc != null && doc.file_name?.toLowerCase().endsWith(".gpx") === true) {
    try {
      const fileInfo = await update.api.getFile(doc.file_id)
      if (fileInfo.file_path == null) throw new Error("No file path returned")
      const fileUrl = `https://api.telegram.org/file/bot${telegramToken}/${fileInfo.file_path}`
      const res = await fetch(fileUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buffer = Buffer.from(await res.arrayBuffer())
      const parsed = parseGpx(buffer)
      let mapImage: Buffer | undefined
      if (parsed.coordinates.length >= 2) {
        try {
          mapImage = await generateRouteMap(parsed.coordinates)
        } catch (mapErr) {
          log.warn({ err: mapErr }, "Map generation failed, continuing without map")
        }
      }
      const prefill: Prefill = {
        name: parsed.name,
        distanceKm: parsed.distanceKm,
        elevationGain: parsed.elevationGain,
        elevationLoss: parsed.elevationLoss,
        gpxUrl: `tg://file/${doc.file_id}`,
      }
      return { prefill, mapImage }
    } catch (err) {
      log.warn({ err }, "GPX file processing failed")
      await ctx.reply("⚠️ Could not read GPX file — continuing manually.")
      return { prefill: {} }
    }
  }

  if (text != null) {
    try {
      const imported = await importFromUrl(text)
      return { prefill: imported }
    } catch (err) {
      const warning =
        err instanceof UnsupportedPlatformError
          ? "⚠️ Platform not supported — continuing manually."
          : err instanceof ExtractionFailedError
            ? "⚠️ Could not extract details — continuing manually."
            : ""
      if (warning) await ctx.reply(warning)
      return { prefill: {} }
    }
  }

  return { prefill: {} }
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
