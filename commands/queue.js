const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('🎶 Muestra la cola de canciones'),
  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || queue.length === 0) {
      return interaction.reply('🚫 La cola está vacía.');
    }

    // Mostramos solo los primeros 10 (o menos)
    const maxToShow = 10;
    let desc = '';
    queue.slice(0, maxToShow).forEach((song, i) => {
      desc += `**${i + 1}.** [${song.title}](${song.url})\n`;
    });
    if (queue.length > maxToShow) {
      desc += `...y ${queue.length - maxToShow} más.`;
    }

    const embed = new EmbedBuilder()
      .setTitle('🎵 Cola actual')
      .setDescription(desc)
      .setColor(0x1DB954);

    return interaction.reply({ embeds: [embed] });
  }
};
