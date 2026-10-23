// commands/voice.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType
} = require('discord.js');
const { getVoices, getVoiceById, getGuildVoice, setGuildVoice } = require('../utils/ttsProvider');
const { playTtsSpeech } = require('../player');

/**
 * Aplica el cambio de voz en el servidor, reproduce la muestra de audio en el canal de voz si corresponde
 * y responde con un Embed de confirmación estilizado.
 */
async function applyVoiceChange(interaction, voiceId, isUpdate = false) {
  const guildId = interaction.guildId;
  const selectedVoice = setGuildVoice(guildId, voiceId);
  const voiceChannel = interaction.member?.voice?.channel;

  let sampleNote = '';

  if (voiceChannel) {
    try {
      // Reproducir muestra de ~3 segundos en el canal de voz
      await playTtsSpeech(guildId, voiceChannel, 'Hola, esta es mi voz para este servidor.', selectedVoice.id);
      sampleNote = `🔊 **Muestra en directo:** Reproduciendo saludo de prueba en <#${voiceChannel.id}>...`;
    } catch (err) {
      console.warn('[VOICE] Error reproduciendo muestra de voz:', err?.message || err);
      sampleNote = `⚠️ *No se pudo reproducir la muestra de audio en el canal de voz.*`;
    }
  } else {
    sampleNote = `💡 *Únete a un canal de voz para escuchar la muestra en vivo.*`;
  }

  const embed = new EmbedBuilder()
    .setColor(0x10B981)
    .setTitle(`🗣️ Voz del Servidor Actualizada: ${selectedVoice.emoji} ${selectedVoice.name}`)
    .setDescription(
      `Se ha configurado a **${selectedVoice.name}** como la voz predeterminada del servidor para el comando \`/tts\` y las presentaciones del locutor \`/dj\`.\n\n` +
      sampleNote
    )
    .addFields(
      { name: '👤 Nombre', value: selectedVoice.name, inline: true },
      { name: '🌍 País', value: `${selectedVoice.emoji} ${selectedVoice.country}`, inline: true },
      { name: '⚧️ Género', value: selectedVoice.gender, inline: true },
      { name: '🎭 Descripción', value: selectedVoice.description, inline: false },
      { name: '🆔 Identificador', value: `\`${selectedVoice.id}\``, inline: true },
      { name: '🎙️ Integración', value: '`/tts` • Modo Locutor `/dj`', inline: true }
    )
    .setFooter({
      text: `Configurado por ${interaction.user.username} • Motor Neuronal de Inteligencia Artificial`,
      iconURL: interaction.user.displayAvatarURL()
    })
    .setTimestamp();

  if (isUpdate) {
    if (!interaction.replied && !interaction.deferred) {
      return interaction.update({ embeds: [embed], components: [] });
    } else {
      return interaction.editReply({ embeds: [embed], components: [] });
    }
  } else {
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({ embeds: [embed], components: [] });
    } else {
      return interaction.reply({ embeds: [embed] });
    }
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('🗣️ Configura la voz de IA del servidor para /tts y el locutor DJ')
    .addStringOption(option =>
      option
        .setName('eleccion')
        .setDescription('Elige directamente la voz neuronal para este servidor')
        .setRequired(false)
        .addChoices(
          { name: '🇪🇸 Álvaro (España - Masculina, entusiasta)', value: 'es-ES-AlvaroNeural' },
          { name: '🇪🇸 Elvira (España - Femenina, clara y profesional)', value: 'es-ES-ElviraNeural' },
          { name: '🇲🇽 Jorge (México - Masculina, cálida)', value: 'es-MX-JorgeNeural' },
          { name: '🇲🇽 Dalia (México - Femenina, suave)', value: 'es-MX-DaliaNeural' },
          { name: '🇦🇷 Tomás (Argentina - Masculina, enérgica)', value: 'es-AR-TomasNeural' },
          { name: '🇦🇷 Elena (Argentina - Femenina, expresiva)', value: 'es-AR-ElenaNeural' },
          { name: '🇨🇴 Gonzalo (Colombia - Masculina, formal)', value: 'es-CO-GonzaloNeural' },
          { name: '🇨🇴 Salomé (Colombia - Femenina, dulce)', value: 'es-CO-SalomeNeural' }
        )
    ),

  async execute(interaction) {
    const guildId = interaction.guildId;
    const eleccion = interaction.options.getString('eleccion');

    // Si se pasó el parámetro opcional 'eleccion', aplicar directamente
    if (eleccion) {
      return applyVoiceChange(interaction, eleccion, false);
    }

    // Si se ejecutó sin parámetros, mostrar el menú interactivo con StringSelectMenuBuilder
    const currentVoiceId = getGuildVoice(guildId);
    const currentVoice = getVoiceById(currentVoiceId);
    const voices = getVoices();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('voice_select')
      .setPlaceholder('🎙️ Selecciona una voz neuronal de IA para este servidor...')
      .addOptions(
        voices.map(v => ({
          label: `${v.emoji} ${v.name} (${v.country} - ${v.gender})`,
          description: v.description.length > 100 ? v.description.substring(0, 97) + '...' : v.description,
          value: v.id,
          default: v.id === currentVoiceId
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🎙️ Selector Interactivo de Voces Neuronales (IA)')
      .setDescription(
        'Elige la voz de Inteligencia Artificial que se utilizará para locutar mensajes con el comando `/tts` ' +
        'y para presentar canciones en la radio con el modo locutor `/dj`.\n\n' +
        `🔊 **Voz activa actualmente:** ${currentVoice.emoji} **${currentVoice.name}** (${currentVoice.country} • ${currentVoice.gender})\n` +
        `📝 *Usa el menú desplegable inferior para seleccionar una nueva voz y escuchar una muestra en vivo.*`
      )
      .addFields(
        {
          name: '🇪🇸 Voces de España',
          value: '• `Álvaro`: Masculina, entusiasta • Ideal para locutor DJ\n• `Elvira`: Femenina, clara y profesional',
          inline: false
        },
        {
          name: '🇲🇽 Voces de México',
          value: '• `Jorge`: Masculina, cálida\n• `Dalia`: Femenina, suave',
          inline: false
        },
        {
          name: '🇦🇷 Voces de Argentina',
          value: '• `Tomás`: Masculina, enérgica\n• `Elena`: Femenina, expresiva',
          inline: false
        },
        {
          name: '🇨🇴 Voces de Colombia',
          value: '• `Gonzalo`: Masculina, formal\n• `Salomé`: Femenina, dulce',
          inline: false
        }
      )
      .setFooter({
        text: 'Selecciona una voz en el menú inferior • Muestra automática de 3 segundos en llamada',
        iconURL: interaction.client.user?.displayAvatarURL()
      });

    return interaction.reply({
      embeds: [embed],
      components: [row]
    });
  },

  handleVoiceSelect: applyVoiceChange
};
