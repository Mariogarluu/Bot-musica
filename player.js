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
  StreamType,
} = require('@discordjs/voice');
const { spawn } = require('child_process');
const ffmpegPath = require('ffmpeg-static');
const { PassThrough } = require('stream');
const googleTTS = require('google-tts-api');

const { Ytdl, Quality } = require('@distube/ytdl-core');
const yts = require('yt-search');

const { getReproductorEmbed } = require('./utils/reproductorEmbed');
const { sendOrUpdateReproductor, clearReproductorMessage } = require('./utils/reproductorMessage');
const { getSoundPathOrUrl } = require('./utils/soundEffects');

const queues = new Map();
const players = new Map();
const loops = new Map();
const guildFilters = new Map();
const ffmpegProcesses = new Map();
const soundPlayers = new Map();
const soundEffectSessions = new Map();
const idleTimers = new Map();
const djModes = new Map();

/* -------------------- Filtros FFmpeg -------------------- */
const FILTERS = {
  nightcore: 'atempo=1.25,asetrate=44100*1.25',
  vaporwave: 'atempo=0.8,asetrate=44100*0.8',
  bassboost: 'bass=g=15:f=110:w=0.6',
  '8d': 'apulsator=hz=0.125',
  radio: 'highpass=f=300,lowpass=f=3000,volume=1.2',
  off: null,
  clear: null,
};

function getFilter(guildId) {
  return guildFilters.get(guildId) || 'off';
}

function setFilter(guildId, filterName) {
  const normalized = String(filterName || 'off').toLowerCase().trim();
  if (normalized === 'off' || normalized === 'clear' || !FILTERS[normalized]) {
    guildFilters.delete(guildId);
    return 'off';
  }
  guildFilters.set(guildId, normalized);
  return normalized;
}

function clearFilter(guildId) {
  guildFilters.delete(guildId);
  return 'off';
}

function cleanupFfmpegProcess(guildId) {
  const proc = ffmpegProcesses.get(guildId);
  if (proc) {
    try {
      if (!proc.killed) {
        proc.kill('SIGKILL');
      }
    } catch {}
    ffmpegProcesses.delete(guildId);
  }
}

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

function getDjMode(guildId) { return djModes.get(guildId) || false; }
function setDjMode(guildId, val) { djModes.set(guildId, Boolean(val)); }
function toggleDjMode(guildId) {
  const current = getDjMode(guildId);
  setDjMode(guildId, !current);
  return !current;
}

/* -------------------- Modo Locutor DJ (TTS) -------------------- */
function getRequesterName(song) {
  if (!song) return 'un oyente';
  if (typeof song.requestedBy === 'object' && song.requestedBy?.username) {
    return song.requestedBy.username;
  }
  if (typeof song.requestedBy === 'string' && song.requestedBy.trim()) {
    return song.requestedBy.trim();
  }
  return 'un oyente de la sala';
}

function cleanTitleForSpeech(title) {
  if (!title) return 'este temazo';
  let clean = String(title)
    .replace(/\s*[([{\u3010].*?(?:official|oficial|video|audio|lyrics|letra|videoclip|hd|4k|remastered|version|prod\.).*?[)\]}\u3011]/gi, '')
    .replace(/\s*[([{\u3010][^)\]}\u3011]*[)\]}\u3011]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) clean = String(title).trim();
  if (clean.length > 70) {
    clean = clean.substring(0, 67) + '...';
  }
  return clean;
}

