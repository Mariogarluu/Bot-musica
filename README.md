# 🎵 Discord Music Bot

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Discord.js-v14.21.0-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord.js" />
  <img src="https://img.shields.io/badge/Audio%20Engine-@distube/ytdl--core-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube" />
  <img src="https://img.shields.io/badge/Spotify-Support-1DB954?style=for-the-badge&logo=spotify&logoColor=white" alt="Spotify" />
  <img src="https://img.shields.io/badge/Process%20Manager-PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white" alt="PM2" />
  <img src="https://img.shields.io/badge/License-ISC-blue?style=for-the-badge" alt="License" />
</p>

<p align="center">
  Bot de música profesional para Discord de alto rendimiento, con <b>reproductor interactivo en tiempo real</b>, soporte para <b>YouTube y Spotify</b> (canciones, álbumes y playlists), controles táctiles mediante botones, menús desplegables, cola paginada y preparado para ejecutarse <b>24/7 en segundo plano con PM2</b> en tu propio ordenador.
</p>

---

## 📑 Tabla de Contenidos

1. [Características Destacadas](#-características-destacadas)
2. [Requisitos del Sistema](#-requisitos-del-sistema)
3. [Instalación Rápida](#-instalación-rápida)
4. [Configuración en Discord Developer Portal](#-configuración-en-discord-developer-portal)
5. [Variables de Entorno (.env)](#-variables-de-entorno-env)
6. [Puesta en Marcha](#-puesta-en-marcha)
7. [Comandos Disponibles](#-comandos-disponibles)
8. [Panel Interactivo y Controles](#-panel-interactivo-y-controles)
9. [Ejecución 24/7 en Segundo Plano con PM2](#-ejecución-247-en-segundo-plano-con-pm2)
10. [Estructura del Proyecto](#-estructura-del-proyecto)
11. [Solución de Problemas (FAQ)](#-solución-de-problemas-faq)
12. [Autor y Licencia](#-autor-y-licencia)

---

## ✨ Características Destacadas

- 🟢 **Soporte Multiplataforma Completo**:
  - **Spotify**: Pistas individuales, álbumes completos y playlists públicas (resolución automática a audio de alta calidad).
  - **YouTube**: Búsquedas por palabras clave, URLs directas (`watch?v=`), enlaces cortos (`youtu.be`), YouTube Shorts y playlists completas.
- 🎛️ **Tarjeta Visual del Reproductor (In-Place Updates)**:
  - Embed interactivo con carátula de alta resolución, nombre del canal/artista, usuario que solicitó la canción y barra de duración.
  - Colores dinámicos adaptativos según el estado:
    - 🟢 **Verde (#1DB954)**: Reproduciendo activamente.
    - 🟠 **Ámbar (#F59E0B)**: Canción pausada.
    - 🟣 **Violeta (#8B5CF6)**: Modo bucle (Loop) activo.
  - **Cero saturación de chat**: Las acciones de pausa, reanudar o bucle actualizan el mensaje original en lugar de enviar mensajes nuevos.
- ⏯️ **Botonera de Control Táctil**:
  - Controla la música (`Play/Pausa`, `Saltar`, `Bucle`, `Mezclar`, `Parar`, `Ver Cola` y `Ayuda`) con un solo clic.
- 📜 **Cola Paginada e Inteligente (`/queue`)**:
  - Sistema de paginación interactivo con botones `[◀️]` y `[▶️]`.
  - Duración total acumulada estimada y pista en reproducción actual.
  - Accesible como comando público o como ventana efímera privada desde el reproductor.
- 🔎 **Búsqueda Avanzada con Menú Desplegable (`/search`)**:
  - Explora resultados de YouTube mediante un selector interactivo (`StringSelectMenu`) mostrando título, duración y canal.
- 📜 **Letras Sincronizadas y Paginadas (`/lyrics`)**:
  - Detecta automáticamente la canción en reproducción en `queue[0]` o busca cualquier título indicado en el parámetro opcional `cancion`.
  - Limpia títulos de YouTube retirando coletillas comunes (`(Official Video)`, `[Videoclip]`, `HD`, `4K`, etc.).
  - Consulta la API abierta de LRCLIB e integra paginación interactiva con botones (`⬅️ Anterior`, `Página X/Y`, `Siguiente ➡️`) cuando la letra excede los 3500 caracteres.
- 🎙️ **Modo Locutor DJ con Síntesis de Voz (`/dj`)**:
  - Presenta cada canción antes de reproducirse emulando a un locutor de radio en directo utilizando Google Text-to-Speech (`es`).
  - Generación dinámica de frases variadas con mención al usuario que solicitó el tema y limpieza inteligente de coletillas del título.
  - Transición automática a la canción real tras el evento `AudioPlayerStatus.Idle` del locutor y protección total ante caídas de red.
- 🌿 **Modo Ambiente & Concentración (`/ambient`)**:
  - Menú desplegable interactivo (`StringSelectMenu`) con 6 presets relajantes de bucle infinito (Lluvia y truenos, Chimenea crepitante, Cafetería acogedora, Olas del océano, Bosque al atardecer y Ruido blanco / Brown noise).
  - Vaciado automático de cola, forzado de bucle (`loop: true`) y botón de parada rápida (`⏹️ Detener Ambiente`).
- 🎲 **Minijuego de Ruleta Rusa de Voz (`/ruleta`)**:
  - Dinámica interactiva de ruleta rusa con animación en 3 pasos (giro del tambor, apuntado y desenlace).
  - 1/6 probabilidades de disparo, selección de víctima aleatoria en el canal de voz y castigo configurable (`mute` temporal de 20s con desmuteo automático, o `susto`).
  - Detección inteligente de permisos (`MuteMembers`), jerarquía de roles y modo solitario para pruebas.
- 📖 **Comando `/help` Categorizado**:
  - Guía visual interactiva con filtro desplegable por categorías (Música, Cola, Controles interactivos, Sistema).
- ⚙️ **Optimizado para Ejecución Continua con PM2**:
  - Mantiene el bot activo 24/7 en segundo plano en tu equipo sin necesidad de tener ventanas de terminal abiertas.
  - Reinicio automático inmediato si ocurre alguna excepción o fallo inesperado.
  - Servidor HTTP ligero interno en el puerto `3000` (o `$PORT`) para comprobar el estado del servicio en cualquier momento.
- 🟢 **Presencia Dinámica**:
  - Rota automáticamente el estado de actividad del bot en Discord cada 45 segundos, indicando comandos y número de servidores conectados.

---

## 📋 Requisitos del Sistema

- **[Node.js](https://nodejs.org/)**: v18.0.0 o superior (recomendado v20 LTS).
- **[npm](https://www.npmjs.com/)**: v9.0.0 o superior (incluido con Node.js).
- **FFmpeg & Opus**: Gestionados automáticamente mediante los paquetes `@discordjs/opus` y `ffmpeg-static`.
- Una aplicación registrada en el **[Discord Developer Portal](https://discord.com/developers/applications)**.

---

## 🔧 Instalación Rápida

1. **Clonar el repositorio**:
   ```bash
   git clone https://github.com/Mariogarluu/Bot-musica.git
   cd Bot-musica
   ```

2. **Instalar dependencias**:
   ```bash
   npm install
   ```

3. **Crear archivo de configuración**:
   Copia el archivo de ejemplo [.env.example](.env.example) a `.env`:
   ```bash
   # En Windows PowerShell:
   Copy-Item .env.example .env

   # En Linux / macOS / Bash:
   cp .env.example .env
   ```

---

## 🤖 Configuración en Discord Developer Portal

Para que el bot pueda conectarse, reproducir sonido y responder a comandos:

1. Ve a [Discord Developer Portal](https://discord.com/developers/applications) y crea una aplicación (**New Application**).
2. **Obtener el Token**:
   - En el menú lateral izquierdo, ve a **Bot**.
   - Pulsa en **Reset Token**, copia el valor y pégalo en tu archivo `.env` como `DISCORD_TOKEN`.
3. **Activar Gateway Intents**:
   - En la misma pestaña **Bot**, baja a **Privileged Gateway Intents** y activa:
     - ✅ **Presence Intent**
     - ✅ **Server Members Intent**
     - ✅ **Message Content Intent**
   - Guarda los cambios (**Save Changes**).
4. **Obtener el Client ID**:
   - Ve a **General Information**, copia el **Application ID** y asígnalo en `.env` como `CLIENT_ID`.
5. **Obtener el Guild ID (Servidor de pruebas)**:
   - En Discord, activa el Modo Desarrollador (*Ajustes de Usuario -> Avanzado -> Modo Desarrollador*).
   - Haz clic derecho sobre el icono de tu servidor y selecciona **Copiar ID**.
   - Pégalo en tu `.env` como `GUILD_ID`.
6. **Invitar el Bot a tu Servidor**:
   - En el portal, ve a **OAuth2** -> **URL Generator**.
   - Selecciona los **Scopes**:
     - `bot`
     - `applications.commands`
   - Selecciona los **Bot Permissions**:
     - `Send Messages`
     - `Embed Links`
     - `Attach Files`
     - `Read Message History`
     - `Connect`
     - `Speak`
     - `Use Voice Activity`
   - Copia la URL generada en la parte inferior, ábrela en tu navegador y autoriza al bot en tu servidor.

---

## 🔐 Variables de Entorno (.env)

Crea y edita el archivo `.env` en la raíz del proyecto:

```env
# ==========================================
# 🎵 Variables de Entorno - Discord Music Bot
# ==========================================

# Obligatorio: Token del bot obtenido en el Discord Developer Portal
DISCORD_TOKEN=OTk5OTk5OTk5OTk5...

# Obligatorio: ID de la aplicación (Application ID)
CLIENT_ID=123456789012345678

# Obligatorio: ID del servidor para registro instantáneo de comandos Slash
GUILD_ID=876543210987654321

# Opcional: Puerto HTTP para el servidor de estado interno (por defecto: 3000)
PORT=3000

# Opcional: Cookie de sesión de YouTube (útil si YouTube solicita comprobaciones)
# YT_COOKIE="CONSENT=YES+...; PREF=...; SID=..."
```

> [!WARNING]
> Nunca compartas ni subas tu archivo `.env` a repositorios públicos de GitHub. Está excluido de forma segura mediante el archivo `.gitignore`.

---

## 🚀 Puesta en Marcha

### 1. Registrar los comandos Slash
Antes de arrancar el bot por primera vez, o tras modificar algún comando, registra las barras diagonales:

```bash
npm run deploy
```
*Salida esperada:*
```text
🔄 Refreshing slash commands...
✅ Slash commands deployed successfully!
```

> [!TIP]
> Por defecto, `deploy-commands.js` registra los comandos en el servidor especificado en `GUILD_ID`, lo que hace que aparezcan de forma **inmediata**. Si deseas registrarlos de manera global en todos los servidores donde esté el bot, usa `Routes.applicationCommands(CLIENT_ID)` (puede tardar hasta 1 hora en propagarse por los servidores de Discord).

### 2. Iniciar el bot en desarrollo
Para comprobar que todo funciona correctamente en la consola:

```bash
npm start
```
*(O de forma directa con `node index.js`). Deberías ver:*
```text
🌐 Servidor HTTP activo en el puerto 3000
✅ Conectado como TuBot#1234!
🚀 Bot de música iniciado y listo.
```

---

## 📝 Comandos Disponibles

Todos los comandos se ejecutan mediante las interacciones nativas **Slash Commands** (`/`):

| Comando | Parámetros | Descripción | Ejemplo de Uso |
|:---|:---|:---|:---|
| `/play` | `song` *(requerido)* | Reproduce una pista o playlist de **YouTube** o **Spotify**, o busca por texto | `/play song: Bohemian Rhapsody`<br>`/play song: https://open.spotify.com/playlist/...`<br>`/play song: https://youtu.be/...` |
| `/filter` | `tipo` *(requerido)* | Aplica filtros de audio en tiempo real con FFmpeg (**nightcore**, **vaporwave**, **bassboost**, **8d**, **radio**, **off**) | `/filter tipo: ⚡ Nightcore`<br>`/filter tipo: 🌊 Vaporwave`<br>`/filter tipo: ❌ Desactivar / Off` |
| `/dj` | `estado` *(opcional: true/false)* | Activa o desactiva el **Modo Locutor DJ** (TTS en español) que presenta canciones con estilo de radio | `/dj`<br>`/dj estado: True`<br>`/dj estado: False` |
| `/voice` | `eleccion` *(opcional)* | Abre el selector interactivo o configura la **voz neuronal de IA** del servidor (Álvaro, Elvira, Jorge, Dalia, Tomás, Elena, Gonzalo, Salomé, Guy, Aria) | `/voice`<br>`/voice eleccion: 🇲🇽 Jorge` |
| `/tts` | `mensaje` *(requerido)* | Lee en voz alta un texto en tu canal de voz con la **voz de IA** activa del servidor | `/tts mensaje: Hola a todos los presentes` |
| `/ambient` | *Ninguno* | Abre el **menú interactivo de audio ambiental en bucle** (Focus / Study Mode) | `/ambient` |
| `/search` | `query` *(requerido)* | Busca los mejores resultados en YouTube y abre un **menú interactivo** para elegir | `/search query: Imagine Dragons Bones` |
| `/lyrics` | `cancion` *(opcional)* | Muestra la letra de la canción actual o de la que busques con **paginación interactiva** | `/lyrics`<br>`/lyrics cancion: Coldplay - Viva La Vida` |
| `/queue` | *Ninguno* | Muestra la cola de reproducción con **paginación interactiva** `[◀️]` `[▶️]` | `/queue` |
| `/pause` | *Ninguno* | Pausa la canción que está sonando actualmente | `/pause` |
| `/resume` | *Ninguno* | Reanuda la reproducción pausada | `/resume` |
| `/skip` | *Ninguno* | Salta la pista actual y pasa a la siguiente en espera | `/skip` |
| `/shuffle` | *Ninguno* | Reordena aleatoriamente todas las canciones en espera de la cola | `/shuffle` |
| `/stop` | *Ninguno* | Detiene la música, vacía la lista y desconecta el bot del canal de voz | `/stop` |
| `/ruleta` | `castigo` *(opcional: mute, susto)* | Inicia la **Ruleta Rusa de voz** (animación en 3 pasos, riesgo 1/6, mute temporal o susto) | `/ruleta`<br>`/ruleta castigo: 🔇 Mute`<br>`/ruleta castigo: 👻 Susto` |
| `/soundboard` | *Ninguno* | Abre la **botonera interactiva de efectos de sonido y memes** con paginación, pausa inteligente de música y botón `➕ Añadir` | `/soundboard` |
| `/soundboard-add` | `nombre`, `archivo` *(opc)*, `url` *(opc)*, `emoji` *(opc)*, `color` *(opc)* | **Añade un sonido al soundboard** arrastrando un archivo de audio directamente a Discord o indicando una URL, con vista previa | `/soundboard-add nombre: Taco Bell emoji: 🔔`<br>`/soundboard-add nombre: GigaChad archivo: [audio.mp3]` |
| `/soundboard-remove` | *Ninguno* | Abre un **menú interactivo para borrar** sonidos personalizados del bot | `/soundboard-remove` |
| `/soundboard-web` | *Ninguno* | Abre el enlace al **Soundboard Studio Web** (`http://localhost:3000/soundboard`) con Drag & Drop y vista previa en tiempo real | `/soundboard-web` |
| `/help` | `categoria` *(opcional)* | Abre el manual interactivo categorizado del bot | `/help`<br>`/help categoria: 🎵 Comandos de Música` |

---

## 🎛️ Panel Interactivo y Controles

Cada vez que una canción comienza a sonar, el bot envía una tarjeta enriquecida con controles en botones:

```
+-----------------------------------------------------------+
|  🎵 Reproduciendo Ahora                                   |
|  Queen – Bohemian Rhapsody (Official Video)               |
|                                                           |
|  🔘▬▬▬▬▬▬▬▬▬▬▬▬▬▬ 5:55                                     |
|                                                           |
|  ⏱️ Duración: 5:55  👤 Artista: Queen  🙋 Pedido por: Mario|
+-----------------------------------------------------------+
| [ ⏸️ Pausa ] [ ⏭️ Saltar ] [ 🔁 Bucle ] [ 🔀 Mezclar ]     |
| [ ⏹️ Parar ] [ 📋 Ver Cola ] [ ❓ Ayuda & Opciones ]        |
+-----------------------------------------------------------+
```

### Funciones de los Botones:
- ⏸️ / ▶️ **Play / Pausa**: Alterna el estado de reproducción. Cambia dinámicamente el color del embed a ámbar o verde.
- ⏭️ **Saltar (Skip)**: Finaliza la pista actual y reproduce inmediatamente la siguiente.
- 🔁 **Modo Bucle (Loop)**: Repite de forma indefinida la canción actual. Cambia el embed a color púrpura.
- 🔀 **Mezclar (Shuffle)**: Baraja las canciones pendientes en la cola manteniendo la actual intacta.
- ⏹️ **Detener (Stop)**: Desconecta el bot del canal de voz y limpia la cola de reproducción.
- 📋 **Ver Cola**: Muestra una respuesta privada y paginada con la lista de espera para no saturar el canal de texto.
- ❓ **Ayuda & Opciones**: Despliega el menú de ayuda y comandos en una respuesta efímera interactiva.

---

## 🔄 Ejecución 24/7 en Segundo Plano con PM2

Para tener el bot funcionando de forma continua en tu propio ordenador sin necesidad de mantener una ventana de PowerShell o terminal abierta, se utiliza **[PM2](https://pm2.keymetrics.io/)**, un administrador de procesos para Node.js.

### 1. Instalar PM2 globalmente
Abre tu terminal o PowerShell y ejecuta:

```bash
npm install -g pm2
```

### 2. Iniciar el bot con PM2
Desde la carpeta raíz del proyecto (`Bot-musica`), ejecuta:

```bash
pm2 start index.js --name "bot-musica"
```

O si prefieres utilizar el script configurado con el optimizador de memoria:
```bash
pm2 start npm --name "bot-musica" -- start
```

### 3. Comandos útiles de PM2

| Acción | Comando |
|:---|:---|
| **Ver estado del bot** | `pm2 status` |
| **Ver logs en tiempo real** | `pm2 logs bot-musica` |
| **Reiniciar el bot** | `pm2 restart bot-musica` |
| **Detener el bot temporalmente** | `pm2 stop bot-musica` |
| **Eliminar el proceso de PM2** | `pm2 delete bot-musica` |

### 4. Iniciar automáticamente al encender el ordenador (Opcional)

Si utilizas **Windows** y quieres que el bot arranque automáticamente al encender tu PC:

1. Instala el módulo de servicio de Windows para PM2:
   ```bash
   npm install pm2-windows-startup -g
   ```
2. Configura el inicio automático:
   ```bash
   pm2-startup install
   ```
3. Guarda la lista actual de procesos para que se restauren al reiniciar:
   ```bash
   pm2 save
   ```

*(En Linux / macOS basta con ejecutar `pm2 startup` y seguir la instrucción que aparece en pantalla, seguido de `pm2 save`).*

---

## 🛠️ Estructura del Proyecto

```text
Bot-musica/
├── assets/                     # Recursos locales del bot
│   └── sounds/                # Efectos de audio en MP3 para el Soundboard
├── commands/                   # Comandos Slash modulares
│   ├── ambient.js             # Modo ambiente / Focus Mode con selector
│   ├── dj.js                  # Modo Locutor DJ con Text-to-Speech
│   ├── filter.js              # Filtros de audio en tiempo real con FFmpeg
│   ├── help.js                # Comando /help con selector de categorías
│   ├── lyrics.js              # Buscador y paginador de letras de canciones
│   ├── pause.js               # Comando /pause para pausar el reproductor
│   ├── play.js                # Manejo de reproducción (YouTube, Spotify, Playlists)
│   ├── queue.js               # Visualizador de cola con paginación
│   ├── resume.js              # Comando /resume para continuar reproducción
│   ├── ruleta.js              # Minijuego de Ruleta Rusa de voz
│   ├── search.js              # Búsqueda en YouTube con menú desplegable
│   ├── shuffle.js             # Mezclador aleatorio de cola
│   ├── skip.js                # Salto de pistas
│   ├── soundboard-add.js      # Añadir sonidos al soundboard (archivo o URL)
│   ├── soundboard-remove.js   # Borrar sonidos personalizados
│   ├── soundboard-web.js      # Acceso al estudio web de soundboard
│   ├── soundboard.js          # Botonera interactiva de memes y efectos de sonido
│   ├── stop.js                # Detención, vaciado y desconexión
│   ├── tts.js                 # Locución Text-to-Speech con voces de IA
│   └── voice.js               # Selector de voces neuronales de IA
├── data/                      # Persistencia de sonidos personalizados
├── utils/                     # Utilidades y generadores de UI
│   ├── ambientStreams.js      # Presets de audio relajante en bucle
│   ├── helpEmbed.js           # Generación de embeds y menús de ayuda
│   ├── queueEmbed.js          # Formateador de colas paginadas y botones
│   ├── reproductorEmbed.js    # Embed reactivo del reproductor de audio
│   ├── reproductorMessage.js  # Gestor de actualización in-place (anti-spam)
│   ├── soundEffects.js        # Catálogo de sonidos y mapeo para soundboard
│   ├── soundboardWeb.js       # Interfaz web y API REST para soundboard
│   └── ttsProvider.js         # Motor neuronal de voces de IA y fallback
├── .env.example               # Plantilla de variables de entorno
├── deploy-commands.js         # Script de registro de comandos Slash en Discord REST
├── index.js                   # Punto de entrada, listeners, servidor HTTP y presencia
├── player.js                  # Motor de audio (@discordjs/voice, streams, filtros y colas)
├── package.json               # Dependencias, scripts y optimizaciones de memoria
└── README.md                  # Documentación del proyecto
```

---

## ❓ Solución de Problemas (FAQ)

### 1. ¿El bot se une al canal pero no reproduce ningún sonido?
- Asegúrate de que el bot tenga los permisos **Connect** y **Speak** en el canal de voz específico.
- Verifica que el canal de voz no tenga un límite de usuarios lleno.
- Revisa que las dependencias de audio nativas se hayan compilado correctamente (`@discordjs/opus` y `ffmpeg-static`). En caso necesario ejecuta `npm rebuild`.

### 2. Error de YouTube: `Sign in to confirm you're not a bot` o `Status code: 429`
Si YouTube solicita verificación por exceso de peticiones o restricciones de edad:
- Instala una extensión como *Get cookies.txt LOCALLY* en tu navegador con sesión iniciada en YouTube.
- Exporta tu cookie de YouTube.
- Añade la variable `YT_COOKIE` a tu archivo `.env`:
  ```env
  YT_COOKIE="CONSENT=YES+...; PREF=...; SID=..."
  ```
- Reinicia el proceso con `pm2 restart bot-musica`.

### 3. Los comandos Slash (`/play`, `/help`, etc.) no aparecen en Discord
- Ejecuta manualmente el script de registro:
  ```bash
  npm run deploy
  ```
- Si estás probando en un servidor específico, comprueba que la variable `GUILD_ID` en el archivo `.env` coincide exactamente con el ID de dicho servidor.

### 4. ¿Cómo veo si el bot tuvo algún error mientras corría en segundo plano?
Ejecuta en tu terminal:
```bash
pm2 logs bot-musica --lines 50
```
Esto mostrará las últimas 50 líneas de registro de consola de la ejecución del bot.

---

## 👨‍💻 Autor y Licencia

Desarrollado con ❤️ por **[Mariogarluu](https://github.com/Mariogarluu)**.

Este proyecto está bajo la Licencia **ISC**. Puedes utilizarlo, modificarlo y distribuirlo libremente para tus propios proyectos personales o comunitarios.
