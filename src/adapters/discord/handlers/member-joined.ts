import type { Client } from "discord.js"

export function registerMemberJoinedHandler(client: Client): void {
  client.on("guildMemberAdd", async (member) => {
    const channel = member.guild.systemChannel
    if (!channel) return
    await channel.send(`Welcome to Group Ride, ${member.displayName}! 🚴`)
  })
}
