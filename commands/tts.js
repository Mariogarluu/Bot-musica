// commands/tts.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getGuildVoice, getVoiceById } = require('../utils/ttsProvider');
const { playTtsSpeech } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('tts')
    .setDescription('🗣️ Lee en voz alta un mensaje en tu canal de voz con voces neuronales de IA')
    .addStringOption(option =>
      option
        .setName('mensaje')
        .setDescription('El texto que el bot locutará en voz alta (máximo 300 caracteres)')
        .setRequired(true)
        .setMaxLength(300)
    ),

  async execute(interaction) {
    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('🚫 Canal de Voz Requerido')
        .setDescription('Debes unirte primero a un canal de voz para que el bot pueda locutar tu mensaje.');
      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const mensaje = interaction.options.getString('mensaje')?.trim();
    if (!mensaje) {
      return interaction.reply({
        content: '❌ Debes proporcionar un mensaje de texto no vacío para locutar.',
        ephemeral: true
      });
    }

    // Defer reply para permitir el tiempo de síntesis neuronal sin timeout en Discord
    await interaction.deferReply();

    const guildId = interaction.guildId;
    const voiceId = getGuildVoice(guildId);
    const voice = getVoiceById(voiceId);

    try {
      // Reproducción inteligente: pausa la música si hay alguna sonando y la reanuda automáticamente al terminar
      await playTtsSpeech(guildId, voiceChannel, mensaje, voiceId);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🗣️ Locución Text-to-Speech (IA Neuronal)')
        .setDescription(`> *"${mensaje}"*`)
        .addFields(
          {
            name: '👤 Emisor',
            value: `<@${interaction.user.id}>`,
            inline: true
          },
          {
            name: '🎙️ Voz Empleada',
            value: `**${voice.emoji} ${voice.name}**\n\`${voice.country} • ${voice.gender}\``,
            inline: true
          },
          {
            name: '🎧 Canal de Voz',
            value: `<#${voiceChannel.id}>`,
            inline: true
          }
        )
        .setFooter({
          text: 'Pausa y reanuda música automáticamente • Cambia la voz con /voice',
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    } catch (err) {
      console.error('[TTS Command Error]:', err);
      const errorEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('❌ Error al Reproducir TTS')
        .setDescription('Ocurrió un inconveniente al sintetizar o reproducir la locución de voz. Inténtalo de nuevo en unos momentos.');

      return interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
