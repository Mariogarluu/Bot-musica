const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('📃 Muestra la cola de canciones'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || queue.length === 0) {
      return interaction.reply('📃 La cola está vacía.');
    }

    const description = queue.map((song, i) =>
      `**${i + 1}.** [${song.title}](${song.url})`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setTitle('Cola de reproducción')
      .setDescription(description)
      .setColor(0x1DB954);

    await interaction.reply({ embeds: [embed] });
  }
};
