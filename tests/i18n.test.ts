import { afterEach, describe, expect, test } from "bun:test"
import { getMessages } from "../src/i18n"

const originalLang = process.env.LANG

afterEach(() => {
  if (originalLang == null) {
    delete process.env.LANG
  } else {
    process.env.LANG = originalLang
  }
})

describe("getMessages", () => {
  test("defaults to English when LANG is unset", () => {
    delete process.env.LANG
    const m = getMessages()
    expect(m.rideNotFound).toBe("This ride no longer exists.")
  })

  test("returns French messages when LANG=fr", () => {
    process.env.LANG = "fr"
    const m = getMessages()
    expect(m.rideNotFound).toBe("Cette sortie n'existe plus.")
  })

  test("falls back to English for an unsupported LANG", () => {
    process.env.LANG = "de"
    const m = getMessages()
    expect(m.rideNotFound).toBe("This ride no longer exists.")
  })
})

describe("weatherForecast message", () => {
  test("formats all fields into the English message", () => {
    process.env.LANG = "en"
    const m = getMessages()
    const text = m.weatherForecast(14, 22, "Sunny", 15, 22, "↖️", 10, 0)
    expect(text).toBe(
      "🌤️ **Forecast:** Sunny, 14–22°C, 💨 15 km/h ↖️ (gusts 22 km/h), 🌧️ 10% chance of rain",
    )
  })

  test("appends precipitation volume when it is greater than zero", () => {
    process.env.LANG = "en"
    const m = getMessages()
    const text = m.weatherForecast(14, 22, "Rainy", 15, 22, "↖️", 80, 3.5)
    expect(text).toBe(
      "🌤️ **Forecast:** Rainy, 14–22°C, 💨 15 km/h ↖️ (gusts 22 km/h), 🌧️ 80% chance of rain (3.5 mm)",
    )
  })

  test("formats all fields into the French message", () => {
    process.env.LANG = "fr"
    const m = getMessages()
    const text = m.weatherForecast(14, 22, "Ensoleillé", 15, 22, "↖️", 10, 0)
    expect(text).toBe(
      "🌤️ **Météo :** Ensoleillé, 14–22°C, 💨 15 km/h ↖️ (rafales 22 km/h), 🌧️ 10% de risque de pluie",
    )
  })
})

describe("dayBeforeReminder message", () => {
  test("includes the meeting time when set", () => {
    process.env.LANG = "en"
    const m = getMessages()
    expect(m.dayBeforeReminder("Place de la République", "09:00")).toBe(
      "🚴 **Reminder** — tomorrow's ride at **09:00**! Meeting point: **Place de la République**",
    )
  })

  test("omits the meeting time when not set", () => {
    process.env.LANG = "en"
    const m = getMessages()
    expect(m.dayBeforeReminder("Place de la République")).toBe(
      "🚴 **Reminder** — tomorrow's ride! Meeting point: **Place de la République**",
    )
  })
})
