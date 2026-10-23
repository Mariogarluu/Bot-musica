// commands/ambient.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const { ambientPresets, getAmbientPreset } = require('../utils/ambientStreams');
const player = require('../player');

/**
 * Genera el Embed visual interactivo para el modo ambiente / Focus Mode.
 * @param {object|null} selectedPreset
 * @returns {EmbedBuilder}
 */
function buildAmbientEmbed(selectedPreset = null) {
  const embed = new EmbedBuilder()
    .setColor(selectedPreset ? selectedPreset.color : 0x6366F1)
    .setTitle('🌿 Modo Ambiente & Concentración • Focus Hub')
    .setTimestamp();

  if (selectedPreset) {
    embed
      .setDescription(
        `### Actualmente Sonando en Bucle Infinito:\n` +
        `**${selectedPreset.emoji} ${selectedPreset.name}**\n` +
        `> *${selectedPreset.description}*\n\n` +
        `🔁 **Bucle:** \`Activado (Infinito)\` • ⏱️ **Duración:** \`${selectedPreset.duration}\`\n\n` +
        `✨ *Puedes elegir otro ambiente en el menú inferior para cambiarlo al instante o pulsar el botón para detener.*`
      )
      .setFooter({
        text: 'Focus & Study Mode • Sonido en bucle activo • Pulsa ⏹️ para finalizar',
      });

    if (selectedPreset.thumbnail) {
      embed.setThumbnail(selectedPreset.thumbnail);
    }
  } else {
    const presetList = ambientPresets
      .map(p => `• ${p.emoji} **${p.name}**\n  ↳ *${p.description}*`)
      .join('\n');

    embed
      .setDescription(
        `Transforma tu canal de voz en un espacio de paz y máxima concentración para estudiar, trabajar o relajarte.\n\n` +
        `**🎧 Ambientes Disponibles:**\n${presetList}\n\n` +
        `👇 **Selecciona un ambiente en el menú inferior para iniciar la reproducción en bucle continuo:**`
      )
      .setThumbnail('https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=500&auto=format&fit=crop&q=80')
      .setFooter({
        text: 'Focus & Study Mode • Al seleccionar un preset se vacía la cola y se activa el bucle',
      });
  }

  return embed;
}

/**
 * Genera los componentes de interfaz: Menú desplegable y Botón de parada rápida.
 * @param {string|null} activePresetId
 * @param {boolean} disabled
 * @returns {ActionRowBuilder[]}
 */
function buildAmbientComponents(activePresetId = null, disabled = false) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('ambient_select')
    .setPlaceholder('🍃 Haz clic aquí para elegir un sonido relajante...')
    .setDisabled(disabled)
    .addOptions(
      ambientPresets.map(preset => ({
        label: preset.name.substring(0, 100),
        description: preset.description.substring(0, 100),
        value: preset.id,
        emoji: preset.emoji,
        default: preset.id === activePresetId,
      }))
    );

  const stopButton = new ButtonBuilder()
    .setCustomId('ambient_stop')
    .setLabel('⏹️ Detener Ambiente')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(disabled);

  const menuRow = new ActionRowBuilder().addComponents(selectMenu);
  const buttonRow = new ActionRowBuilder().addComponents(stopButton);

  return [menuRow, buttonRow];
}

/**
 * Procesa la selección de un preset de audio ambiental.
 * @param {import('discord.js').StringSelectMenuInteraction} interaction 
 */
async function handleAmbientSelect(interaction) {
  const voiceChannel = interaction.member?.voice?.channel;
  if (!voiceChannel) {
    const errorEmbed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('🚫 Canal de Voz Requerido')
      .setDescription('Debes estar en un canal de voz para activar un sonido de ambiente.');

    if (!interaction.deferred && !interaction.replied) {
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
    return interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
  }

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate().catch(() => {});
  }

  const presetId = interaction.values?.[0];
  const preset = getAmbientPreset(presetId);
  if (!preset) return;

  const guildId = interaction.guildId;

  // 1. Detener reproducción anterior y vaciar la cola actual
  const existingPlayer = player.getPlayer(guildId);
  if (existingPlayer) {
    existingPlayer.removeAllListeners();
    try { existingPlayer.stop(true); } catch {}
  }
  player.setQueue(guildId, []);

  // 2. Forzar el bucle infinito
  player.setLoop(guildId, true);

  // 3. Crear el objeto de track de ambiente
  const song = {
    title: preset.title || preset.name,
    url: preset.url,
    thumbnail: preset.thumbnail || null,
    duration: preset.duration || 'Bucle continuo',
    seconds: 0,
    author: preset.author || 'Sonidos de Ambiente',
    ambient: true,
    presetId: preset.id,
    requestedBy: {
      username: interaction.user.username,
      avatarURL: interaction.user.displayAvatarURL(),
    },
  };

  // 4. Añadir a la cola e iniciar reproducción en bucle
  await player.addToQueue(interaction, song);

  // 5. Actualizar la interfaz del mensaje
  const updatedEmbed = buildAmbientEmbed(preset);
  const updatedComponents = buildAmbientComponents(preset.id, false);

  await interaction.editReply({
    embeds: [updatedEmbed],
    components: updatedComponents,
  }).catch(err => {
    console.error('Error al actualizar mensaje de ambiente:', err);
  });
}

/**
 * Procesa la detención rápida del modo ambiente.
 * @param {import('discord.js').ButtonInteraction} interaction 
 */
async function handleAmbientStop(interaction) {
  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferUpdate().catch(() => {});
  }

  await player.stopPlayer(interaction);

  const stoppedEmbed = new EmbedBuilder()
    .setColor(0xEF4444)
    .setTitle('⏹️ Modo Ambiente Detenido')
    .setDescription(
      'Se ha detenido la reproducción en bucle, se ha vaciado la cola musical y el bot ha abandonado el canal de voz.\n\n' +
      '*Puedes volver a usar `/ambient` en cualquier momento cuando desees una nueva sesión de concentración.*'
    )
    .setFooter({ text: 'Focus & Study Mode • Sesión finalizada' })
    .setTimestamp();

  const disabledComponents = buildAmbientComponents(null, true);

  await interaction.editReply({
    embeds: [stoppedEmbed],
    components: disabledComponents,
  }).catch(err => {
    console.error('Error al actualizar mensaje tras detener ambiente:', err);
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ambient')
    .setDescription('🌿 Sonidos relajantes en bucle infinito para estudio y concentración (Focus Mode)'),

  buildAmbientEmbed,
  buildAmbientComponents,
  handleAmbientSelect,
  handleAmbientStop,

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('🚫 Canal de Voz Requerido')
        .setDescription('Debes conectarte primero a un canal de voz para activar los sonidos ambientales de estudio.');
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const embed = buildAmbientEmbed();
    const components = buildAmbientComponents();

    return interaction.reply({
      embeds: [embed],
      components,
    });
  },
};
