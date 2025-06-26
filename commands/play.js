const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addToQueue } = require('../player');
const ytdl = require('ytdl-core'); // ¡Faltaba esto, guarra!

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Plays a song from YouTube by URL')
    .addStringOption(option =>
      option.setName('song')
        .setDescription('The YouTube URL of the song')
        .setRequired(true)
    ),

  async execute(interaction) {
    const songInput = interaction.options.getString('song');

    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '🚫 You need to join a voice channel first!',
        ephemeral: true,
      });
    }

    let songInfo;
    try {
      songInfo = await ytdl.getInfo(songInput);
    } catch (error) {
      console.error(`❌ Error fetching song info: ${error}`);
      return interaction.reply({
        content: '❌ Error retrieving the song. Please provide a valid YouTube URL.',
        ephemeral: true,
      });
    }

    const songData = {
      title: songInfo.videoDetails.title,
      url: songInfo.videoDetails.video_url,
    };

    await interaction.deferReply();
    await addToQueue(interaction, songData);

    const embed = new EmbedBuilder()
      .setColor(0x1DB954)
      .setTitle('🎶 Added to Queue')
      .setDescription(`**[${songData.title}](${songData.url})**`)
      .setThumbnail(songInfo.videoDetails.thumbnails[0].url)
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.editReply({ embeds: [embed] });
  }
};
