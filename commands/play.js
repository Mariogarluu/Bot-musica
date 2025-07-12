// commands/play.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addToQueue, getQueue } = require('../player');
const ytdl = require('@distube/ytdl-core');
const ytpl = require('ytpl');
const { getReproductorEmbed } = require('../utils/reproductorEmbed');
const { sendOrUpdateReproductor } = require('../utils/reproductorMessage');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('🎵 Reproduce una canción o playlist de YouTube')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('URL del video o playlist de YouTube')
                .setRequired(true)
        ),

    async execute(interaction) {
        const songInput = interaction.options.getString('song');
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({
                content: '🚫 Debes unirte primero a un canal de voz.',
                ephemeral: true,
            });
        }

        await interaction.deferReply();

        // ¿Es playlist?
        if (ytpl.validateID(songInput)) {
            try {
                const playlist = await ytpl(songInput, { pages: 1 });
                const songs = playlist.items.map(video => ({
                    title: video.title,
                    url: video.shortUrl
                }));

                const wasEmpty = getQueue(interaction.guildId).length === 0;

                for (const song of songs) {
                    await addToQueue(interaction, song);
                }

                const embed = new EmbedBuilder()
                    .setColor(0x1DB954)
                    .setTitle('🎶 Playlist añadida a la cola')
                    .setDescription(`${playlist.title}\nTotal canciones: ${songs.length}`)
                    .setURL(songInput)
                    .setFooter({ text: `Pedido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

                await interaction.editReply({ embeds: [embed] });

                if (wasEmpty && songs.length > 0) {
                    const queue = getQueue(interaction.guildId);
                    const { embed: playerEmbed, buttons } = getReproductorEmbed(queue[0], interaction, queue);
                    await sendOrUpdateReproductor(interaction.guildId, interaction, queue[0], queue, playerEmbed, buttons);
                }
                return;
            } catch (err) {
                console.error(err);
                return interaction.editReply('❌ Error al procesar la playlist.');
            }
        }

        // Video individual
        if (!songInput.startsWith("http")) {
            return interaction.editReply({
                content: '❌ Por favor, introduce una URL de YouTube válida.',
                ephemeral: true,
            });
        }

        let title = songInput;
        try {
            const info = await ytdl.getBasicInfo(songInput);
            title = info.videoDetails.title;
        } catch (err) {}

        const song = { title, url: songInput };
        await addToQueue(interaction, song);

        const queue = getQueue(interaction.guildId);
        const { embed, buttons } = getReproductorEmbed(song, interaction, queue);

        await sendOrUpdateReproductor(interaction.guildId, interaction, song, queue, embed, buttons);
    }
};
