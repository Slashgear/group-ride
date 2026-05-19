import type { CreateRideInput } from "../../domain/ride"
import { ExtractionFailedError } from "./index"

export async function importFromGarmin(_url: string): Promise<Partial<CreateRideInput>> {
  // TODO: fetch and parse Garmin Connect activity page (requires public activity)
  throw new ExtractionFailedError("Garmin import not yet implemented")
}
