import type { CreateRideInput } from "../../domain/ride"
import { ExtractionFailedError } from "./index"

export async function importFromKomoot(url: string): Promise<Partial<CreateRideInput>> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  })

  if (!res.ok) {
    throw new ExtractionFailedError(`HTTP ${res.status} — the tour may be private or unavailable.`)
  }

  const html = await res.text()

  // Komoot embeds tour data as JSON in page scripts
  const distanceM = extractNumber(html, /"distance"\s*:\s*([\d.]+)/)
  const elevationUp = extractNumber(html, /"elevation_up"\s*:\s*([\d.]+)/)
  const elevationDown = extractNumber(html, /"elevation_down"\s*:\s*([\d.]+)/)

  if (distanceM == null) {
    throw new ExtractionFailedError("Could not extract tour data — the tour may be private.")
  }

  return {
    distanceKm: Math.round((distanceM / 1000) * 10) / 10,
    elevationGain: elevationUp != null ? Math.round(elevationUp) : undefined,
    elevationLoss: elevationDown != null ? Math.round(elevationDown) : undefined,
    externalUrl: url,
  }
}

function extractNumber(html: string, pattern: RegExp): number | null {
  const match = html.match(pattern)
  if (!match?.[1]) return null
  const n = parseFloat(match[1])
  return isNaN(n) ? null : n
}
