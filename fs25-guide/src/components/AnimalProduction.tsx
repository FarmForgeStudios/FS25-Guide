import React, { useState, useEffect, useMemo } from 'react';
import { Droplets, Wheat, Package, PawPrint, Info, Edit2, Check, Wifi, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { useGameData, Animal, ResourceState } from '../lib/GameDataContext';
import { ItemIcon } from '../lib/icons';
import { useLanguage } from '../lib/LanguageContext';
import { translateFillType } from '../lib/translations';

// Configuration des espèces (Templates)
const SPECIES_CONFIG: Record<string, { food: string[]; products: string[]; needsWater: boolean }> = {
  chicken: {
    food: ['WHEAT', 'BARLEY', 'SORGHUM'],
    products: ['EGG'],
    needsWater: true
  },
  sheep: {
    food: ['GRASS', 'DRYGRASS_WINDROW'],
    products: ['WOOL'],
    needsWater: true
  },
  cow: {
    food: ['GRASS', 'DRYGRASS_WINDROW', 'SILAGE', 'FORAGE'],
    products: [],
    needsWater: true
  },
  horse: {
    food: ['DRYGRASS_WINDROW', 'OAT', 'SORGHUM'],
    products: ['HORSE_TRAINING'],
    needsWater: true
  },
  pig: {
    food: ['MAIZE', 'CANOLA', 'WHEAT', 'SUNFLOWER', 'BARLEY', 'POTATO', 'SOYBEAN', 'SUGARBEET'],
    products: [],
    needsWater: true
  },
  bee: {
    food: [],
    products: ['HONEY'],
    needsWater: false
  },
  goat: {
    food: ['GRASS', 'DRYGRASS_WINDROW'],
    products: [],
    needsWater: true
  },
  buffalo: {
    food: ['GRASS', 'DRYGRASS_WINDROW', 'SILAGE', 'FORAGE'],
    products: [],
    needsWater: true
  }
};

// Base de données des races connues pour l'affichage et l'association aux espèces
const BREED_DATABASE: Record<string, { nameKey: string; species: string; products?: string[] }> = {
  // Poules
  'chicken': { nameKey: 'species.chicken', species: 'chicken' },
  'rooster': { nameKey: 'breed.rooster', species: 'chicken', products: [] },
  
  // Moutons
  'sheep': { nameKey: 'species.sheep', species: 'sheep' },
  'bentheim': { nameKey: 'breed.bentheim', species: 'sheep' },
  'steinschaf': { nameKey: 'breed.steinschaf', species: 'sheep' },
  'swiss_brown_sheep': { nameKey: 'breed.swiss_brown_sheep', species: 'sheep' },
  'black_welsh': { nameKey: 'breed.black_welsh', species: 'sheep' },
  
  // Vaches
  'cow': { nameKey: 'species.cow', species: 'cow' },
  'holstein': { nameKey: 'breed.holstein', species: 'cow' },
  'brown_swiss': { nameKey: 'breed.brown_swiss', species: 'cow' },
  'swiss_brown': { nameKey: 'breed.brown_swiss', species: 'cow' },
  'simmental': { nameKey: 'breed.simmental', species: 'cow' },
  'limousin': { nameKey: 'breed.limousin', species: 'cow' },
  'angus': { nameKey: 'breed.angus', species: 'cow' },
  'ayrshire': { nameKey: 'breed.ayrshire', species: 'cow' },
  'waterbuffalo': { nameKey: 'breed.waterbuffalo', species: 'buffalo' },
  'buffalo': { nameKey: 'breed.waterbuffalo', species: 'buffalo' },
  
  // Chevaux
  'horse': { nameKey: 'species.horse', species: 'horse' },
  'horse_grey': { nameKey: 'Cheval (Gris)', species: 'horse' },
  'horse_pinto': { nameKey: 'Cheval (Pie)', species: 'horse' },
  'horse_palomino': { nameKey: 'Cheval (Palomino)', species: 'horse' },
  'horse_chestnut': { nameKey: 'Cheval (Alezan)', species: 'horse' },
  'horse_bay': { nameKey: 'Cheval (Bai)', species: 'horse' },
  'horse_black': { nameKey: 'Cheval (Noir)', species: 'horse' },
  'horse_seal_brown': { nameKey: 'Cheval (Bai-Brun)', species: 'horse' },
  'horse_dun': { nameKey: 'Cheval (Isabelle)', species: 'horse' },

  // Fallback for generic horse keys if mod sends them differently
  'haflinger': { nameKey: 'breed.haflinger', species: 'horse' },
  
  // Cochons
  'pig': { nameKey: 'species.pig', species: 'pig' },
  'german_landrace': { nameKey: 'breed.german_landrace', species: 'pig' },
  'bentheim_black_pied': { nameKey: 'breed.bentheim_black_pied', species: 'pig' },
  'berkshire': { nameKey: 'breed.berkshire', species: 'pig' },
  'mangalitsa': { nameKey: 'breed.mangalitsa', species: 'pig' },
  'turopolje': { nameKey: 'breed.turopolje', species: 'pig' },
  
  // Autres
  'bee': { nameKey: 'species.bee', species: 'bee' },
  'goat': { nameKey: 'species.goat', species: 'goat' },
  'boer_goat': { nameKey: 'breed.boer_goat', species: 'goat' },
  
  // Ajouts courants
  'charolais': { nameKey: 'breed.charolais', species: 'cow' },
  'salers': { nameKey: 'breed.salers', species: 'cow' },
  'aubrac': { nameKey: 'breed.aubrac', species: 'cow' },
  'highland': { nameKey: 'breed.highland', species: 'cow' },
  'highlandcattle': { nameKey: 'breed.highlandcattle', species: 'cow' }
};

const TRANSLATION_MAP: Record<string, string> = {
  'Cow': 'Vache', 'Cows': 'Vaches',
  'Sheep': 'Mouton', 'Sheeps': 'Moutons',
  'Pig': 'Cochon', 'Pigs': 'Cochons',
  'Chicken': 'Poule', 'Chickens': 'Poules',
  'Rooster': 'Coq', 'Roosters': 'Coqs',
  'Horse': 'Cheval', 'Horses': 'Chevaux',
  'Goat': 'Chèvre', 'Goats': 'Chèvres',
  'Bee': 'Abeille', 'Bees': 'Abeilles',
  'Duck': 'Canard', 'Ducks': 'Canards',
  'Donkey': 'Âne', 'Donkeys': 'Ânes',
  'Cattle': 'Vache', 
  'Bull': 'Taureau', 'Bulls': 'Taureaux',
  'Calf': 'Veau', 'Calves': 'Veaux',
  'Lamb': 'Agneau', 'Lambs': 'Agneaux',
  'Piglet': 'Porcelet', 'Piglets': 'Porcelets',
  'Foal': 'Poulain', 'Foals': 'Poulains',
  'Chick': 'Poussin', 'Chicks': 'Poussins',
};

function translateBreedName(name: string, lang: string): string {
  if (!name) return '';
  if (lang === 'en') return name.replace(/_/g, ' ');

  let translated = name;
  translated = translated.replace(/_/g, ' ');
  
  if (translated.toLowerCase().includes('seal brown')) translated = translated.replace(/Seal Brown/yi, 'Bai-Brun');
  
  Object.entries(TRANSLATION_MAP).forEach(([eng, fr]) => {
    const regex = new RegExp(`\\b${eng}\\b`, 'gi');
    translated = translated.replace(regex, fr);
  });
  
  if (translated.includes('Cheval') && !translated.includes('(')) {
     const colors = ['Gris', 'Pie', 'Palomino', 'Alezan', 'Bai', 'Noir', 'Bai-Brun', 'Isabelle'];
     for (const color of colors) {
       if (translated.includes(color) && !translated.includes(`(${color})`)) {
         translated = translated.replace(color, `(${color})`);
       }
     }
  }

  return translated.charAt(0).toUpperCase() + translated.slice(1);
}

type AnimalCardState = {
  id: string;
  penId: string;
  penName: string;
  breedName: string;
  species: string;
  count: number;
  health: number;
  reproduction: number;
  productivity: number;
  water: ResourceState;
  food: Record<string, ResourceState>;
  products: Record<string, ResourceState>;
  config: {
    food: string[];
    products: string[];
    needsWater: boolean;
  };
};

interface ProgressBarProps {
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  value: ResourceState;
  onChange: (newVal: ResourceState) => void;
  key?: string | number;
  readonly?: boolean;
  unit?: string;
}

function ProgressBar({ 
  label, 
  icon: Icon, 
  colorClass, 
  bgClass, 
  value, 
  onChange,
  readonly = false,
  unit = 'L'
}: ProgressBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempCurrent, setTempCurrent] = useState(value.current.toString());
  const [tempMax, setTempMax] = useState(value.max.toString());

  useEffect(() => {
    setTempCurrent(value.current.toString());
    setTempMax(value.max.toString());
  }, [value]);

  const percentage = value.max > 0 ? Math.min(100, Math.max(0, (value.current / value.max) * 100)) : 0;

  const handleSave = () => {
    onChange({
      current: parseInt(tempCurrent) || 0,
      max: parseInt(tempMax) || 1
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-1.5 overflow-hidden">
      <div className="flex justify-between items-center text-sm gap-2">
        <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300 truncate">
          <Icon className="w-4 h-4 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
        
        {isEditing && !readonly ? (
          <div className="flex items-center gap-1 shrink-0">
            <input 
              type="number" 
              value={tempCurrent}
              onChange={e => setTempCurrent(e.target.value)}
              className="w-16 px-1 py-0.5 text-right border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
            />
            {unit !== '%' && (
              <>
                <span className="text-gray-400 dark:text-gray-500">/</span>
                <input 
                  type="number" 
                  value={tempMax}
                  onChange={e => setTempMax(e.target.value)}
                  className="w-16 px-1 py-0.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                />
              </>
            )}
            <button onClick={handleSave} className="ml-1 p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded">
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <span className="text-gray-600 dark:text-gray-400 font-bold whitespace-nowrap">
              {unit === '%' ? (
                `${Math.round(percentage)}%`
              ) : (
                <>
                  {Math.round(value.current).toLocaleString()}
                  <span className="text-gray-400 dark:text-gray-500 font-normal mx-0.5">/</span>
                  {Math.round(value.max).toLocaleString()}
                  <span className="ml-0.5 text-[10px] font-normal opacity-70">{unit}</span>
                </>
              )}
            </span>
            {!readonly && (
              <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className={cn("h-2.5 w-full rounded-full overflow-hidden", bgClass)}>
        <div 
          className={cn("h-full transition-all duration-500", colorClass)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function ensureResourceState(val: any, defaultMax: number = 1000): ResourceState {
  if (val === undefined || val === null) return { current: 0, max: defaultMax };
  
  let current = 0;
  let max = -1;
  
  if (typeof val === 'number') {
    current = val;
  } else if (typeof val === 'string') {
    current = parseFloat(val) || 0;
  } else if (typeof val === 'object' && val !== null) {
    if (Array.isArray(val)) {
      // If it's an array, try to find the first numeric value
      const firstItem = val.find((item: any) => item && typeof item === 'object' && (item.fillLevel !== undefined || item.current !== undefined || item.level !== undefined || item.value !== undefined));
      if (firstItem) {
        current = Number(firstItem.fillLevel || firstItem.current || firstItem.level || firstItem.value || 0);
        if (firstItem.max !== undefined) max = Number(firstItem.max);
        else if (firstItem.capacity !== undefined) max = Number(firstItem.capacity);
      }
    } else if (val.current !== undefined) current = Number(val.current);
    else if (val.fillLevel !== undefined) {
      if (Array.isArray(val.fillLevel)) {
        // If it's an array, try to find the first numeric value
        const firstItem = val.fillLevel.find((item: any) => item && typeof item === 'object' && item.fillLevel !== undefined);
        if (firstItem) current = Number(firstItem.fillLevel);
      } else if (typeof val.fillLevel === 'object' && val.fillLevel !== null) {
        current = Number(val.fillLevel.fillLevel || val.fillLevel.level || val.fillLevel.value || 0);
      } else {
        current = Number(val.fillLevel);
      }
    }
    else if (val.level !== undefined) current = Number(val.level);
    else if (val.value !== undefined) current = Number(val.value);
    
    if (!Array.isArray(val)) {
      if (val.max !== undefined) max = Number(val.max);
      else if (val.capacity !== undefined) max = Number(val.capacity);
    }
  }
  
  if (isNaN(current)) current = 0;
  
  // Detect if it's a percentage
  let isPercentage = false;
  if (max === 100 || max === 1) {
    isPercentage = true;
  } else if (max === -1 && current > 0 && current <= 1) {
    isPercentage = true;
  }
  
  if (isPercentage) {
    if (current > 1) {
      current = current / 100;
    }
    max = 1;
  } else {
    if (max === -1 || isNaN(max) || max <= 0) {
      max = Math.max(current, defaultMax);
    }
  }
  
  return { current, max };
}

function parseFoodState(val: any, defaultMax: number = 5000): Record<string, ResourceState> {
  if (val === undefined || val === null) return {};
  
  if (typeof val === 'number' || typeof val === 'string') {
    const parsed = Number(val);
    if (!isNaN(parsed)) {
      return { 'TOTAL': { current: parsed, max: defaultMax } };
    }
  }
  
  const productKeys = ['MANURE', 'LIQUIDMANURE', 'SLURRY', 'MILK', 'EGGS', 'EGG', 'WOOL', 'HONEY', 'GOATMILK', 'BUFFALOMILK'];
  
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      const result: Record<string, ResourceState> = {};
      val.forEach(item => {
        if (item && typeof item === 'object') {
          const type = item.fillType || item.type || item.name;
          if (type && !productKeys.includes(type.toUpperCase())) {
            result[type.toUpperCase()] = ensureResourceState(item, defaultMax);
          }
        }
      });
      if (Object.keys(result).length > 0) return result;
    } else if (val.fillLevel && typeof val.fillLevel === 'object') {
      // Handle { fillLevel: { ... } } or { fillLevel: [ ... ] } format
      const result: Record<string, ResourceState> = {};
      const items = Array.isArray(val.fillLevel) ? val.fillLevel : [val.fillLevel];
      
      items.forEach((item: any) => {
        if (item && typeof item === 'object') {
          const type = item.fillType || item.type || item.name;
          if (type && !productKeys.includes(type.toUpperCase())) {
            result[type.toUpperCase()] = ensureResourceState(item, defaultMax);
          }
        }
      });
      // Also add any other keys that might be present (like STRAW)
      for (const [key, item] of Object.entries(val)) {
        if (key !== 'fillLevel' && !productKeys.includes(key.toUpperCase()) && (typeof item === 'number' || typeof item === 'string' || (typeof item === 'object' && item !== null))) {
          result[key.toUpperCase()] = ensureResourceState(item, defaultMax);
        }
      }
      if (Object.keys(result).length > 0) return result;
    } else if ('current' in val || 'fillLevel' in val || 'level' in val || 'value' in val) {
      return { 'TOTAL': ensureResourceState(val, defaultMax) };
    } else {
      const result: Record<string, ResourceState> = {};
      let hasKeys = false;
      for (const [key, item] of Object.entries(val)) {
        if (!productKeys.includes(key.toUpperCase()) && (typeof item === 'number' || typeof item === 'string' || (typeof item === 'object' && item !== null))) {
          result[key.toUpperCase()] = ensureResourceState(item, defaultMax);
          hasKeys = true;
        }
      }
      if (hasKeys) return result;
    }
  }
  
  return { 'TOTAL': { current: 0, max: defaultMax } };
}

export function AnimalProduction() {
  const { data, syncStatus, lastSync, updateAnimal: globalUpdateAnimal } = useGameData();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('all');

  const animalCards = useMemo(() => {
    if (!data.animals || data.animals.length === 0) return {};

    const newCards: Record<string, AnimalCardState> = {};
    const productMapping: Record<string, string> = {
      'milk': 'MILK', 'egg': 'EGG', 'eggs': 'EGG', 'wool': 'WOOL', 'manure': 'MANURE',
      'slurry': 'LIQUIDMANURE', 'liquidmanure': 'LIQUIDMANURE', 'liquid_manure': 'LIQUIDMANURE',
      'honey': 'HONEY', 'goatmilk': 'GOAT_MILK', 'buffalomilk': 'BUFFALO_MILK', 'straw': 'STRAW', 'litter': 'MANURE',
      'goat_milk': 'GOAT_MILK', 'buffalo_milk': 'BUFFALO_MILK', 'strawpellets': 'STRAWPELLETS', 'haypellets': 'HAYPELLETS',
      'oeufs': 'EGG', 'lait': 'MILK', 'laine': 'WOOL', 'fumier': 'MANURE', 'lisier': 'LIQUIDMANURE', 'miel': 'HONEY', 'paille': 'STRAW', 'litiere': 'STRAW'
    };
    
    data.animals.forEach(animalData => {
      const breeds = animalData.breeds && Object.keys(animalData.breeds).length > 0 
        ? animalData.breeds 
        : { [animalData.breed || animalData.type || 'Unknown']: animalData.count || 1 };

      Object.entries(breeds).forEach(([breedName, breedCount]) => {
        const rawType = breedName.toLowerCase();
        let breedKey = rawType;
        let breedDef = BREED_DATABASE[breedKey];
        
        if (!breedDef && breedKey.includes(' ')) {
          breedKey = breedKey.replace(/\s+/g, '_');
          breedDef = BREED_DATABASE[breedKey];
        }

        if (!breedDef) {
          const PREFIX_TO_SPECIES: Record<string, string> = {
            'cow_': 'cow', 'sheep_': 'sheep', 'pig_': 'pig', 'chicken_': 'chicken',
            'rooster_': 'chicken', 'horse_': 'horse', 'goat_': 'goat', 'bee_': 'bee', 'duck_': 'duck'
          };

          for (const [prefix, expectedSpecies] of Object.entries(PREFIX_TO_SPECIES)) {
            if (breedKey.startsWith(prefix)) {
              const stripped = breedKey.substring(prefix.length);
              const potentialMatch = BREED_DATABASE[stripped];
              if (potentialMatch && potentialMatch.species === expectedSpecies) {
                breedKey = stripped;
                breedDef = potentialMatch;
                break;
              }
            }
          }
        }

        if (!breedDef) {
          let guessedSpecies = 'cow';
          if (rawType.includes('cow') || rawType.includes('vache') || rawType.includes('kühe')) guessedSpecies = 'cow';
          else if (rawType.includes('sheep') || rawType.includes('mouton') || rawType.includes('schaf')) guessedSpecies = 'sheep';
          else if (rawType.includes('chicken') || rawType.includes('poule') || rawType.includes('hühner')) guessedSpecies = 'chicken';
          else if (rawType.includes('pig') || rawType.includes('cochon') || rawType.includes('schwein')) guessedSpecies = 'pig';
          else if (rawType.includes('horse') || rawType.includes('cheval') || rawType.includes('pferde')) guessedSpecies = 'horse';
          else if (rawType.includes('bee') || rawType.includes('abeille')) guessedSpecies = 'bee';
          
          breedDef = {
            nameKey: translateBreedName(breedName, language),
            species: guessedSpecies
          };
        }

        const speciesConfig = SPECIES_CONFIG[breedDef.species] || SPECIES_CONFIG['cow'];
        const cardId = `${animalData.penId || animalData.id}_${breedKey}`;

        if (!newCards[cardId]) {
          const productsList = breedDef.products || speciesConfig.products;
          const initialProducts: Record<string, ResourceState> = {};
          productsList.forEach(p => initialProducts[p] = { current: 0, max: 1000 });

          newCards[cardId] = {
            id: cardId,
            penId: animalData.penId || animalData.id,
            penName: animalData.penName || animalData.name || 'Enclos sans nom',
            breedName: breedDef.nameKey.startsWith('breed.') || breedDef.nameKey.startsWith('species.') ? t(breedDef.nameKey) : breedDef.nameKey,
            species: breedDef.species,
            count: 0,
            health: 0,
            reproduction: 0,
            productivity: 0,
            water: { current: 0, max: 0 },
            food: {},
            products: initialProducts,
            config: {
              food: speciesConfig.food,
              products: productsList,
              needsWater: speciesConfig.needsWater
            }
          };
        }

        const card = newCards[cardId];
        card.count += breedCount;
        
        const normalizePercentage = (val: any): number => {
          let num = Number(val);
          if (isNaN(num)) return 0;
          if (num > 1) return num / 100;
          return num;
        };

        // Stats are shared for the pen
        card.health = normalizePercentage(animalData.health);
        card.reproduction = normalizePercentage(animalData.reproduction);
        card.productivity = normalizePercentage(animalData.productivity);

        if (animalData.water) {
          const w = ensureResourceState(animalData.water, 2000);
          card.water.current = w.current;
          card.water.max = w.max;
        }

        if (animalData.food) {
          const f = parseFoodState(animalData.food, 10000);
          Object.entries(f).forEach(([type, state]) => {
            card.food[type] = state;
          });
        }

        if (animalData.products) {
          Object.entries(animalData.products).forEach(([key, val]) => {
            const mappedName = productMapping[key.toLowerCase()] || key.toUpperCase();
            const state = ensureResourceState(val);
            
            if (mappedName === 'STRAW') {
              if (!card.food['STRAW']) card.food['STRAW'] = { current: 0, max: 0 };
              card.food['STRAW'].current = state.current;
              card.food['STRAW'].max = state.max;
            } else {
              if (!card.products[mappedName]) {
                card.products[mappedName] = { current: 0, max: 1000 };
              }
              card.products[mappedName].current = state.current;
              card.products[mappedName].max = state.max;
            }
          });
        }
      });
    });

    // Add global storage values for specific products
    if (data.storage) {
      Object.values(newCards).forEach(card => {
        const globalProducts = ['MILK', 'MANURE', 'LIQUIDMANURE', 'GOAT_MILK', 'BUFFALO_MILK', 'EGG', 'WOOL', 'HONEY', 'STRAWPELLETS', 'HAYPELLETS'];
        globalProducts.forEach(prod => {
          let storageKey = data.storage[prod] ? prod : (data.storage[prod.replace('_', '')] ? prod.replace('_', '') : null);
          if (!storageKey && prod === 'LIQUIDMANURE' && data.storage['LIQUID_MANURE']) {
            storageKey = 'LIQUID_MANURE';
          }
          if (card.config.products.includes(prod) && storageKey) {
            if (!card.products[prod] || card.products[prod].current === 0) {
              card.products[prod] = { 
                current: data.storage[storageKey].level, 
                max: data.storage[storageKey].capacity > 0 ? data.storage[storageKey].capacity : Math.max(1000, data.storage[storageKey].level)
              };
            }
          }
        });
        
        if (card.config.food.includes('STRAW') && data.storage['STRAW']) {
          if (!card.food['STRAW'] || card.food['STRAW'].current === 0) {
            card.food['STRAW'] = { 
              current: data.storage['STRAW'].level, 
              max: data.storage['STRAW'].capacity > 0 ? data.storage['STRAW'].capacity : Math.max(1000, data.storage['STRAW'].level)
            };
          }
        }
      });
    }

    return newCards;
  }, [data.animals, data.storage, language, t]);

  const updateAnimal = (id: string, updates: Partial<AnimalCardState>) => {
    const card = animalCards[id];
    if (!card) return;

    // Persist to global state using penId
    const globalUpdates: any = {};
    if (updates.count !== undefined) globalUpdates.count = updates.count;
    if (updates.health !== undefined) globalUpdates.health = updates.health;
    if (updates.productivity !== undefined) globalUpdates.productivity = updates.productivity;
    if (updates.water !== undefined) globalUpdates.water = updates.water;
    if (updates.food !== undefined) globalUpdates.food = updates.food;
    if (updates.products !== undefined) globalUpdates.products = updates.products;
    if (updates.penName !== undefined) globalUpdates.penName = updates.penName;
    
    if (Object.keys(globalUpdates).length > 0) {
      globalUpdateAnimal(card.penId, globalUpdates);
    }
  };

  const updateFood = (animalId: string, foodType: string, value: ResourceState) => {
    const card = animalCards[animalId];
    if (!card) return;
    const currentFood = card.food || {};
    const newFood = { ...currentFood, [foodType]: value };
    
    globalUpdateAnimal(card.penId, { food: newFood });
  };

  const updateProduct = (animalId: string, product: string, value: ResourceState) => {
    const card = animalCards[animalId];
    if (!card) return;
    const currentProducts = card.products || {};
    const newProducts = { ...currentProducts, [product]: value };

    globalUpdateAnimal(card.penId, { products: newProducts });
  };

  const sortedCards: AnimalCardState[] = (Object.values(animalCards) as AnimalCardState[]).sort((a, b) => {
     if (a.species !== b.species) return a.species.localeCompare(b.species);
     if (a.penName !== b.penName) return a.penName.localeCompare(b.penName);
     return a.breedName.localeCompare(b.breedName);
  });

  const availableSpecies = Array.from(new Set(sortedCards.map(card => card.species)));
  
  const filteredCards = activeTab === 'all' 
    ? sortedCards 
    : sortedCards.filter(card => card.species === activeTab);

  const cardsByPen = useMemo(() => {
    const groups: Record<string, { name: string, cards: AnimalCardState[] }> = {};
    filteredCards.forEach(card => {
      if (!groups[card.penId]) {
        groups[card.penId] = { name: card.penName, cards: [] };
      }
      groups[card.penId].cards.push(card);
    });
    return Object.entries(groups).sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [filteredCards]);

  const speciesIcons: Record<string, any> = {
    chicken: { icon: ItemIcon, color: 'text-amber-600', bg: 'bg-amber-50' },
    sheep: { icon: ItemIcon, color: 'text-green-600', bg: 'bg-green-50' },
    cow: { icon: ItemIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    horse: { icon: ItemIcon, color: 'text-orange-600', bg: 'bg-orange-50' },
    pig: { icon: ItemIcon, color: 'text-pink-600', bg: 'bg-pink-50' },
    bee: { icon: ItemIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    goat: { icon: ItemIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    buffalo: { icon: ItemIcon, color: 'text-indigo-600', bg: 'bg-indigo-50' }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 pb-24 space-y-6">
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md pb-4 pt-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('animals.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('animals.subtitle')}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              syncStatus === 'connected' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
              syncStatus === 'error' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
            )}>
              <Wifi className={cn("w-4 h-4", syncStatus === 'connected' && "animate-pulse")} />
              {syncStatus === 'connected' ? t('animals.sync.status') : syncStatus === 'error' ? t('animals.sync.error') : t('animals.sync.offline')}
            </div>
            {lastSync && syncStatus === 'connected' && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {t('animals.sync.last')} : {new Date(lastSync).toLocaleTimeString(language)}
              </span>
            )}
          </div>
        </div>

        {availableSpecies.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <button
              onClick={() => setActiveTab('all')}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                activeTab === 'all' 
                  ? "bg-gray-900 text-white border-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-100 shadow-sm" 
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
              )}
            >
              {t('production.all')}
            </button>
            {availableSpecies.map(species => {
              const config = speciesIcons[species] || { icon: PawPrint, color: 'text-gray-600', bg: 'bg-gray-50' };
              const Icon = config.icon;
              return (
                <button
                  key={species}
                  onClick={() => setActiveTab(species)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                    activeTab === species
                      ? cn("text-white border-transparent shadow-sm", 
                          species === 'chicken' ? "bg-amber-600 dark:bg-amber-500" :
                          species === 'cow' ? "bg-blue-600 dark:bg-blue-500" :
                          species === 'pig' ? "bg-pink-600 dark:bg-pink-500" :
                          species === 'sheep' ? "bg-green-600 dark:bg-green-500" :
                          species === 'horse' ? "bg-orange-600 dark:bg-orange-500" :
                          species === 'bee' ? "bg-yellow-500 dark:bg-yellow-400" :
                          species === 'goat' ? "bg-emerald-600 dark:bg-emerald-500" :
                          "bg-indigo-600 dark:bg-indigo-500"
                        )
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  )}
                >
                  <Icon type={species} className={cn("w-4 h-4", activeTab === species ? "text-white" : config.color)} />
                  {t(`species.${species}`)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {sortedCards.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <PawPrint className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('animals.no_animals')}</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
            {t('animals.no_animals_desc')}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {cardsByPen.map(([penId, group]) => (
            <div key={penId} className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{group.name}</h2>
                </div>
                <button 
                  onClick={() => {
                    const newName = prompt(t('animals.edit_pen_name') || 'Modifier le nom de l\'enclos', group.name);
                    if (newName !== null) {
                      // Update all cards in this pen
                      group.cards.forEach(card => updateAnimal(card.id, { penName: newName }));
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t('animals.edit_pen_name')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.cards.map(card => (
                  <div key={card.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl", 
                          card.species === 'chicken' ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" :
                          card.species === 'cow' ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                          card.species === 'pig' ? "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400" :
                          card.species === 'sheep' ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400" :
                          "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                        )}>
                          <ItemIcon type={card.species} className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{card.breedName}</h3>
                          <div className="flex flex-col gap-1 mt-1">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wider">{t('animals.quantity')}:</label>
                              <span className="text-sm font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 px-3 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                                {card.count || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {card.config.food.length > 0 && (
                      <div className="mb-5">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <Info className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                          {t('animals.accepted_food')}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {card.config.food.map(f => (
                            <span key={f} className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/30 rounded-md text-xs font-medium">
                              <ItemIcon type={f} className="w-3 h-3" />
                              {translateFillType(f, language)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4 mb-2">
                        <ProgressBar 
                          label={t('animals.health')} 
                          icon={Check} 
                          colorClass="bg-emerald-500 dark:bg-emerald-400" 
                          bgClass="bg-emerald-100 dark:bg-emerald-900/30"
                          value={{ current: card.health, max: 1 }}
                          onChange={() => {}}
                          readonly={true}
                          unit="%"
                        />
                        <ProgressBar 
                          label={t('animals.productivity')} 
                          icon={Clock} 
                          colorClass="bg-blue-500 dark:bg-blue-400" 
                          bgClass="bg-blue-100 dark:bg-blue-900/30"
                          value={{ current: card.productivity, max: 1 }}
                          onChange={() => {}}
                          readonly={true}
                          unit="%"
                        />
                        <ProgressBar 
                          label={t('animals.reproduction') || 'Reproduction'} 
                          icon={PawPrint} 
                          colorClass="bg-pink-500 dark:bg-pink-400" 
                          bgClass="bg-pink-100 dark:bg-pink-900/30"
                          value={{ current: card.reproduction, max: 1 }}
                          onChange={() => {}}
                          readonly={true}
                          unit="%"
                        />
                      </div>

                      {card.config.needsWater && (
                        <ProgressBar 
                          label={t('animals.water')} 
                          icon={Droplets} 
                          colorClass="bg-blue-500 dark:bg-blue-400" 
                          bgClass="bg-blue-100 dark:bg-blue-900/30"
                          value={card.water}
                          onChange={() => {}}
                          readonly={true}
                          unit={card.water.max === 1 ? "%" : "L"}
                        />
                      )}

                      {(card.config.food.length > 0 || Object.keys(card.food).some(k => k !== 'STRAW' && k !== 'TOTAL')) && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-4">
                          <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('animals.food')}</div>
                          
                          {(() => {
                            let currentFood = 0;
                            let maxFood = 0;
                            if (card.food['TOTAL'] && card.food['TOTAL'].max > 0) {
                              currentFood = card.food['TOTAL'].current;
                              maxFood = card.food['TOTAL'].max;
                            } else {
                              Object.entries(card.food).forEach(([k, f]) => {
                                if (k !== 'TOTAL' && k !== 'STRAW') {
                                  currentFood += f.current;
                                  if (f.max > maxFood) {
                                    maxFood = f.max;
                                  }
                                }
                              });
                            }
                            
                            const foodTypes = new Set([...card.config.food, ...Object.keys(card.food)]);
                            foodTypes.delete('TOTAL');
                            foodTypes.delete('STRAW');
                            
                            return (
                              <>
                                <ProgressBar 
                                  label={t('animals.food_total')} 
                                  icon={Wheat} 
                                  colorClass="bg-amber-500 dark:bg-amber-400" 
                                  bgClass="bg-amber-100 dark:bg-amber-900/30"
                                  value={{ current: currentFood, max: maxFood }}
                                  onChange={() => {}}
                                  readonly={true}
                                  unit={maxFood === 1 ? "%" : "L"}
                                />
                                {Array.from(foodTypes).map(foodType => {
                                  const value = card.food[foodType] || { current: 0, max: 0 };
                                  const displayMax = value.max > 0 ? value.max : maxFood;
                                  
                                  return (
                                    <div key={foodType}>
                                      <ProgressBar 
                                        label={translateFillType(foodType, language)} 
                                        icon={(props) => <ItemIcon type={foodType} {...props} />} 
                                        colorClass={"bg-amber-400 dark:bg-amber-500"} 
                                        bgClass={"bg-amber-50 dark:bg-amber-900/20"}
                                        value={{ current: value.current, max: displayMax }}
                                        onChange={() => {}}
                                        readonly={true}
                                        unit={displayMax === 1 ? "%" : "L"}
                                      />
                                    </div>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>
                      )}

                      {(() => {
                        const validProducts = Array.from(new Set([...card.config.products, ...Object.keys(card.products)]))
                          .filter(product => product !== 'STRAW' && product !== 'MANURE' && product !== 'LIQUIDMANURE' && product !== 'MILK' && product !== 'GOAT_MILK' && product !== 'BUFFALO_MILK');
                        
                        if (validProducts.length === 0) return null;

                        return (
                          <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-4">
                            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('production.output')}</div>

                            {validProducts.map(product => {
                                const isWaste = product === 'MANURE' || product === 'LIQUIDMANURE';
                                return (
                                  <div key={product}>
                                    <ProgressBar 
                                      label={translateFillType(product, language)} 
                                      icon={(props) => <ItemIcon type={product} {...props} />} 
                                      colorClass={isWaste ? "bg-amber-800 dark:bg-amber-600" : "bg-emerald-500 dark:bg-emerald-400"} 
                                      bgClass={isWaste ? "bg-amber-100 dark:bg-amber-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}
                                      value={{
                                        current: card.products[product]?.current || 0,
                                        max: (card.products[product]?.max && card.products[product].max > 0) ? card.products[product].max : 1000
                                      }}
                                      onChange={() => {}}
                                      readonly={true}
                                      unit={card.products[product]?.max === 1 ? "%" : "L"}
                                    />
                                  </div>
                                );
                              })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
