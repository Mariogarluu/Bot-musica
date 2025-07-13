const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const ytdl = require('@distube/ytdl-core');
const { getReproductorEmbed } = require('./utils/reproductorEmbed');
const { sendOrUpdateReproductor, clearReproductorMessage } = require('./utils/reproductorMessage');

const queues = new Map();
const players = new Map();
const reproductorMessages = new Map(); // por si necesitas referencias a mensajes

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
  if (!song || !song.url) return;
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
    let queue = getQueue(guildId);
    queue.shift();
    setQueue(guildId, queue);
    if (queue.length > 0 && queue[0].url) {
      playSong(interaction, queue[0]);
    } else if (connection) {
      connection.destroy();
    }
    return;
  }

  const resource = createAudioResource(stream);
  let player = getPlayer(guildId);
  if (!player) {
    player = createAudioPlayer();
    setPlayer(guildId, player);
  }

  player.removeAllListeners();
  player.play(resource);
  connection.subscribe(player);

  // Embeds y reproductor
  const queue = getQueue(guildId);
  const { embed, buttons } = getReproductorEmbed(song, interaction, queue);
  await sendOrUpdateReproductor(guildId, interaction.channel, embed, buttons);

  player.on(AudioPlayerStatus.Idle, async () => {
    let queue = getQueue(guildId);
    queue.shift();
    setQueue(guildId, queue);
    if (queue.length > 0 && queue[0].url) {
      playSong(interaction, queue[0]);
    } else {
      if (connection) connection.destroy();
      await clearReproductorMessage(guildId);
    }
  });

  player.on('error', async (error) => {
    let queue = getQueue(guildId);
    queue.shift();
    setQueue(guildId, queue);
    if (queue.length > 0 && queue[0].url) {
      playSong(interaction, queue[0]);
    } else {
      if (connection) connection.destroy();
      await clearReproductorMessage(guildId);
    }
  });
}

async function pausePlayer(interaction) {
  const player = getPlayer(interaction.guildId);
  if (player) player.pause();
}

async function resumePlayer(interaction) {
  const player = getPlayer(interaction.guildId);
  if (player) player.unpause();
}

async function skipSong(interaction) {
  const player = getPlayer(interaction.guildId);
  if (player) player.stop();
}

async function stopPlayer(interaction) {
  const guildId = interaction.guildId;
  const player = getPlayer(guildId);
  const connection = getVoiceConnection(guildId);
  setQueue(guildId, []);
  if (player) player.stop();
  if (connection) connection.destroy();
  await clearReproductorMessage(guildId);
}

module.exports = {
  addToQueue,
  getQueue,
  setQueue,
  pausePlayer,
  resumePlayer,
  skipSong,
  stopPlayer,
};
