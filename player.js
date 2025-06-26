// Import necessary functions from Discord Voice API
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, getVoiceConnection } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

// Map to store music queues per guild (server)
const queues = new Map(); // key = guildId, value = queue object

// Get or create the queue for a specific guild
function getQueue(guildId) {
  if (!queues.has(guildId)) {
    queues.set(guildId, {
      songs: [],        // Array of song objects
      connection: null, // Voice connection
      player: null,     // Audio player instance
      playing: false,   // Flag to know if it's currently playing
    });
  }
  return queues.get(guildId);
}

// Play the next song in the queue
async function playNext(interaction, queue) {
  if (queue.songs.length === 0) {
    // No more songs — destroy connection and exit
    queue.playing = false;
    queue.connection.destroy();
    return;
  }

  const song = queue.songs[0]; // Get the first song in the queue
  const stream = ytdl(song.url, { filter: 'audioonly', highWaterMark: 1 << 25 });
  const resource = createAudioResource(stream);
  const player = createAudioPlayer();

  queue.player = player;
  queue.playing = true;

  player.play(resource);
  queue.connection.subscribe(player);

  // When the song finishes, remove it and play the next
  player.on(AudioPlayerStatus.Idle, () => {
    queue.songs.shift();       // Remove the current song
    playNext(interaction, queue); // Play the next one
  });

  // In case of error during playback
  player.on('error', error => {
    console.error(`❌ Playback error: ${error.message}`);
    queue.songs.shift(); // Skip song on error
    playNext(interaction, queue);
  });

  // Respond to the user
  await interaction.followUp({ content: `🎶 Now playing: ${song.title}` });
}

// Add a song to the queue
async function addToQueue(interaction, song) {
  const voiceChannel = interaction.member.voice.channel;
  const guildId = interaction.guild.id;
  const queue = getQueue(guildId);

  // If the bot is not connected yet, connect
  if (!queue.connection) {
    queue.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });
  }

  queue.songs.push(song); // Add the song to the queue

  // If nothing is playing, start playback
  if (!queue.playing) {
    await playNext(interaction, queue);
  } else {
    await interaction.followUp({ content: `📝 Added to queue: ${song.title}` });
  }
}

// Skip the current song
function skip(interaction) {
  const queue = queues.get(interaction.guild.id);
  if (queue && queue.player) {
    queue.player.stop(true); // Force the player to stop, triggering the next song
    return true;
  }
  return false;
}

// Stop the music and clear the queue
function stop(interaction) {
  const queue = queues.get(interaction.guild.id);
  if (queue) {
    queue.songs = [];
    if (queue.player) queue.player.stop();
    if (queue.connection) queue.connection.destroy();
    queues.delete(interaction.guild.id);
    return true;
  }
  return false;
}

// Pause the current song
function pause(interaction) {
  const queue = queues.get(interaction.guild.id);
  if (queue && queue.player) {
    return queue.player.pause();
  }
  return false;
}

// Resume a paused song
function resume(interaction) {
  const queue = queues.get(interaction.guild.id);
  if (queue && queue.player) {
    return queue.player.unpause();
  }
  return false;
}

// Get a formatted list of songs in the queue
function getQueueList(interaction) {
  const queue = queues.get(interaction.guild.id);
  if (!queue || queue.songs.length === 0) return null;
  return queue.songs.map((s, i) => `${i + 1}. ${s.title}`).join('\n');
}

// Export all queue control functions for use in commands
module.exports = {
  addToQueue,
  skip,
  stop,
  pause,
  resume,
  getQueueList
};
