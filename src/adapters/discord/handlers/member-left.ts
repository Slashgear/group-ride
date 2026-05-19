import type { Client } from "discord.js"
import type { RideService } from "../../../services/ride.service"

export function registerMemberLeftHandler(client: Client, rideService: RideService): void {
  client.on("guildMemberRemove", async (member) => {
    await rideService.removeMemberFromAllActiveRides(Number(member.id))
  })
}
