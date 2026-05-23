import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  type Client,
  type ForumChannel,
  type TextChannel,
} from "discord.js"
import type { MessagingPort } from "../../domain/ports/messaging.port"
import type { Ride, ThreadId, UserId } from "../../domain/ride"
import { formatAnnouncement, formatSummary, formatThreadTitle } from "./format"

export class DiscordMessaging implements MessagingPort {
  constructor(
    private readonly client: Client,
    private readonly guildId: string,
    private readonly announcementChannelId: string,
    private readonly forumChannelId: string,
  ) {}

  async announce(ride: Ride): Promise<void> {
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
    })
  }

  async createThread(ride: Ride): Promise<ThreadId> {
    const channel = await this.client.channels.fetch(this.forumChannelId)
    if (channel?.type !== ChannelType.GuildForum)
      throw new Error("Forum channel is not a GUILD_FORUM channel")
    const forum = channel as unknown as ForumChannel
    const thread = await forum.threads.create({
      name: formatThreadTitle(ride),
      message: { content: formatSummary(ride), components: [buildRideActionsRow(ride.id)] },
    })
    return thread.id
  }

  async pinSummary(threadId: ThreadId, _ride: Ride): Promise<number> {
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    // In a forum thread the starter message is already pinned by Discord.
    // We fetch it and return its numeric ID for updatePinnedSummary.
    const messages = await thread.messages.fetch({ limit: 1, after: "0" })
    const starter = messages.first()
    if (starter == null) throw new Error("Could not fetch starter message")
    return Number(starter.id)
  }

  async updatePinnedSummary(threadId: ThreadId, ride: Ride, participants: UserId[]): Promise<void> {
    if (ride.pinnedMessageId == null) return
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    const msg = await thread.messages.fetch(String(ride.pinnedMessageId))
    const components = ride.status === "active" ? [buildRideActionsRow(ride.id)] : []
    await msg.edit({ content: formatSummary(ride, participants), components })
  }

  async closeThread(threadId: ThreadId): Promise<void> {
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    await thread.setArchived(true)
  }

  async addMemberToThread(threadId: ThreadId, userId: UserId): Promise<void> {
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    await thread.members.add(String(userId))
    await thread.send(`<@${userId}> You're in! Welcome to the ride. 🚴`)
  }

  async removeMemberFromThread(threadId: ThreadId, userId: UserId): Promise<void> {
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    await thread.members.remove(String(userId))
  }

  async notifyThread(threadId: ThreadId, message: string): Promise<void> {
    const thread = await this.client.channels.fetch(threadId)
    if (thread?.isThread() !== true) throw new Error(`Channel ${threadId} is not a thread`)
    await thread.send(message)
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
