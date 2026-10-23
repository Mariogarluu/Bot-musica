// player.js
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  getVoiceConnection,
  demuxProbe,
  entersState,
  VoiceConnectionStatus,
} = require('@discordjs/voice');

const { Ytdl, Quality } = require('@distube/ytdl-core');
const yts = require('yt-search');

const { getReproductorEmbed } = require('./utils/reproductorEmbed');
const { sendOrUpdateReproductor, clearReproductorMessage } = require('./utils/reproductorMessage');

const queues = new Map();
const players = new Map();
const loops = new Map();

const yt = new Ytdl({
  cookie: process.env.YT_COOKIE || undefined,
});

/* -------------------- Cola / Player / Loop / Estados -------------------- */
function getQueue(guildId) { return queues.get(guildId) || []; }
function setQueue(guildId, queue) { queues.set(guildId, queue); }
function getPlayer(guildId) { return players.get(guildId); }
function setPlayer(guildId, player) { players.set(guildId, player); }
function getLoop(guildId) { return loops.get(guildId) || false; }
function setLoop(guildId, val) { loops.set(guildId, !!val); }
function toggleLoop(guildId) {
  const current = getLoop(guildId);
  setLoop(guildId, !current);
  return !current;
}

function isPaused(guildId) {
  const player = getPlayer(guildId);
  if (!player) return false;
  return player.state.status === AudioPlayerStatus.Paused;
}

