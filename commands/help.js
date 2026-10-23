// commands/help.js
const { SlashCommandBuilder } = require('discord.js');
const { getHelpData } = require('../utils/helpEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖 Muestra la guía interactiva de comandos, opciones y controles del bot')
    .addStringOption(option =>
      option.setName('categoria')
        .setDescription('Categoría específica que deseas consultar')
        .setRequired(false)
        .addChoices(
          { name: '🏠 Visión General', value: 'overview' },
          { name: '🎵 Comandos de Música', value: 'music' },
          { name: '📜 Gestión de Cola', value: 'queue' },
          { name: '🎛️ Controles Interactivos', value: 'buttons' },
          { name: 'ℹ️ Información del Sistema', value: 'info' }
        )
    ),

  async execute(interaction) {
    const category = interaction.options.getString('categoria') || 'overview';
    const { embed, components } = getHelpData(interaction.client, category, interaction.user);
    await interaction.reply({ embeds: [embed], components });
  }
};
