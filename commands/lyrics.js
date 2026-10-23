// commands/lyrics.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require('discord.js');
const { getQueue } = require('../player');

/**
 * Limpia coletillas habituales de títulos de YouTube/música
 * como (Official Video), [Videoclip], HD, 4K, Remastered, etc.
 */
function cleanSongTitle(rawTitle) {
  if (!rawTitle) return '';
  let title = rawTitle;

  // 1. Eliminar coletillas comunes en paréntesis o corchetes
  title = title.replace(/[\(\[]\s*(?:official\s*(?:music\s*|lyric\s*|audio\s*)?video|video\s*oficial|videoclip(?:\s*oficial)?|official\s*audio|audio\s*oficial|official\s*lyric\s*video|lyric\s*video|official\s*visualizer|visualizer|clip\s*oficial|music\s*video|letra|lyrics|en\s*vivo|live(?:\s*version|\s*at\s*[^)\]]+)?|4k(?:\s*remaster(?:ed)?)?|hd(?:\s*remaster(?:ed)?)?|remaster(?:ed)?|1080p|hq|explicit)\s*[\)\]]/gi, '');

  // 2. Coletillas compuestas en corchetes o paréntesis con palabras clave de video/formato
  title = title.replace(/[\(\[][^)\]]*(?:official|video|audio|lyric|remaster|videoclip|visualizer)[^)\]]*[\)\]]/gi, '');

  // 3. Palabras de resolución o formato aisladas
  title = title.replace(/\b(?:4k|hd|hq|1080p|720p|remastered|remaster)\b/gi, '');

  // 4. Paréntesis o corchetes que hayan quedado vacíos
  title = title.replace(/[\(\[]\s*[\)\]]/g, '');

  // 5. Normalizar espacios múltiples y guiones huérfanos
  title = title.replace(/\s+/g, ' ').replace(/\s*-\s*$/, '').trim();

  return title;
}

/**
 * Limpia el nombre del autor/canal de YouTube (e.g. "Queen - Topic" -> "Queen")
 */
function cleanArtistName(rawArtist) {
  if (!rawArtist) return '';
  return rawArtist
    .replace(/ - Topic$/i, '')
    .replace(/VEVO$/i, '')
    .replace(/\s*Official(?:\s*(?:Artist\s*)?Channel)?$/i, '')
    .trim();
}

/**
 * Divide la letra en páginas si excede el límite máximo especificado (3500 caracteres),
 * cortando de forma limpia por saltos de línea para no partir versos.
 */
function splitLyrics(lyrics, maxLength = 3500) {
  if (!lyrics || lyrics.length <= maxLength) {
    return [lyrics];
  }

  const pages = [];
  const lines = lyrics.split('\n');
  let current = '';

  for (const line of lines) {
    if ((current + '\n' + line).length > maxLength) {
      if (current.trim()) {
        pages.push(current.trim());
        current = line;
      } else {
        // Línea individual que excede el límite (caso anómalo)
        let remaining = line;
        while (remaining.length > maxLength) {
          pages.push(remaining.substring(0, maxLength));
          remaining = remaining.substring(maxLength);
        }
        current = remaining;
      }
    } else {
      current = current ? `${current}\n${line}` : line;
    }
  }

  if (current.trim()) {
    pages.push(current.trim());
  }

  return pages.length > 0 ? pages : [lyrics];
}

/**
 * Consulta la API de LRCLIB para obtener la letra.
 * Primero intenta con /api/get?track_name=...&artist_name=...
 * y realiza fallback con /api/search?q=... si es necesario.
 */
