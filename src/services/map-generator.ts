import { createMemoryTileCache } from "gpxsnap"
import { renderGpx } from "gpxsnap/gpx"

const MAP_WIDTH = 900
const MAP_HEIGHT = 900
const PADDING = 40

// Shared across renders so repeated routes in the same area don't re-download tiles.
const tileCache = createMemoryTileCache(1000)

export async function generateRouteMap(gpxContents: string): Promise<Buffer> {
  const image = await renderGpx(gpxContents, {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    padding: PADDING,
    basemap: "esri-light-gray",
    stats: true,
    elevationProfile: true,
    pixelRatio: 2,
    distanceMarkers: true,
    line: { colorBy: "elevation" },
    format: "webp",
    quality: 80,
    tileCache,
    onTileError: "skip",
    userAgent: "group-ride-bot/1.0 (https://github.com/Slashgear/group-ride)",
  })
  return Buffer.from(image)
}
