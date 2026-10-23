// commands/ruleta.js
const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const {
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus
} = require('@discordjs/voice');
const googleTTS = require('google-tts-api');
const { getPlayer } = require('../player');

/**
 * Reproduce un breve efecto sonoro vía TTS si el bot está conectado en el canal de voz
 * y no interrumpe ninguna canción en reproducción activa.
 * @param {string} guildId
 * @param {string} channelId
 * @param {boolean} isBang
 */
async function playVoiceEffect(guildId, channelId, isBang) {
  try {
    const connection = getVoiceConnection(guildId);
    if (!connection || connection.state.status !== VoiceConnectionStatus.Ready) return;
    if (connection.joinConfig?.channelId !== channelId) return;

    // Si hay un reproductor de música activo, no interrumpir la lista de canciones
    const player = getPlayer(guildId);
    if (player && (player.state.status === AudioPlayerStatus.Playing || player.state.status === AudioPlayerStatus.Buffering)) {
      return;
    }

    const text = isBang ? '¡Bang! ¡Disparo en la ruleta rusa!' : 'Click. Te has salvado.';
    const audioUrl = googleTTS.getAudioUrl(text, { lang: 'es', slow: false });
    const resource = createAudioResource(audioUrl);
    const soundPlayer = createAudioPlayer();

    soundPlayer.play(resource);
    connection.subscribe(soundPlayer);

    soundPlayer.on(AudioPlayerStatus.Idle, () => {
      try {
        soundPlayer.stop();
      } catch {}
    });

    soundPlayer.on('error', () => {
      try {
        soundPlayer.stop();
      } catch {}
    });
  } catch (err) {
    // Característica opcional: no debe interrumpir la respuesta del comando
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ruleta')
    .setDescription('🎲 Ruleta Rusa de voz: ¡Gira el tambor y desafía tu suerte en la llamada!')
    .addStringOption(option =>
      option
        .setName('castigo')
        .setDescription('Tipo de desenlace para la víctima si sale la bala')
        .setRequired(false)
        .addChoices(
          { name: '🔇 Silencio (Mute temporal en voz durante 20s)', value: 'mute' },
          { name: '👻 Susto (Mención y muerte humorística sin mute)', value: 'susto' }
        )
    ),

  async execute(interaction) {
    // 1. Validaciones previas
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ Este comando solo puede ser ejecutado dentro de un servidor.',
        ephemeral: true
      });
    }

    const voiceChannel = interaction.member?.voice?.channel;
    if (!voiceChannel) {
      const noVoiceEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('❌ Canal de Voz Requerido')
        .setDescription('Debes estar conectado a un canal de voz para poder retar a tus compañeros en la **Ruleta Rusa**.');
      return interaction.reply({ embeds: [noVoiceEmbed], ephemeral: true });
    }

    // Filtrar participantes (excluyendo bots)
    const members = voiceChannel.members.filter(m => !m.user.bot);
    if (members.size === 0) {
      const noMembersEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('❌ Sin Participantes')
        .setDescription('No hay usuarios humanos en el canal de voz para participar en la Ruleta Rusa.');
      return interaction.reply({ embeds: [noMembersEmbed], ephemeral: true });
    }

    const isSoloMode = members.size === 1;
    const castigo = interaction.options.getString('castigo') || 'mute';

    // Comprobación de permisos de moderación del bot en la guild
    const botMember = interaction.guild.members.me;
    const hasMutePerm = botMember?.permissions.has(PermissionFlagsBits.MuteMembers) || false;

    // 2. Notificación diferida para manejar la animación por pasos sin que caduque la interacción
    await interaction.deferReply();

    // -------------------- PASO 1: Girando el tambor --------------------
    let noticeText = '';
    if (isSoloMode) {
      noticeText += '\n\n🧪 *Modo Pruebas / Solitario*: ¡Estás jugando solo! El revólver apuntará hacia ti.';
    }
    if (castigo === 'mute' && !hasMutePerm) {
      noticeText += '\n\n⚠️ *Aviso de permisos*: El bot no posee el permiso `Silenciar Miembros`. Si sale la bala, el castigo será simulado con humor.';
    }

    const step1Embed = new EmbedBuilder()
      .setColor(0xF59E0B)
      .setTitle('🎲 Ruleta Rusa — Paso 1/3: Girando el tambor...')
      .setDescription(
        '🎲 **Girando el tambor del revólver...**\n\n' +
        'El cilindro de 6 recámaras gira a toda velocidad. Una única bala reposa en su interior.\n' +
        'El frío metal resuena en la sala mientras todos aguantan la respiración...' +
        noticeText
      )
      .setFooter({
        text: `Iniciado por ${interaction.user.username} • Modo: ${castigo === 'mute' ? 'Mute 20s' : 'Susto'}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [step1Embed] });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // -------------------- PASO 2: Apuntando a los miembros --------------------
    const step2Embed = new EmbedBuilder()
      .setColor(0xEA580C)
      .setTitle('🎯 Ruleta Rusa — Paso 2/3: Apuntando...')
      .setDescription(
        `🎯 **Apuntando a los miembros de \`${voiceChannel.name}\`...**\n\n` +
        `¡Clack! El tambor se detiene. El cañón apunta fijamente hacia los **${members.size}** miembro${members.size === 1 ? '' : 's'} en la llamada...\n\n` +
        '🤫 *El dedo acaricia lentamente el gatillo. La tensión se puede cortar con un cuchillo...*'
      )
      .setFooter({
        text: `Canal: ${voiceChannel.name} • 1 bala, 6 recámaras (16.6% riesgo)`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    await interaction.editReply({ embeds: [step2Embed] });
    await new Promise(resolve => setTimeout(resolve, 2000));

    // -------------------- PASO 3: Desenlace --------------------
    // Probabilidad real de ruleta rusa tradicional: 1 entre 6 (16.67%)
    const chamberFired = Math.floor(Math.random() * 6) === 0;

    // Caso A: La bala NO sale (¡CLICK! - Salvados)
    if (!chamberFired) {
      await playVoiceEffect(interaction.guildId, voiceChannel.id, false);

      const clickEmbed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('💨 *¡CLICK!* — ¡Todos se han salvado!')
        .setDescription(
          `*¡CLICK!* El martillo percutor golpeó una recámara totalmente vacía.\n\n` +
          `✨ **¡Nadie ha resultado herido!** Todos los miembros de \`${voiceChannel.name}\` respiran aliviados en esta ronda.\n\n` +
          `🎲 *La bala sigue esperando en el cilindro... ¿Quién tendrá la valentía de volver a probar su suerte?*`
        )
        .addFields(
          { name: '📍 Canal de Voz', value: `\`${voiceChannel.name}\``, inline: true },
          { name: '🎲 Resultado', value: '`Recámara Vacía (5/6)`', inline: true },
          { name: '👥 Participantes', value: `\`${members.size}\``, inline: true }
        )
        .setFooter({
          text: `Ronda finalizada • Ejecutada por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [clickEmbed] });
    }

    // Caso B: La bala SALE (¡¡¡BANG!!!)
    // Refrescar lista de miembros por si alguien salió en los últimos 4 segundos
    const freshMembers = voiceChannel.members.filter(m => !m.user.bot);
    const pool = freshMembers.size > 0 ? freshMembers : members;
    const victim = pool.random();

    // Reproducir efecto sonoro si el bot está en voz (opcional)
    await playVoiceEffect(interaction.guildId, voiceChannel.id, true);

    // B.1 Desenlace de 'susto' (sin mute)
    if (castigo === 'susto') {
      const scareEmbed = new EmbedBuilder()
        .setColor(0xB91C1C)
        .setTitle('💥 ¡¡¡BAAANG!!! — ¡QUÉ SUSTO!')
        .setDescription(
          `¡¡¡BOOOOOOM!!! ¡El revólver escupió fuego y la bala le pasó a milímetros a ${victim} (${victim.displayName})!\n\n` +
          `👻 **¡Ha sido un susto de muerte!** Para esta ronda no hay muteo, pero a ${victim} se le ha congelado el alma.\n\n` +
          `*Todos en \`${voiceChannel.name}\` pueden reírse a gusto de su cara de pánico.*`
        )
        .setThumbnail(victim.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🎯 Víctima del Susto', value: `${victim}`, inline: true },
          { name: '🎭 Modo', value: '`Susto (Sin Mute)`', inline: true },
          { name: '🎲 Probabilidad', value: '`1 de 6 (¡BANG!)`', inline: true }
        )
        .setFooter({
          text: `Ruleta Rusa • Iniciada por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [scareEmbed] });
    }

    // B.2 Desenlace de 'mute' (20 segundos)
    let muteSuccess = false;
    let humorousReason = null;

    if (!hasMutePerm) {
      humorousReason = 'El bot carece del permiso `Silenciar Miembros` (MuteMembers) en el servidor.';
    } else if (victim.id === interaction.guild.ownerId) {
      humorousReason = 'La víctima es el/la Dueño/a del Servidor (inmune al castigo de moderación).';
    } else if (botMember && victim.roles.highest.position >= botMember.roles.highest.position) {
      humorousReason = 'La víctima tiene un rol superior o igual al bot en la jerarquía de roles.';
    } else if (!victim.voice?.channelId) {
      humorousReason = 'La víctima se desconectó de la llamada instantes antes del impacto.';
    } else {
      try {
        await victim.voice.setMute(true, 'Ruleta Rusa: Mute temporal de 20 segundos');
        muteSuccess = true;

        // Desmuteo automático tras 20 segundos
        setTimeout(async () => {
          try {
            const memberToUnmute = await interaction.guild.members.fetch(victim.id).catch(() => null);
            if (memberToUnmute?.voice?.serverMute) {
              await memberToUnmute.voice.setMute(false, 'Ruleta Rusa: Fin del castigo de 20s');
            }
          } catch (unmuteError) {
            console.warn(`[Ruleta] No se pudo desmutear a ${victim.user.tag}:`, unmuteError.message);
          }
        }, 20000);
      } catch (err) {
        console.warn(`[Ruleta] Falló el mute sobre ${victim.user.tag}:`, err.message);
        humorousReason = `Discord denegó la moderación de voz (${err.message}).`;
      }
    }

    if (muteSuccess) {
      const bangMuteEmbed = new EmbedBuilder()
        .setColor(0xDC2626)
        .setTitle('💥 ¡¡¡BAAANG!!! — La bala encontró su destino')
        .setDescription(
          `¡¡¡BOOOOM!!! Un disparo atronador ha estallado en **${voiceChannel.name}**!\n\n` +
          `💀 **Víctima caída:** ${victim} (${victim.displayName})\n` +
          `🔇 **Castigo:** Silenciado/a en la llamada durante **20 segundos**.\n\n` +
          `⏱️ *El bot le devolverá el habla automáticamente tras 20 segundos. ¡Guarden un minuto de silencio por el caído!*`
        )
        .setThumbnail(victim.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🎯 Víctima', value: `${victim}`, inline: true },
          { name: '🔇 Castigo', value: '`Mute temporal (20s)`', inline: true },
          { name: '🎲 Probabilidad', value: '`1 de 6 (Impacto)`', inline: true }
        )
        .setFooter({
          text: `Ruleta Rusa • Iniciada por ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      return interaction.editReply({ embeds: [bangMuteEmbed] });
    }

    // Desenlace humorístico si el bot no pudo mutear
    const humorousDeathEmbed = new EmbedBuilder()
      .setColor(0xDC2626)
      .setTitle('💥 ¡¡¡BAAANG!!! — ¡Muerte Humorística!')
      .setDescription(
        `¡¡¡BOOOOM!!! La bala calibre 44 impactó de lleno en ${victim} (${victim.displayName})!\n\n` +
        `💀 **Veredicto:** ¡Ha caído desplomado/a en combate de forma dramática y teatral!\n\n` +
        `🎭 **Indulto Técnico:** *${humorousReason}*\n` +
        `Su micrófono sigue abierto para que pueda pronunciar sus últimas palabras, ¡pero su dignidad y honor han quedado pulverizados! 🪦`
      )
      .setThumbnail(victim.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🎯 Víctima', value: `${victim}`, inline: true },
        { name: '🪦 Estado', value: '`Eliminado/a simbólicamente`', inline: true },
        { name: '⚠️ Moderación', value: '`Mute simulado en texto`', inline: true }
      )
      .setFooter({
        text: `Ruleta Rusa • Iniciada por ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    return interaction.editReply({ embeds: [humorousDeathEmbed] });
  }
};
