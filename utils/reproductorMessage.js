// utils/reproductorMessage.js
const reproductorMessages = new Map();

async function sendOrUpdateReproductor(guildId, interaction, song, queue, embed, buttons, preferEdit = false) {
  const prev = reproductorMessages.get(guildId);

  // 1. Intento de edición in-place si se prefiere y existe mensaje previo
  if (preferEdit && prev) {
    try {
      let channel = interaction.channel;
      if (!channel && interaction.client) {
        channel = await interaction.client.channels.fetch(prev.channelId);
      }
      if (channel) {
        const msg = await channel.messages.fetch(prev.messageId);
        if (msg) {
          await msg.edit({ embeds: [embed], components: buttons });
          return msg;
        }
      }
    } catch (e) {
      // Si la edición falla (ej: mensaje eliminado manualmente), pasamos a enviar uno nuevo
    }
  }

  // 2. Si no es edición o falló, borramos el mensaje previo si aún existe
  if (prev) {
    try {
      let channel = interaction.channel;
      if (!channel && interaction.client) {
        channel = await interaction.client.channels.fetch(prev.channelId);
      }
      if (channel) {
        const msg = await channel.messages.fetch(prev.messageId);
        if (msg) await msg.delete();
      }
    } catch (e) {}
  }

  // 3. Envío del nuevo reproductor
  let newMsg = null;
  try {
    let channel = interaction.channel;
    if (!channel && prev && interaction.client) {
      try {
        channel = await interaction.client.channels.fetch(prev.channelId);
      } catch {}
    }

    if (channel && typeof channel.send === 'function') {
      newMsg = await channel.send({ embeds: [embed], components: buttons });
    } else if (interaction.followUp) {
      newMsg = await interaction.followUp({ embeds: [embed], components: buttons, fetchReply: true });
    }
  } catch (err) {
    console.error('[reproductorMessage] Error enviando nuevo reproductor:', err?.message || err);
  }

  if (newMsg) {
    reproductorMessages.set(guildId, {
      messageId: newMsg.id,
      channelId: newMsg.channelId || newMsg.channel.id
    });
  }
  return newMsg;
}

function clearReproductorMessage(guildId) {
  reproductorMessages.delete(guildId);
}

function getReproductorMessage(guildId) {
  return reproductorMessages.get(guildId);
}

module.exports = { sendOrUpdateReproductor, clearReproductorMessage, getReproductorMessage };
