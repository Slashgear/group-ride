import { SqliteRideRepository } from "./adapters/sqlite/ride.repo"

const adapter = (process.env.ADAPTER ?? "discord").toLowerCase()
const rideRepo = new SqliteRideRepository()

if (adapter === "telegram") {
  const { startTelegram } = await import("./adapters/telegram/start")
  await startTelegram(rideRepo)
} else {
  const { startDiscord } = await import("./adapters/discord/start")
  await startDiscord(rideRepo)
}
