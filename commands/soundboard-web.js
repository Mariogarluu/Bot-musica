// commands/soundboard-web.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soundboard-web')
    .setDescription('🌐 Abre el panel web interactivo para añadir y previsualizar sonidos visualmente'),

  async execute(interaction) {
    const port = process.env.PORT || 3000;
    const webUrl = `http://localhost:${port}/soundboard`;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🌐 Soundboard Studio • Panel Web Visual')
      .setDescription(
        'El **Soundboard Studio** te permite crear botones interactivos para Discord de forma 100% visual desde tu navegador:\n\n' +
        '✨ **Herramientas del Panel Web:**\n' +
        '• 📥 **Drag & Drop**: Arrastra archivos `.mp3`, `.wav` o `.ogg` directamente desde tu ordenador.\n' +
        '• 🔘 **Vista Previa en Vivo**: Observa cómo quedará el botón en Discord (color, emoji y texto) mientras escribes.\n' +
        '• 🎧 **Reproductor de Muestra**: Escucha el sonido en el navegador antes de guardarlo en el bot.\n' +
        '• 🗑️ **Gestión de Biblioteca**: Visualiza todos los sonidos activos y elimina los que ya no uses con un solo clic.'
      )
      .addFields(
        {
          name: '🔗 Enlace de Acceso Local',
          value: `[**Haz clic aquí para abrir Soundboard Studio**](${webUrl})\n\`${webUrl}\``,
          inline: false
        }
      )
      .setFooter({
        text: 'Servidor HTTP activo en el bot',
        iconURL: interaction.client.user?.displayAvatarURL()
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Abrir Soundboard Studio')
        .setStyle(ButtonStyle.Link)
        .setURL(webUrl)
        .setEmoji('🌐')
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
};
