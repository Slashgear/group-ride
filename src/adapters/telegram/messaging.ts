import { InlineKeyboard, type Api } from "grammy"
import type { MessagingPort } from "../../domain/ports/messaging.port"
import type { Ride, ThreadId, UserId } from "../../domain/ride"
import { formatAnnouncement, formatSummary, formatTopicTitle, topicLink } from "./format"

export class TelegramMessaging implements MessagingPort {
  constructor(
    private readonly api: Api,
    private readonly groupChatId: number,
  ) {}

  async announce(ride: Ride): Promise<void> {
    const keyboard = new InlineKeyboard().text("Join this ride 🚴", `join:${ride.id}`)
    await this.api.sendMessage(this.groupChatId, formatAnnouncement(ride), {
      parse_mode: "HTML",
      reply_markup: keyboard,
    })
  }

  async createThread(ride: Ride): Promise<ThreadId> {
    const topic = await this.api.createForumTopic(this.groupChatId, formatTopicTitle(ride))
    return String(topic.message_thread_id)
  }

  async pinSummary(threadId: ThreadId, ride: Ride, participants: UserId[]): Promise<number> {
    const msg = await this.api.sendMessage(this.groupChatId, formatSummary(ride, participants), {
      message_thread_id: Number(threadId),
      parse_mode: "HTML",
    })
    await this.api.pinChatMessage(this.groupChatId, msg.message_id, {
      disable_notification: true,
    })
    return msg.message_id
  }

  async updatePinnedSummary(
    _threadId: ThreadId,
    ride: Ride,
    participants: UserId[],
  ): Promise<void> {
    if (ride.pinnedMessageId == null) return
    await this.api.editMessageText(
      this.groupChatId,
      ride.pinnedMessageId,
      formatSummary(ride, participants),
      { parse_mode: "HTML" },
    )
  }

  async closeThread(threadId: ThreadId): Promise<void> {
    await this.api.closeForumTopic(this.groupChatId, Number(threadId))
  }

  async addMemberToThread(threadId: ThreadId, userId: UserId, silent = false): Promise<void> {
    // Telegram topics are visible to all group members — no access grant needed.
    // Only send the "You're in!" notification for explicit joins, not for the proposer on creation.
    if (silent) return
    const link = topicLink(this.groupChatId, threadId)
    await this.api.sendMessage(
      this.groupChatId,
      `<a href="tg://user?id=${userId}">You're in!</a> Head to the ride discussion: ${link}`,
      { message_thread_id: Number(threadId), parse_mode: "HTML" },
    )
  }

  async removeMemberFromThread(_threadId: ThreadId, _userId: UserId): Promise<void> {
    // No-op: Telegram topics are accessible to all group members.
  }

  async notifyThread(threadId: ThreadId, message: string): Promise<void> {
    await this.api.sendMessage(this.groupChatId, message, {
      message_thread_id: Number(threadId),
    })
  }

  async notifyMainChannel(message: string): Promise<void> {
    await this.api.sendMessage(this.groupChatId, message)
  }
}
