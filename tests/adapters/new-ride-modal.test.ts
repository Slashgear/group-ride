import { describe, expect, test } from "bun:test"
import type { ModalBuilder } from "discord.js"
import { buildNewRideModal } from "../../src/adapters/messaging/discord/commands/new-ride-modal"
import { buildEditModal } from "../../src/adapters/messaging/discord/handlers/edit-ride"
import type { Ride } from "../../src/domain/ride"

// Discord API limits: https://discord.com/developers/docs/interactions/message-components#text-input-object
const DISCORD_LABEL_MAX_LENGTH = 45
const DISCORD_MODAL_TITLE_MAX_LENGTH = 45
const DISCORD_PLACEHOLDER_MAX_LENGTH = 100

type ModalJson = ReturnType<ModalBuilder["toJSON"]>
type LabelRow = { label?: string; component?: { placeholder?: string } }

function assertModalFitsDiscordLimits(json: ModalJson): void {
  expect(json.title.length, `title too long: "${json.title}"`).toBeLessThanOrEqual(
    DISCORD_MODAL_TITLE_MAX_LENGTH,
  )
  for (const row of json.components as LabelRow[]) {
    expect(row.label?.length ?? 0, `label too long: "${row.label}"`).toBeLessThanOrEqual(
      DISCORD_LABEL_MAX_LENGTH,
    )
    const placeholder = row.component?.placeholder
    if (placeholder != null) {
      expect(placeholder.length, `placeholder too long: "${placeholder}"`).toBeLessThanOrEqual(
        DISCORD_PLACEHOLDER_MAX_LENGTH,
      )
    }
  }
}

const fakeRide: Ride = {
  id: "ride-1",
  threadId: "thread-1",
  proposerId: "user-1",
  proposerName: "Test",
  date: new Date(2026, 5, 15),
  name: null,
  meetingTime: "08:00",
  meetingPoint: "Place de la République",
  distanceKm: 100,
  elevationGain: 2000,
  elevationLoss: 2000,
  level: null,
  gpxUrl: null,
  externalUrl: null,
  notes: null,
  status: "active",
  pinnedMessageId: null,
  reminderDaySent: false,
  reminderHourSent: false,
  createdAt: new Date(2026, 5, 1),
  maxParticipants: null,
}

describe("buildNewRideModal", () => {
  test("all fields fit Discord limits", () => {
    assertModalFitsDiscordLimits(buildNewRideModal().toJSON())
  })
})

describe("buildEditModal", () => {
  test("all fields fit Discord limits", () => {
    assertModalFitsDiscordLimits(buildEditModal("ride-1", fakeRide).toJSON())
  })
})
