import type { CreateRideInput } from "../../domain/ride"
import { logger } from "../../logger"
import { importFromGarmin } from "./garmin"
import { importFromKomoot } from "./komoot"
import { importFromStrava } from "./strava"

import { UnsupportedPlatformError } from "./errors"
export { ExtractionFailedError, UnsupportedPlatformError } from "./errors"

const log = logger.child({ module: "importer" })

export async function importFromUrl(url: string): Promise<Partial<CreateRideInput>> {
  const { hostname } = new URL(url)
  log.info({ url }, "Importing ride from URL")

  let result: Partial<CreateRideInput>

  if (hostname === "komoot.com" || hostname.endsWith(".komoot.com"))
    result = await importFromKomoot(url)
  else if (hostname === "strava.com" || hostname.endsWith(".strava.com"))
    result = await importFromStrava(url)
  else if (hostname === "garmin.com" || hostname.endsWith(".garmin.com"))
    result = await importFromGarmin(url)
  else throw new UnsupportedPlatformError(`Unsupported platform: ${hostname}`)

  log.info({ url, fields: Object.keys(result) }, "Import succeeded")
  return result
}
