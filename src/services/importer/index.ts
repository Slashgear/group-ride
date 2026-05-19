import type { CreateRideInput } from "../../domain/ride"
import { logger } from "../../logger"
import { importFromGarmin } from "./garmin"
import { importFromKomoot } from "./komoot"
import { importFromStrava } from "./strava"

const log = logger.child({ module: "importer" })

export class UnsupportedPlatformError extends Error {}
export class ExtractionFailedError extends Error {}

export async function importFromUrl(url: string): Promise<Partial<CreateRideInput>> {
  const { hostname } = new URL(url)
  log.info({ url }, "Importing ride from URL")

  let result: Partial<CreateRideInput>

  if (hostname.includes("komoot.com")) result = await importFromKomoot(url)
  else if (hostname.includes("strava.com")) result = await importFromStrava(url)
  else if (hostname.includes("garmin.com")) result = await importFromGarmin(url)
  else throw new UnsupportedPlatformError(`Unsupported platform: ${hostname}`)

  log.info({ url, fields: Object.keys(result) }, "Import succeeded")
  return result
}
