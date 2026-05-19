import type { CreateRideInput } from "../../domain/ride"
import { importFromGarmin } from "./garmin"
import { importFromKomoot } from "./komoot"
import { importFromStrava } from "./strava"

export class UnsupportedPlatformError extends Error {}
export class ExtractionFailedError extends Error {}

export async function importFromUrl(url: string): Promise<Partial<CreateRideInput>> {
  const { hostname } = new URL(url)

  if (hostname.includes("komoot.com")) return importFromKomoot(url)
  if (hostname.includes("strava.com")) return importFromStrava(url)
  if (hostname.includes("garmin.com")) return importFromGarmin(url)

  throw new UnsupportedPlatformError(`Unsupported platform: ${hostname}`)
}
