import type { CreateRideInput } from "../../domain/ride"
import { ExtractionFailedError } from "./index"

export async function importFromStrava(_url: string): Promise<Partial<CreateRideInput>> {
  // TODO: fetch and parse Strava activity page (requires public activity)
  throw new ExtractionFailedError("Strava import not yet implemented")
}
