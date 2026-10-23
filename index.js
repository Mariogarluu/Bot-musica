// index.js
require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Collection,
  EmbedBuilder,
  ActivityType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
} = require('discord.js');
const {
  pausePlayer,
  resumePlayer,
  togglePause,
  skipSong,
  stopPlayer,
  getQueue,
  setQueue,
  addToQueue,
  getLoop,
  toggleLoop,
  playSoundEffect,
  stopSoundEffect,
} = require('./player');
const { getSoundEffect } = require('./utils/soundEffects');
const { handleSoundboardWebRequest } = require('./utils/soundboardWeb');
const { getReproductorEmbed } = require('./utils/reproductorEmbed');
const { sendOrUpdateReproductor } = require('./utils/reproductorMessage');
const { getQueueEmbed } = require('./utils/queueEmbed');
const { getHelpData } = require('./utils/helpEmbed');
const fs = require('fs');
const http = require('http');
const yts = require('yt-search');

// Servidor HTTP de soporte & Soundboard Studio Web
const PORT = process.env.PORT || 3000;
http.createServer(async (req, res) => {
  try {
    const handled = await handleSoundboardWebRequest(req, res);
    if (handled) return;
  } catch (err) {
    console.error('Error en servidor HTTP soundboard:', err);
  }

  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('🎵 Bot de música Discord activo 24/7 | Soundboard Studio disponible en /soundboard');
}).listen(PORT, () => {
  console.log(`🌐 Servidor HTTP activo en el puerto ${PORT} (Soundboard Studio: http://localhost:${PORT}/soundboard)`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Carga dinámica de comandos
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// Rotación dinámica de presencia para visualizar el estado y opciones del bot
let presenceIndex = 0;
function updateBotPresence() {
  if (!client.user) return;
  const guildCount = client.guilds.cache.size;
  const presences = [
    { name: '/help | /play 🎵', type: ActivityType.Listening },
    { name: `música en ${guildCount} servidor${guildCount === 1 ? '' : 'es'} 🎧`, type: ActivityType.Playing },
    { name: '/queue & controles 🎛️', type: ActivityType.Watching },
    { name: 'YouTube Music en alta calidad 🎶', type: ActivityType.Listening }
  ];

  const current = presences[presenceIndex % presences.length];
  client.user.setPresence({
    activities: [{ name: current.name, type: current.type }],
    status: 'online'
  });
  presenceIndex++;
}

client.once('ready', () => {
  console.log(`✅ Conectado como ${client.user.tag}!`);
  updateBotPresence();
  setInterval(updateBotPresence, 45000); // Rota cada 45 segundos
});

client.on('interactionCreate', async interaction => {
  // -------------------- MENÚS DESPLEGABLES (Select Menus) --------------------
  if (interaction.isStringSelectMenu()) {
    // 1. Selector de resultados de /search
    if (interaction.customId === 'search_select') {
      const voiceChannel = interaction.member?.voice?.channel;
      if (!voiceChannel) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle('🚫 Canal de Voz Requerido')
          .setDescription('Debes unirte primero a un canal de voz para reproducir música.');
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: true });

      const videoId = interaction.values[0];
      let info;
      try {
        info = await yts({ videoId });
      } catch (err) {
        console.error('Error obteniendo vídeo seleccionado:', err);
      }

      if (!info) {
        return interaction.editReply({ content: '❌ No se pudo cargar la información de la canción seleccionada.' });
      }

      const song = {
        title: info.title,
        url: info.url,
        thumbnail: info.thumbnail || info.image || null,
        duration: info.timestamp || '--:--',
        seconds: info.seconds || 0,
        author: info.author?.name || 'YouTube',
        requestedBy: {
          username: interaction.user.username,
          avatarURL: interaction.user.displayAvatarURL()
        }
      };

      const wasEmpty = getQueue(interaction.guildId).length === 0;
      await addToQueue(interaction, song);

      const confirmEmbed = new EmbedBuilder()
        .setColor(0x1DB954)
        .setTitle(wasEmpty ? '▶️ Reproduciendo Selección' : '✅ Selección Añadida a la Cola')
        .setDescription(`[**${song.title}**](${song.url})`)
        .setThumbnail(song.thumbnail)
        .addFields(
          { name: '⏱️ Duración', value: `\`${song.duration}\``, inline: true },
          { name: '👤 Canal', value: song.author, inline: true }
        )
        .setFooter({ text: `Pedido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

      return interaction.editReply({ embeds: [confirmEmbed] });
    }

    // 2. Selector de categorías de /help
    if (interaction.customId === 'help_category_select') {
      const category = interaction.values[0];
      const { embed, components } = getHelpData(client, category, interaction.user);
      return interaction.update({ embeds: [embed], components });
    }

    // 3. Selector de presets de /ambient (Focus Mode)
    if (interaction.customId === 'ambient_select') {
      if (interaction.deferred || interaction.replied) return;
      const { handleAmbientSelect } = require('./commands/ambient');
      return handleAmbientSelect(interaction);
    }

    // 4. Selector de voces neuronales de /voice
    if (interaction.customId === 'voice_select') {
      if (interaction.deferred || interaction.replied) return;
      const { handleVoiceSelect } = require('./commands/voice');
      const selectedVoiceId = interaction.values[0];
      return handleVoiceSelect(interaction, selectedVoiceId, true);
    }

    // 5. Selector de borrado de sonidos de /soundboard-remove
    if (interaction.customId === 'soundboard_delete_select') {
      const soundId = interaction.values[0];
      const { removeCustomSound, getSoundEffect } = require('./utils/soundEffects');
      const sound = getSoundEffect(soundId);
      const name = sound ? `${sound.emoji || '🔊'} ${sound.name}` : soundId;
      const removed = removeCustomSound(soundId);

      if (removed) {
        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(0x23A55A)
              .setTitle('✅ Sonido Eliminado')
              .setDescription(`El sonido **${name}** ha sido eliminado permanentemente del soundboard.`)
          ],
          components: []
        });
      } else {
        return interaction.update({
          content: '❌ No se pudo encontrar o eliminar el sonido especificado.',
          components: []
        });
      }
    }
  }

  // -------------------- BOTONES INTERACTIVOS --------------------
  if (interaction.isButton()) {
    // Ignorar botones gestionados por collectors locales en comandos (ej. /lyrics)
    if (interaction.customId.startsWith('lyrics_')) return;

    const guildId = interaction.guildId;
    const queue = getQueue(guildId);

    // -------------------- BOTONES DEL SOUNDBOARD --------------------
    // 1. Abrir modal visual para añadir sonido
    if (interaction.customId === 'soundboard_open_modal') {
      const modal = new ModalBuilder()
        .setCustomId('soundboard_add_modal')
        .setTitle('➕ Añadir Sonido al Soundboard');

      const nameInput = new TextInputBuilder()
        .setCustomId('modal_sound_name')
        .setLabel('Nombre del sonido (máx. 25 letras)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ej: Bazinga, Taco Bell, GigaChad')
        .setMinLength(2)
        .setMaxLength(25)
        .setRequired(true);

      const emojiInput = new TextInputBuilder()
        .setCustomId('modal_sound_emoji')
        .setLabel('Emoji para el botón')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ej: 🔔, 🗿, 💥, 🎉 (opcional, por defecto: 🔊)')
        .setMaxLength(8)
        .setRequired(false);

      const urlInput = new TextInputBuilder()
        .setCustomId('modal_sound_url')
        .setLabel('URL directa del audio (mp3 / ogg / wav)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://ejemplo.com/sonido.mp3')
        .setRequired(true);

      const colorInput = new TextInputBuilder()
        .setCustomId('modal_sound_color')
        .setLabel('Color: azul (1), gris (2), verde (3), rojo (4)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('azul, rojo, verde o gris (por defecto: azul)')
        .setMaxLength(10)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder().addComponents(nameInput),
        new ActionRowBuilder().addComponents(emojiInput),
        new ActionRowBuilder().addComponents(urlInput),
        new ActionRowBuilder().addComponents(colorInput)
      );

      return interaction.showModal(modal);
    }

    // 2. Paginación del Soundboard
    if (interaction.customId.startsWith('soundboard_page_')) {
      const pageStr = interaction.customId.replace('soundboard_page_', '');
      const targetPage = parseInt(pageStr, 10);
      if (!isNaN(targetPage)) {
        const { getSoundboardPanel } = require('./commands/soundboard');
        const payload = getSoundboardPanel(targetPage, client.user);
        return interaction.update(payload);
      }
      return interaction.deferUpdate().catch(() => {});
    }

    // 3. Botones de reproducción de efectos del Soundboard
    if (interaction.customId.startsWith('soundboard_')) {
      const voiceChannel = interaction.member?.voice?.channel;
      if (!voiceChannel) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle('🚫 Canal de Voz Requerido')
          .setDescription('Debes unirte a un canal de voz para reproducir efectos de sonido.');
        return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }

      await interaction.deferUpdate().catch(() => {});

      if (interaction.customId === 'soundboard_stop') {
        stopSoundEffect(guildId);
        return;
      }

      const soundId = interaction.customId.replace('soundboard_', '');
      const sound = getSoundEffect(soundId);
      if (sound) {
        await playSoundEffect(guildId, voiceChannel, sound);
      }
      return;
    }

    // Paginación de la cola
    if (interaction.customId.startsWith('queue_page_')) {
      const pageStr = interaction.customId.replace('queue_page_', '');
      const targetPage = parseInt(pageStr, 10);
      if (!isNaN(targetPage)) {
        const { embed, components } = getQueueEmbed(guildId, targetPage, interaction.user);
        return interaction.update({ embeds: [embed], components });
      }
    }

    // Botón de ver cola desde el reproductor (Ventana efímera e interactiva)
    if (interaction.customId === 'queue') {
      const { embed, components } = getQueueEmbed(guildId, 1, interaction.user);
      return interaction.reply({ embeds: [embed], components, ephemeral: true });
    }

    // Botón de ayuda & opciones desde el reproductor
    if (interaction.customId === 'help') {
      const { embed, components } = getHelpData(client, 'overview', interaction.user);
      return interaction.reply({ embeds: [embed], components, ephemeral: true });
    }

    // Botón de parada rápida de /ambient
    if (interaction.customId === 'ambient_stop') {
      if (interaction.deferred || interaction.replied) return;
      const { handleAmbientStop } = require('./commands/ambient');
      return handleAmbientStop(interaction);
    }

    // Botón de play individual desde /search (compatibilidad)
    if (interaction.customId.startsWith('search_play_')) {
      const videoId = interaction.customId.replace('search_play_', '');
      const voiceChannel = interaction.member?.voice?.channel;
      if (!voiceChannel) {
        return interaction.reply({
          embeds: [new EmbedBuilder().setColor(0xEF4444).setDescription('🚫 Debes unirte primero a un canal de voz.')],
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });
      const info = await yts({ videoId }).catch(() => null);
      if (!info) {
        return interaction.editReply('❌ No se encontró la información del vídeo.');
      }

      const song = {
        title: info.title,
        url: info.url,
        thumbnail: info.thumbnail || info.image || null,
        duration: info.timestamp || '--:--',
        seconds: info.seconds || 0,
        author: info.author?.name || 'YouTube',
        requestedBy: {
          username: interaction.user.username,
          avatarURL: interaction.user.displayAvatarURL()
        }
      };

      await addToQueue(interaction, song);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0x1DB954)
            .setTitle('✅ Canción Seleccionada')
            .setDescription(`[**${song.title}**](${song.url}) se ha añadido correctamente.`)
        ]
      });
    }

    // Controles de reproducción principales: Agradecer interacción sin generar mensajes extra en chat
    await interaction.deferUpdate().catch(() => {});

    let updated = false;
    switch (interaction.customId) {
      case 'pause_resume':
        await togglePause(interaction);
        updated = true;
        break;

      case 'pause':
        await pausePlayer(interaction);
        updated = true;
        break;

      case 'resume':
        await resumePlayer(interaction);
        updated = true;
        break;

      case 'skip':
        await skipSong(interaction);
        break;

      case 'loop':
        toggleLoop(guildId);
        updated = true;
        break;

      case 'shuffle':
        if (queue && queue.length > 2) {
          const [current, ...rest] = queue;
          for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
          }
          setQueue(guildId, [current, ...rest]);
          updated = true;
        }
        break;

      case 'stop':
        await stopPlayer(interaction);
        break;
    }

    // Si la acción requiere refrescar el reproductor en el sitio (in-place)
    if (updated) {
      const updatedQueue = getQueue(guildId);
      if (updatedQueue && updatedQueue[0]) {
        const { embed, buttons } = getReproductorEmbed(updatedQueue[0], interaction, updatedQueue);
        await sendOrUpdateReproductor(guildId, interaction, updatedQueue[0], updatedQueue, embed, buttons, true);
      }
    }
    return;
  }

  // -------------------- ENVÍO DE FORMULARIOS MODAL --------------------
  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'soundboard_add_modal') {
      const name = interaction.fields.getTextInputValue('modal_sound_name').trim();
      const emoji = interaction.fields.getTextInputValue('modal_sound_emoji').trim() || '🔊';
      const url = interaction.fields.getTextInputValue('modal_sound_url').trim();
      const colorText = interaction.fields.getTextInputValue('modal_sound_color').trim() || 'azul';

      await interaction.deferReply({ ephemeral: true });

      try {
        const { addCustomSound, normalizeButtonStyle } = require('./utils/soundEffects');
        const style = normalizeButtonStyle(colorText);

        const sound = await addCustomSound({
          name,
          shortName: name.slice(0, 20),
          emoji,
          style,
          url,
          description: `Añadido por ${interaction.user.username} vía Modal Discord`
        });

        const confirmEmbed = new EmbedBuilder()
          .setColor(0x23A55A)
          .setTitle('🎉 ¡Sonido Añadido al Soundboard!')
          .setDescription(`El botón **${sound.emoji} ${sound.name}** se ha creado con éxito y ya aparece en la botonera de llamadas.`)
          .addFields(
            { name: '🔘 Botón', value: `\`${sound.emoji} ${sound.shortName}\``, inline: true },
            { name: '🎨 Color', value: style === 4 ? 'Rojo' : (style === 3 ? 'Verde' : (style === 2 ? 'Gris' : 'Azul')), inline: true }
          )
          .setFooter({ text: 'Pulsa el botón de abajo para probar tu nuevo sonido en llamada' });

        const previewRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`soundboard_${sound.id}`)
            .setLabel(sound.shortName)
            .setEmoji(sound.emoji)
            .setStyle(sound.style)
        );

        return interaction.editReply({
          embeds: [confirmEmbed],
          components: [previewRow]
        });
      } catch (err) {
        return interaction.editReply({
          content: `❌ No se pudo guardar el sonido: ${err.message}`
        });
      }
    }
  }

  // -------------------- COMANDOS SLASH --------------------
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error ejecutando /${interaction.commandName}:`, error);
    const errorEmbed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('❌ Error Inesperado')
      .setDescription('Ocurrió un error al procesar este comando. Inténtalo de nuevo en unos momentos.');

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [errorEmbed] }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('🚀 Bot de música iniciado y listo.'))
  .catch(console.error);
