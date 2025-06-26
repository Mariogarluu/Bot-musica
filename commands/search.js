const {
  SlashCommandBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ComponentType,
  EmbedBuilder
} = require('discord.js');
const { google } = require('googleapis');
const { addToQueue } = require('../player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('🔍 Search for a song on YouTube and select one to play')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('Enter the name of the song')
        .setRequired(true)
    ),

  async execute(interaction) {
    const query = interaction.options.getString('query');

    // Check for YouTube API key
    if (!process.env.YOUTUBE_API_KEY) {
      return interaction.reply({
        content: '❌ Missing YouTube API key. Please contact the bot admin.',
        ephemeral: true
      });
    }

    // Show loading message
    await interaction.reply({
      content: '🔍 Searching on YouTube...',
      ephemeral: true
    });

    // Init YouTube API
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });

    let results;
    try {
      const res = await youtube.search.list({
        part: 'snippet',
        q: query,
        maxResults: 10,
        type: 'video'
      });

      results = res.data.items;
    } catch (error) {
      console.error('❌ YouTube Search Error:', error);
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('❌ YouTube Error')
            .setDescription(`Failed to fetch search results.\n\`${error.message || 'Unknown error'}\``)
        ],
        ephemeral: true
      });
    }

    if (!results.length) {
      return interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(0xFFFF00)
            .setTitle('📭 No results')
            .setDescription('No songs found for your search.')
        ],
        ephemeral: true
      });
    }

    // Format select options
    const options = results.map(video => ({
      label: video.snippet.title.substring(0, 100),
      description: video.snippet.channelTitle.substring(0, 100),
      value: `https://www.youtube.com/watch?v=${video.id.videoId}`
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_song')
      .setPlaceholder('🎶 Choose a song')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setTitle('🔍 YouTube Search Results')
      .setDescription('Select a song from the dropdown menu below')
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    await interaction.editReply({
      content: null,
      embeds: [embed],
      components: [row]
    });

    // Wait for selection
    const collector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 20000,
      max: 1
    });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: '❌ This is not your menu. Shoo.',
          ephemeral: true
        });
      }

      const selectedUrl = i.values[0];
      const selectedTitle = options.find(opt => opt.value === selectedUrl)?.label;

      if (!interaction.member.voice.channel) {
        return i.reply({
          content: '❌ You must be in a voice channel to play a song.',
          ephemeral: true
        });
      }

      await i.deferUpdate();

      const song = {
        title: selectedTitle,
        url: selectedUrl
      };

      await addToQueue(interaction, song);
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        try {
          await interaction.editReply({
            content: '⏱️ You took too long. Try `/search` again.',
            components: [],
            embeds: []
          });
        } catch (err) {
          console.warn('⚠️ Could not edit message on collector end:', err.message);
        }
      }
    });
  }
};
