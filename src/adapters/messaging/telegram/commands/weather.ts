import type { Bot } from "grammy"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import type { WeatherService } from "../../../../services/weather.service"
import type { BotContext } from "../bot"
import { getMessages } from "../../../../i18n"

export function registerWeatherCommand(
  bot: Bot<BotContext>,
  rideRepo: RideRepository,
  weather: WeatherService | undefined,
): void {
  bot.command("weather", async (ctx) => {
    const m = getMessages()
    if (weather == null) {
      await ctx.reply(m.weatherUnavailable)
      return
    }
    const threadId = ctx.message?.message_thread_id
    const ride = threadId == null ? null : await rideRepo.findByThreadId(String(threadId))
    if (ride == null) {
      await ctx.reply(m.weatherNotInThread)
      return
    }
    const data = await weather.getWeather(
      ride.meetingPoint,
      ride.date,
      ride.meetingTime ?? undefined,
    )
    if (data == null) {
      await ctx.reply(m.weatherUnavailable)
      return
    }
    await ctx.reply(
      m.weatherForecast(
        data.tempMinC,
        data.tempMaxC,
        data.description,
        data.windSpeedKmph,
        data.windGustKmph,
        data.windDirection,
        data.precipitationChancePct,
        data.precipitationMm,
      ),
    )
  })
}
