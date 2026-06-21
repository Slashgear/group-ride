import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { validateConfig } from "../src/config"

const DISCORD_VARS = {
  DISCORD_TOKEN: "token",
  DISCORD_CLIENT_ID: "client-id",
  DISCORD_GUILD_ID: "guild-id",
  DISCORD_ANNOUNCEMENT_CHANNEL_ID: "announcement-channel-id",
  DISCORD_FORUM_CHANNEL_ID: "forum-channel-id",
}

const TELEGRAM_VARS = {
  TELEGRAM_TOKEN: "token",
  TELEGRAM_GROUP_CHAT_ID: "-100123456789",
}

const ALL_KEYS = ["ADAPTER", ...Object.keys(DISCORD_VARS), ...Object.keys(TELEGRAM_VARS)]

beforeEach(() => {
  for (const key of ALL_KEYS) delete process.env[key]
})

afterEach(() => {
  for (const key of ALL_KEYS) delete process.env[key]
})

describe("validateConfig — discord (default)", () => {
  test("passes when all required vars are set", () => {
    Object.assign(process.env, DISCORD_VARS)
    expect(() => validateConfig()).not.toThrow()
  })

  test("passes when ADAPTER is explicitly 'discord'", () => {
    process.env.ADAPTER = "discord"
    Object.assign(process.env, DISCORD_VARS)
    expect(() => validateConfig()).not.toThrow()
  })

  test.each(Object.keys(DISCORD_VARS))("throws when %s is missing", (missing) => {
    const vars = { ...DISCORD_VARS }
    delete (vars as Record<string, string>)[missing]
    Object.assign(process.env, vars)
    expect(() => validateConfig()).toThrow(missing)
  })

  test("reports all missing vars in a single error", () => {
    expect(() => validateConfig()).toThrow(
      /DISCORD_TOKEN.*DISCORD_CLIENT_ID.*DISCORD_GUILD_ID.*DISCORD_ANNOUNCEMENT_CHANNEL_ID.*DISCORD_FORUM_CHANNEL_ID/,
    )
  })
})

describe("validateConfig — telegram", () => {
  beforeEach(() => {
    process.env.ADAPTER = "telegram"
  })

  test("passes when all required vars are set", () => {
    Object.assign(process.env, TELEGRAM_VARS)
    expect(() => validateConfig()).not.toThrow()
  })

  test.each(Object.keys(TELEGRAM_VARS))("throws when %s is missing", (missing) => {
    const vars = { ...TELEGRAM_VARS }
    delete (vars as Record<string, string>)[missing]
    Object.assign(process.env, vars)
    expect(() => validateConfig()).toThrow(missing)
  })

  test("reports all missing vars in a single error", () => {
    expect(() => validateConfig()).toThrow(/TELEGRAM_TOKEN.*TELEGRAM_GROUP_CHAT_ID/)
  })

  test("does not require Discord vars", () => {
    Object.assign(process.env, TELEGRAM_VARS)
    expect(() => validateConfig()).not.toThrow()
  })
})

describe("validateConfig — unused adapter vars warning", () => {
  test("warns when Telegram vars are set alongside Discord adapter", () => {
    Object.assign(process.env, DISCORD_VARS, TELEGRAM_VARS)
    const { warnings } = validateConfig()
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatch(/TELEGRAM_TOKEN/)
    expect(warnings[0]).toMatch(/TELEGRAM_GROUP_CHAT_ID/)
    expect(warnings[0]).toMatch(/discord/)
  })

  test("warns when Discord vars are set alongside Telegram adapter", () => {
    process.env.ADAPTER = "telegram"
    Object.assign(process.env, DISCORD_VARS, TELEGRAM_VARS)
    const { warnings } = validateConfig()
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatch(/DISCORD_TOKEN/)
    expect(warnings[0]).toMatch(/telegram/)
  })

  test("no warning when only the active adapter vars are set", () => {
    Object.assign(process.env, DISCORD_VARS)
    const { warnings } = validateConfig()
    expect(warnings).toHaveLength(0)
  })
})
