// commands/soundboard.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { getAllSoundEffects } = require('../utils/soundEffects');

const ITEMS_PER_PAGE = 9; // 3 filas de 3 botones = 9 sonidos por página

/**
 * Genera el payload (embeds y components) de la botonera del soundboard para la página solicitada.
 * @param {number} page
 * @param {object} clientUser
 */
function getSoundboardPanel(page = 1, clientUser = null) {
  const sounds = getAllSoundEffects();
  const totalPages = Math.max(1, Math.ceil(sounds.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageSounds = sounds.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const components = [];

  // Agrupar los sonidos en filas de máximo 3 botones para máxima legibilidad
  for (let i = 0; i < pageSounds.length; i += 3) {
    const rowSounds = pageSounds.slice(i, i + 3);
    const row = new ActionRowBuilder();

    rowSounds.forEach(sound => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`soundboard_${sound.id}`)
          .setLabel((sound.shortName || sound.name).slice(0, 20))
          .setEmoji(sound.emoji || '🔊')
          .setStyle(sound.style || ButtonStyle.Primary)
      );
    });

    components.push(row);
  }

  // Fila de Controles y Navegación
  const controlRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`soundboard_page_${currentPage - 1}`)
      .setLabel('◀ Anterior')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage <= 1),

    new ButtonBuilder()
      .setCustomId('soundboard_page_info')
      .setLabel(`Pág ${currentPage}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId(`soundboard_page_${currentPage + 1}`)
      .setLabel('Siguiente ▶')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(currentPage >= totalPages),

    new ButtonBuilder()
      .setCustomId('soundboard_open_modal')
      .setLabel('➕ Añadir')
      .setEmoji('✨')
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId('soundboard_stop')
      .setLabel('Silenciar')
      .setEmoji('⏹️')
      .setStyle(ButtonStyle.Danger)
  );

  components.push(controlRow);

  const port = process.env.PORT || 3000;
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🔊 Soundboard de Memes & Efectos de Voz')
    .setDescription(
      'Pulsa cualquier botón para reproducir un efecto instantáneo en tu llamada de voz.\n\n' +
      '✨ **Reproducción Inteligente:**\n' +
      '• Si hay música sonando, **se pausa momentáneamente** y **se reanuda sola** al terminar el clip.\n' +
      '• ¡Pulsa **➕ Añadir** para crear nuevos botones o visita el **Panel Web**!\n' +
      '• Pulsa **⏹️ Silenciar** para cortar cualquier audio en curso.'
    )
    .addFields(
      {
        name: `📋 Sonidos en esta página (${pageSounds.length})`,
        value: pageSounds.map(s => `${s.emoji || '🔊'} **${s.name}**`).join(' • ') || 'No hay sonidos en esta página',
        inline: false
      },
      {
        name: '🌐 Soundboard Studio Web (Panel Visual)',
        value: `Accede a [http://localhost:${port}/soundboard](http://localhost:${port}/soundboard) para subir MP3s arrastrando archivos y previsualizar botones en directo.`,
        inline: false
      }
    )
    .setFooter({
      text: `Total de sonidos: ${sounds.length} • Página ${currentPage} de ${totalPages} • Discord.js v14`,
      iconURL: clientUser?.displayAvatarURL?.()
    });

  return { embeds: [embed], components };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soundboard')
    .setDescription('🔊 Abre la botonera interactiva con memes y efectos de sonido para llamadas'),

  getSoundboardPanel,

  async execute(interaction) {
    const payload = getSoundboardPanel(1, interaction.client.user);
    return interaction.reply(payload);
  }
};
