import { type ChatInputCommandInteraction, type Client, type Interaction } from "discord.js"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import { resolveWeatherQuery, type WeatherService } from "../../../../services/weather.service"
import { parseDateAndTime } from "../../shared/parse"
import { getMessages } from "../../../../i18n"
import { logger } from "../../../../logger"

const log = logger.child({ module: "discord-weather" })

export function registerWeatherCommand(
  client: Client,
  rideRepo: RideRepository,
  weather: WeatherService | undefined,
): void {
  client.on("interactionCreate", (interaction) => {
    void onWeather(interaction, rideRepo, weather).catch((err) => {
      log.error({ err }, "Unhandled error in weather command")
    })
  })
}

async function onWeather(
  interaction: Interaction,
  rideRepo: RideRepository,
  weather: WeatherService | undefined,
): Promise<void> {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "weather") return
  await handleWeatherCommand(interaction, rideRepo, weather)
}

async function handleWeatherCommand(
  interaction: ChatInputCommandInteraction,
  rideRepo: RideRepository,
  weather: WeatherService | undefined,
): Promise<void> {
  await interaction.deferReply()
  const m = getMessages()
  if (weather == null) {
    await interaction.editReply({ content: m.weatherUnavailable })
    return
  }
  const optLocation = interaction.options.getString("location") ?? undefined
  const optDate = interaction.options.getString("date") ?? undefined
  const ride = await rideRepo.findByThreadId(interaction.channelId)

  let date: Date
  let meetingTime: string | undefined

  if (optDate == null) {
    if (ride == null) {
      await interaction.editReply({ content: m.weatherMissingArgs })
      return
    }
    date = ride.date
    meetingTime = ride.meetingTime ?? undefined
  } else {
    const parsed = parseDateAndTime(optDate)
    if (parsed == null) {
      await interaction.editReply({ content: m.weatherInvalidDate })
      return
    }
    date = parsed.date
    meetingTime = parsed.meetingTime ?? ride?.meetingTime ?? undefined
  }

  let location: string
  if (optLocation == null) {
    if (ride == null) {
      await interaction.editReply({ content: m.weatherMissingArgs })
      return
    }
    location = resolveWeatherQuery(ride)
  } else {
    location = optLocation
  }

  const data = await weather.getWeather(location, date, meetingTime)
  if (data == null) {
    await interaction.editReply({ content: m.weatherUnavailable })
    return
  }
  await interaction.editReply({
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
  })
}
