// utils/reproductorEmbed.js
const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

function getReproductorEmbed(currentSong, interaction, queue = [], options = {}) {
  const player = require('../player');
  const guildId = interaction.guildId;
  const paused = options.isPaused !== undefined ? options.isPaused : (player.isPaused ? player.isPaused(guildId) : false);
  const loopActive = options.isLoop !== undefined ? options.isLoop : (player.getLoop ? player.getLoop(guildId) : false);
  const activeFilter = options.filter !== undefined ? options.filter : (player.getFilter ? player.getFilter(guildId) : 'off');

  const siguiente = queue && queue.length > 1 ? queue[1] : null;

  // Metadata de la canción
  const durationText = currentSong.duration || 'Desconocida';
  const authorText = currentSong.author || 'YouTube';
  const requester = currentSong.requestedBy?.username || interaction.user?.username || 'Usuario';
  const requesterAvatar = currentSong.requestedBy?.avatarURL || interaction.user?.displayAvatarURL?.() || null;

  // Aspecto visual según estado
  let statusHeader = '🎵 Reproduciendo Ahora';
  let embedColor = 0x1DB954; // Spotify Green

  if (paused) {
    statusHeader = '⏸️ Reproductor en Pausa';
    embedColor = 0xF59E0B; // Amber Gold
  } else if (loopActive) {
    statusHeader = '🔁 Reproduciendo en Bucle';
    embedColor = 0x8B5CF6; // Violet
  }

  const cleanTitle = currentSong.title
    ? (currentSong.title.length > 80 ? currentSong.title.substring(0, 77) + '...' : currentSong.title)
    : 'Canción de YouTube';

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setAuthor({
      name: statusHeader,
      iconURL: paused
        ? 'https://cdn-icons-png.flaticon.com/512/565/565296.png'
        : 'https://cdn-icons-png.flaticon.com/512/565/565285.png'
    })
    .setTitle(cleanTitle);

  if (currentSong.url) {
    embed.setURL(currentSong.url);
    embed.setDescription(
      `[🔗 Abrir enlace](${currentSong.url})\n\n` +
      `🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬ \`${durationText}\``
    );
  } else {
    embed.setDescription(`🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬ \`${durationText}\``);
  }

  embed.addFields(
    { name: '⏱️ Duración', value: `\`${durationText}\``, inline: true },
    { name: '👤 Canal / Artista', value: authorText, inline: true },
    { name: '🙋 Pedido por', value: requester, inline: true }
  );

  // Miniatura
  if (currentSong.thumbnail) {
    embed.setThumbnail(currentSong.thumbnail);
  }

  // Siguiente pista
  if (siguiente) {
    const nextDuration = siguiente.duration ? ` (\`${siguiente.duration}\`)` : '';
    const nextTitle = siguiente.title.length > 60 ? siguiente.title.substring(0, 57) + '...' : siguiente.title;
    const nextLink = siguiente.url ? `[${nextTitle}](${siguiente.url})` : `**${nextTitle}**`;
    embed.addFields({
      name: '⏭️ Siguiente en la cola',
      value: `${nextLink}${nextDuration}`,
      inline: false
    });
  } else {
    embed.addFields({
      name: '⏭️ Siguiente en la cola',
      value: '*Ninguna pista en espera. La reproducción finalizará al terminar esta canción.*',
      inline: false
    });
  }

  // Pie y fecha
  const queueCount = queue.length;
  const djActive = options.isDj !== undefined ? options.isDj : (player.getDjMode ? player.getDjMode(guildId) : false);
  const djText = djActive ? ' • DJ: 🎙️ ON' : '';
  const filterText = activeFilter && activeFilter !== 'off' && activeFilter !== 'clear' ? ` • Filtro: ${activeFilter}` : '';
  embed.setFooter({
    text: `Cola: ${queueCount} pista${queueCount === 1 ? '' : 's'} • Bucle: ${loopActive ? 'Activado' : 'Desactivado'}${djText}${filterText} • /help para ver opciones`,
    iconURL: requesterAvatar || undefined
  });
  embed.setTimestamp();

  // Fila 1 de controles (Máximo 5 botones por fila en Discord)
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('pause_resume')
      .setLabel(paused ? '▶️ Reanudar' : '⏸️ Pausar')
      .setStyle(paused ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('skip')
      .setLabel('⏭️ Saltar')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('loop')
      .setLabel('🔁 Bucle')
      .setStyle(loopActive ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('shuffle')
      .setLabel('🔀 Mezclar')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(queueCount <= 2),
    new ButtonBuilder()
      .setCustomId('stop')
      .setLabel('⏹️ Parar')
      .setStyle(ButtonStyle.Danger)
  );

  // Fila 2 de controles (Opciones y visualización)
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('queue')
      .setLabel(`📋 Ver Cola (${queueCount})`)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('help')
      .setLabel('❓ Ayuda & Opciones')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embed, buttons: [row1, row2] };
}

module.exports = { getReproductorEmbed };
