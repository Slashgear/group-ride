import type { Ride, ThreadId, UserId } from "../ride"

export interface MessagingPort {
  announce(ride: Ride): Promise<void>
  createThread(ride: Ride): Promise<ThreadId>
  pinSummary(threadId: ThreadId, ride: Ride): Promise<number>
  updatePinnedSummary(threadId: ThreadId, ride: Ride, participants: UserId[]): Promise<void>
  closeThread(threadId: ThreadId): Promise<void>
  addMemberToThread(threadId: ThreadId, userId: UserId): Promise<void>
  removeMemberFromThread(threadId: ThreadId, userId: UserId): Promise<void>
  notifyThread(threadId: ThreadId, message: string): Promise<void>
  notifyMainChannel(message: string): Promise<void>
}
