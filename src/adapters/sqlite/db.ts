import { Database } from "bun:sqlite"
import { mkdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"

const path = process.env.DATABASE_PATH ?? "./data/group-ride.db"
mkdirSync(dirname(path), { recursive: true })

export const db = new Database(path, { create: true })
db.exec("PRAGMA journal_mode = WAL;")
db.exec("PRAGMA foreign_keys = ON;")

const MIGRATIONS = ["001_initial.sql", "002_add_pinned_message_id.sql"]

const { user_version: currentVersion } = db.query("PRAGMA user_version").get() as {
  user_version: number
}

for (let i = currentVersion; i < MIGRATIONS.length; i++) {
  const sql = readFileSync(join(import.meta.dir, "migrations", MIGRATIONS[i]!), "utf-8")
  db.exec(sql)
  db.exec(`PRAGMA user_version = ${i + 1}`)
}
