import type { CreateRideInput } from "../../domain/ride"
import { ExtractionFailedError } from "./index"

export async function importFromGarmin(url: string): Promise<Partial<CreateRideInput>> {
  const parsed = new URL(url)
  const match = parsed.pathname.match(/\/course\/(\d+)/)
  if (!match?.[1]) throw new ExtractionFailedError("Could not extract course ID from Garmin URL.")

  return {
    externalUrl: `https://connect.garmin.com/app/course/${match[1]}`,
  }
}
