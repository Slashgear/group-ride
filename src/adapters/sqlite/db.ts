import { Database } from "bun:sqlite"
import { mkdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { logger } from "../../logger"

const log = logger.child({ module: "sqlite" })

const path = process.env.DATABASE_PATH ?? "./data/group-ride.db"
mkdirSync(dirname(path), { recursive: true })

export const db = new Database(path, { create: true })
db.exec("PRAGMA journal_mode = WAL;")
db.exec("PRAGMA foreign_keys = ON;")

const MIGRATIONS = [
  "001_initial.sql",
  "002_add_pinned_message_id.sql",
  "003_add_proposer_name.sql",
  "004_add_meeting_time.sql",
  "005_add_ride_name.sql",
]

const { user_version: currentVersion } = db.query("PRAGMA user_version").get() as {
  user_version: number
}

for (let i = currentVersion; i < MIGRATIONS.length; i++) {
  const name = MIGRATIONS[i]!
  db.exec(readFileSync(join(import.meta.dir, "migrations", name), "utf-8"))
  db.exec(`PRAGMA user_version = ${i + 1}`)
  log.info({ migration: name, version: i + 1 }, "Migration applied")
}
