import { SqliteRideRepository } from "./adapters/sqlite/ride.repo"
import { PostgresRideRepository } from "./adapters/postgres/ride.repo"
import { logger } from "./logger"
import pkg from "../package.json"

const adapter = (process.env.ADAPTER ?? "discord").toLowerCase()
const databaseUrl = process.env.DATABASE_URL
const rideRepo =
  databaseUrl == null ? new SqliteRideRepository() : new PostgresRideRepository(databaseUrl)

function maskDatabaseUrl(url: string): string {
  try {
    const parsed = new URL(url)
    return `${parsed.protocol}//*****@${parsed.host}${parsed.pathname}`
  } catch {
    return "postgres://<invalid url>"
  }
}

logger.info(
  {
    version: pkg.version,
    adapter,
    database:
      databaseUrl == null
        ? (process.env.DATABASE_PATH ?? "./data/group-ride.db")
        : maskDatabaseUrl(databaseUrl),
    timezone: process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
  "Starting Group Ride",
)

// Graceful shutdown — close the PostgreSQL connection pool on SIGTERM / SIGINT
// so Docker / the OS doesn't have to wait for the default TCP timeout.
async function shutdown(): Promise<void> {
  if (rideRepo instanceof PostgresRideRepository) await rideRepo.end()
  process.exit(0)
}
process.once("SIGTERM", () => void shutdown())
process.once("SIGINT", () => void shutdown())

if (adapter === "telegram") {
  const { startTelegram } = await import("./adapters/telegram/start")
  await startTelegram(rideRepo)
} else {
  const { startDiscord } = await import("./adapters/discord/start")
  await startDiscord(rideRepo)
}
