// Load environment variables from .env file
require('dotenv').config();

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');

// Create a new Discord client with specific intents (permissions)
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,              // Allows bot to access basic guild info
        GatewayIntentBits.GuildMessages,       // Allows bot to read messages
        GatewayIntentBits.MessageContent,      // Allows bot to read message content
        GatewayIntentBits.GuildVoiceStates,    // Allows bot to access voice channel state
    ],
});

// Create a collection to store all slash commands
client.commands = new Collection();

// Load all command files from the /commands directory
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command); // Add each command to the collection
}

// Event: Bot is ready
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// Event: Slash command interaction received
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName); // Get the matching command

    if (!command) return;

    try {
        await command.execute(interaction); // Run the command logic
    } catch (error) {
        console.error(error);
        // Reply with error message (ephemeral = only visible to user)
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

// Log in to Discord using the bot token from .env
client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('Bot is online!'))
    .catch(console.error);