/* -------------------- Normalizador/Resolutor de entradas -------------------- */
async function resolveToYoutubeUrl(input) {
  let s = String(input || '').trim();
  if (!s) throw new Error('Entrada vacía');

  // youtu.be -> watch
  const mShort = s.match(/^https?:\/\/(?:www\.)?youtu\.be\/([A-Za-z0-9_-]{11})(?:[?&#].*)?$/i);
  if (mShort) return `https://www.youtube.com/watch?v=${mShort[1]}`;

  // shorts -> watch
  const mShorts = s.match(/^https?:\/\/(?:www\.)?youtube\.com\/shorts\/([A-Za-z0-9_-]{11})(?:[?&#].*)?$/i);
  if (mShorts) return `https://www.youtube.com/watch?v=${mShorts[1]}`;

  // ID suelto (11 caracteres)
  const mId = s.match(/^[A-Za-z0-9_-]{11}$/);
  if (mId) return `https://www.youtube.com/watch?v=${s}`;

  // watch?v=
  const mWatch = s.match(/[?&]v=([A-Za-z0-9_-]{11})/);
  if (mWatch) return `https://www.youtube.com/watch?v=${mWatch[1]}`;

  // Si ya es URL de youtube válida
  if (/^https?:\/\/(?:www\.)?youtube\.com\/watch\?v=[A-Za-z0-9_-]{11}/i.test(s)) {
    return s;
  }

  // Si no es un enlace de YouTube watch, buscar en YouTube
  const searchRes = await yts(s);
  if (searchRes && searchRes.videos && searchRes.videos.length > 0) {
    return searchRes.videos[0].url;
  }

  throw new Error(`No se encontró ningún vídeo en YouTube para: "${s}"`);
}

/* -------------------- Crear resource con @distube/ytdl-core -------------------- */
async function createResourceFromInput(urlOrQuery) {
  const resolvedUrl = await resolveToYoutubeUrl(urlOrQuery);

  const stream = await yt.download(resolvedUrl, {
    quality: Quality.HighestAudio,
    filter: { hasAudio: true, hasVideo: false },
    highWaterMark: 1 << 25,
  });

  const probed = await demuxProbe(stream);
  return {
    resource: createAudioResource(probed.stream, { inputType: probed.type, inlineVolume: true }),
    url: resolvedUrl,
  };
}

/* -------------------- API pública de Cola -------------------- */
async function addToQueue(interaction, song) {
  const guildId = interaction.guildId;
  let queue = getQueue(guildId);
  queue.push(song);
  setQueue(guildId, queue);

  if (queue.length === 1) {
    await playSong(interaction, song);
  } else {
    const { embed, buttons } = getReproductorEmbed(queue[0], interaction, queue);
    await sendOrUpdateReproductor(guildId, interaction, queue[0], queue, embed, buttons, true);
  }
}

async function addMultipleToQueue(interaction, songs) {
  if (!Array.isArray(songs) || songs.length === 0) return;
  const guildId = interaction.guildId;
  let queue = getQueue(guildId);
  const wasEmpty = queue.length === 0;

  queue.push(...songs);
  setQueue(guildId, queue);

  if (wasEmpty) {
    await playSong(interaction, queue[0]);
  } else {
    const { embed, buttons } = getReproductorEmbed(queue[0], interaction, queue);
    await sendOrUpdateReproductor(guildId, interaction, queue[0], queue, embed, buttons, true);
  }
}

/* -------------------- Reproducción -------------------- */
async function playSong(interaction, song) {
  if (!song) {
    console.error('Canción inválida en playSong:', song);
    return;
  }
  const guildId = interaction.guildId;
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    console.error('El usuario no está en un canal de voz.');
    return;
  }

  // Conectar a voz o reconectar si está destruida
  let connection = getVoiceConnection(guildId);
  if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    connection.on('stateChange', (oldState, newState) => {
      console.log(`[VOICE STATE]: ${oldState.status} -> ${newState.status}`);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch (error) {
        try { connection.destroy(); } catch {}
      }
    });

    connection.on('error', (err) => {
      console.error('[VOICE ERROR]:', err?.message || err);
    });
  } else if (connection.joinConfig?.channelId !== voiceChannel.id) {
    connection.rejoin({
      channelId: voiceChannel.id,
      selfDeaf: true,
    });
  }

  // Esperar a que la conexión esté lista si no lo está ya
  if (connection.state.status !== VoiceConnectionStatus.Ready) {
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
    } catch (err) {
      console.error('[VOICE] No se pudo establecer conexión (timeout):', err?.message || err);
      try { connection?.destroy(); } catch {}
      return;
    }
  }

  // Crear/recuperar player
  let player = getPlayer(guildId);
  if (!player) {
    player = createAudioPlayer();
    setPlayer(guildId, player);
  }
  player.removeAllListeners();

  // Crear resource desde la entrada
  let resourceData;
  try {
    resourceData = await createResourceFromInput(song.url || song.query || song.title);
    if (!song.url && resourceData.url) {
      song.url = resourceData.url;
    }
  } catch (err) {
    console.error('Error creando resource de audio:', err?.message || err);
    await shiftAndMaybePlayNext(guildId, interaction);
    return;
  }

  connection.subscribe(player);
  player.play(resourceData.resource);

  // Refrescar UI del reproductor
  const queue = getQueue(guildId);
  const { embed, buttons } = getReproductorEmbed(song, interaction, queue);
  await sendOrUpdateReproductor(guildId, interaction, song, queue, embed, buttons);

  // Auto-siguiente
  player.on(AudioPlayerStatus.Idle, async () => {
    await handleTrackEnd(guildId, interaction);
  });

  player.on('error', async (error) => {
    console.error('Error en el reproductor:', error?.message || error);
    await shiftAndMaybePlayNext(guildId, interaction);
  });
}

/* -------------------- Utilidades internas -------------------- */
async function handleTrackEnd(guildId, interaction) {
  const isLoop = getLoop(guildId);
  let queue = getQueue(guildId);

  if (isLoop && queue.length > 0) {
    await playSong(interaction, queue[0]);
    return;
  }

  await shiftAndMaybePlayNext(guildId, interaction);
}

async function shiftAndMaybePlayNext(guildId, interaction) {
  const connection = getVoiceConnection(guildId);
  let queue = getQueue(guildId);
  queue.shift();
  setQueue(guildId, queue);

  if (queue.length > 0) {
    try {
      await playSong(interaction, queue[0]);
    } catch (err) {
      console.error('Error con la siguiente canción:', err?.message || err);
      await shiftAndMaybePlayNext(guildId, interaction);
    }
  } else {
    try { connection?.destroy(); } catch {}
    clearReproductorMessage(guildId);
  }
}

/* -------------------- Controles -------------------- */
module.exports = {
  addToQueue,
  addMultipleToQueue,
  getQueue,
  setQueue,
  getLoop,
  setLoop,
  toggleLoop,
  isPaused,

  togglePause: async (interaction) => {
    const player = getPlayer(interaction.guildId);
    if (!player) return false;
    if (player.state.status === AudioPlayerStatus.Paused) {
      return player.unpause();
    } else if (player.state.status === AudioPlayerStatus.Playing) {
      return player.pause(true);
    }
    return false;
  },

  pausePlayer: async (interaction) => {
    const player = getPlayer(interaction.guildId);
    if (!player) return false;
    return player.pause(true);
  },

  resumePlayer: async (interaction) => {
    const player = getPlayer(interaction.guildId);
    if (!player) return false;
    return player.unpause();
  },

  skipSong: async (interaction) => {
    const player = getPlayer(interaction.guildId);
    if (!player) return false;
    player.stop(true);
    return true;
  },

  stopPlayer: async (interaction) => {
    const guildId = interaction.guildId;
    const player = getPlayer(guildId);
    const connection = getVoiceConnection(guildId);
    setQueue(guildId, []);
    setLoop(guildId, false);
    try { player?.stop(true); } catch {}
    try { connection?.destroy(); } catch {}
    clearReproductorMessage(guildId);
    return true;
  },
};
