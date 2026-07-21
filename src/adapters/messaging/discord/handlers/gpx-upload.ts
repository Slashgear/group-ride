import type { Client, Message } from "discord.js"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import type { RideService } from "../../../../services/ride.service"
import { generateRouteMap } from "../../../../services/map-generator"
import { resolveWeatherQuery, type WeatherService } from "../../../../services/weather.service"
import { getMessages } from "../../../../i18n"
import { logger } from "../../../../logger"

const log = logger.child({ module: "discord-gpx-upload" })

export function registerGpxUploadHandler(
  client: Client,
  rideRepo: RideRepository,
  rideService: RideService,
  weather: WeatherService | undefined,
): void {
  client.on("messageCreate", (message) => {
    void onMessage(message, rideRepo, rideService, weather).catch((err) => {
      log.error({ err }, "Unhandled error in gpx upload handler")
    })
  })
}

async function onMessage(
  message: Message,
  rideRepo: RideRepository,
  rideService: RideService,
  weather: WeatherService | undefined,
): Promise<void> {
  if (message.author.bot || !message.channel.isThread()) return

  const attachment = message.attachments.find((a) => a.name.toLowerCase().endsWith(".gpx"))
  if (attachment == null) return

  const ride = await rideRepo.findByThreadId(message.channelId)
  if (ride == null || ride.status !== "active" || message.author.id !== ride.proposerId) return

  const m = getMessages()
  try {
    const res = await fetch(attachment.url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const gpxContents = await res.text()
    let mapImage: Buffer | undefined
    try {
      mapImage = await generateRouteMap(gpxContents)
    } catch (mapErr) {
      log.warn({ err: mapErr }, "Map generation failed, continuing without map")
    }
    const updated = await rideService.attachGpx(
      ride.id,
      message.author.id,
      gpxContents,
      attachment.url,
      mapImage,
    )
    await message.react("✅")

    if (weather == null) return
    const location = resolveWeatherQuery(updated)
    const data = await weather.getWeather(location, updated.date, updated.meetingTime ?? undefined)
    if (data == null) return
    const image = await weather.getForecastImage(location)
    await message.channel.send({
      content: m.weatherForecast(
        data.tempMinC,
        data.tempMaxC,
        data.description,
        data.windSpeedKmph,
        data.windGustKmph,
        data.windDirection,
        data.precipitationChancePct,
        data.precipitationMm,
      ),
      files: image == null ? [] : [{ attachment: image, name: "weather.png" }],
    })
  } catch (err) {
    log.warn({ err, rideId: ride.id }, "GPX upload processing failed")
    await message.react("⚠️").catch(() => {})
    await message.reply(m.gpxParseFailed).catch(() => {})
  }
}
