// commands/pause.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { pausePlayer, getQueue } = require('../player');
const { getReproductorEmbed } = require('../utils/reproductorEmbed');
const { sendOrUpdateReproductor } = require('../utils/reproductorMessage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('⏸️ Pausa la canción actual'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || queue.length === 0) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setDescription('❌ No se está reproduciendo ninguna canción en este momento.');
      return interaction.reply({ embeds: [errEmbed], ephemeral: true });
    }

    const result = await pausePlayer(interaction);
    if (result) {
      // Actualizar el reproductor en el canal
      const { embed, buttons } = getReproductorEmbed(queue[0], interaction, queue);
      await sendOrUpdateReproductor(interaction.guildId, interaction, queue[0], queue, embed, buttons, true);

      const successEmbed = new EmbedBuilder()
        .setColor(0xF59E0B)
        .setTitle('⏸️ Reproducción Pausada')
        .setDescription(`Se ha pausado [**${queue[0].title}**](${queue[0].url}).\nUsa \`/resume\` o pulsa **▶️ Reanudar** para continuar.`);
      await interaction.reply({ embeds: [successEmbed] });
    } else {
      const failEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setDescription('❌ La música ya se encuentra pausada o no se puede pausar.');
      await interaction.reply({ embeds: [failEmbed], ephemeral: true });
    }
  }
};