async function fetchLyrics(track, artist) {
  const headers = {
    'User-Agent': 'DiscordBotMusica/1.0.0 (https://github.com/)'
  };

  // 1. Intento primario: /api/get si disponemos de track y artist
  if (track && artist) {
    try {
      const getUrl = `https://lrclib.net/api/get?${new URLSearchParams({
        track_name: track,
        artist_name: artist
      })}`;
      const res = await fetch(getUrl, { headers });
      if (res.ok) {
        const data = await res.json();
        const lyrics = data.plainLyrics || (data.syncedLyrics ? data.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s*/g, '') : null);
        if (lyrics || data.instrumental) {
          return {
            trackName: data.trackName || track,
            artistName: data.artistName || artist,
            albumName: data.albumName,
            lyrics,
            instrumental: Boolean(data.instrumental)
          };
        }
      }
    } catch (err) {
      console.warn('Advertencia en LRCLIB /api/get:', err.message);
    }
  }

  // 2. Fallback: /api/search para búsqueda flexible
  const searchQueries = [
    [artist, track].filter(Boolean).join(' '),
    track
  ].filter(Boolean);

  for (const query of searchQueries) {
    try {
      const searchUrl = `https://lrclib.net/api/search?${new URLSearchParams({ q: query })}`;
      const res = await fetch(searchUrl, { headers });
      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          const match = results.find(r => r.plainLyrics || r.syncedLyrics) || results[0];
          const lyrics = match.plainLyrics || (match.syncedLyrics ? match.syncedLyrics.replace(/\[\d{2}:\d{2}\.\d{2,3}\]\s*/g, '') : null);
          if (lyrics || match.instrumental) {
            return {
              trackName: match.trackName || track,
              artistName: match.artistName || artist,
              albumName: match.albumName,
              lyrics,
              instrumental: Boolean(match.instrumental)
            };
          }
        }
      }
    } catch (err) {
      console.warn('Advertencia en LRCLIB /api/search:', err.message);
    }
  }

  return null;
}

/**
 * Crea la fila de botones de paginación interactiva:
 * [ ⬅️ Anterior ] [ Página X/Y ] [ Siguiente ➡️ ]
 */
