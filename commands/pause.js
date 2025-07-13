const { SlashCommandBuilder } = require('discord.js');
const { pausePlayer } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('⏸️ Pausa la reproducción'),
  async execute(interaction) {
    await pausePlayer(interaction);
    return interaction.reply({ content: '⏸️ Pausado', ephemeral: true });
  }
};
