const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pause } = require('../player'); // Import the pause logic from player.js

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('⏸️ Pauses the current song'),

  async execute(interaction) {
    const success = pause(interaction);

    if (success) {
      const embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('⏸️ Paused')
        .setDescription('Playback has been paused.')
        .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({
        content: '❌ No song is currently playing.',
        ephemeral: true
      });
    }
  }
};
