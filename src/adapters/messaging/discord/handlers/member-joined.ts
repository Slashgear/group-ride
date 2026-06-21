import { type Client, type GuildMember } from "discord.js"
import { logger } from "../../../../logger"

const log = logger.child({ module: "discord-member-joined" })

const WELCOME_MESSAGE = (name: string) => `Hey ${name}! 👋 Welcome to **Group Ride** 🚴

Here's how it works:

**Proposing a ride**
Use \`/newride\` in any channel. A form will open — fill in the date, meeting point, time, and optionally paste a Komoot/Strava/Garmin link to auto-fill distance and elevation.

**Joining a ride**
When a ride is proposed, an announcement appears in the announcements channel with a **Join this ride** button. Click it to register. You can also join directly from the ride thread.

**The ride thread**
Each ride has its own private thread in the forum channel. Only registered participants can see it — that's where you coordinate details, ask questions, and chat with the group.

**Leaving or cancelling**
Inside the thread, use the **Leave** button to drop out, or **Cancel ride** to cancel the whole ride (any member can do this).

See you on the road! 🚵`

export function registerMemberJoinedHandler(client: Client): void {
  client.on("guildMemberAdd", (member) => {
    void onMemberJoined(member)
  })
}

async function onMemberJoined(member: GuildMember): Promise<void> {
  try {
    await member.send(WELCOME_MESSAGE(member.displayName))
  } catch (err) {
    log.warn(
      { err, userId: member.id },
      "Could not send welcome DM; falling back to system channel",
    )
    const channel = member.guild.systemChannel
    if (channel) {
      try {
        await channel.send(
          `Welcome to Group Ride, ${member.displayName}! 🚴 Check your DMs for info on how to use the bot.`,
        )
      } catch (channelErr) {
        log.error(
          { err: channelErr, userId: member.id, guildId: member.guild.id },
          "Failed to send welcome message to system channel",
        )
      }
    }
  }
}
