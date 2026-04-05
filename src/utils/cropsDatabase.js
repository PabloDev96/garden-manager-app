/**
 * Devuelve todos los cultivos del catálogo como un array plano.
 * Se evalúa en tiempo de ejecución para evitar referencias circulares.
 */
export function getAllCrops() {
  const result = [];
  for (const [categoryKey, category] of Object.entries(CROPS_DATABASE)) {
    for (const [typeKey, type] of Object.entries(category.types)) {
      result.push({ id: typeKey, categoryKey, name: type.name, emoji: type.emoji, color: type.color });
    }
  }
  return result;
}

export const CROPS_DATABASE = {
  verdura: {
    label: 'Verduras y Hortalizas',
    emoji: '🥬',
    types: {
      acelga:     { name: 'Acelga',     emoji: '🥬', color: '#4CAF50' },
      ajo:        { name: 'Ajo',        emoji: '🧄', color: '#F5F5DC' },
      berenjena:  { name: 'Berenjena',  emoji: '🍆', color: '#6A1B9A' },
      berza:      { name: 'Berza',      emoji: '🥬', color: '#558B2F' },
      calabacin:  { name: 'Calabacín',  emoji: '🥒', color: '#7CB342' },
      calabaza:   { name: 'Calabaza',   emoji: '🎃', color: '#FF8C42' },
      cebolla:    { name: 'Cebolla',    emoji: '🧅', color: '#8D6E63' },
      coliflor:   { name: 'Coliflor',   emoji: '🥦', color: '#B0BEC5' },
      escarola:   { name: 'Escarola',   emoji: '🥗', color: '#AED581' },
      espinaca:   { name: 'Espinaca',   emoji: '🌿', color: '#388E3C' },
      lechuga:    { name: 'Lechuga',    emoji: '🥬', color: '#7CB342' },
      maiz:       { name: 'Maíz',       emoji: '🌽', color: '#FDD835' },
      nabo:       { name: 'Nabo',       emoji: '🌱', color: '#9E9E9E' },
      patata:     { name: 'Patata',     emoji: '🥔', color: '#A1887F' },
      pimiento:   { name: 'Pimiento',   emoji: '🫑', color: '#C62828' },
      puerro:     { name: 'Puerro',     emoji: '🧅', color: '#C5E1A5' },
      remolacha:  { name: 'Remolacha',  emoji: '🔴', color: '#880E4F' },
      repollo:    { name: 'Repollo',    emoji: '🥦', color: '#33691E' },
      tomate:     { name: 'Tomate',     emoji: '🍅', color: '#FF6B6B' },
      zanahoria:  { name: 'Zanahoria',  emoji: '🥕', color: '#FF9800' },
    }
  },
  legumbre: {
    label: 'Legumbres',
    emoji: '🫘',
    types: {
      guisante:   { name: 'Guisante',     emoji: '🫛', color: '#9CCC65' },
      haba:       { name: 'Haba',         emoji: '🫘', color: '#AED581' },
      judia:      { name: 'Judía Verde',  emoji: '🫘', color: '#7CB342' },
    }
  },
  hierba: {
    label: 'Hierbas Aromáticas',
    emoji: '🌿',
    types: {
      perejil:    { name: 'Perejil',  emoji: '🌿', color: '#4CAF50' },
    }
  },
};
