const { SlashCommandBuilder } = require('discord.js');
const { resumePlayer } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('▶️ Reanuda la reproducción'),
  async execute(interaction) {
    await resumePlayer(interaction);
    return interaction.reply({ content: '▶️ Reanudado', ephemeral: true });
  }
};
