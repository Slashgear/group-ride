declare module "staticmaps" {
  interface TileLayerOptions {
    tileUrl?: string
    tileSize?: number
    tileRequestHeader?: Record<string, string>
  }

  interface StaticMapsOptions {
    width: number
    height: number
    paddingX?: number
    paddingY?: number
    tileUrl?: string
    tileRequestHeader?: Record<string, string>
    tileLayers?: TileLayerOptions[]
    zoomRange?: { min?: number; max?: number }
    maxZoom?: number
  }

  interface LineOptions {
    coords: [number, number][]
    color?: string
    width?: number
  }

  interface MapImage {
    buffer(mime: string, options?: Record<string, unknown>): Promise<Buffer>
    save(fileName: string, options?: Record<string, unknown>): Promise<void>
  }

  class StaticMaps {
    image: MapImage
    constructor(options?: StaticMapsOptions)
    addLine(options: LineOptions): void
    render(center?: [number, number], zoom?: number): Promise<void>
  }

  export default StaticMaps
}
