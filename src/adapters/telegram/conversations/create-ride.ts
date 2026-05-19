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

interface Prefill {
  distanceKm?: number
  elevationGain?: number
  elevationLoss?: number
  level?: RideLevel
  notes?: string
  externalUrl?: string
}

export function buildCreateRideConversation(rideService: RideService) {
  return async (conversation: CreateRideConversation, ctx: BotContext): Promise<void> => {
    const proposerId = ctx.from!.id
    let prefill: Prefill = {}
    let importConfirmed = false

    // Step 1: optional link import
    await ctx.reply(
      "Do you have a link to import? (Komoot, Strava, Garmin)\nSend the URL or /skip to fill manually.",
    )
    const linkMsg = await conversation.waitFor("message:text")
    const linkText = linkMsg.message.text

    if (linkText !== "/skip") {
      try {
        prefill = await importFromUrl(linkText)
        const preview = formatDraftSummary({
          date: new Date(),
          meetingPoint: "—",
          ...prefill,
        })
        const kb = new InlineKeyboard()
          .text("✅ Confirm imported data", "import:confirm")
          .row()
          .text("✏️ Edit field by field", "import:edit")
        await ctx.reply(
          `Here's what I found:\n\n${preview}\n\n<i>Date and meeting point are not in the import — you'll fill them next.</i>`,
          { reply_markup: kb, parse_mode: "HTML" },
        )
        const cbq = await conversation.waitForCallbackQuery(/^import:/)
        await cbq.answerCallbackQuery()
        importConfirmed = cbq.callbackQuery.data === "import:confirm"
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

    // Optional fields — skipped if import was confirmed, shown with buttons if editing
    let distanceKm: number | undefined = prefill.distanceKm
    let elevationGain: number | undefined = prefill.elevationGain
    let elevationLoss: number | undefined = prefill.elevationLoss
    let level: RideLevel | undefined = prefill.level
    let notes: string | undefined = prefill.notes

    if (!importConfirmed) {
      distanceKm = await askNumberField(conversation, ctx, "📏 Distance in km?", prefill.distanceKm)
      elevationGain = await askNumberField(
        conversation,
        ctx,
        "⬆️ Elevation gain D+ in meters?",
        prefill.elevationGain,
      )
      elevationLoss = await askNumberField(
        conversation,
        ctx,
        "⬇️ Elevation loss D- in meters?",
        prefill.elevationLoss,
      )
      level = await askLevelField(conversation, ctx, prefill.level)
      notes = await askTextField(conversation, ctx, "📝 Any notes?", prefill.notes)
    }

    // Required fields — always asked
    await ctx.reply("📅 What is the ride date? (DD/MM/YYYY)")
    let date: Date | null = null
    while (!date) {
      const msg = await conversation.waitFor("message:text")
      date = parseDate(msg.message.text)
      if (!date) await ctx.reply("❌ Invalid format. Please use DD/MM/YYYY.")
    }

    await ctx.reply("📍 Where is the meeting point?")
    const meetingMsg = await conversation.waitFor("message:text")
    const meetingPoint = meetingMsg.message.text

    // GPX — always optional, never in imports
    await ctx.reply("🗺️ GPX track URL? (/skip to leave blank)")
    const gpxMsg = await conversation.waitFor("message:text")
    const gpxUrl = gpxMsg.message.text === "/skip" ? undefined : gpxMsg.message.text

    // Final confirmation
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
    const confirmKb = new InlineKeyboard()
      .text("✅ Create ride", "confirm:yes")
      .text("❌ Cancel", "confirm:no")
    await ctx.reply(`Ready to create:\n\n${summary}`, {
      reply_markup: confirmKb,
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

async function askNumberField(
  conversation: CreateRideConversation,
  ctx: BotContext,
  prompt: string,
  prefill?: number,
): Promise<number | undefined> {
  if (prefill != null) {
    const kb = new InlineKeyboard()
      .text(`✅ Keep: ${prefill}`, "field:keep")
      .text("✏️ Change", "field:edit")
    await ctx.reply(`${prompt}\n\nImported: <b>${prefill}</b>`, {
      reply_markup: kb,
      parse_mode: "HTML",
    })
    const cbq = await conversation.waitForCallbackQuery(/^field:/)
    await cbq.answerCallbackQuery()
    if (cbq.callbackQuery.data === "field:keep") return prefill
    await ctx.reply("Send the new value or /skip to leave blank.")
  } else {
    await ctx.reply(`${prompt} (/skip to leave blank)`)
  }
  const msg = await conversation.waitFor("message:text")
  if (msg.message.text === "/skip") return undefined
  const n = Number(msg.message.text)
  return isNaN(n) ? undefined : n
}

async function askTextField(
  conversation: CreateRideConversation,
  ctx: BotContext,
  prompt: string,
  prefill?: string,
): Promise<string | undefined> {
  if (prefill) {
    const kb = new InlineKeyboard().text("✅ Keep", "field:keep").text("✏️ Change", "field:edit")
    await ctx.reply(`${prompt}\n\nImported: <b>${prefill}</b>`, {
      reply_markup: kb,
      parse_mode: "HTML",
    })
    const cbq = await conversation.waitForCallbackQuery(/^field:/)
    await cbq.answerCallbackQuery()
    if (cbq.callbackQuery.data === "field:keep") return prefill
    await ctx.reply("Send the new value or /skip to leave blank.")
  } else {
    await ctx.reply(`${prompt} (/skip to leave blank)`)
  }
  const msg = await conversation.waitFor("message:text")
  return msg.message.text === "/skip" ? undefined : msg.message.text
}

async function askLevelField(
  conversation: CreateRideConversation,
  ctx: BotContext,
  prefill?: RideLevel,
): Promise<RideLevel | undefined> {
  if (prefill) {
    const kb = new InlineKeyboard()
      .text(`✅ Keep: ${prefill}`, "field:keep")
      .text("✏️ Change", "field:edit")
    await ctx.reply(`💪 Ride level — imported: <b>${prefill}</b>`, {
      reply_markup: kb,
      parse_mode: "HTML",
    })
    const cbq = await conversation.waitForCallbackQuery(/^field:/)
    await cbq.answerCallbackQuery()
    if (cbq.callbackQuery.data === "field:keep") return prefill
  } else {
    await ctx.reply("💪 What is the ride level?")
  }
  const kb = new InlineKeyboard()
    .text("🟢 Easy", "level:easy")
    .text("🟡 Moderate", "level:moderate")
    .text("🔴 Hard", "level:hard")
    .row()
    .text("Skip", "level:skip")
  await ctx.reply("Choose a level:", { reply_markup: kb })
  const cbq = await conversation.waitForCallbackQuery(/^level:/)
  await cbq.answerCallbackQuery()
  const data = cbq.callbackQuery.data.split(":")[1]
  return data === "skip" ? undefined : (data as RideLevel)
}

function parseDate(text: string): Date | null {
  const parts = text.split("/").map(Number)
  if (parts.length !== 3) return null
  const [day, month, year] = parts as [number, number, number]
  const date = new Date(year, month - 1, day)
  return isNaN(date.getTime()) ? null : date
}
