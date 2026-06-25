import { type Client, type GuildMember, type PartialGuildMember } from "discord.js"
import type { RideService } from "../../../../services/ride.service"
import { logger } from "../../../../logger"

const log = logger.child({ module: "discord-member-left" })

export function registerMemberLeftHandler(client: Client, rideService: RideService): void {
  client.on("guildMemberRemove", (member) => {
    void onMemberLeft(member, rideService).catch((err) => {
      log.error({ err, userId: member.id }, "Unhandled error in member left handler")
    })
  })
}

async function onMemberLeft(
  member: GuildMember | PartialGuildMember,
  rideService: RideService,
): Promise<void> {
  await rideService.removeMemberFromAllActiveRides(member.id)
}
