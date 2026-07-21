import { XMLParser } from "fast-xml-parser"

export interface GpxParseResult {
  name?: string
  distanceKm?: number
  elevationGain?: number
  elevationLoss?: number
  /** [longitude, latitude] pairs — used for the route's start point (weather lookup) */
  coordinates: [number, number][]
}

interface RawTrackPoint {
  "@_lat"?: string | number
  "@_lon"?: string | number
  ele?: string | number
}

interface TrackPoint {
  lat: number
  lon: number
  ele?: number
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "trk" || name === "trkseg" || name === "trkpt",
})

export function parseGpx(buffer: Buffer): GpxParseResult {
  const doc = parser.parse(buffer.toString("utf-8")) as {
    gpx?: {
      metadata?: { name?: string }
      trk?: Array<{
        name?: string
        trkseg?: Array<{ trkpt?: RawTrackPoint[] }>
      }>
    }
  }
  if (doc.gpx == null) throw new Error("Not a valid GPX file")

  const tracks = doc.gpx.trk ?? []
  const name = tracks[0]?.name ?? doc.gpx.metadata?.name

  const points: TrackPoint[] = []
  for (const trk of tracks) {
    for (const seg of trk.trkseg ?? []) {
      for (const pt of seg.trkpt ?? []) {
        const lat = Number(pt["@_lat"])
        const lon = Number(pt["@_lon"])
        if (isFinite(lat) && isFinite(lon)) {
          points.push({ lat, lon, ele: pt.ele == null ? undefined : Number(pt.ele) })
        }
      }
    }
  }

  if (points.length < 2) throw new Error("GPX file has insufficient track points")

  let distanceM = 0
  let elevationGain = 0
  let elevationLoss = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    if (prev != null && curr != null) {
      distanceM += haversineMeters(prev, curr)
      if (prev.ele != null && curr.ele != null) {
        const diff = curr.ele - prev.ele
        if (diff > 0) elevationGain += diff
        else elevationLoss += Math.abs(diff)
      }
    }
  }

  const coordinates = subsample(points, 500).map<[number, number]>((p) => [p.lon, p.lat])

  return {
    name: name ?? undefined,
    distanceKm: Math.round((distanceM / 1000) * 10) / 10,
    elevationGain: Math.round(elevationGain) || undefined,
    elevationLoss: Math.round(elevationLoss) || undefined,
    coordinates,
  }
}

function haversineMeters(a: TrackPoint, b: TrackPoint): number {
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
