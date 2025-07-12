const { SlashCommandBuilder } = require('discord.js');
const { getQueue, setQueue } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('🔀 Mezcla aleatoriamente la cola de canciones'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || queue.length <= 1) {
      return interaction.reply({
        content: '🚫 No hay suficientes canciones en la cola para mezclar.',
        ephemeral: true
      });
    }

    // Mantener la canción actual en primer lugar, solo mezclamos el resto
    const [current, ...rest] = queue;
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    setQueue(interaction.guildId, [current, ...rest]);
    return interaction.reply('🔀 La cola ha sido mezclada!');
  }
};
