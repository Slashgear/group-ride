import { SqliteRideRepository } from "./adapters/sqlite/ride.repo"
import { PostgresRideRepository } from "./adapters/postgres/ride.repo"

const adapter = (process.env.ADAPTER ?? "discord").toLowerCase()
const rideRepo =
  process.env.DATABASE_URL == null
    ? new SqliteRideRepository()
    : new PostgresRideRepository(process.env.DATABASE_URL)

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
