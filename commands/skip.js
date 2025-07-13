const { SlashCommandBuilder } = require('discord.js');
const { skipSong } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('⏭️ Salta la canción actual'),
  async execute(interaction) {
    await skipSong(interaction);
    return interaction.reply({ content: '⏭️ Canción saltada', ephemeral: true });
  }
};
