import { type Client, type GuildMember, type PartialGuildMember } from "discord.js"
import type { RideService } from "../../../services/ride.service"

export function registerMemberLeftHandler(client: Client, rideService: RideService): void {
  client.on("guildMemberRemove", (member) => {
    void onMemberLeft(member, rideService)
  })
}

async function onMemberLeft(
  member: GuildMember | PartialGuildMember,
  rideService: RideService,
): Promise<void> {
  await rideService.removeMemberFromAllActiveRides(Number(member.id))
}
