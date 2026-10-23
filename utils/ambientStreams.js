// utils/ambientStreams.js

/**
 * Lista curada de presets de audio ambiental de alta calidad y libres de derechos
 * diseñados para estudio, concentración profunda, relajación o descanso (Focus / Study Mode).
 */
const ambientPresets = [
  {
    id: 'rain_thunder',
    name: 'Lluvia y truenos relajantes',
    title: '🌧️ Lluvia y Truenos Relajantes (Focus & Sleep)',
    emoji: '🌧️',
    description: 'Tormenta suave y lluvia continua para calmar la mente y concentrarse',
    url: 'https://www.youtube.com/watch?v=nDq6TstdEi8',
    duration: '10:00:00',
    thumbnail: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?w=500&auto=format&fit=crop&q=80',
    color: 0x3B82F6,
    author: 'Ambiente Natural'
  },
  {
    id: 'fireplace',
    name: 'Fuego de chimenea crepitante',
    title: '🔥 Fuego de Chimenea Crepitante (Calidez & Relax)',
    emoji: '🔥',
    description: 'Leña ardiendo y chasquidos cálidos para una atmósfera reconfortante',
    url: 'https://www.youtube.com/watch?v=UgHKb_7884o',
    duration: '12:00:37',
    thumbnail: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=500&auto=format&fit=crop&q=80',
    color: 0xEA580C,
    author: 'Ambiente Cálido'
  },
  {
    id: 'cozy_cafe',
    name: 'Cafetería acogedora',
    title: '☕ Cafetería Acogedora (Coffee Shop Study Ambience)',
    emoji: '☕',
    description: 'Murmullo suave, tazas de café y ambiente productivo de cafetería',
    url: 'https://www.youtube.com/watch?v=uiMXGIG_DQo',
    duration: '4:04:07',
    thumbnail: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&auto=format&fit=crop&q=80',
    color: 0x92400E,
    author: 'Focus & Coffee'
  },
  {
    id: 'ocean_waves',
    name: 'Olas del océano',
    title: '🌊 Olas del Océano (Paz & Oleaje Rítmico)',
    emoji: '🌊',
    description: 'Oleaje suave y continuo rompiendo en la orilla del mar',
    url: 'https://www.youtube.com/watch?v=vPhg6sc1Mk4',
    duration: '8:02:12',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80',
    color: 0x0284C7,
    author: 'Ambiente Marino'
  },
  {
    id: 'sunset_forest',
    name: 'Bosque al atardecer',
    title: '🌲 Bosque al Atardecer (Naturaleza & Canto de Aves)',
    emoji: '🌲',
    description: 'Brisa suave entre las copas de los árboles y aves al atardecer',
    url: 'https://www.youtube.com/watch?v=_M-joHQkBS0',
    duration: '1:00:00',
    thumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500&auto=format&fit=crop&q=80',
    color: 0x15803D,
    author: 'Bosque & Naturaleza'
  },
  {
    id: 'brown_noise',
    name: 'Ruido blanco / Brown noise',
    title: '🎧 Ruido Blanco / Brown Noise (Máxima Concentración)',
    emoji: '🎧',
    description: 'Frecuencias bajas estables ideales para cancelar ruidos y enfocar la atención',
    url: 'https://www.youtube.com/watch?v=0GDfOAuUvQ0',
    duration: '8:00:00',
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80',
    color: 0x6366F1,
    author: 'Focus Frequency'
  }
];

/**
 * Obtiene un preset ambiental a partir de su ID único.
 * @param {string} id 
 * @returns {object|undefined}
 */
function getAmbientPreset(id) {
  return ambientPresets.find(p => p.id === id);
}

module.exports = {
  ambientPresets,
  getAmbientPreset
};
