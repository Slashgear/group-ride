import { type ChatInputCommandInteraction, type Client, type Interaction } from "discord.js"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import { resolveWeatherQuery, type WeatherService } from "../../../../services/weather.service"
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
  const ride = await rideRepo.findByThreadId(interaction.channelId)
  if (ride == null) {
    await interaction.editReply({ content: m.weatherNotInThread })
    return
  }
  const data = await weather.getWeather(
    resolveWeatherQuery(ride),
    ride.date,
    ride.meetingTime ?? undefined,
  )
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
