import type { CreateRideInput } from "../../domain/ride"
import { ExtractionFailedError } from "./errors"

export function importFromGarmin(url: string): Promise<Partial<CreateRideInput>> {
  const parsed = new URL(url)
  const match = parsed.pathname.match(/\/course\/(\d+)/u)
  if (match?.[1] == null)
    throw new ExtractionFailedError("Could not extract course ID from Garmin URL.")
  return Promise.resolve({ externalUrl: `https://connect.garmin.com/app/course/${match[1]}` })
}
