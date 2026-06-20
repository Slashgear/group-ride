import { describe, expect, test } from "bun:test"
import { parseGpx } from "../../../src/services/importer/gpx"

function makeGpxBuffer(xml: string): Buffer {
  return Buffer.from(xml, "utf-8")
}

const SIMPLE_GPX = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Test Route</name>
    <trkseg>
      <trkpt lat="48.8566" lon="2.3522"><ele>35</ele></trkpt>
      <trkpt lat="48.8600" lon="2.3550"><ele>40</ele></trkpt>
      <trkpt lat="48.8650" lon="2.3600"><ele>30</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`

const GPX_WITH_METADATA_NAME = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Metadata Name</name>
  </metadata>
  <trk>
    <trkseg>
      <trkpt lat="48.8566" lon="2.3522"><ele>35</ele></trkpt>
      <trkpt lat="48.8600" lon="2.3550"><ele>40</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`

const GPX_WITHOUT_ELEVATION = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Flat Route</name>
    <trkseg>
      <trkpt lat="48.8566" lon="2.3522"></trkpt>
      <trkpt lat="48.8600" lon="2.3550"></trkpt>
      <trkpt lat="48.8650" lon="2.3600"></trkpt>
    </trkseg>
  </trk>
</gpx>`

describe("parseGpx", () => {
  test("returns name, distance, elevation and coordinates for a simple GPX", () => {
    const result = parseGpx(makeGpxBuffer(SIMPLE_GPX))

    expect(result.name).toBe("Test Route")
    expect(result.distanceKm).toBeGreaterThan(0)
    expect(result.elevationGain).toBeDefined()
    expect(result.elevationLoss).toBeDefined()
    expect(result.coordinates.length).toBe(3)
    // coordinates are [lon, lat] pairs
    expect(result.coordinates[0]).toEqual([2.3522, 48.8566])
  })

  test("falls back to metadata name when track name is absent", () => {
    const result = parseGpx(makeGpxBuffer(GPX_WITH_METADATA_NAME))
    expect(result.name).toBe("Metadata Name")
  })

  test("returns undefined elevation when no ele elements are present", () => {
    const result = parseGpx(makeGpxBuffer(GPX_WITHOUT_ELEVATION))
    expect(result.elevationGain).toBeUndefined()
    expect(result.elevationLoss).toBeUndefined()
    expect(result.distanceKm).toBeGreaterThan(0)
  })

  test("throws when buffer is not valid GPX XML", () => {
    expect(() => parseGpx(makeGpxBuffer("<not>valid gpx</not>"))).toThrow("Not a valid GPX file")
  })

  test("throws when GPX has fewer than 2 track points", () => {
    const singlePoint = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <trkseg>
      <trkpt lat="48.8566" lon="2.3522"><ele>35</ele></trkpt>
    </trkseg>
  </trk>
</gpx>`
    expect(() => parseGpx(makeGpxBuffer(singlePoint))).toThrow(
      "GPX file has insufficient track points",
    )
  })

  test("throws when GPX has no track points at all", () => {
    const noPoints = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Empty</name>
    <trkseg></trkseg>
  </trk>
</gpx>`
    expect(() => parseGpx(makeGpxBuffer(noPoints))).toThrow(
      "GPX file has insufficient track points",
    )
  })

  test("subsamples to at most 500 coordinates for large tracks", () => {
    const points = Array.from({ length: 1000 }, (_, i) => {
      const lat = 48.0 + i * 0.001
      const lon = 2.0 + i * 0.001
      return `      <trkpt lat="${lat}" lon="${lon}"><ele>${100 + i}</ele></trkpt>`
    }).join("\n")

    const largeGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>Long Route</name>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>`
    const result = parseGpx(makeGpxBuffer(largeGpx))
    expect(result.coordinates.length).toBeLessThanOrEqual(500)
  })
})
