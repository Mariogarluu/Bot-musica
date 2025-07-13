const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const yts = require('yt-search');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('🔎 Busca vídeos de YouTube para reproducir')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Palabra clave de búsqueda')
        .setRequired(true)
    ),
  async execute(interaction) {
    const query = interaction.options.getString('query');
    await interaction.deferReply();

    const res = await yts(query);
    if (!res || !res.videos || res.videos.length === 0) {
      return interaction.editReply('❌ No encontré resultados en YouTube.');
    }

    // Solo 5 primeros resultados
    const results = res.videos.slice(0, 5);

    let desc = '';
    results.forEach((v, i) => {
      desc += `**${i + 1}.** [${v.title}](${v.url}) (${v.timestamp})\n`;
    });

    const embed = new EmbedBuilder()
      .setTitle('🔎 Resultados de búsqueda')
      .setDescription(desc)
      .setColor(0xff0000)
      .setFooter({ text: `Pedido por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });

    // Botón de reproducir para cada resultado
    const row = new ActionRowBuilder();
    results.forEach((v, i) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`search_play_${v.videoId}`)
          .setLabel(`▶️ Reproducir #${i + 1}`)
          .setStyle(ButtonStyle.Primary)
      );
    });

    await interaction.editReply({ embeds: [embed], components: [row] });
  }
};
