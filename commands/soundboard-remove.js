// commands/soundboard-remove.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder
} = require('discord.js');
const { loadCustomSounds } = require('../utils/soundEffects');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soundboard-remove')
    .setDescription('🗑️ Elimina un sonido personalizado del soundboard mediante un menú interactivo'),

  async execute(interaction) {
    const customSounds = loadCustomSounds();

    if (!customSounds || customSounds.length === 0) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xF59E0B)
            .setTitle('ℹ️ Sin Sonidos Personalizados')
            .setDescription(
              'Actualmente no hay sonidos añadidos por usuarios en el soundboard.\n' +
              '*(Los sonidos meme integrados de fábrica no se pueden borrar).*'
            )
        ],
        ephemeral: true
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('soundboard_delete_select')
      .setPlaceholder('🗑️ Selecciona el sonido personalizado que deseas borrar...')
      .addOptions(
        customSounds.slice(0, 25).map(sound => ({
          label: (sound.name || 'Sin nombre').slice(0, 25),
          description: `ID: ${sound.id}`.slice(0, 50),
          value: sound.id,
          emoji: sound.emoji || '🔊'
        }))
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('🗑️ Gestión de Sonidos Personalizados')
      .setDescription(
        'Elige a continuación el sonido que deseas eliminar permanentemente del soundboard.\n' +
        'El archivo local y su botón desaparecerán de inmediato de la botonera.'
      )
      .setFooter({ text: 'Selecciona una opción del menú inferior' });

    return interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }
};
