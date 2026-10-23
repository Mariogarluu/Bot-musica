// commands/skip.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { skipSong, getQueue } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('⏭️ Salta la canción actual y pasa a la siguiente'),

  async execute(interaction) {
    const queue = getQueue(interaction.guildId);
    if (!queue || queue.length === 0) {
      const errEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setDescription('❌ No hay ninguna canción reproduciéndose para saltar.');
      return interaction.reply({ embeds: [errEmbed], ephemeral: true });
    }

    const currentTitle = queue[0].title;
    const result = await skipSong(interaction);

    if (result) {
      const successEmbed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle('⏭️ Canción Saltada')
        .setDescription(`Se ha saltado: **${currentTitle}**\nCargando la siguiente pista...`);
      await interaction.reply({ embeds: [successEmbed] });
    } else {
      const failEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setDescription('❌ No se pudo saltar la canción.');
      await interaction.reply({ embeds: [failEmbed], ephemeral: true });
    }
  }
};
