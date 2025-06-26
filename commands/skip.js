const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { skip } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('⏭ Skips the current song and plays the next one in the queue'),

  async execute(interaction) {
    await interaction.deferReply();

    const result = skip(interaction);

    const embed = new EmbedBuilder()
      .setColor(result ? 0x0099FF : 0xFF0000)
      .setTitle(result ? '⏭ Skipped!' : '❌ Cannot Skip')
      .setDescription(result ? 'Now playing the next song in the queue.' : 'There is no song currently playing to skip.')
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
