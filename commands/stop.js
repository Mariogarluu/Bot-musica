const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { stop } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⛔ Stops the music and clears the queue'),

  async execute(interaction) {
    await interaction.deferReply();

    const result = stop(interaction);

    const embed = new EmbedBuilder()
      .setColor(result ? 0xFF5555 : 0xAAAAAA)
      .setTitle(result ? '🛑 Music Stopped' : '❌ Nothing Playing')
      .setDescription(result
        ? 'All songs have been removed from the queue.\nThe bot has left the voice channel.'
        : 'There is no active music session to stop.')
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};
