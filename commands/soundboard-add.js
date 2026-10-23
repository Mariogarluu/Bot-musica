// commands/soundboard-add.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { addCustomSound, normalizeButtonStyle } = require('../utils/soundEffects');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soundboard-add')
    .setDescription('➕ Añade un sonido personalizado al soundboard (sube tu archivo o pon una URL)')
    .addStringOption(option =>
      option.setName('nombre')
        .setDescription('Nombre que aparecerá en el botón (máx. 25 caracteres)')
        .setRequired(true)
        .setMaxLength(25)
    )
    .addAttachmentOption(option =>
      option.setName('archivo')
        .setDescription('Archivo de audio (.mp3, .ogg, .wav, .m4a)')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('url')
        .setDescription('O enlace directo a un archivo de audio público')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Emoji para el botón (ej: 🔔, 🗿, 💥)')
        .setRequired(false)
        .setMaxLength(8)
    )
    .addStringOption(option =>
      option.setName('color')
        .setDescription('Color visual del botón')
        .setRequired(false)
        .addChoices(
          { name: '🟦 Azul Blurple (Primary)', value: '1' },
          { name: '🟥 Rojo Peligro (Danger)', value: '4' },
          { name: '🟩 Verde Éxito (Success)', value: '3' },
          { name: '⬛ Gris Oscuro (Secondary)', value: '2' }
        )
    ),

  async execute(interaction) {
    const name = interaction.options.getString('nombre').trim();
    const attachment = interaction.options.getAttachment('archivo');
    const url = interaction.options.getString('url')?.trim();
    const emoji = interaction.options.getString('emoji')?.trim() || '🔊';
    const colorVal = interaction.options.getString('color') || '1';

    if (!attachment && !url) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xEF4444)
            .setTitle('🚫 Falta Origen de Audio')
            .setDescription('Debes adjuntar un **archivo de audio** (`.mp3`, `.ogg`, `.wav`) o indicar una **URL** directa.')
        ],
        ephemeral: true
      });
    }

    await interaction.deferReply({ ephemeral: true });

    let buffer = null;
    let finalUrl = url;

    // Si el usuario subió un archivo adjunto
    if (attachment) {
      try {
        const res = await fetch(attachment.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arrayBuf = await res.arrayBuffer();
        buffer = Buffer.from(arrayBuf);
      } catch (err) {
        return interaction.editReply({
          content: `❌ Error descargando el archivo adjunto: ${err.message}`
        });
      }
    }

    try {
      const style = normalizeButtonStyle(parseInt(colorVal, 10));
      const sound = await addCustomSound({
        name,
        shortName: name.slice(0, 20),
        emoji,
        style,
        url: finalUrl,
        buffer,
        description: `Añadido por ${interaction.user.username} vía comando Discord`
      });

      const confirmEmbed = new EmbedBuilder()
        .setColor(0x23A55A)
        .setTitle('🎉 ¡Sonido Añadido al Soundboard!')
        .setDescription(
          `El sonido **${sound.emoji} ${sound.name}** se ha guardado correctamente y ya está disponible para reproducir en llamadas de voz.`
        )
        .addFields(
          { name: '🔘 Botón', value: `\`${sound.emoji} ${sound.shortName}\``, inline: true },
          { name: '🎨 Color', value: style === 4 ? 'Rojo' : (style === 3 ? 'Verde' : (style === 2 ? 'Gris' : 'Azul')), inline: true },
          { name: '📁 Almacenamiento', value: buffer ? 'Archivo guardado en el bot' : 'Enlace remoto / URL', inline: true }
        )
        .setFooter({
          text: `Añadido por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        });

      // Vista previa del botón real interactivo
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
    } catch (error) {
      console.error('[SOUNDBOARD ADD ERROR]:', error);
      return interaction.editReply({
        content: `❌ Error al registrar el sonido: ${error.message}`
      });
    }
  }
};
