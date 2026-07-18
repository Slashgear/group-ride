import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type Client,
  type TextChannel,
} from "discord.js"
import type { MessagingPort } from "../../../domain/ports/messaging.port"
import type { Ride, ThreadId, UserId } from "../../../domain/ride"
import { generateIcal } from "../../../services/ical"
import { formatAnnouncement, formatSummary, formatThreadTitle } from "./format"
import { logger } from "../../../logger"

const log = logger.child({ module: "discord-messaging" })

export class DiscordMessaging implements MessagingPort {
  constructor(
    private readonly client: Client,
    private readonly guildId: string,
    private readonly announcementChannelId: string,
    private readonly forumChannelId: string,
  ) {}

  async announce(ride: Ride, mapImage?: Buffer): Promise<void> {
    const channel = await this.client.channels.fetch(this.announcementChannelId)
    if (channel?.isTextBased() !== true)
      throw new Error("Announcement channel is not a text channel")
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`join:${ride.id}`)
        .setLabel("Join this ride 🚴")
        .setStyle(ButtonStyle.Primary),
    )
    await (channel as unknown as TextChannel).send({
      content: formatAnnouncement(ride),
      components: [row],
      files: [
        ...(mapImage == null ? [] : [{ attachment: mapImage, name: "route.png" }]),
        { attachment: generateIcal(ride), name: "ride.ics" },
      ],
    })
  }

  async createThread(ride: Ride, mapImage?: Buffer): Promise<ThreadId> {
    const channel = await this.client.channels.fetch(this.forumChannelId)
    if (channel?.type !== ChannelType.GuildForum)
      throw new Error("Forum channel is not a GUILD_FORUM channel")
    const thread = await channel.threads.create({
      name: formatThreadTitle(ride),
      message: { content: formatSummary(ride), components: [buildRideActionsRow(ride.id)] },
    })
    if (mapImage != null) {
      await thread.send({
        content: "📍 Route map",
        files: [{ attachment: mapImage, name: "route.png" }],
      })
    }
    return thread.id
  }

  async pinSummary(
    threadId: ThreadId,
    ride: Ride,
    participants: UserId[],
    waitlist: UserId[] = [],
  ): Promise<string> {
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    const starter = await thread.fetchStarterMessage()
    if (starter == null) throw new Error("Could not fetch starter message")
    await starter.edit({
      content: formatSummary(ride, participants, waitlist),
      components: [buildRideActionsRow(ride.id)],
    })
    return starter.id
  }

  async updatePinnedSummary(
    threadId: ThreadId,
    ride: Ride,
    participants: UserId[],
    waitlist: UserId[] = [],
  ): Promise<void> {
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    const starter = await thread.fetchStarterMessage()
    if (starter == null) {
      log.warn({ threadId }, "Starter message not found, skipping update")
      return
    }
    const components = ride.status === "active" ? [buildRideActionsRow(ride.id)] : []
    await starter.edit({ content: formatSummary(ride, participants, waitlist), components })
  }

  async closeThread(threadId: ThreadId): Promise<void> {
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    await thread.setArchived(true)
  }

  async addMemberToThread(threadId: ThreadId, userId: UserId, silent = false): Promise<void> {
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    await thread.members.add(userId)
    if (!silent) await thread.send(`<@${userId}> You're in! Welcome to the ride. 🚴`)
  }

  async removeMemberFromThread(threadId: ThreadId, userId: UserId): Promise<void> {
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    await thread.members.remove(userId)
  }

  async notifyThread(threadId: ThreadId, message: string, image?: Buffer): Promise<void> {
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    await thread.send({
      content: message,
      files: image == null ? [] : [{ attachment: image, name: "weather.png" }],
    })
  }

  async notifyMainChannel(message: string): Promise<void> {
    const channel = await this.client.channels.fetch(this.announcementChannelId)
    if (channel?.isTextBased() !== true)
      throw new Error("Announcement channel is not a text channel")
    await (channel as unknown as TextChannel).send(message)
  }
}

function buildRideActionsRow(rideId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`join:${rideId}`)
      .setLabel("🚴 Join")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`participants:${rideId}`)
      .setLabel("👥 Participants")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`edit:${rideId}`)
      .setLabel("✏️ Edit")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`leave:${rideId}`)
      .setLabel("🚪 Leave")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`cancel:${rideId}`)
      .setLabel("❌ Cancel")
      .setStyle(ButtonStyle.Danger),
  )
}
