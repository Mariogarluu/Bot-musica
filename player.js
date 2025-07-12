// player.js
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const { getReproductorEmbed } = require('./utils/reproductorEmbed');
const { sendOrUpdateReproductor, clearReproductorMessage } = require('./utils/reproductorMessage');

const queues = new Map();
const players = new Map();

function getQueue(guildId) {
  return queues.get(guildId) || [];
}
function setQueue(guildId, queue) {
  queues.set(guildId, queue);
}
function getPlayer(guildId) {
  return players.get(guildId);
}
function setPlayer(guildId, player) {
  players.set(guildId, player);
}

async function addToQueue(interaction, song) {
  const guildId = interaction.guildId;
  let queue = getQueue(guildId);
  queue.push(song);
  setQueue(guildId, queue);
  if (queue.length === 1) {
    await playSong(interaction, song);
  }
}

async function playSong(interaction, song) {
  if (!song || !song.url) {
    console.error("Canción inválida en playSong:", song);
    return;
  }
  console.log("Reproduciendo canción:", song);

  const guildId = interaction.guildId;
  const voiceChannel = interaction.member.voice.channel;
  if (!voiceChannel) return;

  let connection = getVoiceConnection(guildId);
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
  }

  let stream;
  try {
    stream = ytdl(song.url, { filter: 'audioonly', quality: 'highestaudio', highWaterMark: 1 << 25 });
  } catch (err) {
    console.error('No se pudo reproducir:', err);
    let queue = getQueue(guildId);
    queue.shift();
    setQueue(guildId, queue);
    if (queue.length > 0 && queue[0] && queue[0].url) {
      playSong(interaction, queue[0]);
    } else if (connection) {
      connection.destroy();
      clearReproductorMessage(guildId);
    }
    return;
  }

  const resource = createAudioResource(stream, { inputType: stream.readable ? undefined : stream.type });
  let player = getPlayer(guildId);
  if (!player) {
    player = createAudioPlayer();
    setPlayer(guildId, player);
  }

  player.removeAllListeners();
  player.play(resource);
  connection.subscribe(player);

  // ⚡ Cada vez que cambia la canción, refresca el reproductor
  const queue = getQueue(guildId);
  const { embed, buttons } = getReproductorEmbed(song, interaction, queue);
  await sendOrUpdateReproductor(guildId, interaction, song, queue, embed, buttons);

  player.on(AudioPlayerStatus.Idle, async () => {
    let queue = getQueue(guildId);
    queue.shift();
    setQueue(guildId, queue);

    if (queue.length > 0 && queue[0] && queue[0].url) {
      await playSong(interaction, queue[0]);
    } else {
      if (connection) connection.destroy();
      clearReproductorMessage(guildId);
    }
  });

  player.on('error', error => {
    console.error('Error en el reproductor:', error);
  });
}

// Las demás funciones igual (pause, resume, skip, stop...)

module.exports = {
  addToQueue,
  getQueue,
  setQueue,
  pausePlayer: async (interaction) => {
    const guildId = interaction.guildId;
    const player = getPlayer(guildId);
    if (!player) return false;
    player.pause();
    return true;
  },
  resumePlayer: async (interaction) => {
    const guildId = interaction.guildId;
    const player = getPlayer(guildId);
    if (!player) return false;
    player.unpause();
    return true;
  },
  skipSong: async (interaction) => {
    const guildId = interaction.guildId;
    const player = getPlayer(guildId);
    if (!player) return false;
    player.stop();
    return true;
  },
  stopPlayer: async (interaction) => {
    const guildId = interaction.guildId;
    const player = getPlayer(guildId);
    const connection = getVoiceConnection(guildId);
    setQueue(guildId, []);
    if (player) player.stop();
    if (connection) connection.destroy();
    clearReproductorMessage(guildId);
    return true;
  }
};
