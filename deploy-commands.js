const fs = require('fs');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

// Load all commands from ./commands
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  commands.push(command.data.toJSON());
}

// Create REST client with your bot token
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

// Deploy the commands to your test server (GUILD_ID)
(async () => {
  try {
    console.log('🔄 Refreshing slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log('✅ Slash commands deployed successfully!');
  } catch (error) {
    console.error('❌ Error registering slash commands:', error);
  }
})();

