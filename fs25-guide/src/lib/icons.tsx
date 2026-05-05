import React from 'react';
import { Package, LucideIcon } from 'lucide-react';

export const getEmojiForType = (type: string): string => {
  if (!type || typeof type !== 'string') return '📦';
  const lowerType = type.toLowerCase();

  // Crops
  if (lowerType.includes('wheat') || lowerType.includes('blé')) return '🌾';
  if (lowerType.includes('barley') || lowerType.includes('orge')) return '🌾';
  if (lowerType.includes('oat') || lowerType.includes('avoine')) return '🌾';
  if (lowerType.includes('canola') || lowerType.includes('colza')) return '🌼';
  if (lowerType.includes('sorghum') || lowerType.includes('sorgho')) return '🌿';
  if (lowerType.includes('corn') || lowerType.includes('maïs') || lowerType.includes('maize')) return '🌽';
  if (lowerType.includes('sugarbeet') || lowerType.includes('betterave sucrière')) return '🍠';
  if (lowerType.includes('potato') || lowerType.includes('pomme de terre')) return '🥔';
  if (lowerType.includes('grass') || lowerType.includes('herbe')) return '🌿';
  if (lowerType.includes('cotton') || lowerType.includes('coton')) return '☁️';
  if (lowerType.includes('sunflower') || lowerType.includes('tournesol')) return '🌻';
  if (lowerType.includes('sugarcane') || lowerType.includes('canne à sucre')) return '🎋';
  if (lowerType.includes('olive')) return '🫒';
  if (lowerType.includes('grape') || lowerType.includes('raisin')) return '🍇';
  if (lowerType.includes('carrot') || lowerType.includes('carotte')) return '🥕';
  if (lowerType.includes('parsnip') || lowerType.includes('panais')) return '🥕';
  if (lowerType.includes('red beet') || lowerType.includes('betterave rouge')) return '🧅';
  if (lowerType.includes('pea') || lowerType.includes('pois')) return '🫛';
  if (lowerType.includes('spinach') || lowerType.includes('épinard')) return '🍃';
  if (lowerType.includes('green bean') || lowerType.includes('haricot vert')) return '🫘';
  if (lowerType.includes('soybean') || lowerType.includes('soja')) return '🫘';
  if (lowerType.includes('rice') || lowerType.includes('riz')) return '🍚';

  // Products
  if (lowerType.includes('flour') || lowerType.includes('farine')) return '🥡';
  if (lowerType.includes('bread') || lowerType.includes('pain')) return '🍞';
  if (lowerType.includes('cheese') || lowerType.includes('fromage')) return '🧀';
  if (lowerType.includes('mozzarella')) return '🧀';
  if (lowerType.includes('butter') || lowerType.includes('beurre')) return '🧈';
  if (lowerType.includes('chocolate') || lowerType.includes('chocolat')) return '🍫';
  if (lowerType.includes('oil') || lowerType.includes('huile')) return '🫙';
  if (lowerType.includes('juice') || lowerType.includes('jus')) return '🧃';
  if (lowerType.includes('raisin')) return '🍇';
  if (lowerType.includes('cereal') || lowerType.includes('céréale')) return '🥣';
  if (lowerType.includes('chip') || lowerType.includes('frite')) return '🍟';
  if (lowerType.includes('sugar') || lowerType.includes('sucre')) return '🧊';
  if (lowerType.includes('cake') || lowerType.includes('gâteau')) return '🍰';
  if (lowerType.includes('fabric') || lowerType.includes('tissu')) return '🧵';
  if (lowerType.includes('clothes') || lowerType.includes('vêtement')) return '👕';
  if (lowerType.includes('soup') || lowerType.includes('soupe')) return '🍲';
  if (lowerType.includes('noodle') || lowerType.includes('nouille')) return '🍜';
  if (lowerType.includes('kimchi')) return '🥫';
  if (lowerType.includes('preserved') || lowerType.includes('conserve')) return '🫙';
  if (lowerType.includes('canned') || lowerType.includes('boîte')) return '🥫';

  // Materials & Wood
  if (lowerType.includes('cement') || lowerType.includes('ciment')) return '🧱';
  if (lowerType.includes('plank') || lowerType.includes('planche')) return '🪵';
  if (lowerType.includes('wood') || lowerType.includes('bois')) return '🪵';
  if (lowerType.includes('furniture') || lowerType.includes('meuble')) return '🪑';
  if (lowerType.includes('bathtub') || lowerType.includes('baignoire')) return '🛁';
  if (lowerType.includes('bucket') || lowerType.includes('seau')) return '🪣';
  if (lowerType.includes('barrel') || lowerType.includes('tonneau')) return '🛢️';
  if (lowerType.includes('rope') || lowerType.includes('corde')) return '🪢';
  if (lowerType.includes('paper') || lowerType.includes('papier')) return '🧻';
  if (lowerType.includes('carton')) return '📦';
  if (lowerType.includes('wall') || lowerType.includes('mur')) return '🧱';
  if (lowerType.includes('roof') || lowerType.includes('toit')) return '🛖';
  if (lowerType.includes('piano')) return '🎹';
  if (lowerType.includes('tractor') || lowerType.includes('tracteur')) return '🚜';
  if (lowerType.includes('wagon')) return '🛒';

  // Greenhouse
  if (lowerType.includes('strawberry') || lowerType.includes('fraise')) return '🍓';
  if (lowerType.includes('lettuce') || lowerType.includes('laitue')) return '🥬';
  if (lowerType.includes('tomato') || lowerType.includes('tomate')) return '🍅';
  if (lowerType.includes('cabbage') || lowerType.includes('chou')) return '🥬';
  if (lowerType.includes('onion') || lowerType.includes('oignon')) return '🧅';
  if (lowerType.includes('garlic') || lowerType.includes('ail')) return '🧄';
  if (lowerType.includes('mushroom') || lowerType.includes('champignon')) return '🍄';
  if (lowerType.includes('chili') || lowerType.includes('piment')) return '🌶️';
  if (lowerType.includes('sapling') || lowerType.includes('plant')) return '🌱';

  // Animals & Animal Products
  if (lowerType.includes('cow') || lowerType.includes('vache')) return '🐄';
  if (lowerType.includes('buffalo') || lowerType.includes('buffle')) return '🐃';
  if (lowerType.includes('sheep') || lowerType.includes('mouton')) return '🐑';
  if (lowerType.includes('goat') || lowerType.includes('chèvre')) return '🐐';
  if (lowerType.includes('chicken') || lowerType.includes('poule')) return '🐔';
  if (lowerType.includes('pig') || lowerType.includes('cochon')) return '🐖';
  if (lowerType.includes('horse') || lowerType.includes('cheval')) return '🐎';
  if (lowerType.includes('dog') || lowerType.includes('chien')) return '🐕';
  if (lowerType.includes('egg') || lowerType.includes('oeuf')) return '🥚';
  if (lowerType.includes('wool') || lowerType.includes('laine')) return '🧶';
  if (lowerType.includes('milk') || lowerType.includes('lait')) return '🥛';
  if (lowerType.includes('honey') || lowerType.includes('miel')) return '🍯';
  
  // Animal Food
  if (lowerType.includes('water') || lowerType.includes('eau')) return '💧';
  if (lowerType.includes('mineral feed') || lowerType.includes('minéral')) return '🧊';
  if (lowerType.includes('ration')) return '🥗';
  if (lowerType.includes('forage') || lowerType.includes('fourrage')) return '🌿';

  // Bales & Greenery
  if (lowerType.includes('hay') || lowerType.includes('foin')) return '🌾';
  if (lowerType.includes('straw') || lowerType.includes('paille')) return '🌾';
  if (lowerType.includes('silage') || lowerType.includes('ensilage')) return '🟩';
  if (lowerType.includes('chaff') || lowerType.includes('menue paille')) return '🍃';
  if (lowerType.includes('bale') || lowerType.includes('balle') || lowerType.includes('botte')) return '🧻';

  // Others
  if (lowerType.includes('seed') || lowerType.includes('semence')) return '🌱';
  if (lowerType.includes('stone') || lowerType.includes('pierre')) return '🪨';
  if (lowerType.includes('snow') || lowerType.includes('neige')) return '❄️';
  if (lowerType.includes('salt') || lowerType.includes('sel')) return '🧂';
  if (lowerType.includes('diesel') || lowerType.includes('carburant')) return '⛽';
  if (lowerType.includes('def') || lowerType.includes('adblue')) return '🛢️';
  if (lowerType.includes('electric') || lowerType.includes('électrique')) return '⚡';
  if (lowerType.includes('methane') || lowerType.includes('méthane')) return '💨';
  if (lowerType.includes('twine') || lowerType.includes('ficelle')) return '🧵';
  if (lowerType.includes('net') || lowerType.includes('filet')) return '🕸️';

  // Yield Boost
  if (lowerType.includes('manure') || lowerType.includes('fumier')) return '💩';
  if (lowerType.includes('slurry') || lowerType.includes('lisier')) return '🟤';
  if (lowerType.includes('radish') || lowerType.includes('radis')) return '🌱';
  if (lowerType.includes('lime') || lowerType.includes('chaux')) return '⚪';
  if (lowerType.includes('fertilizer') || lowerType.includes('engrais')) return '🟢';
  if (lowerType.includes('herbicide')) return '☠️';
  if (lowerType.includes('additive') || lowerType.includes('additif')) return '🧪';
  if (lowerType.includes('digestate') || lowerType.includes('digestat')) return '🟤';

  // Default
  return '📦';
};

// Helper component to render icon with consistent styling
export const ItemIcon = ({ type, className }: { type: string, className?: string }) => {
  const emoji = getEmojiForType(type);
  
  return (
    <span 
      className={`inline-flex items-center justify-center ${className || ''}`}
      style={{ 
        fontSize: '1.2em',
        lineHeight: 1,
        filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.1))'
      }}
      title={type}
    >
      {emoji}
    </span>
  );
};
