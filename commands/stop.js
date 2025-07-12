const { SlashCommandBuilder } = require('discord.js');
const { stopPlayer } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹️ Detiene la música y limpia la cola'),
  async execute(interaction) {
    const result = await stopPlayer(interaction);
    if (result) {
      await interaction.reply('⏹️ Música detenida y cola limpia.');
    } else {
      await interaction.reply({ content: '❌ No se está reproduciendo nada.', ephemeral: true });
    }
  }
};
