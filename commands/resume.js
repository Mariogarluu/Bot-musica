const { SlashCommandBuilder } = require('discord.js');
const { resumePlayer } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('▶️ Continúa la música pausada'),
  async execute(interaction) {
    const result = await resumePlayer(interaction);
    if (result) {
      await interaction.reply('▶️ Música reanudada.');
    } else {
      await interaction.reply({ content: '❌ No hay música pausada.', ephemeral: true });
    }
  }
};
