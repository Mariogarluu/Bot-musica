const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueueList } = require('../player'); // Get the current queue from player.js

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Shows the current song queue'),

  async execute(interaction) {
    const queueText = getQueueList(interaction); // Get formatted queue list

    if (!queueText) {
      return interaction.reply({ content: '📭 The queue is empty.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x1DB954) // Verde Spotify, baby
      .setTitle('🎶 Current Queue')
      .setDescription(queueText)
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
