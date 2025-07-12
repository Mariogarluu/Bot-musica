const reproductorMessages = new Map();

async function sendOrUpdateReproductor(guildId, interaction, song, queue, embed, buttons) {
  // Borra mensaje anterior si existe
  const prev = reproductorMessages.get(guildId);
  if (prev) {
    try {
      const channel = await interaction.client.channels.fetch(prev.channelId);
      const msg = await channel.messages.fetch(prev.messageId);
      if (msg) await msg.delete();
    } catch (e) {}
  }

  // Envía el nuevo reproductor (siempre como followUp)
  const msg = await interaction.followUp({ embeds: [embed], components: buttons, fetchReply: true });
  reproductorMessages.set(guildId, { messageId: msg.id, channelId: msg.channel.id });
}

function clearReproductorMessage(guildId) {
  reproductorMessages.delete(guildId);
}

module.exports = { sendOrUpdateReproductor, clearReproductorMessage };