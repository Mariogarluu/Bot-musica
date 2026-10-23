// commands/play.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { addToQueue, addMultipleToQueue } = require('../player');
const { Ytdl } = require('@distube/ytdl-core');
const spotify = require('spotify-url-info')(fetch);
const yts = require('yt-search');

const yt = new Ytdl({
  cookie: process.env.YT_COOKIE || undefined,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('🎵 Reproduce una canción o playlist (YouTube, Spotify o búsqueda)')
    .addStringOption(option =>
      option.setName('song')
        .setDescription('URL de YouTube, Spotify o nombre de la canción')
        .setRequired(true)
    ),

  async execute(interaction) {
    const songInput = interaction.options.getString('song').trim();
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xEF4444)
            .setDescription('🚫 Debes unirte primero a un canal de voz para reproducir música.')
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    // 1) ¿Es enlace de Spotify? (track, playlist, album)
    if (/https?:\/\/(?:open\.)?spotify\.com\/(track|playlist|album)\/([a-zA-Z0-9]+)/i.test(songInput)) {
      const match = songInput.match(/(track|playlist|album)/i);
      const type = match ? match[1].toLowerCase() : 'track';

      try {
        if (type === 'track') {
          const trackData = await spotify.getPreview(songInput);
          const title = `${trackData.artist} - ${trackData.title}`;
          const song = {
            title,
            query: title,
            url: null,
            thumbnail: trackData.image || null,
            duration: '--:--',
            seconds: 0,
            author: trackData.artist || 'Spotify',
            requestedBy: {
              username: interaction.user.username,
              avatarURL: interaction.user.displayAvatarURL()
            }
          };

          // Búsqueda preliminar para tener enlace de YouTube de inmediato si es posible
          try {
            const ytResult = await yts(title);
            if (ytResult?.videos?.length > 0) {
              song.url = ytResult.videos[0].url;
              song.duration = ytResult.videos[0].timestamp || '--:--';
              song.seconds = ytResult.videos[0].seconds || 0;
              song.thumbnail = trackData.image || ytResult.videos[0].thumbnail;
            }
          } catch {}

          await addToQueue(interaction, song);

          const embed = new EmbedBuilder()
            .setColor(0x1DB954)
            .setTitle('🟢 Canción de Spotify añadida a la cola')
            .setDescription(`[**${song.title}**](${song.url || songInput})`)
            .addFields(
              { name: '⏱️ Duración', value: `\`${song.duration}\``, inline: true },
              { name: '👤 Artista', value: trackData.artist || 'Spotify', inline: true }
            )
            .setFooter({ text: `Pedido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

          if (song.thumbnail) embed.setThumbnail(song.thumbnail);

          return interaction.editReply({ embeds: [embed] });
        } else if (type === 'playlist' || type === 'album') {
          const details = await spotify.getDetails(songInput);
          const listTitle = details.preview?.title || (type === 'playlist' ? 'Playlist de Spotify' : 'Álbum de Spotify');
          const rawTracks = details.tracks || [];

          if (rawTracks.length === 0) {
            return interaction.editReply('❌ No se encontraron canciones en este enlace de Spotify.');
          }

          const songs = rawTracks.map(t => {
            const trackArtist = t.artist || t.artists?.[0]?.name || '';
            const trackName = t.name || t.title || '';
            const fullTitle = trackArtist ? `${trackArtist} - ${trackName}` : trackName;
            return {
              title: fullTitle,
              query: fullTitle,
              url: null,
              duration: '--:--',
              seconds: 0,
              author: trackArtist || 'Spotify',
              requestedBy: {
                username: interaction.user.username,
                avatarURL: interaction.user.displayAvatarURL()
              }
            };
          });

          await addMultipleToQueue(interaction, songs);

          const embed = new EmbedBuilder()
            .setColor(0x1DB954)
            .setTitle(type === 'playlist' ? '🎶 Playlist de Spotify añadida a la cola' : '💿 Álbum de Spotify añadido a la cola')
            .setDescription(`**${listTitle}**\nTotal de canciones cargadas: **${songs.length}**`)
            .setURL(songInput)
            .setFooter({ text: `Pedido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

          if (details.preview?.image) embed.setThumbnail(details.preview.image);

          return interaction.editReply({ embeds: [embed] });
        }
      } catch (err) {
        console.error('Error procesando enlace de Spotify:', err);
        return interaction.editReply('❌ Ocurrió un error al procesar el enlace de Spotify. Asegúrate de que sea público.');
      }
    }

    // 2) ¿Es Playlist de YouTube?
    const isYtPlaylist = songInput.includes('/playlist') || (songInput.includes('list=') && !songInput.includes('v='));
    if (isYtPlaylist) {
      try {
        const pl = await yt.getPlaylist(songInput);
        if (!pl || !pl.videos || pl.videos.length === 0) {
          return interaction.editReply('❌ La playlist de YouTube está vacía o es privada.');
        }

        const songs = pl.videos.map(v => ({
          title: v.title,
          url: v.url,
          duration: v.lengthSeconds ? `${Math.floor(v.lengthSeconds / 60)}:${(v.lengthSeconds % 60).toString().padStart(2, '0')}` : '--:--',
          seconds: v.lengthSeconds || 0,
          thumbnail: v.thumbnails?.[0]?.url || null,
          author: v.author?.name || 'YouTube',
          requestedBy: {
            username: interaction.user.username,
            avatarURL: interaction.user.displayAvatarURL()
          }
        }));

        await addMultipleToQueue(interaction, songs);

        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('🎶 Playlist de YouTube añadida a la cola')
          .setDescription(`**${pl.title}**\nTotal de canciones cargadas: **${songs.length}**`)
          .setURL(songInput)
          .setFooter({ text: `Pedido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        if (pl.thumbnails?.[0]?.url) embed.setThumbnail(pl.thumbnails[0].url);

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('Error procesando playlist de YouTube:', err);
        return interaction.editReply('❌ Error al procesar la playlist de YouTube. Comprueba que sea pública.');
      }
    }

    // 3) Vídeo individual de YouTube (watch, youtu.be, shorts)
    const isYtUrl = /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)/i.test(songInput);
    if (isYtUrl) {
      try {
        let cleanUrl = songInput;
        const mWatch = songInput.match(/[?&]v=([A-Za-z0-9_-]{11})/);
        if (mWatch) {
          cleanUrl = `https://www.youtube.com/watch?v=${mWatch[1]}`;
        } else {
          const mShort = songInput.match(/^https?:\/\/(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})/i);
          if (mShort) cleanUrl = `https://www.youtube.com/watch?v=${mShort[1]}`;
        }

        let title = cleanUrl;
        let duration = '--:--';
        let seconds = 0;
        let thumbnail = null;
        let author = 'YouTube';

        try {
          const info = await yt.getInfo(cleanUrl);
          title = info.videoDetails.title;
          seconds = parseInt(info.videoDetails.lengthSeconds, 10) || 0;
          if (seconds > 0) {
            duration = `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
          }
          thumbnail = info.videoDetails.thumbnails?.[0]?.url || null;
          author = info.videoDetails.author?.name || 'YouTube';
        } catch {
          try {
            const r = await yts(cleanUrl);
            if (r?.videos?.[0]) {
              title = r.videos[0].title;
              duration = r.videos[0].timestamp || '--:--';
              seconds = r.videos[0].seconds || 0;
              thumbnail = r.videos[0].thumbnail || null;
              author = r.videos[0].author?.name || 'YouTube';
            }
          } catch {}
        }

        const song = {
          title,
          url: cleanUrl,
          duration,
          seconds,
          thumbnail,
          author,
          requestedBy: {
            username: interaction.user.username,
            avatarURL: interaction.user.displayAvatarURL()
          }
        };

        await addToQueue(interaction, song);

        const embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('▶️ Vídeo de YouTube añadido a la cola')
          .setDescription(`[**${song.title}**](${song.url})`)
          .addFields(
            { name: '⏱️ Duración', value: `\`${song.duration}\``, inline: true },
            { name: '👤 Canal', value: song.author, inline: true }
          )
          .setFooter({ text: `Pedido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

        if (thumbnail) embed.setThumbnail(thumbnail);

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        console.error('Error procesando vídeo de YouTube:', err);
        return interaction.editReply('❌ No se pudo procesar el vídeo de YouTube.');
      }
    }

    // 4) Entrada de texto / Búsqueda directa en YouTube
    try {
      const searchRes = await yts(songInput);
      if (!searchRes || !searchRes.videos || searchRes.videos.length === 0) {
        return interaction.editReply(`❌ No se encontraron resultados para: \`${songInput}\``);
      }

      const firstVideo = searchRes.videos[0];
      const song = {
        title: firstVideo.title,
        url: firstVideo.url,
        duration: firstVideo.timestamp || '--:--',
        seconds: firstVideo.seconds || 0,
        thumbnail: firstVideo.thumbnail || null,
        author: firstVideo.author?.name || 'YouTube',
        requestedBy: {
          username: interaction.user.username,
          avatarURL: interaction.user.displayAvatarURL()
        }
      };

      await addToQueue(interaction, song);

      const embed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle('🔎 Resultado encontrado y añadido a la cola')
        .setDescription(`[**${song.title}**](${song.url})`)
        .addFields(
          { name: '⏱️ Duración', value: `\`${song.duration}\``, inline: true },
          { name: '👤 Canal', value: song.author, inline: true }
        )
        .setFooter({ text: `Pedido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

      if (song.thumbnail) embed.setThumbnail(song.thumbnail);

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('Error en búsqueda de canción:', err);
      return interaction.editReply('❌ Error al buscar la canción.');
    }
  }
};
