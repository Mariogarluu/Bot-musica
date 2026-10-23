// commands/shuffle.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getQueue, setQueue } = require('../player');
const { getReproductorEmbed } = require('../utils/reproductorEmbed');
const { sendOrUpdateReproductor } = require('../utils/reproductorMessage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shuffle')
    .setDescription('🔀 Mezcla aleatoriamente el orden de la cola de canciones'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);

    if (!queue || queue.length <= 1) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setDescription('🚫 No hay suficientes canciones en espera en la cola para mezclar (se necesitan al menos 2 en espera).');
      return interaction.reply({ embeds: [errEmbed], ephemeral: true });
    }

    // Mantener la canción actual en primer lugar, mezclamos las siguientes
    const [current, ...rest] = queue;
    for (let i = rest.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rest[i], rest[j]] = [rest[j], rest[i]];
    }

    const newQueue = [current, ...rest];
    setQueue(interaction.guildId, newQueue);

    // Actualizar el reproductor con el nuevo orden de 'siguiente'
    const { embed, buttons } = getReproductorEmbed(current, interaction, newQueue);
    await sendOrUpdateReproductor(interaction.guildId, interaction, current, newQueue, embed, buttons, true);

    const successEmbed = new EmbedBuilder()
      .setColor(0x8B5CF6)
      .setTitle('🔀 Cola Mezclada con Éxito')
      .setDescription(`Se han reorganizado aleatoriamente **${rest.length}** canciones en espera.`)
      .setFooter({ text: 'Usa /queue para ver el nuevo orden' });

    return interaction.reply({ embeds: [successEmbed] });
  }
};
