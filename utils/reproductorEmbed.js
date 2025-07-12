// utils/reproductorEmbed.js
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

function getReproductorEmbed(currentSong, interaction, queue) {
  let siguiente = null;
  if (queue && queue.length > 1) {
    siguiente = queue[1];
  }

  const embed = new EmbedBuilder()
    .setTitle('🎵 Reproduciendo')
    .setDescription(`[${currentSong.title}](${currentSong.url})`)
    .setColor(0x1DB954)
    .setFooter({ text: `Pedido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

  if (siguiente) {
    embed.addFields({ name: '⏭️ Siguiente', value: `[${siguiente.title}](${siguiente.url})`, inline: false });
  } else {
    embed.addFields({ name: '⏭️ Siguiente', value: '—', inline: false });
  }

  // 5 botones por fila máximo
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('pause').setLabel('⏸️ Pausa').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('resume').setLabel('▶️ Reanudar').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('skip').setLabel('⏭️ Saltar').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('shuffle').setLabel('🔀 Mezclar').setStyle(ButtonStyle.Primary)
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('stop').setLabel('⏹️ Parar').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('queue').setLabel('📋 Cola').setStyle(ButtonStyle.Success)
  );

  return { embed, buttons: [row1, row2] };
}

module.exports = { getReproductorEmbed };
