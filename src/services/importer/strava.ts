import type { CreateRideInput } from "../../domain/ride"
import { ExtractionFailedError } from "./errors"

export function importFromStrava(url: string): Promise<Partial<CreateRideInput>> {
  const parsed = new URL(url)
  const match = parsed.pathname.match(/\/activities\/(\d+)/u)
  if (match?.[1] == null) throw new ExtractionFailedError("Could not extract activity ID from Strava URL.")
  return Promise.resolve({ externalUrl: `https://www.strava.com/activities/${match[1]}` })
}