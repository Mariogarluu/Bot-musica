# 🎵 Bot-musica

Bot de música para Discord que permite reproducir canciones de YouTube en canales de voz. Desarrollado con Discord.js v14 y @discordjs/voice.

## ✨ Características

- 🎵 Reproducción de música desde YouTube por URL
- 🔎 Búsqueda de canciones en YouTube
- 📃 Sistema de cola de reproducción
- ⏸️ Pausar música
- ▶️ Reanudar reproducción
- ⏭️ Saltar canciones
- ⏹️ Detener reproducción y limpiar cola
- 🎨 Embeds bonitos con información de las canciones

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
     - ✅ Connect
     - ✅ Speak
     - ✅ Use Voice Activity
   - Copia la URL generada y ábrela en tu navegador
   - Selecciona tu servidor y autoriza el bot

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
   Bot is online!
   Logged in as TuBot#1234!
   ```

## 📝 Comandos Disponibles

| Comando | Descripción | Uso |
|---------|-------------|-----|
| `/play` | Reproduce una canción de YouTube por URL | `/play song:https://youtube.com/watch?v=...` |
| `/search` | Busca canciones en YouTube | `/search query:nombre de la canción` |
| `/queue` | Muestra la cola de canciones | `/queue` |
| `/pause` | Pausa la canción actual | `/pause` |
| `/resume` | Continúa la música pausada | `/resume` |
| `/skip` | Salta la canción actual | `/skip` |
| `/stop` | Detiene la música y limpia la cola | `/stop` |

## 💡 Ejemplos de Uso

1. **Reproducir una canción por URL**
   ```
   /play song:https://www.youtube.com/watch?v=dQw4w9WgXcQ
   ```

2. **Buscar una canción**
   ```
   /search query:despacito
   ```
   El bot te mostrará los 5 primeros resultados. Luego usa `/play` con la URL del video que quieras.

3. **Ver la cola**
   ```
   /queue
   ```

4. **Controlar la reproducción**
   ```
   /pause    # Pausar
   /resume   # Reanudar
   /skip     # Saltar canción
   /stop     # Detener todo
   ```

## 🛠️ Estructura del Proyecto

```
Bot-musica/
├── commands/          # Comandos slash del bot
│   ├── play.js       # Reproducir música
│   ├── search.js     # Buscar canciones
│   ├── queue.js      # Ver cola
│   ├── pause.js      # Pausar
│   ├── resume.js     # Reanudar
│   ├── skip.js       # Saltar
│   └── stop.js       # Detener
├── index.js          # Archivo principal del bot
├── player.js         # Lógica del reproductor de música
├── deploy-commands.js # Script para registrar comandos
├── package.json      # Dependencias
└── .env             # Variables de entorno (no incluido)
```

## 🔍 Solución de Problemas

### El bot no responde a los comandos
- Verifica que hayas ejecutado `node deploy-commands.js`
- Asegúrate de que el bot esté en línea (`node index.js`)
- Comprueba que el bot tenga los permisos necesarios en el servidor

### Error: "Debes unirte primero a un canal de voz"
- Únete a un canal de voz antes de usar `/play`

### Error al reproducir música
- Verifica que la URL sea de YouTube
- Asegúrate de que el video no sea privado o restringido por edad
- Comprueba tu conexión a internet

### El bot se desconecta del canal de voz
- Esto puede ser normal después de reproducir todas las canciones
- Usa `/play` para que vuelva a conectarse

### Error: "Cannot find module"
- Ejecuta `npm install` para instalar todas las dependencias

## 📦 Dependencias

- **discord.js** (^14.21.0) - Librería principal para Discord
- **@discordjs/voice** (^0.18.0) - Manejo de audio en Discord
- **@distube/ytdl-core** (^4.16.12) - Descargar audio de YouTube
- **yt-search** (^2.13.1) - Buscar videos en YouTube
- **dotenv** (^16.5.0) - Cargar variables de entorno
- **ffmpeg-static** (^5.2.0) - FFmpeg para procesamiento de audio

## 📄 Licencia

ISC

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si encuentras algún bug o tienes alguna sugerencia:

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## ⚠️ Advertencias

- Este bot está diseñado para uso personal y educativo
- Respeta los términos de servicio de YouTube
- No uses el bot para infringir derechos de autor
- El archivo `.env` nunca debe compartirse públicamente

## 👨‍💻 Autor

Mariogarluu

---

¿Necesitas ayuda? Abre un [issue](https://github.com/Mariogarluu/Bot-musica/issues) en GitHub.
