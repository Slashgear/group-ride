export type RideId = string
export type ThreadId = string
// UserId is kept as string to avoid precision loss with 64-bit Discord/Telegram snowflake IDs
// (which exceed Number.MAX_SAFE_INTEGER). Adapters must convert to string at their boundary.
export type UserId = string

export type RideLevel = "easy" | "moderate" | "hard"
export type RideStatus = "active" | "cancelled" | "closed"

export interface Ride {
  id: RideId
  threadId: ThreadId | null
  proposerId: UserId
  proposerName: string
  date: Date
  name: string | null
  meetingTime: string | null
  meetingPoint: string
  distanceKm: number | null
  elevationGain: number | null
  elevationLoss: number | null
  level: RideLevel | null
  gpxUrl: string | null
  externalUrl: string | null
  notes: string | null
  status: RideStatus
  pinnedMessageId: number | null
  reminderDaySent: boolean
  reminderHourSent: boolean
  createdAt: Date
}

export interface CreateRideInput {
  proposerId: UserId
  proposerName: string
  date: Date
  name?: string
  meetingTime?: string
  meetingPoint: string
  distanceKm?: number
  elevationGain?: number
  elevationLoss?: number
  level?: RideLevel
  gpxUrl?: string
  externalUrl?: string
  notes?: string
}
