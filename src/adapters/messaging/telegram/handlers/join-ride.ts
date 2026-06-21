import type { Bot } from "grammy"
import {
  AlreadyMemberError,
  RideNotActiveError,
  RideNotFoundError,
} from "../../../../domain/errors"
import type { RideService } from "../../../../services/ride.service"
import type { BotContext } from "../bot"
import { logger } from "../../../../logger"
import { getMessages } from "../../../../i18n"

const log = logger.child({ module: "telegram-join" })

export function registerJoinRideHandler(bot: Bot<BotContext>, rideService: RideService): void {
  bot.callbackQuery(/^join:(.+)$/u, async (ctx) => {
    const rideId = ctx.match[1] ?? ""
    const userId = String(ctx.from.id)
    const m = getMessages()
    try {
      const result = await rideService.join(rideId, userId)
      const text = result.waitlisted ? m.joinWaitlist(result.position) : m.joinSuccessTelegram
      await ctx.answerCallbackQuery({ text, show_alert: result.waitlisted })
    } catch (err) {
      const text =
        err instanceof AlreadyMemberError
          ? m.alreadyMember
          : err instanceof RideNotActiveError
            ? m.rideNotActive
            : err instanceof RideNotFoundError
              ? m.rideNotFound
              : m.unexpectedError
      await ctx.answerCallbackQuery({ text, show_alert: true })
      if (
        !(
          err instanceof AlreadyMemberError ||
          err instanceof RideNotActiveError ||
          err instanceof RideNotFoundError
        )
      ) {
        log.error({ err, rideId, userId }, "Unexpected error in join handler")
        throw err
      }
    }
  })
}
