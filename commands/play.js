const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addToQueue } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Reproduce una canción de YouTube por URL')
    .addStringOption(option =>
      option.setName('song')
        .setDescription('URL del video de YouTube')
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

    // Validación simple (puedes mejorarla)
    if (!songInput.startsWith("http")) {
      return interaction.reply({
        content: '❌ Por favor, introduce solo la URL de un video de YouTube.',
        ephemeral: true,
      });
    }

    const songData = {
      title: songInput, // Puedes mejorar el título si quieres usando otra librería
      url: songInput,
    };

    await interaction.deferReply();
    await addToQueue(interaction, songData);

    const embed = new EmbedBuilder()
      .setColor(0x1DB954)
      .setTitle('🎶 Añadida a la cola')
      .setDescription(`[${songInput}](${songInput})`)
      .setFooter({ text: `Pedido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.editReply({ embeds: [embed] });
  }
};
