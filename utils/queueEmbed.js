// utils/queueEmbed.js
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getQueue, getLoop } = require('../player');

function formatSeconds(totalSeconds) {
  if (!totalSeconds || isNaN(totalSeconds)) return '--:--';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);
  if (hrs > 0) {
    return `${hrs}h ${mins < 10 ? '0' : ''}${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function getQueueEmbed(guildId, page = 1, user = null) {
  const queue = getQueue(guildId);
  const isLoop = getLoop(guildId);

  if (!queue || queue.length === 0) {
    const emptyEmbed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle('📋 Cola de Reproducción Vacía')
      .setDescription('No hay ninguna canción en la cola en este momento.\n\n💡 Usa `/play [canción o URL]` o `/search` para añadir música.')
      .setFooter({ text: 'Bot de Música' });
    return { embed: emptyEmbed, components: [], totalPages: 0 };
  }

  const currentSong = queue[0];
  const upcomingSongs = queue.slice(1);
  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(upcomingSongs.length / itemsPerPage));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  // Calcular tiempo total aproximado
  let totalSeconds = 0;
  for (const s of queue) {
    totalSeconds += (s.seconds || 0);
  }
  const totalTimeFormatted = totalSeconds > 0 ? formatSeconds(totalSeconds) : 'Desconocida';

  const embed = new EmbedBuilder()
    .setColor(0x1DB954)
    .setTitle('📋 Cola de Reproducción Actual');

  if (currentSong.thumbnail) {
    embed.setThumbnail(currentSong.thumbnail);
  }

  const requester = currentSong.requestedBy?.username || user?.username || 'Usuario';
  const currentLink = currentSong.url ? `[**${currentSong.title}**](${currentSong.url})` : `**${currentSong.title}**`;
  let desc = `### 🔊 Sonando Ahora:\n` +
    `▶️ ${currentLink}\n` +
    `⏱️ Duración: \`${currentSong.duration || '--:--'}\` • 👤 Pedido por: **${requester}**\n\n` +
    `---\n### 📑 Siguientes pistas en espera:\n`;

  if (upcomingSongs.length === 0) {
    desc += `*No hay más pistas en espera. ¡Añade más con \`/play\`!*\n`;
  } else {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const pageSongs = upcomingSongs.slice(startIndex, startIndex + itemsPerPage);

    pageSongs.forEach((song, i) => {
      const realIndex = startIndex + i + 1;
      const dur = song.duration ? `\`${song.duration}\`` : '\`--:--\`';
      const req = song.requestedBy?.username ? ` • 👤 *${song.requestedBy.username}*` : '';
      const safeTitle = song.title.length > 55 ? song.title.substring(0, 52) + '...' : song.title;
      const songLink = song.url ? `[${safeTitle}](${song.url})` : `**${safeTitle}**`;
      desc += `**${realIndex}.** ${songLink} • ${dur}${req}\n`;
    });
  }

  embed.setDescription(desc);
  embed.setFooter({
    text: `Página ${currentPage} de ${totalPages} • Total: ${queue.length} pista${queue.length === 1 ? '' : 's'} • Duración total: ${totalTimeFormatted} • Bucle: ${isLoop ? 'Activado' : 'Desactivado'}`,
    iconURL: user?.displayAvatarURL?.() || undefined
  });
  embed.setTimestamp();

  // Botones de paginación
  const components = [];
  if (totalPages > 1) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`queue_page_${currentPage - 1}`)
        .setLabel('◀️ Anterior')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage <= 1),
      new ButtonBuilder()
        .setCustomId('queue_page_indicator')
        .setLabel(`Página ${currentPage} / ${totalPages}`)
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId(`queue_page_${currentPage + 1}`)
        .setLabel('Siguiente ▶️')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentPage >= totalPages)
    );
    components.push(row);
  }

  return { embed, components, totalPages };
}

module.exports = { getQueueEmbed };
