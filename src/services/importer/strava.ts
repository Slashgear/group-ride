import type { CreateRideInput } from "../../domain/ride"
import { ExtractionFailedError } from "./index"

export async function importFromStrava(url: string): Promise<Partial<CreateRideInput>> {
  const parsed = new URL(url)
  const match = parsed.pathname.match(/\/activities\/(\d+)/)
  if (!match?.[1]) throw new ExtractionFailedError("Could not extract activity ID from Strava URL.")

  return {
    externalUrl: `https://www.strava.com/activities/${match[1]}`,
  }
}
