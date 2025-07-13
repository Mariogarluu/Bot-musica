const { SlashCommandBuilder } = require('discord.js');
const { stopPlayer } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹️ Para la música y limpia la cola'),
  async execute(interaction) {
    await stopPlayer(interaction);
    return interaction.reply({ content: '⏹️ Música parada', ephemeral: true });
  }
};
