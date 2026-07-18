import type { Bot } from "grammy"
import type { RideRepository } from "../../../../domain/ports/ride.repository"
import { resolveWeatherQuery, type WeatherService } from "../../../../services/weather.service"
import { parseWeatherArgs } from "../../shared/parse"
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
    const args = parseWeatherArgs(ctx.match)
    const threadId = ctx.message?.message_thread_id
    const ride = threadId == null ? null : await rideRepo.findByThreadId(String(threadId))

    let date: Date
    let meetingTime: string | undefined

    if (args.date == null) {
      if (ride == null) {
        await ctx.reply(m.weatherMissingArgs)
        return
      }
      date = ride.date
      meetingTime = ride.meetingTime ?? undefined
    } else {
      date = args.date
      meetingTime = args.meetingTime ?? ride?.meetingTime ?? undefined
    }

    let location: string
    if (args.location == null) {
      if (ride == null) {
        await ctx.reply(m.weatherMissingArgs)
        return
      }
      location = resolveWeatherQuery(ride)
    } else {
      location = args.location
    }

    const data = await weather.getWeather(location, date, meetingTime)
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
