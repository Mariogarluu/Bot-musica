const reproductorMessages = new Map();

// Envía o actualiza el mensaje del reproductor
async function sendOrUpdateReproductor(guildId, channel, embed, buttons) {
  try {
    // Borra mensaje anterior si existe
    if (reproductorMessages.has(guildId)) {
      const { channelId, messageId } = reproductorMessages.get(guildId);
      if (channel.id === channelId) {
        try {
          const oldMsg = await channel.messages.fetch(messageId);
          if (oldMsg) await oldMsg.delete();
        } catch { /* puede que ya no exista */ }
      }
    }
    // Enviar nuevo
    const newMsg = await channel.send({ embeds: [embed], components: buttons });
    reproductorMessages.set(guildId, { channelId: channel.id, messageId: newMsg.id });
  } catch (err) {
    console.error("Error enviando el reproductor:", err);
  }
}

async function clearReproductorMessage(guildId) {
  const info = reproductorMessages.get(guildId);
  if (!info) return;
  reproductorMessages.delete(guildId);
  // Opcional: puedes intentar borrar el mensaje si quieres
}

module.exports = {
  sendOrUpdateReproductor,
  clearReproductorMessage,
};
