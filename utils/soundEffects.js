// utils/soundEffects.js
const path = require('path');
const fs = require('fs');
const { ButtonStyle } = require('discord.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SOUNDS_DIR = path.join(__dirname, '..', 'assets', 'sounds');
const CUSTOM_SOUNDS_FILE = path.join(DATA_DIR, 'customSounds.json');

// Asegurar existencia de directorios
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(SOUNDS_DIR)) {
  fs.mkdirSync(SOUNDS_DIR, { recursive: true });
}
if (!fs.existsSync(CUSTOM_SOUNDS_FILE)) {
  fs.writeFileSync(CUSTOM_SOUNDS_FILE, JSON.stringify([], null, 2), 'utf-8');
}

/**
 * Colección de sonidos meme predeterminados de fábrica.
 */
const DEFAULT_SOUND_EFFECTS = [
  {
    id: 'airhorn',
    name: 'Bocina de meme',
    shortName: 'Airhorn',
    emoji: '📢',
    style: ButtonStyle.Danger,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/airhorn.mp3',
    localFile: path.join(SOUNDS_DIR, 'airhorn.mp3'),
    description: 'El clásico bocinazo de meme MLG',
    isBuiltin: true
  },
  {
    id: 'badumtss',
    name: 'Batería de chiste',
    shortName: 'Ba-dum tss',
    emoji: '🥁',
    style: ButtonStyle.Primary,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/badumtss.mp3',
    localFile: path.join(SOUNDS_DIR, 'badumtss.mp3'),
    description: 'Remate clásico para chistes y momentos cómicos',
    isBuiltin: true
  },
  {
    id: 'applause',
    name: 'Aplausos de victoria',
    shortName: 'Aplausos',
    emoji: '👏',
    style: ButtonStyle.Success,
    url: 'https://raw.githubusercontent.com/timothyguo86/50days50projects/master/09-Sound%20Board/sounds/applause.mp3',
    localFile: path.join(SOUNDS_DIR, 'applause.mp3'),
    description: 'Ovación y aplausos triunfales',
    isBuiltin: true
  },
  {
    id: 'crickets',
    name: 'Grillos incómodos',
    shortName: 'Grillos',
    emoji: '🦗',
    style: ButtonStyle.Secondary,
    url: 'https://raw.githubusercontent.com/extratone/macOSsystemsounds/main/mp3/Crickets.mp3',
    localFile: path.join(SOUNDS_DIR, 'crickets.mp3'),
    description: 'Sonido de grillos para silencios incómodos',
    isBuiltin: true
  },
  {
    id: 'bruh',
    name: 'Sonido "Bruh"',
    shortName: 'Bruh',
    emoji: '🗿',
    style: ButtonStyle.Secondary,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/bruh.mp3',
    localFile: path.join(SOUNDS_DIR, 'bruh.mp3'),
    description: 'El legendario e inexpresivo efecto de voz Bruh',
    isBuiltin: true
  },
  {
    id: 'sad_violin',
    name: 'Trompeta triste (Sad / Fail)',
    shortName: 'Sad Violin / Fail',
    emoji: '🎺',
    style: ButtonStyle.Primary,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/sad-violin.mp3',
    localFile: path.join(SOUNDS_DIR, 'sad_violin.mp3'),
    description: 'Música dramática y melancólica para momentos de derrota',
    isBuiltin: true
  },
  {
    id: 'wasted',
    name: 'GTA V Wasted',
    shortName: 'Wasted',
    emoji: '💀',
    style: ButtonStyle.Danger,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/gta5-wasted.mp3',
    localFile: path.join(SOUNDS_DIR, 'wasted.mp3'),
    description: 'Sonido de muerte a cámara lenta de Grand Theft Auto V',
    isBuiltin: true
  },
  {
    id: 'winerror',
    name: 'Windows Error',
    shortName: 'Error XP',
    emoji: '❌',
    style: ButtonStyle.Secondary,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/WinError.mp3',
    localFile: path.join(SOUNDS_DIR, 'winerror.mp3'),
    description: 'El inconfundible aviso de error de Windows',
    isBuiltin: true
  }
];

/**
 * Carga los sonidos personalizados guardados en disco.
 * @returns {Array}
 */