function createPaginationRow(currentPage, totalPages, disabled = false) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('lyrics_prev')
      .setLabel('⬅️ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || currentPage === 0),
    new ButtonBuilder()
      .setCustomId('lyrics_indicator')
      .setLabel(`Página ${currentPage + 1}/${totalPages}`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('lyrics_next')
      .setLabel('Siguiente ➡️')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(disabled || currentPage === totalPages - 1)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lyrics')
    .setDescription('📜 Muestra la letra de la canción actual o de la que busques')
    .addStringOption(option =>
      option
        .setName('cancion')
        .setDescription('Nombre de la canción o artista a buscar (opcional)')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const cancionParam = interaction.options.getString('cancion');
    let targetTitle = '';
    let targetArtist = '';
    let thumbnail = null;
    let songUrl = null;

    if (cancionParam) {
      // El usuario especificó un término de búsqueda manual
      const cleanedInput = cleanSongTitle(cancionParam.trim());

      // Verificar si viene con formato "Artista - Canción"
      if (cleanedInput.includes(' - ')) {
        const parts = cleanedInput.split(/\s+-\s+/);
        targetArtist = cleanArtistName(parts[0]);
        targetTitle = parts.slice(1).join(' - ');
      } else {
        targetTitle = cleanedInput;
      }

      // Si hay una canción en cola con portada relevante, aprovecharla
      const queue = getQueue(interaction.guildId);
      if (queue && queue[0]) {
        const currentLower = (queue[0].title || '').toLowerCase();
        const paramLower = cancionParam.toLowerCase();
        if (currentLower.includes(paramLower) || paramLower.includes(currentLower)) {
          thumbnail = queue[0].thumbnail || null;
          songUrl = queue[0].url || null;
        }
      }
    } else {
      // Detección automática desde la canción en reproducción
      const queue = getQueue(interaction.guildId);
      if (!queue || queue.length === 0 || !queue[0]) {
        const emptyEmbed = new EmbedBuilder()
          .setColor(0x3B82F6)
          .setTitle('ℹ️ Ninguna Canción en Reproducción')
          .setDescription(
            'Actualmente no hay ninguna canción reproduciéndose en este servidor.\n\n' +
            '💡 Puedes buscar la letra de cualquier canción especificando el parámetro:\n' +
            '`/lyrics cancion: [nombre de la canción o artista]`'
          )
          .setFooter({ text: 'Bot de Música' });
        return interaction.editReply({ embeds: [emptyEmbed] });
      }

      const currentSong = queue[0];
      thumbnail = currentSong.thumbnail || null;
      songUrl = currentSong.url || null;

      const cleanedTitle = cleanSongTitle(currentSong.title || '');
      const cleanedAuthor = cleanArtistName(currentSong.author || '');

      if (cleanedTitle.includes(' - ')) {
        const parts = cleanedTitle.split(/\s+-\s+/);
        targetArtist = cleanArtistName(parts[0]);
        targetTitle = parts.slice(1).join(' - ');
      } else {
        targetTitle = cleanedTitle;
        targetArtist = cleanedAuthor;
      }
    }

    // Consultar API de LRCLIB
    const lyricsData = await fetchLyrics(targetTitle, targetArtist);

    if (!lyricsData || (!lyricsData.lyrics && !lyricsData.instrumental)) {
      const notFoundEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('❌ Letra No Encontrada')
        .setDescription(
          `No se encontró ninguna letra para **${targetTitle}**${targetArtist ? ` de **${targetArtist}**` : ''}.\n\n` +
          '💡 **Consejos de búsqueda:**\n' +
          '• Especifica artista y canción: `/lyrics cancion: Coldplay - Viva La Vida`\n' +
          '• Revisa posibles errores ortográficos en el título.'
        )
        .setFooter({
          text: `Solicitado por ${interaction.user.username}`,
          iconURL: interaction.user?.displayAvatarURL?.() || undefined
        });

      if (thumbnail) {
        notFoundEmbed.setThumbnail(thumbnail);
      }

      return interaction.editReply({ embeds: [notFoundEmbed] });
    }

    // Si la canción es instrumental
    if (lyricsData.instrumental && !lyricsData.lyrics) {
      const instrumentalEmbed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle('🎺 Canción Instrumental')
        .setDescription(
          `**${lyricsData.trackName}** de **${lyricsData.artistName}** está registrada como una obra instrumental sin letra vocal.`
        )
        .setFooter({
          text: `Solicitado por ${interaction.user.username}`,
          iconURL: interaction.user?.displayAvatarURL?.() || undefined
        });

      if (thumbnail) {
        instrumentalEmbed.setThumbnail(thumbnail);
      }

      return interaction.editReply({ embeds: [instrumentalEmbed] });
    }

    // Dividir la letra si supera 3500 caracteres
    const pages = splitLyrics(lyricsData.lyrics, 3500);
    let currentPage = 0;

    // Generador de Embed elegante para cada página
    const generateEmbed = pageIndex => {
      const embed = new EmbedBuilder()
        .setColor(0x1DB954)
        .setAuthor({
          name: lyricsData.artistName ? `🎤 ${lyricsData.artistName}` : '🎤 Letra de Canción',
          iconURL: interaction.client.user?.displayAvatarURL?.() || undefined
        })
        .setTitle(`📜 ${lyricsData.trackName}`);

      if (songUrl) {
        embed.setURL(songUrl);
      }

      if (thumbnail) {
        embed.setThumbnail(thumbnail);
      }

      embed.setDescription(pages[pageIndex]);

      const footerText = pages.length > 1
        ? `Página ${pageIndex + 1} de ${pages.length} • Letra vía LRCLIB`
        : 'Letra vía LRCLIB';

      embed.setFooter({
        text: `${footerText} • Pedido por ${interaction.user.username}`,
        iconURL: interaction.user?.displayAvatarURL?.() || undefined
      });
      embed.setTimestamp();

      return embed;
    };

    const initialComponents = pages.length > 1
      ? [createPaginationRow(currentPage, pages.length)]
      : [];

    const replyMessage = await interaction.editReply({
      embeds: [generateEmbed(currentPage)],
      components: initialComponents
    });

    // Paginación interactiva con Collector si hay más de 1 página
    if (pages.length > 1) {
      const collector = replyMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120_000 // 2 minutos de tiempo de interacción
      });

      collector.on('collect', async buttonInteraction => {
        // Asegurarse de que solo el usuario que solicitó el comando navegue
        if (buttonInteraction.user.id !== interaction.user.id) {
          return buttonInteraction.reply({
            content: '❌ Solo el usuario que ejecutó este comando puede navegar por las páginas.',
            ephemeral: true
          });
        }

        if (buttonInteraction.customId === 'lyrics_prev') {
          if (currentPage > 0) currentPage--;
        } else if (buttonInteraction.customId === 'lyrics_next') {
          if (currentPage < pages.length - 1) currentPage++;
        }

        const newEmbed = generateEmbed(currentPage);
        const newRow = createPaginationRow(currentPage, pages.length);

        if (buttonInteraction.deferred || buttonInteraction.replied) {
          await buttonInteraction.editReply({
            embeds: [newEmbed],
            components: [newRow]
          }).catch(() => {});
        } else {
          await buttonInteraction.update({
            embeds: [newEmbed],
            components: [newRow]
          }).catch(() => {});
        }
      });

      collector.on('end', async () => {
        const disabledRow = createPaginationRow(currentPage, pages.length, true);
        await interaction.editReply({
          components: [disabledRow]
        }).catch(() => {});
      });
    }
  }
};