function generateDjPhrase(song) {
  const user = getRequesterName(song);
  const title = cleanTitleForSpeech(song?.title);

  const phrases = [
    `Y ahora en directo para ti, ${user} nos trae ${title}... ¡a disfrutarlo!`,
    `¡Atención a todos en cabina! Por cortesía de ${user}, llega ${title}. ¡Sube el volumen!`,
    `¡Qué temazo entra por antena! A petición de ${user}, recibimos a ${title}. ¡A disfrutar!`,
    `Seguimos en sintonía con la mejor música. Nuestro amigo ${user} nos ha pedido ${title}. ¡Que suene bien fuerte!`,
    `¡Menuda selección para hoy! De parte de ${user}, aquí suena ${title}... ¡puro fuego!`,
    `Para todos los oyentes de la sala, ${user} nos deleita con ${title}. ¡A gozarlo!`,
    `¡No pares la música! Desde los controles, ${user} lanza al aire ${title}. ¡Súbele el volumen!`,
    `¡Directo a tus auriculares! Nuestro colega ${user} nos comparte ${title}. ¡A darlo todo!`
  ];

  const phrase = phrases[Math.floor(Math.random() * phrases.length)];
  return phrase.length > 195 ? phrase.substring(0, 192) + '...' : phrase;
}

