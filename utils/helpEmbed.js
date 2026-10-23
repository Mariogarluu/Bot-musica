// utils/helpEmbed.js
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function getHelpData(client, category = 'overview', user = null) {
  let embed = new EmbedBuilder();

  switch (category) {
    case 'music':
      embed
        .setColor(0x1DB954)
        .setTitle('🎵 Comandos de Música & Reproducción')
        .setDescription('Comandos disponibles para controlar la música en tus canales de voz:')
        .addFields(
          {
            name: '🎶 `/play <canción o url>`',
            value: 'Reproduce un audio de YouTube. Puedes introducir una **URL directa**, un enlace de **playlist** o simplemente el **título de la canción** para buscarla automáticamente.'
          },
          {
            name: '🔎 `/search <búsqueda>`',
            value: 'Busca los mejores resultados en YouTube y despliega un **menú interactivo** con duración, autor y miniaturas para elegir qué pista reproducir.'
          },
          {
            name: '📜 `/lyrics [cancion]`',
            value: 'Muestra la letra de la canción en reproducción actual o de la que especifiques con paginación interactiva y carátula.'
          },
          {
            name: '⏸️ `/pause`',
            value: 'Pausa momentáneamente la canción en reproducción sin perder la posición actual.'
          },
          {
            name: '▶️ `/resume`',
            value: 'Reanuda la canción previamente pausada.'
          },
          {
            name: '⏭️ `/skip`',
            value: 'Salta inmediatamente a la siguiente pista de la cola.'
          },
          {
            name: '🎛️ `/filter <tipo>`',
            value: 'Aplica filtros de audio en tiempo real con FFmpeg: **nightcore**, **vaporwave**, **bassboost**, **8d**, **radio** o **off** para desactivar.'
          },
          {
            name: '🌿 `/ambient`',
            value: 'Abre el menú interactivo de **sonidos relajantes en bucle** (lluvia, chimenea, cafetería, olas, bosque, ruido blanco) ideal para estudiar o descansar en modo focus.'
          },
          {
            name: '🎙️ `/dj [estado]`',
            value: 'Activa o desactiva el **Modo Locutor DJ** (TTS neuronal con la voz elegida en `/voice`). El bot presenta cada canción antes de reproducirse con estilo de radio.'
          },
          {
            name: '🗣️ `/voice [eleccion]`',
            value: 'Configura la **voz neuronal de IA** para el servidor (8 voces de España 🇪🇸, México 🇲🇽, Argentina 🇦🇷 y Colombia 🇨🇴). Si se ejecuta sin parámetros, abre un menú interactivo y reproduce una muestra de audio en llamada.'
          },
          {
            name: '📢 `/tts <mensaje>`',
            value: 'Lee en voz alta tu mensaje en el canal de voz usando Inteligencia Artificial. Si hay música sonando, **se pausa momentáneamente y se reanuda sola** al terminar el mensaje.'
          },
          {
            name: '⏹️ `/stop`',
            value: 'Detiene por completo la reproducción, vacía toda la cola y desconecta al bot del canal de voz.'
          }
        )
        .setFooter({ text: 'Consejo: También puedes controlar todo usando los botones del reproductor.' });
      break;

    case 'queue':
      embed
        .setColor(0x3B82F6)
        .setTitle('📜 Gestión de Cola de Reproducción')
        .setDescription('Herramientas para visualizar y organizar las canciones pendientes:')
        .addFields(
          {
            name: '📋 `/queue`',
            value: 'Abre el visualizador interactivo de la cola con **paginación**, duración total estimada y visualización de la pista actual.'
          },
          {
            name: '🔀 `/shuffle`',
            value: 'Mezcla aleatoriamente el orden de todas las canciones en espera en la cola, manteniendo la que está sonando actualmente.'
          }
        )
        .setFooter({ text: 'Puedes pulsar el botón "📋 Ver Cola" en el reproductor en cualquier momento.' });
      break;

    case 'games':
      embed
        .setColor(0xEF4444)
        .setTitle('🎲 Dinámicas de Servidor, Minijuegos & Soundboard')
        .setDescription('Herramientas interactivas, efectos y soundboard diseñados para llamadas de voz:')
        .addFields(
          {
            name: '🔊 `/soundboard`',
            value: 'Despliega la **botonera interactiva de memes y efectos** con paginación, pausa inteligente de música y botón `➕ Añadir`.'
          },
          {
            name: '➕ `/soundboard-add`',
            value: 'Añade un sonido personalizado subiendo un **archivo MP3/WAV arrastrado** o una URL directa, con emoji y color a tu elección.'
          },
          {
            name: '🗑️ `/soundboard-remove`',
            value: 'Abre un **menú interactivo** para seleccionar y eliminar sonidos personalizados del bot.'
          },
          {
            name: '🌐 `/soundboard-web`',
            value: 'Muestra el enlace directo al **Soundboard Studio Web**, un panel visual con drag & drop y vista previa de botones en vivo.'
          },
          {
            name: '🎲 `/ruleta [castigo: mute | susto]`',
            value: 'Inicia la **Ruleta Rusa de voz**. El tambor gira, apunta a los miembros presentes en la llamada y, si sale la bala (1 de 6 probabilidades), la víctima es silenciada durante **20 segundos** o asustada según el modo elegido.\n*Dispone de modo solitario para pruebas y detección inteligente de permisos de moderación.*'
          }
        )
        .setFooter({ text: 'Requiere estar en un canal de voz para poder participar.' });
      break;

    case 'buttons':
      embed
        .setColor(0x8B5CF6)
        .setTitle('🎛️ Guía de Controles del Reproductor')
        .setDescription('Cada vez que suena una canción, el bot genera un reproductor interactivo con controles rápidos:')
        .addFields(
          {
            name: '⏸️ / ▶️ Botón Play/Pausa',
            value: 'Alterna instantáneamente entre pausar y reanudar la pista sin necesidad de escribir comandos.',
            inline: true
          },
          {
            name: '⏭️ Botón Saltar',
            value: 'Avanza inmediatamente a la siguiente pista en cola.',
            inline: true
          },
          {
            name: '🔁 Botón Bucle',
            value: 'Activa o desactiva la repetición continua de la canción que suena actualmente.',
            inline: true
          },
          {
            name: '🔀 Botón Mezclar',
            value: 'Reordena la lista de reproducción al azar sin detener la música en curso.',
            inline: true
          },
          {
            name: '⏹️ Botón Parar',
            value: 'Apaga el reproductor, limpia la cola y desconecta el bot.',
            inline: true
          },
          {
            name: '📋 Botón Ver Cola',
            value: 'Muestra una ventana privada (efímera) con todas las canciones en espera.',
            inline: true
          }
        )
        .setFooter({ text: 'Los botones se actualizan en tiempo real según el estado de la reproducción.' });
      break;

    case 'info':
      const ping = client?.ws?.ping ?? 0;
      const uptimeSec = Math.floor(process.uptime());
      const hours = Math.floor(uptimeSec / 3600);
      const minutes = Math.floor((uptimeSec % 3600) / 60);
      const seconds = uptimeSec % 60;
      const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

      embed
        .setColor(0xEC4899)
        .setTitle('ℹ️ Información & Estado del Bot')
        .setDescription('Estadísticas en tiempo real del bot:')
        .addFields(
          { name: '📶 Latencia Ping', value: `\`${ping} ms\``, inline: true },
          { name: '⏱️ Tiempo Activo', value: `\`${uptimeStr}\``, inline: true },
          { name: '🌐 Servidores', value: `\`${client?.guilds?.cache?.size ?? 1}\``, inline: true },
          { name: '📦 Versión Discord.js', value: `\`v14.21.0\``, inline: true },
          { name: '⚙️ Entorno Node.js', value: `\`${process.version}\``, inline: true },
          { name: '🎧 Motor de Audio', value: `\`@discordjs/voice\``, inline: true }
        )
        .setFooter({ text: 'Bot de Música optimizado y actualizado' });
      break;

    case 'overview':
    default:
      embed
        .setColor(0x10B981)
        .setTitle('🎶 Centro de Ayuda & Opciones del Bot')
        .setDescription(
          `¡Hola! Soy tu **Bot de Música para Discord**. Puedo reproducir canciones individuales, listas completas de YouTube y permitirte gestionar la música mediante comandos o botones interactivos.\n\n` +
          `👉 **Usa el menú desplegable inferior** para explorar todas las opciones por categoría.`
        )
        .addFields(
          {
            name: '🚀 Inicio Rápido',
            value:
              '1. Únete a un canal de voz en tu servidor.\n' +
              '2. Escribe `/play <nombre o url>` para escuchar tu música.\n' +
              '3. Usa los botones del reproductor para pausar, saltar o activar el bucle.'
          },
          {
            name: '📚 Categorías Disponibles',
            value:
              '• 🎵 **Música & Locución**: `/play`, `/tts`, `/voice`, `/dj`, `/ambient`, `/search`, `/lyrics`, `/pause`, `/resume`, `/skip`, `/stop`\n' +
              '• 📜 **Gestión de Cola**: `/queue`, `/shuffle`\n' +
              '• 🔊 **Soundboard Studio**: `/soundboard`, `/soundboard-add`, `/soundboard-remove`, `/soundboard-web`\n' +
              '• 🎲 **Dinámicas & Minijuegos**: `/ruleta` (Ruleta Rusa de voz)\n' +
              '• 🎛️ **Controles Interactivos**: Guía de la botonera del reproductor\n' +
              '• ℹ️ **Información & Estado**: Ping, tiempo activo y estadísticas'
          }
        )
        .setFooter({
          text: `Solicitado por ${user?.username || 'Usuario'} • Selecciona una categoría abajo`,
          iconURL: user?.displayAvatarURL?.() || undefined
        });
      break;
  }

  // Menú desplegable para cambiar de categoría
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('help_category_select')
    .setPlaceholder('📂 Selecciona una categoría para ver sus opciones...')
    .addOptions([
      {
        label: 'Visión General',
        description: 'Introducción, inicio rápido y guía general',
        value: 'overview',
        emoji: '🏠',
        default: category === 'overview'
      },
      {
        label: 'Comandos de Música',
        description: 'Reproducir, buscar, pausar, saltar y detener',
        value: 'music',
        emoji: '🎵',
        default: category === 'music'
      },
      {
        label: 'Gestión de Cola',
        description: 'Ver la cola de espera y mezclar canciones',
        value: 'queue',
        emoji: '📜',
        default: category === 'queue'
      },
      {
        label: 'Dinámicas & Minijuegos',
        description: 'Ruleta Rusa de voz y juegos de comunidad',
        value: 'games',
        emoji: '🎲',
        default: category === 'games'
      },
      {
        label: 'Controles Interactivos',
        description: 'Explicación de los botones del reproductor',
        value: 'buttons',
        emoji: '🎛️',
        default: category === 'buttons'
      },
      {
        label: 'Información & Estado',
        description: 'Latencia, tiempo en línea y métricas del sistema',
        value: 'info',
        emoji: 'ℹ️',
        default: category === 'info'
      }
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  return { embed, components: [row] };
}

module.exports = { getHelpData };
