// utils/soundEffects.js
const path = require('path');
const fs = require('fs');
const { ButtonStyle } = require('discord.js');

/**
 * Colección de efectos de sonido y memes para el soundboard interactivo.
 * Incluye URLs públicas directas (mp3) y rutas a caché local en assets/sounds.
 */
const SOUND_EFFECTS = [
  {
    id: 'airhorn',
    name: 'Bocina de meme',
    shortName: 'Airhorn',
    emoji: '📢',
    style: ButtonStyle.Danger,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/airhorn.mp3',
    localFile: path.join(__dirname, '..', 'assets', 'sounds', 'airhorn.mp3'),
    description: 'El clásico bocinazo de meme MLG'
  },
  {
    id: 'badumtss',
    name: 'Batería de chiste',
    shortName: 'Ba-dum tss',
    emoji: '🥁',
    style: ButtonStyle.Primary,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/badumtss.mp3',
    localFile: path.join(__dirname, '..', 'assets', 'sounds', 'badumtss.mp3'),
    description: 'Remate clásico para chistes y momentos cómicos'
  },
  {
    id: 'applause',
    name: 'Aplausos de victoria',
    shortName: 'Aplausos',
    emoji: '👏',
    style: ButtonStyle.Success,
    url: 'https://raw.githubusercontent.com/timothyguo86/50days50projects/master/09-Sound%20Board/sounds/applause.mp3',
    localFile: path.join(__dirname, '..', 'assets', 'sounds', 'applause.mp3'),
    description: 'Ovación y aplausos triunfales'
  },
  {
    id: 'crickets',
    name: 'Grillos incómodos',
    shortName: 'Grillos',
    emoji: '🦗',
    style: ButtonStyle.Secondary,
    url: 'https://raw.githubusercontent.com/extratone/macOSsystemsounds/main/mp3/Crickets.mp3',
    localFile: path.join(__dirname, '..', 'assets', 'sounds', 'crickets.mp3'),
    description: 'Sonido de grillos para silencios incómodos'
  },
  {
    id: 'bruh',
    name: 'Sonido "Bruh"',
    shortName: 'Bruh',
    emoji: '🗿',
    style: ButtonStyle.Secondary,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/bruh.mp3',
    localFile: path.join(__dirname, '..', 'assets', 'sounds', 'bruh.mp3'),
    description: 'El legendario e inexpresivo efecto de voz Bruh'
  },
  {
    id: 'sad_violin',
    name: 'Trompeta triste (Sad / Fail)',
    shortName: 'Sad Violin / Fail',
    emoji: '🎺',
    style: ButtonStyle.Primary,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/sad-violin.mp3',
    localFile: path.join(__dirname, '..', 'assets', 'sounds', 'sad_violin.mp3'),
    description: 'Música dramática y melancólica para momentos de derrota'
  },
  // Efectos de sonido adicionales populares
  {
    id: 'wasted',
    name: 'GTA V Wasted',
    shortName: 'Wasted',
    emoji: '💀',
    style: ButtonStyle.Danger,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/gta5-wasted.mp3',
    localFile: path.join(__dirname, '..', 'assets', 'sounds', 'wasted.mp3'),
    description: 'Sonido de muerte a cámara lenta de Grand Theft Auto V'
  },
  {
    id: 'winerror',
    name: 'Windows Error',
    shortName: 'Error XP',
    emoji: '❌',
    style: ButtonStyle.Secondary,
    url: 'https://raw.githubusercontent.com/3kh0/soundboard/main/sounds/WinError.mp3',
    localFile: path.join(__dirname, '..', 'assets', 'sounds', 'winerror.mp3'),
    description: 'El inconfundible aviso de error de Windows'
  }
];

/**
 * Obtiene un efecto de sonido por su identificador.
 * @param {string} id
 */
function getSoundEffect(id) {
  return SOUND_EFFECTS.find(s => s.id === id);
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
  SOUND_EFFECTS,
  getSoundEffect,
  getSoundPathOrUrl
};
