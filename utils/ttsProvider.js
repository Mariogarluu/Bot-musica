// utils/ttsProvider.js
const { EdgeTTS } = require('@andresaya/edge-tts');
const { createAudioResource } = require('@discordjs/voice');
const { Readable, PassThrough } = require('stream');
const googleTTS = require('google-tts-api');

/**
 * Catálogo de voces neuronales de Inteligencia Artificial de alta fidelidad.
 */
const AI_VOICES = [
  {
    id: 'alvaro',
    voice: 'es-ES-AlvaroNeural',
    name: 'Álvaro',
    country: 'España',
    gender: 'Masculino',
    emoji: '🇪🇸',
    description: 'Entusiasta y enérgico • Ideal para locución de radio y DJ',
  },
  {
    id: 'elvira',
    voice: 'es-ES-ElviraNeural',
    name: 'Elvira',
    country: 'España',
    gender: 'Femenino',
    emoji: '🇪🇸',
    description: 'Clara, elegante, profesional y expresiva',
  },
  {
    id: 'jorge',
    voice: 'es-MX-JorgeNeural',
    name: 'Jorge',
    country: 'México',
    gender: 'Masculino',
    emoji: '🇲🇽',
    description: 'Cálido, amigable, natural y conversacional',
  },
  {
    id: 'dalia',
    voice: 'es-MX-DaliaNeural',
    name: 'Dalia',
    country: 'México',
    gender: 'Femenino',
    emoji: '🇲🇽',
    description: 'Suave, melódica, serena y agradable',
  },
  {
    id: 'tomas',
    voice: 'es-AR-TomasNeural',
    name: 'Tomás',
    country: 'Argentina',
    gender: 'Masculino',
    emoji: '🇦🇷',
    description: 'Jovial, activo, dinámico y expresivo',
  },
  {
    id: 'elena',
    voice: 'es-AR-ElenaNeural',
    name: 'Elena',
    country: 'Argentina',
    gender: 'Femenino',
    emoji: '🇦🇷',
    description: 'Expresiva, vibrante y cercana',
  },
  {
    id: 'gonzalo',
    voice: 'es-CO-GonzaloNeural',
    name: 'Gonzalo',
    country: 'Colombia',
    gender: 'Masculino',
    emoji: '🇨🇴',
    description: 'Formal, sobrio, respetuoso y educado',
  },
  {
    id: 'salome',
    voice: 'es-CO-SalomeNeural',
    name: 'Salomé',
    country: 'Colombia',
    gender: 'Femenino',
    emoji: '🇨🇴',
    description: 'Dulce, amigable, tranquila y cercana',
  },
  {
    id: 'alonso',
    voice: 'es-US-AlonsoNeural',
    name: 'Alonso',
    country: 'Latino / EE.UU.',
    gender: 'Masculino',
    emoji: '🌎',
    description: 'Joven, desenfadado y fresco',
  },
  {
    id: 'guy',
    voice: 'en-US-GuyNeural',
    name: 'Guy (Inglés)',
    country: 'EE.UU.',
    gender: 'Masculino',
    emoji: '🇺🇸',
    description: 'Voz masculina estadounidense clara y profesional',
  },
  {
    id: 'aria',
    voice: 'en-US-AriaNeural',
    name: 'Aria (Inglés)',
    country: 'EE.UU.',
    gender: 'Femenino',
    emoji: '🇺🇸',
    description: 'Voz femenina estadounidense versátil y natural',
  },
];

// Mapa en memoria para almacenar la voz activa por servidor (clave: guildId, valor: voiceId)
const guildVoices = new Map();

/**
 * Obtiene todas las voces disponibles en el catálogo.
 */
function getVoices() {
  return AI_VOICES;
}

/**
 * Busca una voz por su ID único, nombre o identificador técnico de Edge.
 * @param {string|object} idOrVoice
 * @returns {object}
 */
function findVoice(idOrVoice) {
  if (!idOrVoice) return AI_VOICES[0];
  if (typeof idOrVoice === 'object' && idOrVoice.voice) return idOrVoice;
  const query = String(idOrVoice).toLowerCase().trim();
  const found = AI_VOICES.find(
    v => v.id.toLowerCase() === query || v.voice.toLowerCase() === query || v.name.toLowerCase() === query
  );
  return found || AI_VOICES[0];
}

/**
 * Alias para findVoice
 */
function getVoiceById(idOrVoice) {
  return findVoice(idOrVoice);
}

/**
 * Obtiene el identificador de voz activo en el servidor (por defecto 'alvaro').
 * @param {string} guildId
 * @returns {string} ID de la voz
 */
function getGuildVoice(guildId) {
  return guildVoices.get(guildId) || 'alvaro';
}

/**
 * Actualiza la voz activa de un servidor.
 * @param {string} guildId
 * @param {string} voiceId
 * @returns {object} Objeto de la voz seleccionada
 */
function setGuildVoice(guildId, voiceId) {
  const voice = findVoice(voiceId);
  guildVoices.set(guildId, voice.id);
  return voice;
}

/**
 * Sintetiza un texto a un AudioResource reproducible en @discordjs/voice.
 * Cuenta con resiliencia y fallback automático a Google TTS si EdgeTTS no responde.
 * @param {string} text
 * @param {string|object} voiceOption
 * @returns {Promise<{ resource: import('@discordjs/voice').AudioResource, voice: object, fallback: boolean }>}
 */
async function synthesizeSpeech(text, voiceOption = 'alvaro') {
  const voice = findVoice(voiceOption);
  const cleanText = String(text || '').trim().substring(0, 350);

  if (!cleanText) {
    throw new Error('El texto para sintetizar no puede estar vacío.');
  }

  // 1. Intento primario con Edge Neural TTS (Calidad IA ultra natural)
  try {
    const tts = new EdgeTTS();
    const result = await tts.generate(cleanText, voice.voice);
    if (result && result.audio && result.audio.length > 0) {
      const stream = Readable.from(result.audio);
      const resource = createAudioResource(stream, { inlineVolume: true });
      if (resource.volume) resource.volume.setVolume(1.0);
      return { resource, voice, fallback: false };
    }
  } catch (err) {
    console.warn(`[TTS Provider] Error en Edge Neural TTS (${voice.name}):`, err?.message || err);
  }

  // 2. Fallback de seguridad inmediato a Google TTS (Nunca deja la llamada en silencio)
  try {
    console.log('[TTS Provider] Activando fallback transparente con Google TTS...');
    const lang = voice.country.includes('EE.UU.') && voice.id.includes('en') ? 'en' : 'es';
    const url = googleTTS.getAudioUrl(cleanText, {
      lang,
      slow: false,
      host: 'https://translate.google.com',
    });

    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error(`Google TTS status: ${res.status}`);

    const buffer = Buffer.from(await res.arrayBuffer());
    const pt = new PassThrough();
    pt.end(buffer);
    const resource = createAudioResource(pt, { inlineVolume: true });
    if (resource.volume) resource.volume.setVolume(1.0);

    return { resource, voice, fallback: true };
  } catch (fallbackErr) {
    console.error('[TTS Provider] Error crítico: fallaron tanto Edge TTS como Google TTS:', fallbackErr);
    throw fallbackErr;
  }
}

module.exports = {
  AI_VOICES,
  getVoices,
  findVoice,
  getVoiceById,
  getGuildVoice,
  setGuildVoice,
  synthesizeSpeech,
};
