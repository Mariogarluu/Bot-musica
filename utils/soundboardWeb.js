// utils/soundboardWeb.js
const fs = require('fs');
const path = require('path');
const {
  getAllSoundEffects,
  getSoundEffect,
  addCustomSound,
  removeCustomSound,
  getSoundPathOrUrl
} = require('./soundEffects');

/**
 * Genera la página HTML del Soundboard Studio Dashboard.
 */
function getDashboardHtml(sounds) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Soundboard Studio • Discord Bot</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%22%2232%22><text y=%2224%22 font-size=%2224%22>🔊</text></svg>">
  <style>
    :root {
      --bg-darker: #1e1f22;
      --bg-dark: #2b2d31;
      --bg-light: #313338;
      --bg-hover: #383a40;
      --blurple: #5865f2;
      --blurple-hover: #4752c4;
      --green: #23a55a;
      --green-hover: #1f9250;
      --red: #f23f43;
      --red-hover: #da373b;
      --grey: #4e5058;
      --grey-hover: #6d6f78;
      --text-normal: #dbdee1;
      --text-muted: #949ba4;
      --text-header: #f2f3f5;
      --border-color: rgba(255, 255, 255, 0.08);
      --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-darker);
      color: var(--text-normal);
      font-family: var(--font-family);
      line-height: 1.5;
      padding-bottom: 60px;
    }

    header {
      background-color: var(--bg-dark);
      border-bottom: 1px solid var(--border-color);
      padding: 16px 28px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(8px);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .brand-icon {
      font-size: 28px;
      background: rgba(88, 101, 242, 0.15);
      border-radius: 12px;
      padding: 6px 10px;
      display: inline-block;
    }

    .brand h1 {
      font-size: 20px;
      color: var(--text-header);
      font-weight: 700;
    }

    .brand p {
      font-size: 13px;
      color: var(--text-muted);
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: rgba(35, 165, 90, 0.15);
      color: #57f287;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      background-color: #57f287;
      border-radius: 50%;
      box-shadow: 0 0 8px #57f287;
    }

    .container {
      max-width: 1200px;
      margin: 32px auto;
      padding: 0 20px;
      display: grid;
      grid-template-columns: 1fr 1.3fr;
      gap: 28px;
    }

    @media (max-width: 900px) {
      .container {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background-color: var(--bg-dark);
      border-radius: 14px;
      border: 1px solid var(--border-color);
      padding: 24px;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25);
    }

    .card-title {
      font-size: 18px;
      font-weight: 700;
      color: var(--text-header);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .card-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-bottom: 22px;
    }

    /* Formulario de Creador */
    .form-group {
      margin-bottom: 18px;
    }

    label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    input[type="text"], input[type="url"], select {
      width: 100%;
      background-color: var(--bg-darker);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 12px 14px;
      color: var(--text-header);
      font-size: 14px;
      font-family: inherit;
      transition: border 0.2s;
    }

    input:focus {
      outline: none;
      border-color: var(--blurple);
    }

    .emoji-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .emoji-chip {
      background-color: var(--bg-light);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 4px 8px;
      font-size: 16px;
      cursor: pointer;
      transition: transform 0.1s, background 0.2s;
      user-select: none;
    }

    .emoji-chip:hover {
      background-color: var(--bg-hover);
      transform: scale(1.15);
    }

    /* Selector de color estilo Discord */
    .color-options {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-top: 8px;
    }

    .color-radio {
      display: none;
    }

    .color-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 10px 8px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      border: 2px solid transparent;
      transition: all 0.2s;
      color: #fff;
    }

    .color-pill.blue { background-color: var(--blurple); }
    .color-pill.red { background-color: var(--red); }
    .color-pill.green { background-color: var(--green); }
    .color-pill.grey { background-color: var(--grey); }

    .color-radio:checked + .color-pill {
      border-color: #fff;
      box-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
      transform: translateY(-2px);
    }

    /* Live Preview */
    .preview-box {
      background-color: var(--bg-darker);
      border: 1px dashed var(--border-color);
      border-radius: 10px;
      padding: 20px;
      margin: 20px 0;
      text-align: center;
    }

    .preview-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    /* Botón simulado idéntico a Discord */
    .discord-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 10px 22px;
      border-radius: 6px;
      font-size: 15px;
      font-weight: 600;
      color: #ffffff;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      transition: filter 0.15s, transform 0.1s;
    }

    .discord-btn:hover {
      filter: brightness(1.1);
    }

    .discord-btn:active {
      transform: scale(0.97);
    }

    .btn-blue { background-color: var(--blurple); }
    .btn-red { background-color: var(--red); }
    .btn-green { background-color: var(--green); }
    .btn-grey { background-color: var(--grey); }

    /* Drag and drop zone */
    .drop-zone {
      border: 2px dashed var(--border-color);
      border-radius: 10px;
      padding: 24px;
      text-align: center;
      background-color: var(--bg-darker);
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      position: relative;
    }

    .drop-zone.dragover {
      border-color: var(--blurple);
      background-color: rgba(88, 101, 242, 0.08);
    }

    .drop-zone p {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 6px;
    }

    .drop-zone .icon {
      font-size: 32px;
      margin-bottom: 4px;
    }

    .file-input {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      opacity: 0;
      cursor: pointer;
    }

    .file-selected {
      margin-top: 10px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background-color: rgba(88, 101, 242, 0.2);
      color: #7983f5;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
    }

    /* Tabs para elegir Archivo o URL */
    .source-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 12px;
    }

    .tab-btn {
      flex: 1;
      padding: 8px 12px;
      background-color: var(--bg-light);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn.active {
      background-color: var(--blurple);
      color: #fff;
      border-color: var(--blurple);
    }

    .submit-btn {
      width: 100%;
      padding: 14px;
      background-color: var(--green);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .submit-btn:hover {
      background-color: var(--green-hover);
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Lista de Sonidos */
    .search-bar {
      margin-bottom: 16px;
    }

    .sounds-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      max-height: 650px;
      overflow-y: auto;
      padding-right: 6px;
    }

    .sounds-grid::-webkit-scrollbar {
      width: 6px;
    }

    .sounds-grid::-webkit-scrollbar-thumb {
      background-color: var(--bg-hover);
      border-radius: 3px;
    }

    .sound-item {
      background-color: var(--bg-light);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      transition: transform 0.15s, border-color 0.2s;
    }

    .sound-item:hover {
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateY(-1px);
    }

    .sound-info {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .sound-badge {
      font-size: 24px;
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--bg-darker);
      border-radius: 10px;
    }

    .sound-meta h4 {
      font-size: 15px;
      color: var(--text-header);
      font-weight: 600;
    }

    .sound-meta span {
      font-size: 12px;
      color: var(--text-muted);
    }

    .sound-tag {
      display: inline-block;
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }

    .tag-builtin {
      background-color: rgba(88, 101, 242, 0.2);
      color: #7983f5;
    }

    .tag-custom {
      background-color: rgba(35, 165, 90, 0.2);
      color: #57f287;
    }

    .sound-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn {
      background-color: var(--bg-hover);
      border: 1px solid var(--border-color);
      color: var(--text-normal);
      border-radius: 6px;
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background-color: var(--blurple);
      color: #fff;
    }

    .action-btn.btn-delete:hover {
      background-color: var(--red);
      color: #fff;
    }

    /* Notificaciones Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background-color: var(--bg-dark);
      border-left: 4px solid var(--green);
      border-radius: 6px;
      padding: 14px 20px;
      color: var(--text-header);
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
      z-index: 1000;
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .toast.show {
      transform: translateY(0);
      opacity: 1;
    }

    .toast.error {
      border-left-color: var(--red);
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-icon">🔊</div>
      <div>
        <h1>Soundboard Studio</h1>
        <p>Añade y gestiona memes y efectos para tus llamadas en Discord</p>
      </div>
    </div>
    <div class="status-badge">
      <div class="status-dot"></div>
      <span>Bot Conectado 24/7</span>
    </div>
  </header>

  <div class="container">
    <!-- PANEL IZQUIERDO: CREADOR VISUAL -->
    <div class="card">
      <div class="card-title">
        <span>➕</span> Añadir Nuevo Sonido
      </div>
      <div class="card-subtitle">
        Diseña el botón visual y sube el archivo de audio para que aparezca al instante en Discord.
      </div>

      <form id="soundForm">
        <div class="form-group">
          <label for="soundName">Nombre del Botón</label>
          <input type="text" id="soundName" placeholder="Ej: Bazinga, Taco Bell, GigaChad" maxlength="25" required>
        </div>

        <div class="form-group">
          <label for="soundEmoji">Emoji del Botón</label>
          <input type="text" id="soundEmoji" placeholder="Ej: 🔔, 🗿, 💥" maxlength="8" value="🔊">
          <div class="emoji-chips">
            <span class="emoji-chip" onclick="setEmoji('📢')">📢</span>
            <span class="emoji-chip" onclick="setEmoji('🥁')">🥁</span>
            <span class="emoji-chip" onclick="setEmoji('👏')">👏</span>
            <span class="emoji-chip" onclick="setEmoji('🦗')">🦗</span>
            <span class="emoji-chip" onclick="setEmoji('🗿')">🗿</span>
            <span class="emoji-chip" onclick="setEmoji('🎺')">🎺</span>
            <span class="emoji-chip" onclick="setEmoji('💀')">💀</span>
            <span class="emoji-chip" onclick="setEmoji('❌')">❌</span>
            <span class="emoji-chip" onclick="setEmoji('🔔')">🔔</span>
            <span class="emoji-chip" onclick="setEmoji('💥')">💥</span>
            <span class="emoji-chip" onclick="setEmoji('🎉')">🎉</span>
            <span class="emoji-chip" onclick="setEmoji('🔥')">🔥</span>
            <span class="emoji-chip" onclick="setEmoji('😂')">😂</span>
            <span class="emoji-chip" onclick="setEmoji('👑')">👑</span>
          </div>
        </div>

        <div class="form-group">
          <label>Color del Botón (Discord Style)</label>
          <div class="color-options">
            <label>
              <input type="radio" name="color" value="1" class="color-radio" checked onchange="updatePreview()">
              <div class="color-pill blue">Azul</div>
            </label>
            <label>
              <input type="radio" name="color" value="4" class="color-radio" onchange="updatePreview()">
              <div class="color-pill red">Rojo</div>
            </label>
            <label>
              <input type="radio" name="color" value="3" class="color-radio" onchange="updatePreview()">
              <div class="color-pill green">Verde</div>
            </label>
            <label>
              <input type="radio" name="color" value="2" class="color-radio" onchange="updatePreview()">
              <div class="color-pill grey">Gris</div>
            </label>
          </div>
        </div>

        <!-- VISTA PREVIA VISUAL EN TIEMPO REAL -->
        <div class="preview-box">
          <div class="preview-label">Vista Previa Exacta del Botón en Discord</div>
          <button type="button" id="previewBtn" class="discord-btn btn-blue">
            <span id="previewEmoji">🔊</span>
            <span id="previewText">Nuevo Sonido</span>
          </button>
        </div>

        <!-- SELECCIÓN DE ORIGEN DE AUDIO -->
        <div class="form-group">
          <label>Origen del Audio</label>
          <div class="source-tabs">
            <button type="button" class="tab-btn active" id="tabFile" onclick="switchSourceTab('file')">📁 Subir Archivo MP3</button>
            <button type="button" class="tab-btn" id="tabUrl" onclick="switchSourceTab('url')">🌐 Enlace Web / URL</button>
          </div>

          <div id="fileSection">
            <div class="drop-zone" id="dropZone">
              <input type="file" id="audioFileInput" class="file-input" accept="audio/*">
              <div class="icon">📥</div>
              <strong>Arrastra tu archivo de audio aquí</strong>
              <p>o haz clic para explorar (.mp3, .ogg, .wav, .m4a)</p>
              <div id="fileBadge" class="file-selected" style="display: none;">
                <span id="fileName">archivo.mp3</span>
              </div>
            </div>
          </div>

          <div id="urlSection" style="display: none;">
            <input type="url" id="soundUrl" placeholder="https://ejemplo.com/sonido.mp3">
            <p style="font-size: 11px; color: var(--text-muted); margin-top: 6px;">
              Pega un enlace directo a un archivo de audio accesible públicamente.
            </p>
          </div>
        </div>

        <!-- REPRODUCTOR DE PRUEBA -->
        <div class="form-group" id="audioPreviewGroup" style="display: none;">
          <label>Escuchar antes de guardar</label>
          <audio id="localAudioPlayer" controls style="width: 100%; height: 38px; border-radius: 8px;"></audio>
        </div>

        <button type="submit" class="submit-btn" id="submitBtn">
          <span>💾</span> Añadir al Soundboard
        </button>
      </form>
    </div>

    <!-- PANEL DERECHO: BIBLIOTECA DE SONIDOS -->
    <div class="card">
      <div class="card-title">
        <span>🎛️</span> Biblioteca del Soundboard
        <span id="soundCounter" style="font-size: 13px; color: var(--text-muted); font-weight: normal; margin-left: auto;">${sounds.length} sonidos</span>
      </div>
      <div class="card-subtitle">
        Todos los sonidos activos en el bot. Pulsa "Escuchar" para reproducir una muestra o borra los personalizados.
      </div>

      <div class="search-bar">
        <input type="text" id="searchInput" placeholder="🔍 Buscar sonido por nombre o emoji..." oninput="filterSounds()">
      </div>

      <div class="sounds-grid" id="soundsContainer">
        <!-- Renderizado dinámicamente con JavaScript -->
      </div>
    </div>
  </div>

  <div id="toast" class="toast">¡Operación realizada con éxito!</div>

  <script>
    let currentSounds = ${JSON.stringify(sounds)};
    let selectedFileBase64 = null;
    let selectedFileName = null;
    let currentSourceMode = 'file';

    const soundNameInput = document.getElementById('soundName');
    const soundEmojiInput = document.getElementById('soundEmoji');
    const previewBtn = document.getElementById('previewBtn');
    const previewEmoji = document.getElementById('previewEmoji');
    const previewText = document.getElementById('previewText');
    const audioFileInput = document.getElementById('audioFileInput');
    const dropZone = document.getElementById('dropZone');
    const fileBadge = document.getElementById('fileBadge');
    const fileNameSpan = document.getElementById('fileName');
    const localAudioPlayer = document.getElementById('localAudioPlayer');
    const audioPreviewGroup = document.getElementById('audioPreviewGroup');
    const soundUrlInput = document.getElementById('soundUrl');

    function updatePreview() {
      const name = soundNameInput.value.trim() || 'Nuevo Sonido';
      const emoji = soundEmojiInput.value.trim() || '🔊';
      const checkedColor = document.querySelector('input[name="color"]:checked')?.value || '1';

      previewText.textContent = name;
      previewEmoji.textContent = emoji;

      previewBtn.className = 'discord-btn';
      if (checkedColor === '1') previewBtn.classList.add('btn-blue');
      else if (checkedColor === '4') previewBtn.classList.add('btn-red');
      else if (checkedColor === '3') previewBtn.classList.add('btn-green');
      else if (checkedColor === '2') previewBtn.classList.add('btn-grey');
    }

    soundNameInput.addEventListener('input', updatePreview);
    soundEmojiInput.addEventListener('input', updatePreview);

    function setEmoji(emoji) {
      soundEmojiInput.value = emoji;
      updatePreview();
    }

    function switchSourceTab(mode) {
      currentSourceMode = mode;
      document.getElementById('tabFile').classList.toggle('active', mode === 'file');
      document.getElementById('tabUrl').classList.toggle('active', mode === 'url');
      document.getElementById('fileSection').style.display = mode === 'file' ? 'block' : 'none';
      document.getElementById('urlSection').style.display = mode === 'url' ? 'block' : 'none';

      if (mode === 'url' && soundUrlInput.value) {
        localAudioPlayer.src = soundUrlInput.value;
        audioPreviewGroup.style.display = 'block';
      }
    }

    soundUrlInput.addEventListener('input', () => {
      const url = soundUrlInput.value.trim();
      if (url.startsWith('http')) {
        localAudioPlayer.src = url;
        audioPreviewGroup.style.display = 'block';
      } else {
        audioPreviewGroup.style.display = 'none';
      }
    });

    // Manejo de Drag and Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length) handleFile(files[0]);
    });

    audioFileInput.addEventListener('change', (e) => {
      if (e.target.files.length) handleFile(e.target.files[0]);
    });

    function handleFile(file) {
      selectedFileName = file.name;
      fileNameSpan.textContent = file.name;
      fileBadge.style.display = 'inline-flex';

      const reader = new FileReader();
      reader.onload = (e) => {
        selectedFileBase64 = e.target.result;
        localAudioPlayer.src = e.target.result;
        audioPreviewGroup.style.display = 'block';
        if (!soundNameInput.value) {
          const autoName = file.name.replace(/\\.[^/.]+$/, '').replace(/[-_]/g, ' ');
          soundNameInput.value = autoName.slice(0, 25);
          updatePreview();
        }
      };
      reader.readAsDataURL(file);
    }

    // Renderizar tarjetas de biblioteca
    function renderSounds(list) {
      const container = document.getElementById('soundsContainer');
      document.getElementById('soundCounter').textContent = list.length + ' sonidos';

      if (list.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 40px;">No se encontraron sonidos.</div>';
        return;
      }

      container.innerHTML = list.map(s => {
        const colorClass = s.style === 4 ? 'btn-red' : (s.style === 3 ? 'btn-green' : (s.style === 2 ? 'btn-grey' : 'btn-blue'));
        const tag = s.isBuiltin
          ? '<span class="sound-tag tag-builtin">Predefinido</span>'
          : '<span class="sound-tag tag-custom">Personalizado</span>';

        const deleteBtn = !s.isBuiltin
          ? \`<button class="action-btn btn-delete" onclick="deleteSound('\${s.id}')">🗑️ Borrar</button>\`
          : '';

        return \`
          <div class="sound-item" data-id="\${s.id}">
            <div class="sound-info">
              <div class="sound-badge">\${s.emoji || '🔊'}</div>
              <div class="sound-meta">
                <h4>\${s.name} \${tag}</h4>
                <span>Botón: \${s.shortName || s.name}</span>
              </div>
            </div>
            <div class="sound-actions">
              <button class="action-btn" onclick="previewSoundAudio('\${s.id}', '\${s.url || ''}')">▶ Escuchar</button>
              \${deleteBtn}
            </div>
          </div>
        \`;
      }).join('');
    }

    function previewSoundAudio(id, url) {
      const audioUrl = '/api/audio/' + id;
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {
        if (url) {
          new Audio(url).play().catch(e => showToast('Error al reproducir audio: ' + e.message, true));
        }
      });
    }

    function filterSounds() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      const filtered = currentSounds.filter(s =>
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.shortName && s.shortName.toLowerCase().includes(q)) ||
        (s.emoji && s.emoji.includes(q))
      );
      renderSounds(filtered);
    }

    async function deleteSound(id) {
      if (!confirm('¿Estás seguro de que deseas eliminar este sonido del soundboard?')) return;

      try {
        const res = await fetch('/api/sounds/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          currentSounds = currentSounds.filter(s => s.id !== id);
          filterSounds();
          showToast('✅ Sonido eliminado correctamente');
        } else {
          showToast(data.error || 'Error al eliminar sonido', true);
        }
      } catch (e) {
        showToast('Error de conexión: ' + e.message, true);
      }
    }

    // Envío del formulario
    document.getElementById('soundForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById('submitBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>⏳</span> Guardando...';

      const name = soundNameInput.value.trim();
      const emoji = soundEmojiInput.value.trim() || '🔊';
      const style = parseInt(document.querySelector('input[name="color"]:checked')?.value || '1', 10);
      const url = soundUrlInput.value.trim();

      const payload = {
        name,
        shortName: name.slice(0, 20),
        emoji,
        style,
        url: currentSourceMode === 'url' ? url : '',
        audioBase64: currentSourceMode === 'file' ? selectedFileBase64 : null,
        fileName: selectedFileName
      };

      if (currentSourceMode === 'file' && !selectedFileBase64) {
        showToast('Por favor, selecciona o arrastra un archivo de audio', true);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>💾</span> Añadir al Soundboard';
        return;
      }

      if (currentSourceMode === 'url' && !url) {
        showToast('Por favor, introduce una URL de audio válida', true);
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>💾</span> Añadir al Soundboard';
        return;
      }

      try {
        const res = await fetch('/api/sounds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await res.json();

        if (result.success && result.sound) {
          currentSounds.push(result.sound);
          filterSounds();
          showToast('🎉 ¡Sonido añadido con éxito al Soundboard!');

          // Limpiar formulario
          soundNameInput.value = '';
          soundEmojiInput.value = '🔊';
          soundUrlInput.value = '';
          selectedFileBase64 = null;
          selectedFileName = null;
          fileBadge.style.display = 'none';
          audioPreviewGroup.style.display = 'none';
          updatePreview();
        } else {
          showToast(result.error || 'No se pudo guardar el sonido', true);
        }
      } catch (err) {
        showToast('Error de red al guardar: ' + err.message, true);
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span>💾</span> Añadir al Soundboard';
      }
    });

    function showToast(msg, isError = false) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.className = 'toast show' + (isError ? ' error' : '');
      setTimeout(() => {
        toast.className = 'toast';
      }, 3500);
    }

    // Inicializar lista
    renderSounds(currentSounds);
    updatePreview();
  </script>
</body>
</html>`;
}

/**
 * Manejador principal para las peticiones HTTP del Soundboard Studio.
 * Soporta GET /soundboard, API REST (/api/sounds) y streaming de audio.
 */
async function handleSoundboardWebRequest(req, res) {
  const urlObj = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const pathname = urlObj.pathname;
  const method = req.method;

  // 1. Dashboard Web UI
  if (method === 'GET' && (pathname === '/soundboard' || pathname === '/soundboard/')) {
    const sounds = getAllSoundEffects();
    const html = getDashboardHtml(sounds);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    return res.end(html);
  }

  // 2. API: Listar todos los sonidos en JSON
  if (method === 'GET' && pathname === '/api/sounds') {
    const sounds = getAllSoundEffects();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: true, sounds }));
  }

  // 3. API: Crear nuevo sonido
  if (method === 'POST' && pathname === '/api/sounds') {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
        // Protección de tamaño máximo (máx. 15MB)
        if (body.length > 15 * 1024 * 1024) {
          req.destroy();
          resolve(true);
        }
      });

      req.on('end', async () => {
        try {
          const payload = JSON.parse(body);
          let buffer = null;

          if (payload.audioBase64) {
            // Extraer base64 real si viene como data URI (data:audio/mp3;base64,...)
            const base64Data = payload.audioBase64.replace(/^data:audio\/\w+;base64,/, '').replace(/^data:application\/octet-stream;base64,/, '');
            buffer = Buffer.from(base64Data, 'base64');
          }

          const newSound = await addCustomSound({
            name: payload.name,
            shortName: payload.shortName || payload.name,
            emoji: payload.emoji || '🔊',
            style: payload.style || 1,
            url: payload.url || '',
            buffer: buffer,
            description: payload.description || 'Añadido desde el Panel Web'
          });

          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, sound: newSound }));
          resolve(true);
        } catch (err) {
          console.error('[SOUNDBOARD API ERROR]:', err);
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: err.message || 'Error al procesar el sonido' }));
          resolve(true);
        }
      });
    });
  }

  // 4. API: Eliminar sonido personalizado
  if (method === 'DELETE' && pathname.startsWith('/api/sounds/')) {
    const soundId = pathname.replace('/api/sounds/', '');
    const success = removeCustomSound(soundId);
    res.writeHead(success ? 200 : 404, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success, error: success ? null : 'Sonido no encontrado o no se puede eliminar' }));
  }

  // 5. API: Stream local de audio para previsualización en el navegador
  if (method === 'GET' && pathname.startsWith('/api/audio/')) {
    const soundId = pathname.replace('/api/audio/', '');
    const sound = getSoundEffect(soundId);
    if (!sound) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Sonido no encontrado');
    }

    const audioPathOrUrl = getSoundPathOrUrl(sound);
    if (sound.localFile && fs.existsSync(sound.localFile)) {
      const stat = fs.statSync(sound.localFile);
      res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size,
        'Accept-Ranges': 'bytes'
      });
      return fs.createReadStream(sound.localFile).pipe(res);
    } else if (sound.url) {
      // Redirigir a la URL pública
      res.writeHead(302, { Location: sound.url });
      return res.end();
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Archivo de audio no disponible');
    }
  }

  return false; // No fue una ruta de soundboard
}

module.exports = {
  getDashboardHtml,
  handleSoundboardWebRequest
};
