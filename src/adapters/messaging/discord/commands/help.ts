import { type Client, type Interaction, MessageFlags } from "discord.js"
import { logger } from "../../../../logger"

const log = logger.child({ module: "discord-help" })

const HELP_MESSAGE = `## 🚴 Group Ride — How it works

**Propose a ride**
Use \`/newride\` in any channel. A form will open — fill in the date, meeting point, time, and optionally paste a Komoot/Strava/Garmin link to auto-fill distance and elevation.

**Join a ride**
When a ride is proposed, an announcement appears in the announcements channel with a **Join this ride** button. Click it to register. You can also join directly from the ride thread.

**The ride thread**
Each ride has its own thread in the forum channel. Only registered participants receive notifications — that's where you coordinate details, ask questions, and chat with the group.

**List upcoming rides**
Use \`/rides\` to see all upcoming rides with Join buttons.

**Leave or cancel**
Inside the thread, use the **Leave** button to drop out, or **Cancel ride** to cancel the whole ride (any member can do this).

**Weather**
Use \`/weather\` inside a ride thread to get the forecast for that ride on demand, or pass \`location\` and/or \`date\` (DD/MM/YYYY) options to check any place and date.`

export function registerHelpCommand(client: Client): void {
  client.on("interactionCreate", (interaction) => {
    void onHelp(interaction).catch((err) => {
      log.error({ err }, "Unhandled error in help command")
    })
  })
}

async function onHelp(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "help") return
  await interaction.reply({ content: HELP_MESSAGE, flags: MessageFlags.Ephemeral })
}
