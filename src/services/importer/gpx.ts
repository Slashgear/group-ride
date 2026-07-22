import { parseGpxDocument, type GpxPoint } from "gpxsnap/gpx"

export interface GpxParseResult {
  name?: string
  distanceKm?: number
  elevationGain?: number
  elevationLoss?: number
  /** [longitude, latitude] pairs — used for the route's start point (weather lookup) */
  coordinates: [number, number][]
}

const GPX_ROOT_TAG = /<gpx[\s>]/iu

export function parseGpx(buffer: Buffer): GpxParseResult {
  const text = buffer.toString("utf-8")
  if (!GPX_ROOT_TAG.test(text)) throw new Error("Not a valid GPX file")

  const doc = parseGpxDocument(text)
  const points = doc.tracks.flatMap((track) => track.points)
  if (points.length < 2) throw new Error("GPX file has insufficient track points")

  let distanceM = 0
  let elevationGain = 0
  let elevationLoss = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    if (prev != null && curr != null) {
      distanceM += haversineMeters(prev, curr)
      if (prev.elevation != null && curr.elevation != null) {
        const diff = curr.elevation - prev.elevation
        if (diff > 0) elevationGain += diff
        else elevationLoss += Math.abs(diff)
      }
    }
  }

  const coordinates = subsample(points, 500).map<[number, number]>((p) => [p.lon, p.lat])

  return {
    name: doc.tracks[0]?.name ?? doc.name,
    distanceKm: Math.round((distanceM / 1000) * 10) / 10,
    elevationGain: Math.round(elevationGain) || undefined,
    elevationLoss: Math.round(elevationLoss) || undefined,
    coordinates,
  }
}

function haversineMeters(a: GpxPoint, b: GpxPoint): number {
  const R = 6_371_000
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const Δφ = ((b.lat - a.lat) * Math.PI) / 180
  const Δλ = ((b.lon - a.lon) * Math.PI) / 180
  const x = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

function subsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr
  const step = arr.length / max
  const result: T[] = []
  for (let i = 0; i < max; i++) {
    const item = arr[Math.floor(i * step)]
    if (item != null) result.push(item)
  }
  return result
}
