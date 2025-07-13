require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const { getQueue, setQueue, addToQueue, pausePlayer, resumePlayer, skipSong, stopPlayer } = require('./player');
const { getReproductorEmbed } = require('./utils/reproductorEmbed');
const { sendOrUpdateReproductor, clearReproductorMessage } = require('./utils/reproductorMessage');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Cargar comandos
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    // Slash commands
    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply('❌ Error ejecutando el comando.');
            } else {
                await interaction.reply({ content: '❌ Error ejecutando el comando.', ephemeral: true });
            }
        }
        return;
    }

    // Botones del reproductor
    if (interaction.isButton()) {
        const guildId = interaction.guildId;
        const queue = getQueue(guildId);

        switch (interaction.customId) {
            case 'pause':
                await pausePlayer(interaction);
                break;
            case 'resume':
                await resumePlayer(interaction);
                break;
            case 'skip':
                await skipSong(interaction);
                break;
            case 'shuffle':
                if (queue && queue.length > 1) {
                    const [current, ...rest] = queue;
                    for (let i = rest.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [rest[i], rest[j]] = [rest[j], rest[i]];
                    }
                    setQueue(guildId, [current, ...rest]);
                }
                break;
            case 'stop':
                await stopPlayer(interaction);
                await clearReproductorMessage(guildId);
                break;
            case 'queue': {
                if (!queue || queue.length === 0) {
                    return interaction.reply({ content: '🚫 La cola está vacía.', ephemeral: true });
                }
                let desc = '';
                queue.forEach((song, i) => {
                    desc += `**${i + 1}.** [${song.title}](${song.url})\n`;
                });
                return interaction.reply({
                    embeds: [{
                        title: '📋 Cola actual',
                        description: desc.length < 4096 ? desc : desc.substring(0, 4093) + "...",
                        color: 0x1DB954
                    }],
                    ephemeral: true
                });
            }
        }

        // Actualizar reproductor después de cada acción
        const updatedQueue = getQueue(guildId);
        if (updatedQueue && updatedQueue[0]) {
            const { embed, buttons } = getReproductorEmbed(updatedQueue[0], interaction, updatedQueue);
            await sendOrUpdateReproductor(guildId, interaction.channel, embed, buttons);
        }
        return;
    }
});

client.login(process.env.DISCORD_TOKEN);
