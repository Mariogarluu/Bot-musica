require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { pausePlayer, resumePlayer, skipSong, stopPlayer, getQueue, setQueue, addToQueue } = require('./player');
const { getReproductorEmbed } = require('./utils/reproductorEmbed');
const { sendOrUpdateReproductor } = require('./utils/reproductorMessage');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
    ],
});

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
    if (interaction.isButton()) {
        const guildId = interaction.guildId;
        const queue = getQueue(guildId);

        // SIEMPRE: asegúrate de deferReply si aún no está respondida la interacción
        if (!interaction.deferred && !interaction.replied) {
            await interaction.deferReply({ ephemeral: false });
        }

        // Lógica de cada botón
        let updated = false;
        switch (interaction.customId) {
            case 'pause':
                await pausePlayer(interaction);
                updated = true;
                break;
            case 'resume':
                await resumePlayer(interaction);
                updated = true;
                break;
            case 'skip':
                await skipSong(interaction);
                updated = true;
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
                updated = true;
                break;
            case 'stop':
                await stopPlayer(interaction);
                updated = true;
                break;
            case 'queue': {
                // Muestra solo la cola (no el reproductor)
                if (!queue || queue.length === 0) {
                    return interaction.followUp({ content: '🚫 La cola está vacía.', ephemeral: true });
                }
                let desc = '';
                queue.forEach((song, i) => {
                    desc += `**${i + 1}.** [${song.title}](${song.url})\n`;
                });
                const embed = new EmbedBuilder()
                    .setTitle('📋 Cola actual')
                    .setDescription(desc.length < 4096 ? desc : desc.substring(0, 4093) + "...")
                    .setColor(0x1DB954);
                return interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        }

        // Si la acción requiere refrescar el reproductor:
        if (updated) {
            const updatedQueue = getQueue(guildId);
            if (updatedQueue && updatedQueue[0]) {
                const { embed, buttons } = getReproductorEmbed(updatedQueue[0], interaction, updatedQueue);
                await sendOrUpdateReproductor(guildId, interaction, updatedQueue[0], updatedQueue, embed, buttons);
            } else {
                // Puedes borrar el mensaje del reproductor si la cola está vacía
            }
        }
        return;
    }

    // --- Botón de play desde search ---
    if (interaction.isButton() && interaction.customId.startsWith('search_play_')) {
        const videoId = interaction.customId.replace('search_play_', '');
        const url = `https://www.youtube.com/watch?v=${videoId}`;

        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({
                content: '🚫 Debes unirte primero a un canal de voz.',
                ephemeral: true,
            });
        }

        const yts = require('yt-search');
        const info = await yts({ videoId });
        const title = info && info.title ? info.title : url;

        await addToQueue(interaction, { title, url });

        // Refresca el reproductor
        const queue = getQueue(interaction.guildId);
        const { embed, buttons } = getReproductorEmbed({ title, url }, interaction, queue);
        await sendOrUpdateReproductor(interaction.guildId, interaction, { title, url }, queue, embed, buttons);
        return;
    }

    // Slash commands
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.deferred || interaction.replied) {
            await interaction.editReply('❌ Hubo un error al ejecutar el comando.');
        } else {
            await interaction.reply({ content: '❌ Hubo un error al ejecutar el comando.', ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN)
    .then(() => console.log('Bot is online!'))
    .catch(console.error);
