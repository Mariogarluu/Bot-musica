// commands/soundboard.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { SOUND_EFFECTS } = require('../utils/soundEffects');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soundboard')
    .setDescription('🔊 Abre la botonera interactiva con memes y efectos de sonido para llamadas'),

  async execute(interaction) {
    // Fila 1: Bocina, Batería, Aplausos
    const row1 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('soundboard_airhorn')
        .setLabel('Bocina Meme')
        .setEmoji('📢')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('soundboard_badumtss')
        .setLabel('Ba-dum tss')
        .setEmoji('🥁')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('soundboard_applause')
        .setLabel('Aplausos')
        .setEmoji('👏')
        .setStyle(ButtonStyle.Success)
    );

    // Fila 2: Grillos, Bruh, Trompeta Triste / Fail
    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('soundboard_crickets')
        .setLabel('Grillos')
        .setEmoji('🦗')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('soundboard_bruh')
        .setLabel('Bruh')
        .setEmoji('🗿')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('soundboard_sad_violin')
        .setLabel('Trompeta Fail')
        .setEmoji('🎺')
        .setStyle(ButtonStyle.Primary)
    );

    // Fila 3: Efectos extra y botón de parada rápida
    const row3 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('soundboard_wasted')
        .setLabel('Wasted')
        .setEmoji('💀')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('soundboard_winerror')
        .setLabel('Error XP')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('soundboard_stop')
        .setLabel('Silenciar')
        .setEmoji('⏹️')
        .setStyle(ButtonStyle.Danger)
    );

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🔊 Soundboard de Memes & Efectos de Voz')
      .setDescription(
        'Pulsa cualquier botón para soltar un efecto de sonido en tu llamada de voz en tiempo real.\n\n' +
        '🎧 **Reproducción Inteligente:**\n' +
        '• Si hay música sonando, **se pausa momentáneamente** y **se reanuda sola** al terminar el clip.\n' +
        '• ¡Puedes pulsar botones cuantas veces quieras sin bloquear la llamada!\n' +
        '• Pulsa **⏹️ Silenciar** si deseas cortar un efecto antes de que termine.'
      )
      .addFields(
        {
          name: '📢 Fila 1 • Reacciones Épicas',
          value: '`📢 Bocina Meme` • `🥁 Ba-dum tss` • `👏 Aplausos`',
          inline: false
        },
        {
          name: '🦗 Fila 2 • Momentos Incómodos & Fails',
          value: '`🦗 Grillos` • `🗿 Bruh` • `🎺 Trompeta Fail (Sad Violin)`',
          inline: false
        },
        {
          name: '💀 Fila 3 • Extras & Control',
          value: '`💀 GTA Wasted` • `❌ Error Windows` • `⏹️ Silenciar Efecto`',
          inline: false
        }
      )
      .setFooter({
        text: 'Soundboard Discord.js v14 • Haz clic en los botones para interactuar',
        iconURL: interaction.client.user?.displayAvatarURL?.()
      });

    return interaction.reply({
      embeds: [embed],
      components: [row1, row2, row3]
    });
  }
};
