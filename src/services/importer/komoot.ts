import type { CreateRideInput, RideLevel } from "../../domain/ride"
import { ExtractionFailedError } from "./index"

interface KomootTour {
  name: string
  distance: number
  elevation_up: number
  elevation_down: number
  difficulty: { grade: string } | null
  sport: string
}

export async function importFromKomoot(url: string): Promise<Partial<CreateRideInput>> {
  const parsed = new URL(url)

  const tourIdMatch = parsed.pathname.match(/\/tour\/(\d+)/)
  if (!tourIdMatch?.[1]) throw new ExtractionFailedError("Could not extract tour ID from URL.")

  const tourId = tourIdMatch[1]
  const shareToken = parsed.searchParams.get("share_token")

  const apiUrl = new URL(`https://www.komoot.com/api/v007/tours/${tourId}`)
  if (shareToken) apiUrl.searchParams.set("share_token", shareToken)

  const res = await fetch(apiUrl, {
    headers: {
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    },
  })

  if (res.status === 401 || res.status === 403) {
    throw new ExtractionFailedError("Tour is private — share token may be missing or expired.")
  }
  if (!res.ok) {
    throw new ExtractionFailedError(`Komoot API returned HTTP ${res.status}.`)
  }

  const tour = (await res.json()) as KomootTour

  return {
    distanceKm: Math.round((tour.distance / 1000) * 10) / 10,
    elevationGain: Math.round(tour.elevation_up),
    elevationLoss: Math.round(tour.elevation_down),
    level: mapDifficulty(tour.difficulty?.grade ?? null),
    notes: tour.name,
    externalUrl: `https://www.komoot.com/tour/${tourId}`,
  }
}

function mapDifficulty(difficulty: string | null): RideLevel | undefined {
  switch (difficulty) {
    case "easy":
      return "easy"
    case "moderate":
      return "moderate"
    case "difficult":
    case "expert":
    case "expert+":
      return "hard"
    default:
      return undefined
  }
}
