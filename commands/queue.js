// commands/queue.js
const { SlashCommandBuilder } = require('discord.js');
const { getQueueEmbed } = require('../utils/queueEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('📋 Muestra la cola interactiva de canciones con paginación'),

  async execute(interaction) {
    const { embed, components } = getQueueEmbed(interaction.guildId, 1, interaction.user);
    return interaction.reply({ embeds: [embed], components });
  }
};
