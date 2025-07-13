const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('📋 Muestra la cola de reproducción'),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || queue.length === 0) {
      return interaction.reply({ content: '🚫 La cola está vacía.', ephemeral: true });
    }
    let desc = '';
    queue.forEach((song, i) => {
      desc += `**${i + 1}.** [${song.title}](${song.url})\n`;
    });
    const embed = new EmbedBuilder()
      .setTitle('📋 Cola actual')
      .setDescription(desc.length < 4096 ? desc : desc.substring(0, 4093) + "...")
      .setColor(0x1DB954);

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
