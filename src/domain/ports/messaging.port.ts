import type { Ride, ThreadId, UserId } from "../ride"

export interface MessagingPort {
  announce(ride: Ride): Promise<void>
  createThread(ride: Ride): Promise<ThreadId>
  /** Sends and pins the initial summary. Receives the participants list so a single
   *  API call is enough — no need for an immediate updatePinnedSummary after. */
  pinSummary(threadId: ThreadId, ride: Ride, participants: UserId[]): Promise<number>
  updatePinnedSummary(threadId: ThreadId, ride: Ride, participants: UserId[]): Promise<void>
  closeThread(threadId: ThreadId): Promise<void>
  /** silent = true: only grants access (Discord) or is a no-op (Telegram).
   *  Use silent when the proposer auto-joins on creation — no "You're in!" needed. */
  addMemberToThread(threadId: ThreadId, userId: UserId, silent?: boolean): Promise<void>
  removeMemberFromThread(threadId: ThreadId, userId: UserId): Promise<void>
  notifyThread(threadId: ThreadId, message: string): Promise<void>
  notifyMainChannel(message: string): Promise<void>
}
