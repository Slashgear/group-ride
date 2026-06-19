import StaticMaps from "staticmaps"

const TRACK_COLOR = "#E74C3C"
const TRACK_WIDTH = 4
const MAP_WIDTH = 1200
const MAP_HEIGHT = 600
const PADDING = 40

export async function generateRouteMap(coordinates: [number, number][]): Promise<Buffer> {
  const map = new StaticMaps({
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    paddingX: PADDING,
    paddingY: PADDING,
    tileLayers: [
      {
        tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        tileSize: 256,
        tileRequestHeader: {
          "User-Agent": "group-ride-bot/1.0 (https://github.com/Slashgear/group-ride)",
        },
      },
    ],
  })

  map.addLine({ coords: coordinates, color: TRACK_COLOR, width: TRACK_WIDTH })
  await map.render()
  return map.image.buffer("image/png")
}
