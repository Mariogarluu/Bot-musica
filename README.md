# 🎵 Bot-musica

Bot de música profesional para Discord con reproductor interactivo en tiempo real, menús desplegables, miniaturas de alta calidad y gestión avanzada de cola. Desarrollado con Discord.js v14 y @discordjs/voice.

## ✨ Características y Visualización

- 🎛️ **Reproductor Interactivo en Tiempo Real**: Tarjeta visual con carátula de YouTube, duración, canal/artista, usuario que la solicitó y estado de la cola.
- 🔁 **Modo Bucle (Loop)**: Repetición continua de tu canción favorita con un solo clic.
- ⏯️ **Botonera Inteligente**: Botón dinámico `Play/Pausa`, `Saltar`, `Bucle`, `Mezclar`, `Parar` y `Ver Cola` sin necesidad de escribir comandos.
- 📖 **Comando `/help` Interactivo**: Panel de ayuda completo con menú desplegable por categorías (Música, Cola, Controles interactivos y Estado del sistema).
- 🔎 **Búsqueda Avanzada con `/search`**: Menú desplegable interactivo (`StringSelectMenu`) para elegir visualmente qué pista escuchar.
- 📃 **Cola Paginada con `/queue`**: Visualización de la pista actual, canciones siguientes, duración total estimada y botones de cambio de página `[◀️]` `[▶️]`.
- 🎵 **Búsqueda Directa en `/play`**: Acepta tanto URLs directas de YouTube como nombres o palabras clave (ej: `/play despacito`).
- 🟢 **Presencia Dinámica**: Muestra actividad en rotación en Discord indicando `/help`, `/play` y el número de servidores conectados.

## 📋 Requisitos Previos

- [Node.js](https://nodejs.org/) v16.9.0 o superior
- [npm](https://www.npmjs.com/) (incluido con Node.js)
- Una cuenta de Discord
- FFmpeg (instalado automáticamente con ffmpeg-static)

## 🔧 Instalación

1. **Clona el repositorio**
   ```bash
   git clone https://github.com/Mariogarluu/Bot-musica.git
   cd Bot-musica
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Crea un archivo `.env`**
   
   Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:
   ```env
   DISCORD_TOKEN=tu_token_del_bot
   CLIENT_ID=tu_client_id
   GUILD_ID=tu_guild_id_de_prueba
   ```

   > **⚠️ IMPORTANTE**: Nunca subas el archivo `.env` a GitHub. Ya está incluido en `.gitignore`.

## 🤖 Configuración del Bot en Discord

1. **Crea una aplicación en Discord**
   - Ve al [Portal de Desarrolladores de Discord](https://discord.com/developers/applications)
   - Haz clic en "New Application"
   - Dale un nombre a tu bot

2. **Obtén el Token del Bot**
   - En la sección "Bot", haz clic en "Add Bot"
   - Copia el token y pégalo en tu archivo `.env` como `DISCORD_TOKEN`

3. **Obtén el Client ID**
   - En la sección "General Information"
   - Copia el "Application ID" y pégalo en tu archivo `.env` como `CLIENT_ID`

4. **Habilita los Intents necesarios**
   - En la sección "Bot"
   - Activa los siguientes Privileged Gateway Intents:
     - ✅ Presence Intent
     - ✅ Server Members Intent
     - ✅ Message Content Intent

5. **Invita el bot a tu servidor**
   - Ve a la sección "OAuth2" → "URL Generator"
   - Selecciona los scopes:
     - ✅ `bot`
     - ✅ `applications.commands`
   - Selecciona los permisos:
     - ✅ Send Messages
     - ✅ Embed Links
     - ✅ Connect
     - ✅ Speak
     - ✅ Use Voice Activity
   - Copia la URL generada y ábrela en tu navegador para autorizarlo en tu servidor.

6. **Obtén el Guild ID**
   - En Discord, activa el Modo Desarrollador (Ajustes → Avanzado → Modo Desarrollador)
   - Haz clic derecho en tu servidor y selecciona "Copiar ID"
   - Pégalo en tu archivo `.env` como `GUILD_ID`

## 🚀 Uso

1. **Registra los comandos slash**
   ```bash
   node deploy-commands.js
   ```
   
   Deberías ver: `✅ Slash commands deployed successfully!`

2. **Inicia el bot**
   ```bash
   node index.js
   ```
   
   Deberías ver:
   ```
   ✅ Conectado como TuBot#1234!
   🚀 Bot de música iniciado y listo.
   ```

## 📝 Comandos Disponibles

| Comando | Descripción | Ejemplo de Uso |
|---------|-------------|----------------|
| `/help` | Panel interactivo de ayuda con menú desplegable de categorías | `/help` o `/help categoria:🎵 Comandos de Música` |
| `/play` | Reproduce una canción por URL o por búsqueda de texto | `/play song:Bohemian Rhapsody` o `/play song:https://...` |
| `/search`| Busca en YouTube y muestra un menú desplegable interactivo | `/search query:Imagine Dragons` |
| `/queue`| Muestra la cola con paginación interactiva `[◀️] [▶️]` | `/queue` |
| `/pause`| Pausa la canción actual | `/pause` |
| `/resume`| Reanuda la reproducción pausada | `/resume` |
| `/skip` | Salta la canción actual a la siguiente | `/skip` |
| `/shuffle`| Mezcla aleatoriamente las canciones en espera de la cola | `/shuffle` |
| `/stop` | Detiene la música, vacía la cola y sale del canal | `/stop` |

## 🎛️ Controles del Reproductor Interactivo

Cada vez que suena una canción, el bot despliega una tarjeta con los siguientes botones:

- **⏸️ / ▶️ Play/Pausa**: Alterna el estado de reproducción instantáneamente.
- **⏭️ Saltar**: Pasa inmediatamente a la siguiente pista.
- **🔁 Bucle**: Activa/desactiva la repetición continua de la canción actual.
- **🔀 Mezclar**: Reordena al azar las canciones en espera.
- **⏹️ Parar**: Apaga la música y desconecta el bot.
- **📋 Ver Cola**: Abre una ventana privada para ver el orden de espera sin saturar el canal.
- **❓ Ayuda & Opciones**: Abre el panel de ayuda y configuración.

## 🛠️ Estructura del Proyecto

```
Bot-musica/
├── commands/               # Comandos slash del bot
│   ├── help.js            # Guía interactiva de opciones y comandos
│   ├── play.js            # Reproducción inteligente (URL / Búsqueda)
│   ├── search.js          # Búsqueda con Select Menu interactivo
│   ├── queue.js           # Cola con paginación
│   ├── pause.js           # Pausa con embed estilizado
│   ├── resume.js          # Reanudar con embed estilizado
│   ├── skip.js            # Saltar canción
│   ├── shuffle.js         # Mezclar cola
│   └── stop.js            # Detener y limpiar
├── utils/
│   ├── helpEmbed.js       # Generador de embeds y menús de ayuda
│   ├── queueEmbed.js      # Generador de cola interactiva y paginada
│   ├── reproductorEmbed.js # Tarjeta visual del reproductor y botones
│   └── reproductorMessage.js # Gestor de actualización in-place de mensajes
├── index.js               # Punto de entrada, presencia y gestor de eventos
├── player.js              # Lógica de audio, cola, loops y streams
├── deploy-commands.js      # Registro de comandos slash en Discord
├── package.json           # Dependencias y configuración
└── .env                  # Variables de entorno (no incluido)
```

## 👨‍💻 Autor

Mariogarluu
