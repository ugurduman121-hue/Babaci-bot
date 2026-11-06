import express from "express";
const app = express();

app.get("/", (req, res) => {
  res.send("Bot aktif!");
});

app.listen(3000, () => {
  console.log("Web sunucusu 3000 portunda çalışıyor.");
});
import "dotenv/config";
import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} from "discord.js";
import {
  commands,
  handleCommand,
  registerSlashCommands,
} from "./src/commands.js";

const { DISCORD_TOKEN, DISCORD_APPLICATION_ID, DISCORD_GUILD_ID } =
  process.env;
const autoAssignMemberRole =
  process.env.DISCORD_AUTO_ASSIGN_MEMBER_ROLE === "true";

if (!DISCORD_TOKEN || !DISCORD_APPLICATION_ID) {
  console.error(
    "Missing DISCORD_TOKEN or DISCORD_APPLICATION_ID. Copy .env.example to .env and fill in your bot details.",
  );
  process.exit(1);
}

if (!/^\d+$/.test(DISCORD_APPLICATION_ID)) {
  console.error(
    "DISCORD_APPLICATION_ID must be the numeric ID from Discord Developer Portal > General Information, not an invite URL.",
  );
  process.exit(1);
}

if (DISCORD_GUILD_ID && !/^\d+$/.test(DISCORD_GUILD_ID)) {
  console.error(
    "DISCORD_GUILD_ID must be the numeric ID of your Discord server.",
  );
  process.exit(1);
}

const intents = [GatewayIntentBits.Guilds];
if (autoAssignMemberRole) intents.push(GatewayIntentBits.GuildMembers);

const client = new Client({ intents });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

if (autoAssignMemberRole) {
  client.on(Events.GuildMemberAdd, async (member) => {
    const role = member.guild.roles.cache.find(
      (guildRole) => guildRole.name === "Üye",
    );

    if (!role) {
      console.log(`No role named "Üye" found in ${member.guild.name}.`);
      return;
    }

    try {
      await member.roles.add(role);
      console.log(`Assigned "Üye" to ${member.user.tag}.`);
    } catch (error) {
      console.error(`Could not assign "Üye" to ${member.user.tag}:`, error);
    }
  });
}

client.on(Events.InteractionCreate, async (interaction) => {
  await handleCommand(interaction, client);
});

async function startBot() {
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
  const commandRoute = DISCORD_GUILD_ID
    ? Routes.applicationGuildCommands(
        DISCORD_APPLICATION_ID,
        DISCORD_GUILD_ID,
      )
    : Routes.applicationCommands(DISCORD_APPLICATION_ID);

  await registerSlashCommands(rest, commandRoute);
  console.log(
    DISCORD_GUILD_ID
      ? "Registered slash commands for the development server."
      : "Registered global slash commands. They may take time to appear.",
  );
  console.log(
    autoAssignMemberRole
      ? 'Automatic "Üye" role assignment is enabled.'
      : 'Automatic "Üye" role assignment is disabled.',
  );

  await client.login(DISCORD_TOKEN);
}

startBot().catch((error) => {
  console.error("Could not start the bot:", error);
  process.exitCode = 1;
  client.destroy();
});
.
