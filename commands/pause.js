const { SlashCommandBuilder } = require('discord.js');
const { pausePlayer } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('⏸️ Pausa la canción actual'),
  async execute(interaction) {
    const result = await pausePlayer(interaction);
    if (result) {
      await interaction.reply('⏸️ Música pausada.');
    } else {
      await interaction.reply({ content: '❌ No se está reproduciendo nada.', ephemeral: true });
    }
  }
};
