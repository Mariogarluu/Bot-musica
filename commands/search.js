// commands/search.js
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const yts = require('yt-search');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('🔎 Busca canciones en YouTube con selector interactivo')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nombre de la canción o artista a buscar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');
    await interaction.deferReply();

    let res;
    try {
      res = await yts(query);
    } catch (err) {
      console.error('Error buscando en YouTube:', err);
      return interaction.editReply('❌ Ocurrió un error al conectar con YouTube.');
    }

    if (!res || !res.videos || res.videos.length === 0) {
      const noResultsEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('🔎 Sin Resultados')
        .setDescription(`No se encontró ningún vídeo para: **${query}**\nIntenta con otros términos de búsqueda.`)
        .setFooter({ text: 'Bot de Música' });
      return interaction.editReply({ embeds: [noResultsEmbed] });
    }

    // Tomamos los primeros 5 resultados
    const results = res.videos.slice(0, 5);

    let desc = '';
    results.forEach((v, i) => {
      const views = typeof v.views === 'number' ? ` • 👁️ ${v.views.toLocaleString()}` : '';
      desc += `**${i + 1}.** [${v.title}](${v.url})\n` +
        `⏱️ \`${v.timestamp || '--:--'}\` • 👤 *${v.author?.name || 'YouTube'}*${views}\n\n`;
    });

    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle(`🔎 Resultados para: "${query.length > 50 ? query.substring(0, 47) + '...' : query}"`)
      .setDescription(desc)
      .setThumbnail(results[0]?.thumbnail || results[0]?.image || null)
      .setFooter({
        text: `Solicitado por ${interaction.user.username} • Elige una opción en el menú inferior`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    // Menú desplegable interactivo
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('search_select')
      .setPlaceholder('🎵 Haz clic aquí para elegir qué canción reproducir...')
      .addOptions(
        results.map((v, i) => ({
          label: `${i + 1}. ${v.title}`.substring(0, 100),
          description: `⏱️ ${v.timestamp || '--:--'} • 👤 ${v.author?.name || 'YouTube'}`.substring(0, 100),
          value: v.videoId,
          emoji: '🎶'
        }))
      );

    const menuRow = new ActionRowBuilder().addComponents(selectMenu);

    // Botones rápidos numerados
    const buttonRow = new ActionRowBuilder().addComponents(
      results.map((v, i) =>
        new ButtonBuilder()
          .setCustomId(`search_play_${v.videoId}`)
          .setLabel(`#${i + 1}`)
          .setStyle(ButtonStyle.Primary)
      )
    );

    // Guardar resultados en caché en el cliente
    interaction.client.searchResults ??= {};
    interaction.client.searchResults[interaction.user.id] = results;

    await interaction.editReply({
      embeds: [embed],
      components: [menuRow, buttonRow]
    });
  }
};
