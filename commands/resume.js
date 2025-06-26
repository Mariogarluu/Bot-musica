const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { resume } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('▶️ Resumes a paused song'),

  async execute(interaction) {
    const success = resume(interaction);

    if (success) {
      const embed = new EmbedBuilder()
        .setColor(0x00FF7F)
        .setTitle('▶️ Playback Resumed')
        .setDescription('The music is now playing again.')
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Nothing to Resume')
        .setDescription('There is no paused track to resume.')
        .setTimestamp();

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
};
