// Import necessary functions from Discord Voice API
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
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
    queue.playing = false;
    queue.connection.destroy();
    return;
  }

  const song = queue.songs[0];
  const stream = ytdl(song.url, { filter: 'audioonly', highWaterMark: 1 << 25 });
  const resource = createAudioResource(stream);
  const player = createAudioPlayer();

  queue.player = player;
  queue.playing = true;

  player.play(resource);
  queue.connection.subscribe(player);

  player.on(AudioPlayerStatus.Idle, () => {
    queue.songs.shift();
    playNext(interaction, queue);
  });

  player.on('error', error => {
    console.error(`❌ Playback error: ${error.message}`);
    queue.songs.shift();
    playNext(interaction, queue);
  });

  // Embed with buttons
  const embed = new EmbedBuilder()
    .setColor(0x1DB954)
    .setTitle('🎶 Now Playing')
    .setDescription(`[${song.title}](${song.url})`)
    .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('pause').setLabel('⏸ Pause').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('skip').setLabel('⏭ Skip').setStyle(ButtonStyle.Primary),
    new ButtonBuilder().setCustomId('stop').setLabel('⛔ Stop').setStyle(ButtonStyle.Danger)
  );

  const message = await interaction.followUp({ embeds: [embed], components: [row] });

  const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

  collector.on('collect', async i => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: '❌ These buttons aren\'t for you.', ephemeral: true });
    }

    if (i.customId === 'pause') {
      const paused = pause(interaction);
      await i.reply({ content: paused ? '⏸️ Song paused.' : '❌ No song is playing.', ephemeral: true });
    } else if (i.customId === 'skip') {
      const skipped = skip(interaction);
      await i.reply({ content: skipped ? '⏭ Skipped to next song.' : '❌ Nothing to skip.', ephemeral: true });
    } else if (i.customId === 'stop') {
      const stopped = stop(interaction);
      await i.reply({ content: stopped ? '⛔ Music stopped.' : '❌ Nothing to stop.', ephemeral: true });
    }
  });

  collector.on('end', () => {
    message.edit({ components: [] });
  });
}

// Add a song to the queue
async function addToQueue(interaction, song) {
  const voiceChannel = interaction.member.voice.channel;
  const guildId = interaction.guild.id;
  const queue = getQueue(guildId);

  if (!queue.connection) {
    queue.connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    });
  }

  queue.songs.push(song);

  if (!queue.playing) {
    await playNext(interaction, queue);
  } else {
    const embed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setTitle('📝 Added to Queue')
      .setDescription(`[${song.title}](${song.url})`)
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    await interaction.followUp({ embeds: [embed] });
  }
}

function skip(interaction) {
  const queue = queues.get(interaction.guild.id);
  if (queue && queue.player) {
    queue.player.stop(true);
    return true;
  }
  return false;
}

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

function pause(interaction) {
  const queue = queues.get(interaction.guild.id);
  if (queue && queue.player) {
    return queue.player.pause();
  }
  return false;
}

function resume(interaction) {
  const queue = queues.get(interaction.guild.id);
  if (queue && queue.player) {
    return queue.player.unpause();
  }
  return false;
}

function getQueueList(interaction) {
  const queue = queues.get(interaction.guild.id);
  if (!queue || queue.songs.length === 0) return null;
  return queue.songs.map((s, i) => `${i + 1}. ${s.title}`).join('\n');
}

module.exports = {
  addToQueue,
  skip,
  stop,
  pause,
  resume,
  getQueueList
};