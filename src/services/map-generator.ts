import { renderGpx } from "gpxsnap/gpx"

const MAP_WIDTH = 1200
const MAP_HEIGHT = 600
const PADDING = 40

export async function generateRouteMap(gpxContents: string): Promise<Buffer> {
  const png = await renderGpx(gpxContents, {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    padding: PADDING,
    stats: true,
    elevationProfile: true,
    userAgent: "group-ride-bot/1.0 (https://github.com/Slashgear/group-ride)",
  })
  return Buffer.from(png)
}
