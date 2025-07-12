const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ytSearch = require('yt-search');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('🔎 Busca canciones en YouTube y muestra las opciones')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Nombre o palabras clave de la canción a buscar')
        .setRequired(true)
    ),
  async execute(interaction) {
    const query = interaction.options.getString('query');
    await interaction.deferReply();

    let results;
    try {
      const search = await ytSearch(query);
      results = search.videos.slice(0, 5);
    } catch (error) {
      console.error('Error buscando en YouTube:', error);
      return interaction.editReply('❌ Error buscando la canción. Inténtalo de nuevo.');
    }

    if (!results || results.length === 0) {
      return interaction.editReply('🔎 No se encontraron resultados.');
    }

    const embed = new EmbedBuilder()
      .setTitle('Resultados de búsqueda en YouTube')
      .setColor(0x1DB954)
      .setDescription(
        results.map((video, idx) =>
          `**${idx + 1}.** [${video.title}](${video.url}) (${video.timestamp})`
        ).join('\n')
      )
      .setFooter({ text: 'Usa /play song:<URL> para reproducir uno de estos.' });

    await interaction.editReply({ embeds: [embed] });
  }
};