async function getTtsAudioResource(text) {
  const url = googleTTS.getAudioUrl(text, {
    lang: 'es',
    slow: false,
    host: 'https://translate.google.com',
  });

  const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) {
    throw new Error(`Google TTS status ${res.status}: ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const pt = new PassThrough();
  pt.end(buffer);
  return createAudioResource(pt);
}

function isPaused(guildId) {
  const session = soundEffectSessions.get(guildId);
  if (session) {
    return !session.wasPlayingMusic;
  }
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

/* -------------------- Crear resource con @distube/ytdl-core y FFmpeg -------------------- */
async function createResourceFromInput(urlOrQuery, filter, seekSeconds = 0) {
  const resolvedUrl = await resolveToYoutubeUrl(urlOrQuery);

  const stream = await yt.download(resolvedUrl, {
    quality: Quality.HighestAudio,
    filter: { hasAudio: true, hasVideo: false },
    highWaterMark: 1 << 25,
  });

  const filterKey = typeof filter === 'string' ? filter.toLowerCase().trim() : null;
  const isClear = !filterKey || filterKey === 'off' || filterKey === 'clear';
  const filterArgs = isClear ? null : (FILTERS[filterKey] || filterKey);
  const shouldSeek = typeof seekSeconds === 'number' && seekSeconds > 0;

  // Si hay filtro activo o debemos posicionar el audio (seek) con FFmpeg
  if (filterArgs || shouldSeek) {
    const ffmpegArgs = [
      '-loglevel', 'error',
      '-i', 'pipe:0',
    ];

    if (shouldSeek) {
      ffmpegArgs.push('-ss', String(Math.floor(seekSeconds)));
    }

    if (filterArgs) {
      ffmpegArgs.push('-af', filterArgs);
    }

    ffmpegArgs.push(
      '-f', 's16le',
      '-ar', '48000',
      '-ac', '2',
      'pipe:1'
    );

    const ffmpegProcess = spawn(ffmpegPath, ffmpegArgs, {
      windowsHide: true,
    });

    stream.on('error', (err) => {
      console.error('[YTDL Stream Error]:', err?.message || err);
      try { ffmpegProcess.kill('SIGKILL'); } catch {}
    });

    ffmpegProcess.stdin.on('error', (err) => {
      if (err.code !== 'EPIPE' && err.code !== 'ERR_STREAM_DESTROYED') {
        console.error('[FFmpeg stdin Error]:', err?.message || err);
      }
    });

    ffmpegProcess.on('error', (err) => {
      console.error('[FFmpeg Process Error]:', err?.message || err);
    });

    ffmpegProcess.on('close', () => {
      try { stream.destroy(); } catch {}
    });

    stream.pipe(ffmpegProcess.stdin);

    const resource = createAudioResource(ffmpegProcess.stdout, {
      inputType: StreamType.Raw,
      inlineVolume: true,
    });

    ffmpegProcess.stdout.on('close', () => {
      try { ffmpegProcess.kill('SIGKILL'); } catch {}
    });

    return {
      resource,
      url: resolvedUrl,
      process: ffmpegProcess,
    };
  }

  // Flujo normal directo sin procesado de FFmpeg
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
async function playActualSong(guildId, interaction, song, seekSeconds = 0) {
  const queue = getQueue(guildId);
  if (!queue || queue.length === 0) return;

  let player = getPlayer(guildId);
  if (!player) {
    player = createAudioPlayer();
    setPlayer(guildId, player);
  }
  player.removeAllListeners();

  // Obtener filtro activo del servidor
  const activeFilter = getFilter(guildId);

  // Crear resource desde la entrada (con filtro y posición si corresponde)
  let resourceData;
  try {
    resourceData = await createResourceFromInput(song.url || song.query || song.title, activeFilter, seekSeconds);
    if (!song.url && resourceData.url) {
      song.url = resourceData.url;
    }
    if (resourceData.process) {
      ffmpegProcesses.set(guildId, resourceData.process);
    }
  } catch (err) {
    console.error('Error creando resource de audio:', err?.message || err);
    cleanupFfmpegProcess(guildId);
    await shiftAndMaybePlayNext(guildId, interaction);
    return;
  }

  const connection = getVoiceConnection(guildId);
  if (connection) {
    connection.subscribe(player);
  }

  player.play(resourceData.resource);

  // Refrescar UI del reproductor
  const updatedQueue = getQueue(guildId);
  const { embed, buttons } = getReproductorEmbed(song, interaction, updatedQueue);
  await sendOrUpdateReproductor(guildId, interaction, song, updatedQueue, embed, buttons);

  // Auto-siguiente
  player.on(AudioPlayerStatus.Idle, async () => {
    cleanupFfmpegProcess(guildId);
    await handleTrackEnd(guildId, interaction);
  });

  player.on('error', async (error) => {
    console.error('Error en el reproductor:', error?.message || error);
    cleanupFfmpegProcess(guildId);
    await shiftAndMaybePlayNext(guildId, interaction);
  });
}

async function playSong(interaction, song, seekSeconds = 0) {
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

  // Limpiar cualquier proceso previo de FFmpeg en este servidor
  cleanupFfmpegProcess(guildId);
  cancelIdleDisconnect(guildId);
  const soundSession = soundEffectSessions.get(guildId);
  if (soundSession?.timeoutId) clearTimeout(soundSession.timeoutId);
  soundEffectSessions.delete(guildId);
  const sPlayer = soundPlayers.get(guildId);
  try { sPlayer?.stop(true); } catch {}

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

  connection.subscribe(player);

  // Modo Locutor DJ: si está activo y es el comienzo de la canción (seekSeconds === 0)
  const djActive = getDjMode(guildId);
  if (djActive && (!seekSeconds || seekSeconds === 0)) {
    let ttsResource = null;
    try {
      const phrase = generateDjPhrase(song);
      console.log(`[DJ Locutor - Guild ${guildId}]: "${phrase}"`);
      ttsResource = await getTtsAudioResource(phrase);
    } catch (ttsErr) {
      console.warn('[DJ Locutor] Error de red o servicio obteniendo locución TTS, procediendo con la canción:', ttsErr?.message || ttsErr);
      ttsResource = null;
    }

    if (ttsResource) {
      player.removeAllListeners();

      // Refrescar UI del reproductor con la canción actual
      const queue = getQueue(guildId);
      const { embed, buttons } = getReproductorEmbed(song, interaction, queue);
      await sendOrUpdateReproductor(guildId, interaction, song, queue, embed, buttons);

      let songStarted = false;
      const startActual = async () => {
        if (songStarted) return;
        songStarted = true;

        const currentQueue = getQueue(guildId);
        if (!currentQueue || currentQueue.length === 0) return;

        await playActualSong(guildId, interaction, song, seekSeconds);
      };

      // Al terminar el evento AudioPlayerStatus.Idle del locutor, comenzar inmediatamente la canción real
      player.once(AudioPlayerStatus.Idle, async () => {
        await startActual();
      });

      player.once('error', async (err) => {
        console.warn('[DJ Locutor] Error en reproducción del locutor:', err?.message || err);
        await startActual();
      });

      player.play(ttsResource);
      return;
    }
  }

  // Si no está activo el modo DJ, o si falló el TTS, o si se trata de un seek/filtro:
  await playActualSong(guildId, interaction, song, seekSeconds);
}

/* -------------------- Utilidades internas -------------------- */
async function handleTrackEnd(guildId, interaction) {
  cleanupFfmpegProcess(guildId);
  const isLoop = getLoop(guildId);
  let queue = getQueue(guildId);

  if (isLoop && queue.length > 0) {
    await playSong(interaction, queue[0]);
    return;
  }

  await shiftAndMaybePlayNext(guildId, interaction);
}

async function shiftAndMaybePlayNext(guildId, interaction) {
  cleanupFfmpegProcess(guildId);
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
    cancelIdleDisconnect(guildId);
    const soundSession = soundEffectSessions.get(guildId);
    if (soundSession?.timeoutId) clearTimeout(soundSession.timeoutId);
    soundEffectSessions.delete(guildId);
    soundPlayers.get(guildId)?.stop(true);
    soundPlayers.delete(guildId);
  }
}

/* -------------------- Gestión de filtros en tiempo real -------------------- */
async function applyFilter(interaction, filterName) {
  const guildId = interaction.guildId;
  const normalized = setFilter(guildId, filterName);
  const queue = getQueue(guildId);
  const player = getPlayer(guildId);

  if (queue && queue.length > 0 && player) {
    const isPlayingOrPaused =
      player.state.status === AudioPlayerStatus.Playing ||
      player.state.status === AudioPlayerStatus.Paused;

    if (isPlayingOrPaused) {
      const wasPaused = player.state.status === AudioPlayerStatus.Paused;
      let seekSeconds = 0;
      if (player.state.resource?.playbackDuration) {
        seekSeconds = Math.max(0, Math.floor(player.state.resource.playbackDuration / 1000));
      }

      // Si ha transcurrido muy poco tiempo (<= 2s), reproducir desde el principio
      if (seekSeconds <= 2) {
        seekSeconds = 0;
      }

      await playSong(interaction, queue[0], seekSeconds);

      if (wasPaused) {
        player.pause(true);
      }

      return {
        filter: normalized,
        replayed: true,
        currentSong: queue[0],
        seekSeconds,
      };
    }
  }

  return {
    filter: normalized,
    replayed: false,
    currentSong: null,
    seekSeconds: 0,
  };
}

/* -------------------- Soundboard & Efectos de Sonido -------------------- */
function cancelIdleDisconnect(guildId) {
  if (idleTimers.has(guildId)) {
    clearTimeout(idleTimers.get(guildId));
    idleTimers.delete(guildId);
  }
}

function scheduleIdleDisconnect(guildId) {
  cancelIdleDisconnect(guildId);
  const timer = setTimeout(() => {
    const connection = getVoiceConnection(guildId);
    const queue = getQueue(guildId);
    const session = soundEffectSessions.get(guildId);
    if (queue.length === 0 && !session) {
      try { connection?.destroy(); } catch {}
      const sPlayer = soundPlayers.get(guildId);
      try { sPlayer?.stop(true); } catch {}
      soundPlayers.delete(guildId);
    }
    idleTimers.delete(guildId);
  }, 60_000);
  idleTimers.set(guildId, timer);
}

function isSoundEffectPlaying(guildId) {
  return soundEffectSessions.has(guildId);
}

function stopSoundEffect(guildId) {
  const session = soundEffectSessions.get(guildId);
  const soundPlayer = soundPlayers.get(guildId);
  if (soundPlayer) {
    try { soundPlayer.stop(true); } catch {}
  }

  if (session) {
    if (session.timeoutId) clearTimeout(session.timeoutId);
    soundEffectSessions.delete(guildId);

    const activeConn = getVoiceConnection(guildId);
    const musicPlayer = getPlayer(guildId);
    const currentQueue = getQueue(guildId);

    if (activeConn && activeConn.state.status !== VoiceConnectionStatus.Destroyed && musicPlayer && currentQueue.length > 0) {
      activeConn.subscribe(musicPlayer);
      if (session.wasPlayingMusic) {
        musicPlayer.unpause();
      }
    } else {
      scheduleIdleDisconnect(guildId);
    }
  }
}

/**
 * Reproduce un efecto de sonido efímero en el canal de voz.
 * Si hay música sonando, la pausa momentáneamente y la restaura automáticamente tras sonar el clip.
 * Maneja el spam de botones sin fallos de interacción ni condiciones de carrera.
 */
async function playSoundEffect(guildId, voiceChannel, soundData) {
  if (!voiceChannel) return false;

  cancelIdleDisconnect(guildId);

  // Conectar o asegurar canal de voz
  let connection = getVoiceConnection(guildId);
  if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: true,
    });

    connection.on('stateChange', (oldState, newState) => {
      console.log(`[VOICE STATE (Soundboard)]: ${oldState.status} -> ${newState.status}`);
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        try { connection.destroy(); } catch {}
      }
    });

    connection.on('error', (err) => {
      console.error('[VOICE ERROR (Soundboard)]:', err?.message || err);
    });
  } else if (connection.joinConfig?.channelId !== voiceChannel.id) {
    const queue = getQueue(guildId);
    if (queue.length === 0) {
      connection.rejoin({
        channelId: voiceChannel.id,
        selfDeaf: true,
      });
    }
  }

  // Esperar a que la conexión esté en estado Ready
  if (connection.state.status !== VoiceConnectionStatus.Ready) {
    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    } catch (err) {
      console.error('[SOUNDBOARD] No se pudo conectar a voz (timeout):', err?.message || err);
      return false;
    }
  }

  const musicPlayer = getPlayer(guildId);
  const queue = getQueue(guildId);
  const hadMusicPlaying = musicPlayer && musicPlayer.state.status === AudioPlayerStatus.Playing;

  // Si ya existía una sesión de soundboard activa (spam continuo), preservamos el estado inicial de música
  const existingSession = soundEffectSessions.get(guildId);
  const wasPlayingMusic = existingSession ? existingSession.wasPlayingMusic : hadMusicPlaying;

  if (existingSession && existingSession.timeoutId) {
    clearTimeout(existingSession.timeoutId);
  }

  // Pausar música si estaba sonando
  if (musicPlayer && musicPlayer.state.status === AudioPlayerStatus.Playing) {
    musicPlayer.pause(true);
  }

  // Crear o recuperar el reproductor de efectos de sonido
  let soundPlayer = soundPlayers.get(guildId);
  if (!soundPlayer) {
    soundPlayer = createAudioPlayer();
    soundPlayers.set(guildId, soundPlayer);
  }
  soundPlayer.removeAllListeners();

  // Generar token único para manejar spam de botones de forma atómica
  const token = (existingSession ? existingSession.token : 0) + 1;

  // Obtener recurso de audio
  const audioSource = getSoundPathOrUrl(soundData);
  const resource = createAudioResource(audioSource, { inlineVolume: true });
  if (resource.volume) {
    resource.volume.setVolume(1.0);
  }

  const sessionData = {
    token,
    wasPlayingMusic,
    timeoutId: null,
  };
  soundEffectSessions.set(guildId, sessionData);

  // Función de cierre y restauración limpia
  const cleanupAndRestore = () => {
    const currentSession = soundEffectSessions.get(guildId);
    if (!currentSession || currentSession.token !== token) {
      return; // Un nuevo sonido fue lanzado durante la reproducción
    }

    if (currentSession.timeoutId) {
      clearTimeout(currentSession.timeoutId);
    }
    soundEffectSessions.delete(guildId);

    try { soundPlayer.stop(true); } catch {}

    const activeConn = getVoiceConnection(guildId);
    if (!activeConn || activeConn.state.status === VoiceConnectionStatus.Destroyed) {
      return;
    }

    const currentMusicPlayer = getPlayer(guildId);
    const currentQueue = getQueue(guildId);

    if (currentSession.wasPlayingMusic && currentMusicPlayer && currentQueue.length > 0) {
      // Reanudar música donde se dejó
      activeConn.subscribe(currentMusicPlayer);
      currentMusicPlayer.unpause();
    } else if (currentMusicPlayer && currentQueue.length > 0) {
      // Re-suscribir música manteniendo el estado de pausa original
      activeConn.subscribe(currentMusicPlayer);
    } else {
      // Sin música en cola: programar desconexión tras 60s si nadie interactúa
      scheduleIdleDisconnect(guildId);
    }
  };

  // Fallback de seguridad: 8 segundos máximo por clip
  sessionData.timeoutId = setTimeout(() => {
    cleanupAndRestore();
  }, 8_000);

  soundPlayer.on(AudioPlayerStatus.Idle, () => {
    cleanupAndRestore();
  });

  soundPlayer.on('error', (err) => {
    console.error('[SOUND PLAYER ERROR]:', err?.message || err);
    cleanupAndRestore();
  });

  connection.subscribe(soundPlayer);
  soundPlayer.play(resource);

  return true;
}

/* -------------------- Controles y Exportaciones -------------------- */
module.exports = {
  // Cola y estados
  addToQueue,
  addMultipleToQueue,
  getQueue,
  setQueue,
  getPlayer,
  setPlayer,
  getLoop,
  setLoop,
  toggleLoop,
  isPaused,

  // Modo Locutor DJ (TTS)
  getDjMode,
  setDjMode,
  toggleDjMode,
  generateDjPhrase,

  // Filtros FFmpeg
  FILTERS,
  getFilter,
  setFilter,
  clearFilter,
  applyFilter,
  createResourceFromInput,

  // Soundboard
  playSoundEffect,
  stopSoundEffect,
  isSoundEffectPlaying,

  // Controles
  playSong,
  togglePause: async (interaction) => {
    const guildId = interaction.guildId;
    const session = soundEffectSessions.get(guildId);
    if (session) {
      session.wasPlayingMusic = !session.wasPlayingMusic;
      return session.wasPlayingMusic;
    }
    const player = getPlayer(guildId);
    if (!player) return false;
    if (player.state.status === AudioPlayerStatus.Paused) {
      return player.unpause();
    } else if (player.state.status === AudioPlayerStatus.Playing) {
      return player.pause(true);
    }
    return false;
  },

  pausePlayer: async (interaction) => {
    const guildId = interaction.guildId;
    const session = soundEffectSessions.get(guildId);
    if (session) {
      session.wasPlayingMusic = false;
      return true;
    }
    const player = getPlayer(guildId);
    if (!player) return false;
    return player.pause(true);
  },

  resumePlayer: async (interaction) => {
    const guildId = interaction.guildId;
    const session = soundEffectSessions.get(guildId);
    if (session) {
      session.wasPlayingMusic = true;
      return true;
    }
    const player = getPlayer(guildId);
    if (!player) return false;
    return player.unpause();
  },

  skipSong: async (interaction) => {
    const guildId = interaction.guildId;
    cleanupFfmpegProcess(guildId);
    const player = getPlayer(guildId);
    if (!player) return false;
    player.stop(true);
    return true;
  },

  stopPlayer: async (interaction) => {
    const guildId = interaction.guildId;
    const player = getPlayer(guildId);
    const connection = getVoiceConnection(guildId);
    cleanupFfmpegProcess(guildId);
    cancelIdleDisconnect(guildId);
    const soundSession = soundEffectSessions.get(guildId);
    if (soundSession?.timeoutId) clearTimeout(soundSession.timeoutId);
    soundEffectSessions.delete(guildId);
    const sPlayer = soundPlayers.get(guildId);
    try { sPlayer?.stop(true); } catch {}
    soundPlayers.delete(guildId);
    setQueue(guildId, []);
    setLoop(guildId, false);
    clearFilter(guildId);
    try { player?.stop(true); } catch {}
    try { connection?.destroy(); } catch {}
    clearReproductorMessage(guildId);
    return true;
  },
};
