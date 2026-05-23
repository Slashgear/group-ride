import { SqliteRideRepository } from "./adapters/sqlite/ride.repo"
import { PostgresRideRepository } from "./adapters/postgres/ride.repo"

const adapter = (process.env.ADAPTER ?? "discord").toLowerCase()
const rideRepo =
  process.env.DATABASE_URL == null
    ? new SqliteRideRepository()
    : new PostgresRideRepository(process.env.DATABASE_URL)

if (adapter === "telegram") {
  const { startTelegram } = await import("./adapters/telegram/start")
  await startTelegram(rideRepo)
} else {
  const { startDiscord } = await import("./adapters/discord/start")
  await startDiscord(rideRepo)
}
