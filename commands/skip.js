const { SlashCommandBuilder } = require('discord.js');
const { skipSong } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('⏭️ Salta la canción actual'),
  async execute(interaction) {
    const result = await skipSong(interaction);
    if (result) {
      await interaction.reply('⏭️ Canción saltada.');
    } else {
      await interaction.reply({ content: '❌ No se puede saltar.', ephemeral: true });
    }
  }
};