function loadCustomSounds() {
  try {
    if (!fs.existsSync(CUSTOM_SOUNDS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(CUSTOM_SOUNDS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error cargando customSounds.json:', error);
    return [];
  }
}

/**
 * Guarda la colección de sonidos personalizados en disco.
 * @param {Array} sounds
 */
function saveCustomSounds(sounds) {
  try {
    fs.writeFileSync(CUSTOM_SOUNDS_FILE, JSON.stringify(sounds, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error guardando customSounds.json:', error);
    return false;
  }
}

/**
 * Retorna todos los sonidos disponibles (predeterminados + personalizados).
 * @returns {Array}
 */
function getAllSoundEffects() {
  const custom = loadCustomSounds();
  return [...DEFAULT_SOUND_EFFECTS, ...custom];
}

/**
 * Mapeo para normalizar estilos de botón (números o nombres).
 */
function normalizeButtonStyle(styleInput) {
  if (typeof styleInput === 'number' && [1, 2, 3, 4].includes(styleInput)) {
    return styleInput;
  }
  const str = String(styleInput || '').toLowerCase().trim();
  if (str === 'danger' || str === 'rojo' || str === 'red' || str === '4') return ButtonStyle.Danger;
  if (str === 'success' || str === 'verde' || str === 'green' || str === '3') return ButtonStyle.Success;
  if (str === 'secondary' || str === 'gris' || str === 'grey' || str === 'gray' || str === '2') return ButtonStyle.Secondary;
  return ButtonStyle.Primary; // Por defecto: Azul (1)
}

/**
 * Añade un nuevo sonido personalizado al soundboard.
 * @param {Object} options
 * @param {string} options.name - Nombre visible
 * @param {string} [options.shortName] - Nombre abreviado
 * @param {string} [options.emoji] - Emoji para el botón
 * @param {number|string} [options.style] - Estilo/color de botón
 * @param {string} [options.url] - URL de audio externa
 * @param {Buffer} [options.buffer] - Buffer de archivo de audio (si se subió localmente)
 * @param {string} [options.description] - Descripción opcional
 * @returns {Object} Sonido creado
 */
async function addCustomSound({ name, shortName, emoji, style, url, buffer, description }) {
  const safeName = String(name || '').trim();
  if (!safeName) throw new Error('El nombre del sonido es obligatorio');

  const id = `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const cleanEmoji = (emoji || '🔊').trim() || '🔊';
  const cleanShortName = (shortName || safeName).slice(0, 20).trim();
  const normalizedStyle = normalizeButtonStyle(style);

  let localFile = null;
  let finalUrl = url ? String(url).trim() : null;

  // Si se subió un buffer (archivo local)
  if (buffer && Buffer.isBuffer(buffer)) {
    const filePath = path.join(SOUNDS_DIR, `${id}.mp3`);
    fs.writeFileSync(filePath, buffer);
    localFile = filePath;
  } else if (finalUrl) {
    // Si viene por URL, intentamos pre-descargar en local para latencia cero
    try {
      const filePath = path.join(SOUNDS_DIR, `${id}.mp3`);
      const res = await fetch(finalUrl);
      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(arrayBuf));
        localFile = filePath;
      }
    } catch (e) {
      console.warn(`[SOUNDBOARD] No se pudo descargar localmente ${finalUrl}, se usará por streaming directo:`, e?.message || e);
    }
  }

  if (!localFile && !finalUrl) {
    throw new Error('Debes proporcionar un archivo de audio o una URL válida');
  }

  const newSound = {
    id,
    name: safeName,
    shortName: cleanShortName,
    emoji: cleanEmoji,
    style: normalizedStyle,
    url: finalUrl || '',
    localFile: localFile || null,
    description: description || 'Sonido añadido por la comunidad',
    createdAt: Date.now(),
    isBuiltin: false
  };

  const current = loadCustomSounds();
  current.push(newSound);
  saveCustomSounds(current);

  return newSound;
}

/**
 * Elimina un sonido personalizado por ID.
 * @param {string} id
 * @returns {boolean}
 */
function removeCustomSound(id) {
  const current = loadCustomSounds();
  const index = current.findIndex(s => s.id === id);
  if (index === -1) return false;

  const [removed] = current.splice(index, 1);
  saveCustomSounds(current);

  // Eliminar archivo local si existe
  if (removed.localFile && fs.existsSync(removed.localFile)) {
    try {
      fs.unlinkSync(removed.localFile);
    } catch (e) {
      console.error(`Error borrando archivo ${removed.localFile}:`, e);
    }
  }

  return true;
}

/**
 * Obtiene un efecto de sonido por su identificador.
 * @param {string} id
 */
function getSoundEffect(id) {
  return getAllSoundEffects().find(s => s.id === id);
}

/**
 * Devuelve la fuente de audio óptima (archivo local si existe, o URL remota directa).
 * @param {object} sound
 * @returns {string}
 */
function getSoundPathOrUrl(sound) {
  if (sound.localFile && fs.existsSync(sound.localFile)) {
    return sound.localFile;
  }
  return sound.url;
}

module.exports = {
  SOUND_EFFECTS: DEFAULT_SOUND_EFFECTS,
  DEFAULT_SOUND_EFFECTS,
  getAllSoundEffects,
  getSoundEffect,
  getSoundPathOrUrl,
  loadCustomSounds,
  saveCustomSounds,
  addCustomSound,
  removeCustomSound,
  normalizeButtonStyle,
  SOUNDS_DIR,
  DATA_DIR
};
