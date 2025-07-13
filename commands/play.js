const { SlashCommandBuilder } = require('discord.js');
const ytdl = require('@distube/ytdl-core');
const ytpl = require('ytpl');
const { addToQueue } = require('../player');

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

    await interaction.deferReply({ ephemeral: true });

    // ¿Es playlist?
    if (ytpl.validateID(songInput)) {
      try {
        const playlist = await ytpl(songInput, { pages: 1 });
        const songs = playlist.items.map(video => ({
          title: video.title,
          url: video.shortUrl
        }));
        for (const song of songs) {
          await addToQueue(interaction, song);
        }
        return interaction.editReply({ content: `🎶 Playlist añadida a la cola (${songs.length} canciones)` });
      } catch (err) {
        console.error(err);
        return interaction.editReply('❌ Error al procesar la playlist.');
      }
    }

    // Si NO es playlist, intenta como video individual:
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

    const song = {
      title,
      url: songInput,
    };

    await addToQueue(interaction, song);

    return interaction.editReply({ content: `▶️ Añadido a la cola: ${title}` });
  }
};
