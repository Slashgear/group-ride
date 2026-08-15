import { renderGpx } from "gpxsnap/gpx"

const MAP_WIDTH = 900
const MAP_HEIGHT = 900
const PADDING = 40

export async function generateRouteMap(gpxContents: string): Promise<Buffer> {
  const image = await renderGpx(gpxContents, {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    padding: PADDING,
    stats: true,
    elevationProfile: true,
    pixelRatio: 2,
    distanceMarkers: true,
    line: { colorBy: "elevation" },
    attribution: false,
    format: "webp",
    quality: 80,
    userAgent: "group-ride-bot/1.0 (https://github.com/Slashgear/group-ride)",
  })
  return Buffer.from(image)
}
