// commands/resume.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { resumePlayer, getQueue } = require('../player');
const { getReproductorEmbed } = require('../utils/reproductorEmbed');
const { sendOrUpdateReproductor } = require('../utils/reproductorMessage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('▶️ Continúa la reproducción pausada'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || queue.length === 0) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setDescription('❌ No hay música activa en este servidor.');
      return interaction.reply({ embeds: [errEmbed], ephemeral: true });
    }

    const result = await resumePlayer(interaction);
    if (result) {
      // Actualizar el reproductor en el canal
      const { embed, buttons } = getReproductorEmbed(queue[0], interaction, queue);
      await sendOrUpdateReproductor(interaction.guildId, interaction, queue[0], queue, embed, buttons, true);

      const successEmbed = new EmbedBuilder()
        .setColor(0x1DB954)
        .setTitle('▶️ Reproducción Reanudada')
        .setDescription(`Continuando con [**${queue[0].title}**](${queue[0].url}).`);
      await interaction.reply({ embeds: [successEmbed] });
    } else {
      const failEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setDescription('❌ La música no estaba pausada o no se pudo reanudar.');
      await interaction.reply({ embeds: [failEmbed], ephemeral: true });
    }
  }
};
