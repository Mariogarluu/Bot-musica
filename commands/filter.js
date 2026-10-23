// commands/filter.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { applyFilter, getFilter, FILTERS } = require('../player');

const FILTER_INFO = {
  nightcore: {
    name: 'Nightcore',
    description: '⚡ **Acelera el tempo (1.25x) y eleva el tono (pitch)** de las voces e instrumentos musicales. Proporciona un estilo sonoro agudo, vibrante y enérgico popular en música electrónica, pop y anime.',
    ffmpeg: 'atempo=1.25,asetrate=44100*1.25',
    color: 0xEC4899,
    emoji: '⚡',
  },
  vaporwave: {
    name: 'Vaporwave',
    description: '🌊 **Ralentiza la reproducción (0.8x) y reduce el tono general**, creando un ambiente retro, envolvente, nostálgico y relajante característico del estilo Lo-Fi y Synthwave.',
    ffmpeg: 'atempo=0.8,asetrate=44100*0.8',
    color: 0x8B5CF6,
    emoji: '🌊',
  },
  bassboost: {
    name: 'Bassboost',
    description: '🔊 **Amplifica intensamente las frecuencias graves (+15 dB a 110 Hz)**, otorgando una pegada de bajos profunda, potente y retumbante ideal para altavoces o auriculares con buena respuesta.',
    ffmpeg: 'bass=g=15:f=110:w=0.6',
    color: 0xEF4444,
    emoji: '🔊',
  },
  '8d': {
    name: 'Audio 8D',
    description: '🎧 **Efecto de audio binaural y paneo circular en 360°**, moviendo rítmicamente el sonido entre el canal izquierdo y derecho. Para una experiencia inmersiva óptima, se recomienda el uso de auriculares.',
    ffmpeg: 'apulsator=hz=0.125',
    color: 0x3B82F6,
    emoji: '🎧',
  },
  radio: {
    name: 'Radio Vintage',
    description: '📻 **Filtro pasa-banda analógico (300 Hz a 3000 Hz)** que suprime los agudos y graves extremos con realce de volumen, simulando la acústica de una radio antigua de tubo o un intercomunicador.',
    ffmpeg: 'highpass=f=300,lowpass=f=3000,volume=1.2',
    color: 0xF59E0B,
    emoji: '📻',
  },
  off: {
    name: 'Filtros Desactivados (Audio Directo)',
    description: '✨ **Restaura el stream de audio original en alta fidelidad**, sin ecualizaciones, distorsiones ni transformaciones de FFmpeg.',
    ffmpeg: 'Ninguno (Stream Directo)',
    color: 0x10B981,
    emoji: '✨',
  },
};

function formatDuration(sec) {
  if (!sec || isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('🎛️ Aplica o desactiva filtros de audio interactivos en tiempo real con FFmpeg')
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('El filtro de audio que deseas aplicar')
        .setRequired(true)
        .addChoices(
          { name: '⚡ Nightcore (Acelerado + Tono Agudo)', value: 'nightcore' },
          { name: '🌊 Vaporwave (Ralentizado + Tono Lo-Fi)', value: 'vaporwave' },
          { name: '🔊 Bassboost (Graves Potenciados +15dB)', value: 'bassboost' },
          { name: '🎧 8D Audio (Paneo Envolvente 360°)', value: '8d' },
          { name: '📻 Radio (Efecto Retro / Walkie-Talkie)', value: 'radio' },
          { name: '❌ Desactivar / Off (Sonido Original)', value: 'off' },
        )
    ),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xEF4444)
            .setDescription('🚫 Debes unirte primero a un canal de voz para configurar los filtros de audio.')
        ],
        ephemeral: true,
      });
    }

    const botVoiceChannel = interaction.guild?.members?.me?.voice?.channel;
    if (botVoiceChannel && voiceChannel.id !== botVoiceChannel.id) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xEF4444)
            .setDescription('🚫 Debes estar en el mismo canal de voz que el bot para modificar los filtros.')
        ],
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const selectedFilter = interaction.options.getString('tipo');
    const filterInfo = FILTER_INFO[selectedFilter] || FILTER_INFO.off;

    try {
      const result = await applyFilter(interaction, selectedFilter);

      const embed = new EmbedBuilder()
        .setColor(filterInfo.color)
        .setTitle(`${filterInfo.emoji} Filtro de Audio: ${filterInfo.name}`)
        .setDescription(filterInfo.description)
        .addFields(
          { name: '🎛️ Parámetros FFmpeg', value: `\`${filterInfo.ffmpeg}\``, inline: true },
          {
            name: '📊 Estado',
            value: result.replayed
              ? '⚡ **Aplicado en tiempo real**'
              : '💾 **Guardado para próximas canciones**',
            inline: true,
          }
        );

      if (result.replayed && result.currentSong) {
        const positionStr = result.seekSeconds > 0
          ? ` • Reanudada en \`${formatDuration(result.seekSeconds)}\``
          : ' • Reiniciada desde el inicio';

        embed.addFields({
          name: '🎵 Canción Actual',
          value: `[**${result.currentSong.title}**](${result.currentSong.url || 'https://youtube.com'})${positionStr}`,
          inline: false,
        });
      }

      embed.setFooter({
        text: `Solicitado por ${interaction.user.username} • Motor FFmpeg en tiempo real`,
        iconURL: interaction.user.displayAvatarURL(),
      });
      embed.setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Error aplicando filtro:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('❌ Error al Aplicar Filtro')
        .setDescription('Ocurrió un error al procesar el audio con FFmpeg. Se mantendrá el audio sin alteraciones.');
      await interaction.editReply({ embeds: [errorEmbed] });
    }
  },
};
