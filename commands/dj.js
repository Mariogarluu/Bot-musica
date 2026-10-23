// commands/dj.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getDjMode, setDjMode, toggleDjMode } = require('../player');
const { getGuildVoice, getVoiceById } = require('../utils/ttsProvider');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dj')
    .setDescription('🎙️ Activa o desactiva el modo Locutor DJ (TTS) para presentar canciones')
    .addBooleanOption(option =>
      option.setName('estado')
        .setDescription('Estado del locutor: On (True) para activar o Off (False) para desactivar')
        .setRequired(false)
    ),

  async execute(interaction) {
    const guildId = interaction.guildId;
    const estadoOption = interaction.options.getBoolean('estado');

    let isEnabled;
    if (estadoOption !== null) {
      setDjMode(guildId, estadoOption);
      isEnabled = estadoOption;
    } else {
      isEnabled = toggleDjMode(guildId);
    }

    const activeVoice = getVoiceById(getGuildVoice(guildId));

    const embed = new EmbedBuilder()
      .setColor(isEnabled ? 0x1DB954 : 0xEF4444)
      .setTitle(isEnabled ? '🎙️ Modo Locutor DJ: Activado' : '🔇 Modo Locutor DJ: Desactivado')
      .setDescription(
        isEnabled
          ? `¡El **Locutor DJ** está encendido! A partir de ahora, cada canción será presentada con estilo de radio antes de comenzar a reproducirse utilizando la voz activa de **${activeVoice.name}**.`
          : 'El **Locutor DJ** ha sido desactivado. Las pistas comenzarán a sonar directamente sin locución previa.'
      )
      .addFields(
        {
          name: '📻 Estado',
          value: isEnabled ? '`🟢 Activado (ON)`' : '`🔴 Desactivado (OFF)`',
          inline: true
        },
        {
          name: '🗣️ Locución Neuronal',
          value: `\`${activeVoice.emoji} ${activeVoice.name} (${activeVoice.country})\``,
          inline: true
        }
      )
      .setFooter({
        text: isEnabled
          ? 'Cambia la voz del locutor con /voice • Usa /dj estado: False para apagarlo'
          : 'Usa /dj para volver a activar el locutor',
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  }
};
