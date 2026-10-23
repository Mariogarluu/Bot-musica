// commands/stop.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { stopPlayer, getQueue } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('⏹️ Detiene la música, limpia la cola y desconecta al bot'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || queue.length === 0) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setDescription('❌ No hay reproducción activa para detener.');
      return interaction.reply({ embeds: [errEmbed], ephemeral: true });
    }

    const result = await stopPlayer(interaction);
    if (result) {
      const successEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('⏹️ Reproducción Finalizada')
        .setDescription('Se ha detenido la música, vaciado la cola y el bot ha abandonado el canal de voz.\n¡Hasta la próxima! 👋');
      await interaction.reply({ embeds: [successEmbed] });
    } else {
      const failEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setDescription('❌ Ocurrió un problema al detener el reproductor.');
      await interaction.reply({ embeds: [failEmbed], ephemeral: true });
    }
  }
};
