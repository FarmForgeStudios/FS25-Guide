import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { translateFillType } from './translations';
import { useLanguage } from './LanguageContext';
import { safeStorage } from './storage';
import cultureData from '../data-culture.json';

export interface PrecisionFarmingData {
  environmentalScore: number;
  nitrogen: number;
  ph: number;
  weedControl: number;
  soilSampling: number;
  tillage: number;
  soilType: string;
}

export interface Field {
  id: string;
  displayId?: string;
  x: number;
  y: number;
  z?: number;
  crop: string;
  plannedFruit?: string;
  size?: number;
  farmlandSize?: number;
  fieldSize?: number;
  growthState: string;
  lastGrowthState?: number;
  weedState?: number;
  stoneLevel?: number;
  groundType?: string;
  sprayType?: string;
  sprayLevel?: number;
  limeLevel?: number;
  rollerLevel?: number;
  plowLevel?: number;
  stubbleShredLevel?: number;
  waterLevel?: number;
  needsFertilizer?: boolean;
  needsPlowing?: boolean;
  needsLime?: boolean;
  needsWeeding?: boolean;
  isOwned?: boolean;
  precisionFarming?: PrecisionFarmingData;
}

export interface MarketData {
  name: string;
  basePrice: number;
  stations: {
    name: string;
    price: number;
    buyPrice: number;
    trend: number;
    variation: number;
  }[];
}

export interface ResourceState {
  current: number;
  max: number;
}

export interface Animal {
  id: string;
  name?: string;
  type?: string;
  species: string;
  breed?: string;
  breeds?: Record<string, number>;
  age?: number;
  health?: number;
  reproduction?: number;
  productivity?: number;
  food?: number | ResourceState | Record<string, number | ResourceState>;
  water?: number | ResourceState;
  straw?: number | ResourceState;
  count?: number;
  products?: Record<string, number | ResourceState>;
  penId?: string;
  penName?: string;
}

export interface ProductionData {
  name: string;
  inputs: Record<string, ResourceState>;
  outputs: Record<string, ResourceState>;
  status?: string;
  isOwned?: boolean;
  recipes?: {
    name: string;
    costPerHour: number;
    costPerMonth: number;
    status: string;
  }[];
}

export interface Vehicle {
  name: string;
  brand?: string;
  type?: string;
  category: string;
  operatingTime: number;
  damage: number;
  wear: number;
  dirt: number;
  fuel: number;
  fuelMax: number;
  fuelType?: string;
  price?: number;
}

export interface PricePoint {
  time: string;
  price: number;
}

export type PriceHistory = Record<string, PricePoint[]>;

export interface GameData {
  fields: Field[];
  storage: Record<string, { level: number; capacity: number }>;
  prices: Record<string, number>;
  market: Record<string, MarketData>;
  bales: Record<string, number>;
  animals: Animal[];
  productions: Record<string, ProductionData>;
  vehicles: Vehicle[];
  currentMonth?: number;
  mapName?: string;
  priceHistory?: PriceHistory;
}

interface GameDataContextType {
  data: GameData;
  syncStatus: 'disconnected' | 'connected' | 'error';
  lastSync: Date | null;
  connectLocalFolder: () => Promise<void>;
  handleManualJsonUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateField: (id: string, updates: Partial<Field>) => void;
  updateAnimal: (id: string, updates: Partial<Animal>) => void;
  updateVehicle: (name: string, updates: Partial<Vehicle>) => void;
  removeField: (id: string) => void;
  addField: (field: Field) => void;
  addFields: (fields: Field[]) => void;
  toggleProductionOwnership: (name: string) => void;
  addManualProduction: (production: ProductionData) => void;
  renameMap: (newName: string) => void;
}

const GameDataContext = createContext<GameDataContextType | undefined>(undefined);

export const useGameData = () => {
  const context = useContext(GameDataContext);
  if (!context) throw new Error('useGameData must be used within a GameDataProvider');
  return context;
};

export const GameDataProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const { language } = useLanguage();
  const [currentMap, setCurrentMap] = useState<string>(safeStorage.getItem('lastMapName') || 'DefaultMap');
  
  const [data, setData] = useState<GameData>(() => {
    const initialHistory: PriceHistory = {};
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    
    cultureData.forEach(c => {
      const priceNum = parseInt(c.avgPrice.replace(/[^0-9]/g, ''));
      if (!isNaN(priceNum)) {
        initialHistory[c.name] = [{ time: now, price: priceNum }];
      }
    });

    return { 
      fields: [], 
      storage: {}, 
      prices: {}, 
      market: {}, 
      bales: {}, 
      animals: [],
      productions: {},
      vehicles: [],
      mapName: 'DefaultMap',
      priceHistory: initialHistory
    };
  });
  
  const [syncStatus, setSyncStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [dirHandle, setDirHandle] = useState<any>(null);
  const [isManualMode, setIsManualMode] = useState<boolean>(
    safeStorage.getItem('isManualMode') === 'true'
  );

  // Persist isManualMode changes
  useEffect(() => {
    safeStorage.setItem('isManualMode', String(isManualMode));
  }, [isManualMode]);

  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);
  
  const manualOverridesRef = useRef<Record<string, Partial<Field>>>({});
  const animalOverridesRef = useRef<Record<string, Partial<Animal>>>({});
  const vehicleOverridesRef = useRef<Record<string, Partial<Vehicle>>>({});
  const deletedFieldsRef = useRef<Set<string>>(new Set());
  const manualProductionOverridesRef = useRef<Record<string, boolean>>({});
  const manualProductionsRef = useRef<Record<string, ProductionData>>({});
  const lastProcessedJsonRef = useRef<string>('');

  const loadMapData = (mapName: string) => {
    setCurrentMap(mapName);
    safeStorage.setItem('lastMapName', mapName);

    const baseMapName = mapName.split(' - Save ')[0];

    // Load Game Data
    let savedData = safeStorage.getItem(`gameData_${mapName}`);
    if (!savedData && baseMapName !== mapName) {
      savedData = safeStorage.getItem(`gameData_${baseMapName}`);
    }

    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (!parsed.priceHistory) parsed.priceHistory = {};
        setData(parsed);
      } catch (e) {}
    } else {
      // Reset to default if no saved data for this map
      const initialHistory: PriceHistory = {};
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      cultureData.forEach(c => {
        const priceNum = parseInt(c.avgPrice.replace(/[^0-9]/g, ''));
        if (!isNaN(priceNum)) {
          initialHistory[c.name] = [{ time: now, price: priceNum }];
        }
      });

      setData({
        fields: [],
        storage: {},
        prices: {},
        market: {},
        bales: {},
        animals: [],
        productions: {},
        vehicles: [],
        mapName: mapName,
        priceHistory: initialHistory
      });
    }

    // Load Overrides
    let savedOverrides = safeStorage.getItem(`manualOverrides_${mapName}`);
    if (!savedOverrides && baseMapName !== mapName) savedOverrides = safeStorage.getItem(`manualOverrides_${baseMapName}`);
    manualOverridesRef.current = savedOverrides ? JSON.parse(savedOverrides) : {};

    let savedDeleted = safeStorage.getItem(`deletedFields_${mapName}`);
    if (!savedDeleted && baseMapName !== mapName) savedDeleted = safeStorage.getItem(`deletedFields_${baseMapName}`);
    deletedFieldsRef.current = savedDeleted ? new Set(JSON.parse(savedDeleted)) : new Set();

    let savedProdOverrides = safeStorage.getItem(`manualProductionOverrides_${mapName}`);
    if (!savedProdOverrides && baseMapName !== mapName) savedProdOverrides = safeStorage.getItem(`manualProductionOverrides_${baseMapName}`);
    manualProductionOverridesRef.current = savedProdOverrides ? JSON.parse(savedProdOverrides) : {};

    let savedAnimalOverrides = safeStorage.getItem(`animalOverrides_${mapName}`);
    if (!savedAnimalOverrides && baseMapName !== mapName) savedAnimalOverrides = safeStorage.getItem(`animalOverrides_${baseMapName}`);
    animalOverridesRef.current = savedAnimalOverrides ? JSON.parse(savedAnimalOverrides) : {};

    let savedVehicleOverrides = safeStorage.getItem(`vehicleOverrides_${mapName}`);
    if (!savedVehicleOverrides && baseMapName !== mapName) savedVehicleOverrides = safeStorage.getItem(`vehicleOverrides_${baseMapName}`);
    vehicleOverridesRef.current = savedVehicleOverrides ? JSON.parse(savedVehicleOverrides) : {};

    let savedManualProds = safeStorage.getItem(`manualProductions_${mapName}`);
    if (!savedManualProds && baseMapName !== mapName) savedManualProds = safeStorage.getItem(`manualProductions_${baseMapName}`);
    manualProductionsRef.current = savedManualProds ? JSON.parse(savedManualProds) : {};
    
    lastProcessedJsonRef.current = '';
  };

  const clearData = () => {
    setData({
      fields: [],
      storage: {},
      prices: {},
      market: {},
      bales: {},
      animals: [],
      productions: {},
      vehicles: [],
      mapName: 'UnknownMap',
      priceHistory: {}
    });
    setSyncStatus('disconnected');
    setLastSync(null);
    lastProcessedJsonRef.current = '';
  };

  const renameMap = (newName: string) => {
    setData(prev => {
      safeStorage.removeItem(`gameData_${prev.mapName}`);
      const mapName = newName || 'ImportManuel';
      setCurrentMap(mapName);
      safeStorage.setItem('lastMapName', mapName);
      return { ...prev, mapName };
    });
  };

  // Load initial map on mount
  useEffect(() => {
    loadMapData(currentMap);
  }, []);

  // Save to safeStorage on change
  useEffect(() => {
    if (data.mapName && data.mapName !== 'DefaultMap') {
      // Only save if we have actual data to prevent overwriting with empty state when game is off
      if (data.fields.length > 0 || Object.keys(data.storage).length > 0 || Object.keys(data.prices).length > 0 || data.vehicles.length > 0) {
        safeStorage.setItem(`gameData_${data.mapName}`, JSON.stringify(data));
        safeStorage.setItem(`manualOverrides_${data.mapName}`, JSON.stringify(manualOverridesRef.current));
        safeStorage.setItem(`deletedFields_${data.mapName}`, JSON.stringify(Array.from(deletedFieldsRef.current)));
        safeStorage.setItem(`manualProductionOverrides_${data.mapName}`, JSON.stringify(manualProductionOverridesRef.current));
        safeStorage.setItem(`animalOverrides_${data.mapName}`, JSON.stringify(animalOverridesRef.current));
        safeStorage.setItem(`vehicleOverrides_${data.mapName}`, JSON.stringify(vehicleOverridesRef.current));
        safeStorage.setItem(`manualProductions_${data.mapName}`, JSON.stringify(manualProductionsRef.current));
        safeStorage.setItem('lastMapName', data.mapName);
        
        // Push manual data to server for other devices
        const manualData = {
          manualOverrides: manualOverridesRef.current,
          deletedFields: Array.from(deletedFieldsRef.current),
          manualProductionOverrides: manualProductionOverridesRef.current,
          animalOverrides: animalOverridesRef.current,
          vehicleOverrides: vehicleOverridesRef.current,
          manualProductions: manualProductionsRef.current
        };
        fetch('/api/manual-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(manualData)
        }).catch(() => {});
      }
    }
  }, [data]);

  // Try to fetch map name if it's UnknownMap and game is running
  useEffect(() => {
    if (data.mapName === 'UnknownMap' && syncStatus === 'connected') {
      fetch('/api/scan-savegame')
        .then(res => res.json())
        .then(saveData => {
          if (saveData.mapTitle || saveData.mapId) {
            const newMapName = saveData.mapTitle || saveData.mapId;
            setData(prev => ({ ...prev, mapName: newMapName }));
            setCurrentMap(newMapName);
          }
        })
        .catch(() => {});
    }
  }, [data.mapName, syncStatus]);

  const processJsonData = (jsonData: any): boolean => {
    const jsonString = JSON.stringify(jsonData);
    if (jsonString === lastProcessedJsonRef.current) {
      return false; // No changes
    }
    
    let incomingMapName = jsonData.mapName || jsonData.mapTitle || jsonData.missionName || jsonData.mapId || 'UnknownMap';
    
    // Prevent infinite loop if we resolved the map name via API but the JSON still says UnknownMap
    if (incomingMapName === 'UnknownMap' && currentMap !== 'UnknownMap' && currentMap !== 'DefaultMap') {
      incomingMapName = currentMap;
    }
    
    // If map changed, load the correct context first
    if (incomingMapName !== currentMap) {
      loadMapData(incomingMapName);
      // We return true to trigger a re-render with the new map context
      // The next polling interval will then process the data for the new map
      return true;
    }

    lastProcessedJsonRef.current = jsonString;

    const parsePrice = (val: any) => {
      if (val === undefined || val === null) return 0;
      if (typeof val === 'number') return isFinite(val) ? val : 0;
      if (typeof val === 'string') {
        const parsed = parseFloat(val.replace(/\s/g, '').replace(',', '.'));
        return isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    setData(prev => {
      try {
        const newFields = (Array.isArray(jsonData.fields) ? jsonData.fields : [])
          .filter((f: any) => !deletedFieldsRef.current.has(String(f.id)))
        .map((f: any) => {
        const existing = prev.fields.find(pf => pf.id === String(f.id));
        const overrides = manualOverridesRef.current[String(f.id)] || {};
        
        // Handle various coordinate formats from different mod versions
        const rawX = f.x !== undefined ? f.x : (f.posX !== undefined ? f.posX : (f.centerX !== undefined ? f.centerX : (f.cx !== undefined ? f.cx : 0)));
        const rawZ = f.z !== undefined ? f.z : (f.posZ !== undefined ? f.posZ : (f.centerZ !== undefined ? f.centerZ : (f.cz !== undefined ? f.cz : 0)));
        
        return {
          id: String(f.id),
          displayId: overrides.displayId !== undefined ? overrides.displayId : (f.displayId || existing?.displayId),
          x: overrides.x !== undefined ? overrides.x : (parseFloat(rawX) || existing?.x || 0),
          y: overrides.y !== undefined ? overrides.y : (parseFloat(rawZ) || existing?.y || 0),
          crop: (f.crop && f.crop !== 'Inconnu') ? f.crop.toUpperCase() : (overrides.crop !== undefined && overrides.crop !== 'Inconnu' ? overrides.crop.toUpperCase() : (existing?.crop && existing.crop !== 'Inconnu' ? existing.crop.toUpperCase() : 'Inconnu')),
          size: f.size !== undefined ? f.size : (overrides.size !== undefined ? overrides.size : (existing?.size || 0)),
          farmlandSize: f.farmlandSize !== undefined ? f.farmlandSize : (overrides.farmlandSize !== undefined ? overrides.farmlandSize : (existing?.farmlandSize || 0)),
          fieldSize: f.fieldSize !== undefined ? f.fieldSize : (overrides.fieldSize !== undefined ? overrides.fieldSize : (existing?.fieldSize || 0)),
          growthState: (f.growthState && f.growthState !== 'Inconnu') ? f.growthState : (overrides.growthState !== undefined ? overrides.growthState : (existing?.growthState || 'Inconnu')),
          needsFertilizer: f.needsFertilizer !== undefined ? f.needsFertilizer : (overrides.needsFertilizer !== undefined ? overrides.needsFertilizer : existing?.needsFertilizer),
          needsPlowing: f.needsPlowing !== undefined ? f.needsPlowing : (overrides.needsPlowing !== undefined ? overrides.needsPlowing : existing?.needsPlowing),
          needsLime: f.needsLime !== undefined ? f.needsLime : (overrides.needsLime !== undefined ? overrides.needsLime : existing?.needsLime),
          needsWeeding: f.needsWeeding !== undefined ? f.needsWeeding : (overrides.needsWeeding !== undefined ? overrides.needsWeeding : existing?.needsWeeding),
          isOwned: f.isOwned !== undefined ? f.isOwned : (overrides.isOwned !== undefined ? overrides.isOwned : existing?.isOwned),
          precisionFarming: f.precisionFarming !== undefined ? f.precisionFarming : (overrides.precisionFarming !== undefined ? overrides.precisionFarming : existing?.precisionFarming)
        };
      });

      const newFieldIds = new Set(newFields.map(f => f.id));
      
      // Include fields from manualOverridesRef that are not in jsonData.fields
      const persistentFields: Field[] = Object.keys(manualOverridesRef.current)
        .filter(id => !newFieldIds.has(id) && !deletedFieldsRef.current.has(id))
        .map(id => {
          const overrides = manualOverridesRef.current[id];
          const existing = prev.fields.find(pf => pf.id === id);
          return {
            id,
            x: 50,
            y: 50,
            crop: 'Inconnu',
            growthState: 'Inconnu',
            isOwned: false,
            ...existing,
            ...overrides
          } as Field;
        });

      // Apply overrides to newFields
      const mergedNewFields = newFields.map(field => {
        if (manualOverridesRef.current[field.id]) {
          return { ...field, ...manualOverridesRef.current[field.id] };
        }
        return field;
      });

      const manualFields = prev.fields.filter(pf => pf.id.startsWith('manual_') && !newFieldIds.has(pf.id));
      
      // Combine all fields, ensuring no duplicates
      const allFields = [...mergedNewFields, ...persistentFields, ...manualFields].filter(f => !deletedFieldsRef.current.has(f.id));
      const uniqueFields = Array.from(new Map(allFields.map(f => [f.id, f])).values());
      
      // Product mapping for normalization
      const productMapping: Record<string, string> = {
        'milk': 'MILK', 'egg': 'EGG', 'eggs': 'EGG', 'wool': 'WOOL', 'manure': 'MANURE',
        'slurry': 'LIQUIDMANURE', 'liquidmanure': 'LIQUIDMANURE', 'liquid_manure': 'LIQUIDMANURE',
        'honey': 'HONEY', 'goatmilk': 'GOAT_MILK', 'buffalomilk': 'BUFFALO_MILK', 'straw': 'STRAW', 'litter': 'MANURE',
        'goat_milk': 'GOAT_MILK', 'buffalo_milk': 'BUFFALO_MILK', 'strawpellets': 'STRAWPELLETS', 'haypellets': 'HAYPELLETS',
        'oeufs': 'EGG', 'lait': 'MILK', 'laine': 'WOOL', 'fumier': 'MANURE', 'lisier': 'LIQUIDMANURE', 'miel': 'HONEY', 'paille': 'STRAW', 'litiere': 'STRAW'
      };

      // Handle storage format (array vs object)
      let parsedStorage: Record<string, { level: number; capacity: number }> = {};
      if (Array.isArray(jsonData.storage)) {
        jsonData.storage.forEach((item: any) => {
          const rawName = item.name || item.fillType || item.type;
          if (rawName) {
            const name = productMapping[rawName.toLowerCase()] || rawName.toUpperCase();
            const level = item.level !== undefined ? item.level : (item.fillLevel !== undefined ? item.fillLevel : 0);
            parsedStorage[name] = { level, capacity: item.capacity || 100000 };
          }
        });
      } else if (jsonData.storage && typeof jsonData.storage === 'object') {
        Object.keys(jsonData.storage).forEach(key => {
          const item = jsonData.storage[key];
          const name = productMapping[key.toLowerCase()] || key.toUpperCase();
          if (typeof item === 'object') {
            const level = item.level !== undefined ? item.level : (item.fillLevel !== undefined ? item.fillLevel : 0);
            parsedStorage[name] = { level, capacity: item.capacity || 100000 };
          } else if (typeof item === 'number') {
            parsedStorage[name] = { level: item, capacity: 100000 };
          }
        });
      } else {
        parsedStorage = prev.storage;
      }

      // Handle prices format (array vs object)
      let parsedPrices: Record<string, number> = {};
      if (Array.isArray(jsonData.prices)) {
        jsonData.prices.forEach((item: any) => {
          const name = item.name || item.fillType || item.type;
          const price = item.price !== undefined ? item.price : item.value;
          if (name && price !== undefined) {
            parsedPrices[name] = Number(price) || 0;
          }
        });
      } else if (jsonData.prices && typeof jsonData.prices === 'object') {
        Object.keys(jsonData.prices).forEach(key => {
          parsedPrices[key] = Number(jsonData.prices[key]) || 0;
        });
      } else {
        parsedPrices = prev.prices;
      }

      // Update price history
      const newPriceHistory = { ...(prev.priceHistory || {}) };
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      Object.keys(parsedPrices).forEach(key => {
        const price = parsedPrices[key];
        const lowerKey = key.toLowerCase();
        const upperKey = key.toUpperCase().replace(/\s+/g, '_');
        const translatedKey = translateFillType(key, languageRef.current).toLowerCase();

        // Find existing history entry that matches this key
        const matchedKey = Object.keys(newPriceHistory).find(k => {
          const lowerK = k.toLowerCase();
          const upperK = k.toUpperCase().replace(/\s+/g, '_');
          const translatedK = translateFillType(k, languageRef.current).toLowerCase();
          
          return lowerK === lowerKey || 
                 upperK === upperKey || 
                 translatedK === lowerKey ||
                 lowerK === translatedKey ||
                 translatedK === translatedKey;
        }) || key;

        if (!newPriceHistory[matchedKey]) {
          newPriceHistory[matchedKey] = [];
        }
        
        // Only add if price changed, history is empty, or we only have one point (to show a flat line)
        const history = [...(newPriceHistory[matchedKey] || [])];
        if (history.length === 0 || history.length === 1 || history[history.length - 1].price !== price) {
          history.push({ time: now, price });
        }
        if (history.length > 50) {
          newPriceHistory[matchedKey] = history.slice(-50);
        } else {
          newPriceHistory[matchedKey] = history;
        }
      });

      // Handle bales format (array vs object)
      let parsedBales: Record<string, number> = {};
      if (Array.isArray(jsonData.bales)) {
        jsonData.bales.forEach((item: any) => {
          const name = item.name || item.fillType || item.type;
          const level = item.level !== undefined ? item.level : (item.fillLevel !== undefined ? item.fillLevel : 0);
          if (name && level !== undefined) {
            parsedBales[name] = level;
          }
        });
      } else if (jsonData.bales && typeof jsonData.bales === 'object') {
        Object.keys(jsonData.bales).forEach(key => {
          const item = jsonData.bales[key];
          if (typeof item === 'object') {
            parsedBales[key] = item.level !== undefined ? item.level : (item.fillLevel !== undefined ? item.fillLevel : 0);
          } else if (typeof item === 'number') {
            parsedBales[key] = item;
          }
        });
      } else {
        parsedBales = prev.bales;
      }

      // Handle market data
      let parsedMarket: Record<string, MarketData> = {};
      
      const marketEntries = Array.isArray(jsonData.market)
        ? jsonData.market.map((item: any) => ({ key: item.fillType || item.name || item.type || 'unknown', item }))
        : (jsonData.market && typeof jsonData.market === 'object')
            ? Object.keys(jsonData.market).map(key => ({ key, item: jsonData.market[key] }))
            : [];

      if (marketEntries.length > 0) {
        marketEntries.forEach(({ key, item }: any) => {
          // If key is numeric (from array index), try to use internal name if available, otherwise fallback to key
          const rawName = (String(key).match(/^\d+$/) && (item.fillType || item.name || item.type)) ? (item.fillType || item.name || item.type) : key;
          const translatedName = translateFillType(rawName, language);
          
          let rawStations = item.stations || [];
          let stationsArray: any[] = [];
          if (Array.isArray(rawStations)) {
            stationsArray = rawStations;
          } else if (typeof rawStations === 'object') {
            stationsArray = Object.values(rawStations);
          }

          const stations = stationsArray.map((s: any) => ({
              name: s.name,
              price: parsePrice(s.price) || parsePrice(s.sellPrice) || 0,
              buyPrice: parsePrice(s.buyPrice) || parsePrice(s.purchasePrice) || parsePrice(s.buyingPrice) || 0,
              trend: parsePrice(s.trend) || 0,
              variation: parsePrice(s.variation) || 0
            }));

            // Handle separate buying stations (array or object)
            const buyingSource = item.buyingStations || item.buying || item.purchaseStations || [];
            let buyingList: any[] = [];
            
            if (Array.isArray(buyingSource)) {
                buyingList = buyingSource;
            } else if (typeof buyingSource === 'object') {
                buyingList = Object.values(buyingSource);
            }

            buyingList.forEach((s: any) => {
                stations.push({
                  name: s.name || s.stationName || "Point d'achat",
                  price: 0,
                  buyPrice: parsePrice(s.price) || parsePrice(s.buyPrice) || parsePrice(s.purchasePrice) || parsePrice(s.buyingPrice) || parsePrice(s.value) || 0,
                  trend: 0,
                  variation: 0
                });
            });

            parsedMarket[translatedName] = {
              name: translatedName,
              basePrice: item.basePrice || 0,
              stations: stations
            };
        });
      } else {
        parsedMarket = prev.market;
      }

      // Handle productions (Production Chains)
      let parsedProductions: Record<string, ProductionData> = {};
      const rawProductions = jsonData.productions || jsonData.productionChains || jsonData.production_chains || jsonData.production_chain || jsonData.factories || [];
      const productionEntries = Array.isArray(rawProductions)
        ? rawProductions.map((item: any) => ({ key: item.name || item.id || 'unknown', item }))
        : (rawProductions && typeof rawProductions === 'object')
            ? Object.keys(rawProductions).map(key => ({ key, item: rawProductions[key] }))
            : [];

      if (productionEntries.length > 0) {
        productionEntries.forEach(({ key, item }: any) => {
          const name = item.name || key;
          const inputs: Record<string, ResourceState> = {};
          const outputs: Record<string, ResourceState> = {};

          if (item.inputs) {
            Object.entries(item.inputs).forEach(([inKey, inVal]: [string, any]) => {
              const current = typeof inVal === 'number' ? inVal : (inVal.level || inVal.fillLevel || inVal.current || inVal.amount || inVal.value || inVal.storageLevel || 0);
              inputs[inKey.toUpperCase()] = {
                current,
                max: inVal.capacity || inVal.max || 100000
              };
            });
          }

          if (item.outputs) {
            Object.entries(item.outputs).forEach(([outKey, outVal]: [string, any]) => {
              const current = typeof outVal === 'number' ? outVal : (outVal.level || outVal.fillLevel || outVal.current || outVal.amount || outVal.value || outVal.storageLevel || 0);
              outputs[outKey.toUpperCase()] = {
                current,
                max: outVal.capacity || outVal.max || 100000
              };
            });
          }

          // Check if any stock exists to automatically mark as owned
          const hasStock = Object.values(inputs).some(i => i.current > 0) || Object.values(outputs).some(o => o.current > 0);

          parsedProductions[name] = {
            name,
            inputs,
            outputs,
            status: item.status || 'running',
            isOwned: manualProductionOverridesRef.current[name] !== undefined 
              ? manualProductionOverridesRef.current[name] 
              : (hasStock ? true : (item.isOwned !== undefined ? item.isOwned : true))
          };
        });
      } else {
        parsedProductions = prev.productions || {};
      }

      // Merge with manual productions
      Object.entries(manualProductionsRef.current).forEach(([name, prod]) => {
        if (!parsedProductions[name]) {
          const manualProd = prod as ProductionData;
          parsedProductions[name] = {
            name: manualProd.name,
            inputs: manualProd.inputs || {},
            outputs: manualProd.outputs || {},
            status: manualProd.status || 'running',
            isOwned: manualProductionOverridesRef.current[name] !== undefined 
              ? manualProductionOverridesRef.current[name] 
              : true
          };
        }
      });

      // Handle animals
      let parsedAnimals: Animal[] = [];
      const rawAnimalsSource = jsonData.animals || jsonData.animalHusbandry || jsonData.husbandries || jsonData.stables || jsonData.husbandry || jsonData.stable || jsonData.placeables || jsonData.placeable || [];
      
      let flatAnimals: any[] = [];
      if (Array.isArray(rawAnimalsSource)) {
        rawAnimalsSource.forEach((item: any) => {
          if (item && typeof item === 'object') {
            // Check if this is a husbandry containing multiple animals
            const nestedAnimals = item.animals || item.animalList || item.groups || item.clusters || item.subAnimals;
            if (Array.isArray(nestedAnimals)) {
              // Inherit husbandry properties (like species, type, or average health) as fallbacks
              const { animals, animalList, groups, clusters, subAnimals, ...husbandryProps } = item;
              
              let totalAnimals = 0;
              nestedAnimals.forEach((a: any) => {
                if (a && typeof a === 'object') {
                  const count = a.count !== undefined ? a.count : (a.numAnimals !== undefined ? a.numAnimals : (a.quantity !== undefined ? a.quantity : 1));
                  totalAnimals += Number(count) || 1;
                }
              });

              nestedAnimals.forEach((a: any) => {
                if (a && typeof a === 'object') {
                  const count = a.count !== undefined ? a.count : (a.numAnimals !== undefined ? a.numAnimals : (a.quantity !== undefined ? a.quantity : 1));
                  const ratio = totalAnimals > 0 ? (Number(count) || 1) / totalAnimals : 1;
                  flatAnimals.push({ ...husbandryProps, ...a, husbandryId: husbandryProps.id, _husbandryRatio: ratio });
                }
              });
            } else {
              flatAnimals.push({ ...item, husbandryId: item.id });
            }
          }
        });
      } else if (rawAnimalsSource && typeof rawAnimalsSource === 'object') {
        Object.entries(rawAnimalsSource).forEach(([key, item]: [string, any]) => {
          if (item && typeof item === 'object') {
            const nestedAnimals = item.animals || item.animalList || item.groups || item.clusters || item.subAnimals;
            if (Array.isArray(nestedAnimals)) {
              const { animals, animalList, groups, clusters, subAnimals, ...husbandryProps } = item;
              
              let totalAnimals = 0;
              nestedAnimals.forEach((a: any) => {
                if (a && typeof a === 'object') {
                  const count = a.count !== undefined ? a.count : (a.numAnimals !== undefined ? a.numAnimals : (a.quantity !== undefined ? a.quantity : 1));
                  totalAnimals += Number(count) || 1;
                }
              });

              nestedAnimals.forEach((a: any) => {
                if (a && typeof a === 'object') {
                  const count = a.count !== undefined ? a.count : (a.numAnimals !== undefined ? a.numAnimals : (a.quantity !== undefined ? a.quantity : 1));
                  const ratio = totalAnimals > 0 ? (Number(count) || 1) / totalAnimals : 1;
                  flatAnimals.push({ ...husbandryProps, ...a, husbandryId: husbandryProps.id, _husbandryRatio: ratio });
                }
              });
            } else {
              // Add key as ID if missing
              if (item.id === undefined) item.id = key;
              flatAnimals.push({ ...item, husbandryId: item.id });
            }
          }
        });
      }

      if (flatAnimals.length > 0) {
        parsedAnimals = flatAnimals.map((item: any) => {
          const animal = typeof item === 'object' && item !== null ? item : {};
          const id = animal.id || animal.uniqueId || Math.random().toString(36).substr(2, 9);
          const overrides = animalOverridesRef.current[id] || {};
          
          let products: Record<string, any> = {};
          if (Array.isArray(animal.products)) {
            animal.products.forEach((p: any) => {
              if (p && typeof p === 'object') {
                const type = p.fillType || p.type || p.name;
                if (type) products[type] = p;
              }
            });
          } else if (typeof animal.products === 'object' && animal.products !== null) {
            products = { ...animal.products };
          }
          products = { ...products, ...(overrides.products || {}) };
          
          // Parse FS22 modules if they exist
          let animalModules: any[] = [];
          if (animal.modules) {
            if (Array.isArray(animal.modules)) {
              animalModules = animal.modules;
            } else if (animal.modules.module) {
              animalModules = Array.isArray(animal.modules.module) ? animal.modules.module : [animal.modules.module];
            } else if (typeof animal.modules === 'object') {
              // Check if it's a direct module object
              if (animal.modules.name || animal.modules.type) {
                animalModules = [animal.modules];
              } else {
                animalModules = Object.values(animal.modules);
              }
            }
          }

          let moduleFood: any = undefined;
          let moduleWater: any = undefined;
          let moduleStraw: any = undefined;
          
          const productKeys = ['manure', 'liquidManure', 'slurry', 'milk', 'eggs', 'wool', 'honey', 'goatMilk', 'buffaloMilk', 'straw'];
          
          animalModules.forEach(mod => {
            if (mod && typeof mod === 'object') {
              const modName = (mod.name || mod.type || '').toLowerCase();
              const modData = mod.fillLevel !== undefined ? mod.fillLevel : (mod.fillLevels !== undefined ? mod.fillLevels : mod);
              
              if (modName === 'food') {
                moduleFood = modData;
              } else if (modName === 'water') {
                moduleWater = modData;
              } else if (modName === 'straw') {
                moduleStraw = modData;
              } else if (productKeys.map(k => k.toLowerCase()).includes(modName)) {
                if (!products[modName] || (typeof products[modName] === 'object' && Number(products[modName].fillLevel || 0) === 0)) {
                  products[modName] = modData;
                }
              }
            }
          });

          // Parse FS22 storage if it exists
          let animalStorage: any[] = [];
          if (animal.storage) {
            if (Array.isArray(animal.storage)) {
              animalStorage = animal.storage;
            } else if (animal.storage.node) {
              animalStorage = Array.isArray(animal.storage.node) ? animal.storage.node : [animal.storage.node];
            } else if (typeof animal.storage === 'object') {
              // Check if it's a direct storage node
              if (animal.storage.fillType || animal.storage.type || animal.storage.name) {
                animalStorage = [animal.storage];
              } else {
                animalStorage = Object.values(animal.storage);
              }
            }
          }
          
          animalStorage.forEach(node => {
            if (node && typeof node === 'object') {
              const fillType = (node.fillType || node.type || node.name || '').toLowerCase();
              const modData = node.fillLevel !== undefined ? node.fillLevel : (node.fillLevels !== undefined ? node.fillLevels : node);
              
              if (fillType === 'food') {
                if (!moduleFood) moduleFood = modData;
              } else if (fillType === 'water') {
                if (!moduleWater) moduleWater = modData;
              } else if (fillType === 'straw') {
                if (!moduleStraw) moduleStraw = modData;
              } else if (productKeys.map(k => k.toLowerCase()).includes(fillType)) {
                if (!products[fillType] || (typeof products[fillType] === 'object' && Number(products[fillType].fillLevel || 0) === 0)) {
                  products[fillType] = modData;
                }
              }
            }
          });

          // Pick up top-level products if they exist
          productKeys.forEach(pk => {
            if (animal[pk] !== undefined && !products[pk]) {
              products[pk] = animal[pk];
            }
            if (animal.fillLevels) {
              if (Array.isArray(animal.fillLevels)) {
                const flItem = animal.fillLevels.find(item => {
                  const type = item.fillType || item.type || item.name;
                  return type && type.toLowerCase() === pk.toLowerCase();
                });
                if (flItem && !products[pk]) {
                  products[pk] = flItem;
                }
              } else {
                const flKey = Object.keys(animal.fillLevels).find(k => k.toLowerCase() === pk.toLowerCase());
                if (flKey && !products[pk]) {
                  products[pk] = animal.fillLevels[flKey];
                }
              }
            }
          });

          // Also check if fillLevels is an array (common in some mods)
          if (Array.isArray(animal.fillLevels)) {
            animal.fillLevels.forEach((fl: any) => {
              if (fl && typeof fl === 'object') {
                const type = (fl.fillType || fl.type || fl.name || '').toLowerCase();
                if (type && productKeys.map(k => k.toLowerCase()).includes(type) && !products[type]) {
                  products[type] = fl;
                }
              }
            });
          } else if (typeof animal.fillLevels === 'object' && animal.fillLevels !== null) {
            Object.entries(animal.fillLevels).forEach(([key, val]) => {
              const type = key.toLowerCase();
              if (productKeys.map(k => k.toLowerCase()).includes(type) && !products[type]) {
                products[type] = val;
              }
            });
          }

          let food = overrides.food || moduleFood || animal.food || animal.foodLevel || animal.fillLevels?.food;
          if (!food && animal.fillLevels) {
            food = animal.fillLevels;
          }
          if (!food) {
            food = { TOTAL: { current: 0, max: 10000 } };
          }
          
          let strawVal = overrides.straw !== undefined ? overrides.straw : (moduleStraw !== undefined ? moduleStraw : animal.straw);
          if (strawVal === undefined && animal.fillLevels) {
            if (Array.isArray(animal.fillLevels)) {
              const flItem = animal.fillLevels.find(item => {
                const type = item.fillType || item.type || item.name;
                return type && type.toLowerCase() === 'straw';
              });
              if (flItem) strawVal = flItem;
            } else {
              const flKey = Object.keys(animal.fillLevels).find(k => k.toLowerCase() === 'straw');
              if (flKey) strawVal = animal.fillLevels[flKey];
            }
          }

          // Add top-level straw if it exists and isn't already in food
          if (strawVal !== undefined) {
            const formatStraw = (val: any) => {
              if (typeof val === 'number') return { current: val, max: 10000 };
              if (typeof val === 'string') return { current: Number(val) || 0, max: 10000 };
              if (typeof val === 'object' && val !== null) {
                return {
                  current: Number(val.current || val.fillLevel || val.level || val.value || 0),
                  max: Number(val.max || val.capacity || 10000)
                };
              }
              return { current: 0, max: 10000 };
            };
            
            if (typeof food === 'number') {
              food = { TOTAL: { current: food, max: 10000 }, STRAW: strawVal };
            } else if (Array.isArray(food)) {
              const hasStraw = food.some(item => {
                const type = item.fillType || item.type || item.name;
                return type && type.toLowerCase() === 'straw';
              });
              if (!hasStraw) {
                food = [...food, { fillType: 'STRAW', ...formatStraw(strawVal) }];
              }
            } else if (typeof food === 'object' && !food.STRAW && !food.straw) {
              food = { ...food, STRAW: strawVal };
            }
          }
          
          const normalizedFood = typeof food === 'number' 
            ? { TOTAL: { current: food, max: 10000 } }
            : (food.current !== undefined ? { TOTAL: { current: food.current, max: food.max || 10000 } } : food);

          // Filter food to exclude products
          if (typeof normalizedFood === 'object' && normalizedFood !== null) {
            const productKeysLower = productKeys.map(pk => pk.toLowerCase());
            Object.keys(normalizedFood).forEach(key => {
              if (productKeysLower.includes(key.toLowerCase()) && key !== 'STRAW' && key !== 'straw') {
                delete (normalizedFood as any)[key];
              }
            });
          }

          const extractValue = (val: any) => {
            if (val === undefined || val === null) return undefined;
            if (typeof val === 'object') {
              // Try common keys in objects used by various mods
              const keys = ['current', 'value', 'level', 'pct', 'percentage', 'fillLevel', 'amount', 'val', 'avg', 'mean', 'ratio', 'v'];
              for (const key of keys) {
                if (val[key] !== undefined) return val[key];
              }
              // If it's an array, try to find a numeric value
              if (Array.isArray(val)) {
                for (const item of val) {
                  const v = extractValue(item);
                  if (v !== undefined) return v;
                }
              }
              return undefined;
            }
            if (typeof val === 'string') {
              const cleaned = val.replace('%', '').trim();
              const parsed = parseFloat(cleaned);
              return isNaN(parsed) ? undefined : parsed;
            }
            const parsed = parseFloat(val);
            return isNaN(parsed) ? undefined : parsed;
          };

          const findKeyInsensitive = (obj: any, search: string) => {
            if (!obj || typeof obj !== 'object') return undefined;
            const lowerSearch = search.toLowerCase();
            for (const key in obj) {
              if (key.toLowerCase() === lowerSearch) return obj[key];
            }
            return undefined;
          };

          const extractFromList = (list: any[], name: string) => {
            if (!Array.isArray(list)) return undefined;
            const item = list.find(i => i && (
              (i.name && i.name.toLowerCase().includes(name.toLowerCase())) ||
              (i.id && i.id.toLowerCase().includes(name.toLowerCase())) ||
              (i.key && i.key.toLowerCase().includes(name.toLowerCase())) ||
              (i.type && i.type.toLowerCase().includes(name.toLowerCase()))
            ));
            return item ? extractValue(item) : undefined;
          };

          // Prioritize percentage-based keys which are more likely to be dynamic health
          const hPct = extractValue(animal.healthPercentage) ?? 
                      extractValue(animal.health_percentage) ??
                      extractValue(animal.health_pct) ??
                      extractValue(animal.condition);
          
          const hVal = extractValue(animal.health) ?? 
                      extractValue(findKeyInsensitive(animal, 'health')) ??
                      extractValue(animal.stats?.health) ?? 
                      extractValue(animal.status?.health) ??
                      extractValue(animal.health_val);

          const rawHealth = hPct !== undefined ? hPct : hVal;

          const pPct = extractValue(animal.productivityPercentage) ?? 
                      extractValue(animal.productivity_percentage) ??
                      extractValue(animal.productivity_pct) ??
                      extractValue(animal.production_level) ??
                      extractValue(animal.productionLevel);

          const pVal = extractValue(animal.productivity) ?? 
                      extractValue(findKeyInsensitive(animal, 'productivity')) ??
                      extractValue(findKeyInsensitive(animal, 'production')) ??
                      extractValue(animal.stats?.productivity) ?? 
                      extractValue(animal.prod_val);

          const rawProductivity = pPct !== undefined ? pPct : pVal;

          const rPct = extractValue(animal.reproductionPercentage) ?? 
                      extractValue(animal.reproduction_percentage) ??
                      extractValue(animal.reproduction_pct) ??
                      extractValue(animal.reproduction);
          
          const rawReproduction = rPct !== undefined ? rPct : undefined;

          // Create a clean version of overrides without health/productivity to ensure they stay dynamic
          const { health: _h, productivity: _p, reproduction: _r, ...cleanOverrides } = overrides;

          let waterObj = cleanOverrides.water || moduleWater || animal.water || animal.waterLevel;
          if (!waterObj && animal.fillLevels) {
            if (Array.isArray(animal.fillLevels)) {
              const flItem = animal.fillLevels.find(item => {
                const type = item.fillType || item.type || item.name;
                return type && type.toLowerCase() === 'water';
              });
              if (flItem) waterObj = flItem;
            } else {
              const flKey = Object.keys(animal.fillLevels).find(k => k.toLowerCase() === 'water');
              if (flKey) waterObj = animal.fillLevels[flKey];
            }
          }

          // Estimate values if missing from savegame (solves "stuck at 100%" or "stuck at 0%" issues)
          let estimatedHealth = 100;
          let estimatedProd = 100;

          if (rawHealth === undefined || rawProductivity === undefined) {
            let foodCurrent = 0;
            let foodMax = 0;
            
            if (normalizedFood) {
              const processFoodItem = (f: any) => {
                if (f && typeof f === 'object') {
                  if (Array.isArray(f)) {
                    f.forEach(processFoodItem);
                  } else if (f.fillLevel && Array.isArray(f.fillLevel)) {
                    f.fillLevel.forEach(processFoodItem);
                  } else {
                    const current = Number(f.current || f.fillLevel || f.level || f.value || 0);
                    const max = Number(f.max || f.capacity || 0);
                    foodCurrent += isNaN(current) ? 0 : current;
                    foodMax += isNaN(max) ? 0 : max;
                  }
                } else if (typeof f === 'number') {
                  foodCurrent += f;
                  foodMax += 10000;
                } else if (typeof f === 'string') {
                  const parsed = Number(f);
                  if (!isNaN(parsed)) {
                    foodCurrent += parsed;
                    foodMax += 10000;
                  }
                }
              };
              
              Object.values(normalizedFood).forEach(processFoodItem);
            }
            
            const foodRatio = foodMax > 0 ? Math.min(1, Math.max(0, foodCurrent / foodMax)) : (foodCurrent > 0 ? 1 : 0);
            
            let waterRatio = 1;
            if (waterObj && typeof waterObj === 'object') {
              let current = 0;
              let max = 2000;
              if (Array.isArray(waterObj)) {
                const firstItem = waterObj.find((item: any) => item && typeof item === 'object' && (item.fillLevel !== undefined || item.current !== undefined || item.level !== undefined || item.value !== undefined));
                if (firstItem) {
                  current = Number(firstItem.fillLevel || firstItem.current || firstItem.level || firstItem.value || 0);
                  max = Number(firstItem.max || firstItem.capacity || 2000);
                }
              } else if (waterObj.fillLevel && Array.isArray(waterObj.fillLevel)) {
                const firstItem = waterObj.fillLevel.find((item: any) => item && typeof item === 'object' && item.fillLevel !== undefined);
                if (firstItem) current = Number(firstItem.fillLevel);
              } else if (waterObj.fillLevel && typeof waterObj.fillLevel === 'object') {
                current = Number(waterObj.fillLevel.fillLevel || waterObj.fillLevel.level || waterObj.fillLevel.value || 0);
              } else {
                current = Number(waterObj.current || waterObj.fillLevel || waterObj.level || waterObj.value || 0);
                max = Number(waterObj.max || waterObj.capacity || 2000);
              }
              if (max > 0 && !isNaN(current) && !isNaN(max)) {
                waterRatio = Math.min(1, Math.max(0, current / max));
              }
            } else if (typeof waterObj === 'number' || typeof waterObj === 'string') {
              const current = Number(waterObj);
              if (!isNaN(current) && current >= 0) {
                waterRatio = Math.min(1, Math.max(0, current / 2000));
              }
            }

            if (foodCurrent === 0 && foodMax > 0) {
              estimatedHealth = 0;
              estimatedProd = 0;
            } else {
              // Simulate FS mechanics: health is good if there's food, productivity scales with food/water
              estimatedHealth = Math.round(50 + (foodRatio * 50));
              estimatedProd = Math.round((foodRatio * 0.8 + waterRatio * 0.2) * 100);
            }
          }

          const health = rawHealth !== undefined ? rawHealth : estimatedHealth;
          const productivity = rawProductivity !== undefined ? rawProductivity : estimatedProd;

          const penId = animal.husbandryId || animal.penId || animal.id || 'default';
          const penName = cleanOverrides.penName || animal.penName || animal.husbandryName || animal.husbandry_name || animal.name || `Enclos ${penId}`;

          let finalWater = waterObj;
          if (!finalWater) finalWater = { current: 0, max: 2000 };

          // Scale values by husbandry ratio to avoid duplication when summing in AnimalProduction
          const ratio = animal._husbandryRatio || 1;
          
          if (ratio !== 1) {
            if (normalizedFood && typeof normalizedFood === 'object') {
              Object.keys(normalizedFood).forEach(key => {
                const val = normalizedFood[key];
                if (val !== undefined && val !== null) {
                  const current = (typeof val === 'number' || typeof val === 'string') ? Number(val) || 0 : Number(val.current || val.level || val.fillLevel || val.value || 0);
                  const max = (typeof val === 'number' || typeof val === 'string') ? 10000 : Number(val.max || val.capacity || 0);
                  normalizedFood[key] = { current: current * ratio, max: max * ratio };
                }
              });
            }
            
            if (finalWater) {
              const current = (typeof finalWater === 'number' || typeof finalWater === 'string') ? Number(finalWater) || 0 : Number(finalWater.current || finalWater.level || finalWater.fillLevel || finalWater.value || 0);
              const max = (typeof finalWater === 'number' || typeof finalWater === 'string') ? 2000 : Number(finalWater.max || finalWater.capacity || 0);
              finalWater = { current: current * ratio, max: max * ratio };
            }
            
            if (products) {
              Object.keys(products).forEach(key => {
                const val = products[key];
                if (val !== undefined && val !== null) {
                  const current = (typeof val === 'number' || typeof val === 'string') ? Number(val) || 0 : Number(val.current || val.level || val.fillLevel || val.value || 0);
                  const max = (typeof val === 'number' || typeof val === 'string') ? 10000 : Number(val.max || val.capacity || 0);
                  products[key] = { current: current * ratio, max: max * ratio };
                }
              });
            }
          }

          return {
            ...animal,
            ...cleanOverrides,
            id,
            name: cleanOverrides.name || animal.name || animal.husbandryName || animal.husbandry_name || 'Enclos sans nom',
            type: cleanOverrides.type || animal.type || animal.species || animal.breed || 'Unknown',
            count: cleanOverrides.count !== undefined ? cleanOverrides.count : (animal.count !== undefined ? animal.count : (animal.numAnimals !== undefined ? animal.numAnimals : (animal.quantity !== undefined ? animal.quantity : 1))),
            food: normalizedFood,
            water: finalWater,
            health: health <= 1 && health > 0 ? health * 100 : health,
            reproduction: rawReproduction !== undefined ? (rawReproduction <= 1 && rawReproduction > 0 ? rawReproduction * 100 : rawReproduction) : 0,
            productivity: productivity <= 1 && productivity > 0 ? productivity * 100 : productivity,
            products,
            penId,
            penName
          };
        });

        // Subtract animal food and products from parsedStorage
        // Some mods export animal pen storage as global storage, which duplicates it.
        parsedAnimals.forEach(animal => {
          if (animal.food) {
            Object.entries(animal.food).forEach(([key, val]) => {
              if (key === 'TOTAL') return;
              let name = key.toUpperCase();
              if (productMapping[key.toLowerCase()]) {
                name = productMapping[key.toLowerCase()];
              }
              const level = typeof val === 'number' ? val : ((val as any).current || (val as any).level || (val as any).fillLevel || 0);
              if (level > 0 && parsedStorage[name]) {
                parsedStorage[name].level = Math.max(0, parsedStorage[name].level - level);
              } else if (level > 0 && parsedStorage[name.replace('_', '')]) {
                parsedStorage[name.replace('_', '')].level = Math.max(0, parsedStorage[name.replace('_', '')].level - level);
              }
            });
          }
          if (animal.products) {
            Object.entries(animal.products).forEach(([key, val]) => {
              let name = key.toUpperCase();
              if (productMapping[key.toLowerCase()]) {
                name = productMapping[key.toLowerCase()];
              }
              const level = typeof val === 'number' ? val : ((val as any).current || (val as any).level || (val as any).fillLevel || (val as any).value || 0);
              if (level > 0 && parsedStorage[name]) {
                parsedStorage[name].level = Math.max(0, parsedStorage[name].level - level);
              } else if (level > 0 && parsedStorage[name.replace('_', '')]) {
                parsedStorage[name.replace('_', '')].level = Math.max(0, parsedStorage[name.replace('_', '')].level - level);
              }
            });
          }
        });
      }

      // Merge bales into parsedStorage
      Object.entries(parsedBales).forEach(([name, level]) => {
        if (level > 0) {
          const upperName = name.toUpperCase();
          if (parsedStorage[upperName]) {
            parsedStorage[upperName].level += level;
          } else {
            parsedStorage[upperName] = { level, capacity: 0 };
          }
        }
      });

      return {
        fields: uniqueFields,
        storage: parsedStorage,
        prices: parsedPrices,
        market: parsedMarket,
        bales: parsedBales,
        animals: parsedAnimals.length > 0 ? parsedAnimals : (prev.animals || []),
        productions: parsedProductions,
        vehicles: Array.isArray(jsonData.vehicles) 
          ? jsonData.vehicles.map((v: any) => {
              // 1. Try to get brand from various data fields
              let brand = '';
              const rawBrand = v.brand || v.brandName || v.brandTitle || v.brandLabel || v.brandText || v.brand_name || v.brandId || '';
              
              if (typeof rawBrand === 'object' && rawBrand !== null) {
                brand = rawBrand.name || rawBrand.title || rawBrand.label || rawBrand.text || '';
              } else {
                brand = String(rawBrand || '');
              }

              // Clean up internal names (e.g., BRAND_FENDT -> FENDT)
              if (brand.startsWith('BRAND_')) {
                brand = brand.replace('BRAND_', '').replace(/_/g, ' ');
              }

              let vehicleName = v.name || 'Inconnu';
              const upperName = vehicleName.toUpperCase().replace(/_/g, ' ');
              
              // 2. Dynamic brand extraction from name if brand is missing or generic
              if (!brand.trim() || brand.toLowerCase().includes('unknown') || brand.toLowerCase().includes('inconnu')) {
                const brands = [
                  { name: 'Abi', matches: ['ABI'] },
                  { name: 'AGCO', matches: ['AGCO'] },
                  { name: 'AGI Batco', matches: ['AGI BATCO'] },
                  { name: 'AGI STORM', matches: ['AGI STORM'] },
                  { name: 'AGI Westfield', matches: ['AGI WESTFIELD'] },
                  { name: 'AGRIFAC', matches: ['AGRIFAC'] },
                  { name: 'Agrio', matches: ['AGRIO'] },
                  { name: 'AGRISEM', matches: ['AGRISEM'] },
                  { name: 'AGROMASZ', matches: ['AGROMASZ'] },
                  { name: 'Albutt', matches: ['ALBUTT'] },
                  { name: 'ALPEGO', matches: ['ALPEGO'] },
                  { name: 'Amazone', matches: ['AMAZONE'] },
                  { name: 'AMITYTECH', matches: ['AMITYTECH'] },
                  { name: 'Anderson Group', matches: ['ANDERSON GROUP', 'ANDERSON'] },
                  { name: 'ANNABURGER', matches: ['ANNABURGER'] },
                  { name: 'Antonio Carraro', matches: ['ANTONIO CARRARO'] },
                  { name: 'APE', matches: ['APE'] },
                  { name: 'Aprilia', matches: ['APRILIA'] },
                  { name: 'Arcusin', matches: ['ARCUSIN'] },
                  { name: 'Bednar', matches: ['BEDNAR'] },
                  { name: 'Bergmann', matches: ['BERGMANN'] },
                  { name: 'Berthoud', matches: ['BERTHOUD'] },
                  { name: 'Bomech', matches: ['BOMECH'] },
                  { name: 'Brandt', matches: ['BRANDT'] },
                  { name: 'Brantner', matches: ['BRANTNER'] },
                  { name: 'BREDAL', matches: ['BREDAL'] },
                  { name: 'Capello', matches: ['CAPELLO'] },
                  { name: 'Case IH', matches: ['CASE IH', 'CASE', 'MAGNUM', 'PUMA', 'STEIGER'] },
                  { name: 'Challenger', matches: ['CHALLENGER', 'MT6', 'MT7', 'MT8'] },
                  { name: 'Claas', matches: ['CLAAS'] },
                  { name: 'Convey-All', matches: ['CONVEY-ALL', 'CONVEY ALL'] },
                  { name: 'Dalbo', matches: ['DALBO'] },
                  { name: 'Damcon', matches: ['DAMCON'] },
                  { name: 'Demco', matches: ['DEMCO'] },
                  { name: 'Deutz-Fahr', matches: ['DEUTZ-FAHR', 'DEUTZ', 'FAHR'] },
                  { name: 'Dewulf', matches: ['DEWULF'] },
                  { name: 'Einböck', matches: ['EINBÖCK', 'EINBOCK'] },
                  { name: 'ELHO', matches: ['ELHO'] },
                  { name: 'Elmer\'s Manufacturing', matches: ['ELMER\'S MANUFACTURING', 'ELMERS', 'ELMER'] },
                  { name: 'ERO', matches: ['ERO'] },
                  { name: 'FAE', matches: ['FAE'] },
                  { name: 'FARESIN', matches: ['FARESIN'] },
                  { name: 'Farmax', matches: ['FARMAX'] },
                  { name: 'Farmet', matches: ['FARMET'] },
                  { name: 'Farmtech', matches: ['FARMTECH'] },
                  { name: 'Fendt', matches: ['FENDT'] },
                  { name: 'Fiat', matches: ['FIAT'] },
                  { name: 'Fliegl', matches: ['FLIEGL', 'EDK'] },
                  { name: 'Fuhrmann', matches: ['FUHRMANN'] },
                  { name: 'GERINGHOFF', matches: ['GERINGHOFF'] },
                  { name: 'Gessner Industries', matches: ['GESSNER INDUSTRIES', 'GESSNER'] },
                  { name: 'Gorenc', matches: ['GORENC'] },
                  { name: 'GÖWEIL', matches: ['GÖWEIL', 'GOWEIL'] },
                  { name: 'Great Plains', matches: ['GREAT PLAINS', 'SOLID STAND'] },
                  { name: 'Grégoire', matches: ['GRÉGOIRE', 'GREGOIRE'] },
                  { name: 'Grimme', matches: ['GRIMME'] },
                  { name: 'Hardi', matches: ['HARDI'] },
                  { name: 'Hauer', matches: ['HAUER'] },
                  { name: 'Hawe', matches: ['HAWE'] },
                  { name: 'Heizomat', matches: ['HEIZOMAT'] },
                  { name: 'Holaras', matches: ['HOLARAS'] },
                  { name: 'HOLMER', matches: ['HOLMER'] },
                  { name: 'Horsch', matches: ['HORSCH'] },
                  { name: 'IMPEX', matches: ['IMPEX'] },
                  { name: 'INTERNATIONAL', matches: ['INTERNATIONAL'] },
                  { name: 'Iseki', matches: ['ISEKI'] },
                  { name: 'J&M', matches: ['J&M', 'J & M'] },
                  { name: 'JCB', matches: ['JCB', 'FASTRAC'] },
                  { name: 'JENZ', matches: ['JENZ'] },
                  { name: 'John Deere', matches: ['JOHN DEERE', 'JOHN', 'DEERE', 'JD', '3650'] },
                  { name: 'Joskin', matches: ['JOSKIN'] },
                  { name: 'Jungheinrich', matches: ['JUNGHEINRICH'] },
                  { name: 'Kaweco', matches: ['KAWECO'] },
                  { name: 'KEMPER', matches: ['KEMPER'] },
                  { name: 'Kesla', matches: ['KESLA'] },
                  { name: 'Kingston Trailers', matches: ['KINGSTON TRAILERS', 'KINGSTON'] },
                  { name: 'KINZE', matches: ['KINZE'] },
                  { name: 'Knoche', matches: ['KNOCHE'] },
                  { name: 'Köckerling', matches: ['KÖCKERLING', 'KOCKERLING'] },
                  { name: 'Koller Forsttechnik', matches: ['KOLLER FORSTTECHNIK', 'KOLLER'] },
                  { name: 'Komatsu', matches: ['KOMATSU'] },
                  { name: 'Kotte', matches: ['KOTTE'] },
                  { name: 'Krampe', matches: ['KRAMPE'] },
                  { name: 'Kröger', matches: ['KRÖGER', 'KROGER'] },
                  { name: 'Krone', matches: ['KRONE', 'KRONE TRAILER'] },
                  { name: 'Kubota', matches: ['KUBOTA', 'M8'] },
                  { name: 'Kuhn', matches: ['KUHN', '980'] },
                  { name: 'Kverneland', matches: ['KVERNELAND'] },
                  { name: 'Lacotec', matches: ['LACOTEC'] },
                  { name: 'Landini', matches: ['LANDINI'] },
                  { name: 'Lemken', matches: ['LEMKEN'] },
                  { name: 'Lindner', matches: ['LINDNER'] },
                  { name: 'Lizard', matches: ['LIZARD'] },
                  { name: 'LODE KING', matches: ['LODE KING'] },
                  { name: 'MacDon', matches: ['MACDON'] },
                  { name: 'Mack Trucks', matches: ['MACK TRUCKS', 'MACK'] },
                  { name: 'MAGSI', matches: ['MAGSI'] },
                  { name: 'Manitou', matches: ['MANITOU'] },
                  { name: 'Massey Ferguson', matches: ['MASSEY FERGUSON', 'MASSEY', 'MF', 'MF8', 'MF7', '8570'] },
                  { name: 'McCormack', matches: ['MCCORMACK'] },
                  { name: 'McCormick', matches: ['MCCORMICK'] },
                  { name: 'MERIDIAN', matches: ['MERIDIAN'] },
                  { name: 'MERLO', matches: ['MERLO'] },
                  { name: 'MZURI', matches: ['MZURI'] },
                  { name: 'Nardi', matches: ['NARDI'] },
                  { name: 'New Holland', matches: ['NEW HOLLAND', 'NEW', 'HOLLAND', 'NH', 'T6', 'T7', 'T8'] },
                  { name: 'Novag', matches: ['NOVAG'] },
                  { name: 'OXBO', matches: ['OXBO'] },
                  { name: 'Paladin', matches: ['PALADIN'] },
                  { name: 'Pfanzelt', matches: ['PFANZELT'] },
                  { name: 'PITTS Trailers', matches: ['PITTS TRAILERS', 'PITTS'] },
                  { name: 'PONSSE', matches: ['PONSSE'] },
                  { name: 'Pöttinger', matches: ['PÖTTINGER', 'POTTINGER'] },
                  { name: 'Prinoth', matches: ['PRINOTH'] },
                  { name: 'Provitis', matches: ['PROVITIS'] },
                  { name: 'Quicke', matches: ['QUICKE'] },
                  { name: 'Reiter', matches: ['REITER'] },
                  { name: 'Riedler Fahrzeugbau', matches: ['RIEDLER FAHRZEUGBAU', 'RIEDLER'] },
                  { name: 'Rigitrac', matches: ['RIGITRAC'] },
                  { name: 'Risutec', matches: ['RISUTEC'] },
                  { name: 'Ropa', matches: ['ROPA'] },
                  { name: 'Rottne', matches: ['ROTTNE'] },
                  { name: 'Rudolph', matches: ['RUDOLPH'] },
                  { name: 'Salek', matches: ['SALEK'] },
                  { name: 'Samasz', matches: ['SAMASZ'] },
                  { name: 'Same', matches: ['SAME'] },
                  { name: 'Samson Agro', matches: ['SAMSON AGRO', 'SAMSON'] },
                  { name: 'Schäffer', matches: ['SCHÄFFER', 'SCHAFFER'] },
                  { name: 'Schuitemaker', matches: ['SCHUITEMAKER'] },
                  { name: 'Schwarzmüller', matches: ['SCHWARZMÜLLER', 'SCHWARZMULLER'] },
                  { name: 'Sennebogen', matches: ['SENNEBOGEN'] },
                  { name: 'SILOKING', matches: ['SILOKING'] },
                  { name: 'SIP', matches: ['SIP'] },
                  { name: 'Skoda', matches: ['SKODA', 'ENYAQ'] },
                  { name: 'STEMA', matches: ['STEMA'] },
                  { name: 'STEYR', matches: ['STEYR'] },
                  { name: 'Strautmann', matches: ['STRAUTMANN'] },
                  { name: 'STREUMASTER', matches: ['STREUMASTER'] },
                  { name: 'Summers', matches: ['SUMMERS'] },
                  { name: 'Tajfun', matches: ['TAJFUN'] },
                  { name: 'Tenwinkel', matches: ['TENWINKEL'] },
                  { name: 'Thunder Creek Equipment', matches: ['THUNDER CREEK EQUIPMENT', 'THUNDER CREEK'] },
                  { name: 'TMC Cancela', matches: ['TMC CANCELA'] },
                  { name: 'Treffler', matches: ['TREFFLER'] },
                  { name: 'TT', matches: ['TT'] },
                  { name: 'Unia', matches: ['UNIA'] },
                  { name: 'Väderstad', matches: ['VÄDERSTAD', 'VADERSTAD'] },
                  { name: 'Valtra', matches: ['VALTRA'] },
                  { name: 'Vermeer', matches: ['VERMEER'] },
                  { name: 'Vredo', matches: ['VREDO'] },
                  { name: 'Volvo', matches: ['VOLVO'] },
                  { name: 'Walkabout', matches: ['WALKABOUT'] },
                  { name: 'WesttecH', matches: ['WESTTECH'] },
                  { name: 'WIFO', matches: ['WIFO'] },
                  { name: 'Wilson Trailer', matches: ['WILSON TRAILER', 'WILSON'] },
                  { name: 'Zetor', matches: ['ZETOR'] },
                  { name: 'Zunhammer', matches: ['ZUNHAMMER'] }
                ];

                for (const b of brands) {
                  if (b.matches.some(m => upperName.startsWith(m) || upperName.includes(' ' + m + ' ') || upperName.includes('_' + m + '_'))) {
                    brand = b.name;
                    break;
                  }
                }
              }

              // 3. Clean up the name if it contains the brand to avoid redundancy
              if (brand && vehicleName.toLowerCase().startsWith(brand.toLowerCase())) {
                const potentialNewName = vehicleName.slice(brand.length).trim();
                if (potentialNewName.length > 1) {
                  vehicleName = potentialNewName;
                }
              } else if (brand === 'Massey Ferguson' && (vehicleName.toLowerCase().startsWith('mf') || vehicleName.toLowerCase().startsWith('massey'))) {
                 if (vehicleName.toLowerCase().startsWith('mf')) vehicleName = vehicleName.slice(2).trim();
                 else if (vehicleName.toLowerCase().startsWith('massey')) vehicleName = vehicleName.slice(6).trim();
              }

              // 4. Translate category to French and handle Shop Category/Type
              const categoryMap: Record<string, string> = {
                'TRACTOR': 'Tracteur',
                'TRACTORSSMALL': 'Petits tracteurs',
                'TRACTORSMEDIUM': 'Tracteurs moyens',
                'TRACTORSLARGE': 'Gros tracteurs',
                'COMBINEDRIVABLE': 'Moissonneuse',
                'HARVESTERS': 'Moissonneuses',
                'CAR': 'Voiture',
                'CARS': 'Voitures',
                'TRUCK': 'Camion',
                'TRUCKS': 'Camions',
                'TRAILER': 'Remorque',
                'TRAILERS': 'Remorques',
                'AUGERWAGONS': 'Transbordeurs',
                'DYNAMICMOUNTATTACHERTRAILER': 'Remorque',
                'CUTTER': 'Barre de coupe',
                'CUTTERS': 'Barres de coupe',
                'CULTIVATOR': 'Cultivateur',
                'CULTIVATORS': 'Cultivateurs',
                'DISCHARROW': 'Déchaumeuse',
                'POWERHARROW': 'Herse rotative',
                'SUBSOILER': 'Sous-soleuse',
                'SOWINGMACHINE': 'Semoir',
                'SEEDERS': 'Semoirs',
                'PLANTERS': 'Planteuses',
                'PLOW': 'Charrue',
                'PLOWS': 'Charrues',
                'FERTILIZERSPREADERS': 'Épandeurs d\'engrais',
                'SPRAYER': 'Pulvérisateur',
                'SPRAYERS': 'Pulvérisateurs',
                'MOWER': 'Faucheuse',
                'MOWERS': 'Faucheuses',
                'TEDDER': 'Faneuse',
                'TEDDERS': 'Faneuses',
                'WINDROWER': 'Andaineur',
                'WINDROWERS': 'Andaineurs',
                'BALER': 'Presse',
                'BALERS': 'Presses',
                'WRAPPERS': 'Enrubanneuses',
                'BALEWRAPPERS': 'Enrubanneuses',
                'BALELOADERS': 'Chargeuses de balles',
                'FORAGEHARVESTER': 'Ensileuse',
                'FORAGEHARVESTERSCUTTERS': 'Barres de coupe d\'ensileuse',
                'SLURRYTANKER': 'Tonne à lisier',
                'SLURRYTANKS': 'Tonnes à lisier',
                'SLURRYVEHICLES': 'Véhicules à lisier',
                'MANURESPREADER': 'Épandeur à fumier',
                'MANURESPREADERS': 'Épandeurs à fumier',
                'MANUREVEHICLES': 'Véhicules à fumier',
                'LOADERWAGON': 'Remorque autochargeuse',
                'FORAGEWAGONS': 'Remorques autochargeuses',
                'WEEDER': 'Sarcleuse',
                'WEEDERS': 'Sarcleuses',
                'ROLLERS': 'Rouleaux',
                'MULCHER': 'Broyeur',
                'MULCHERS': 'Broyeurs',
                'STONEPICKERS': 'Ramasseuses de pierres',
                'TELEHANDLER': 'Télescopique',
                'TELEHANDLERS': 'Télescopiques',
                'SKIDSTEER': 'Chargeuse compacte',
                'SKIDSTEERS': 'Chargeuses compactes',
                'FRONTLOADER': 'Chargeur frontal',
                'FRONTLOADERS': 'Chargeurs frontaux',
                'WHEELLOADER': 'Chargeuse sur pneus',
                'WHEELLOADERS': 'Chargeuses sur pneus',
                'FORKLIFT': 'Chariot élévateur',
                'FORKLIFTS': 'Chariots élévateurs',
                'WOODHARVESTER': 'Abatteuse',
                'WOODFORWARDER': 'Porteur',
                'WOODCRANE': 'Grue à bois',
                'CHAINSAWS': 'Tronçonneuses',
                'FORESTRYEQUIPMENT': 'Équipement forestier',
                'ANIMALSEQUIPMENT': 'Équipement pour animaux',
                'GRAPEVINEHARVESTER': 'Machine à vendanger',
                'GRAPEVINEVEHICLES': 'Véhicules à vigne',
                'OLIVEHARVESTER': 'Récolteuse d\'olives',
                'OLIVEVEHICLES': 'Véhicules à olives',
                'COTTONHARVESTER': 'Récolteuse de coton',
                'COTTONVEHICLES': 'Véhicules à coton',
                'SUGARCANEHARVESTER': 'Récolteuse de canne à sucre',
                'SUGARCANEVEHICLES': 'Véhicules à canne à sucre',
                'SUGARBEETHARVESTER': 'Arracheuse de betteraves',
                'BEETVEHICLES': 'Véhicules à betteraves',
                'POTATOHARVESTER': 'Arracheuse de pommes de terre',
                'POTATOVEHICLES': 'Véhicules à pommes de terre',
                'ANIMALTRANSPORT': 'Bétaillère',
                'WEIGHT': 'Masse',
                'WEIGHTS': 'Masses',
                'FRONTLOADERTOOLS': 'Outil chargeur',
                'TELEHANDLERTOOLS': 'Outil télescopique',
                'SKIDSTEERTOOLS': 'Outil chargeuse compacte',
                'WHEELLOADERTOOLS': 'Outil chargeuse sur pneus',
                'WINTEREQUIPMENT': 'Équipement hivernal',
                'LEVELER': 'Niveleuse',
                'SNOWPLOWS': 'Chasse-neige',
                'SALTBOXES': 'Sableuses',
                'MISC': 'Divers'
              };

              // Try to get type and shop category
              const vehicleType = v.type || v.typeName || v.vehicleType || '';
              const shopCategory = v.shopCategory || v.categoryName || v.category || 'Inconnu';
              
              const rawCategory = String(shopCategory).toUpperCase().replace(/[\s-]/g, '');
              const translatedCategory = categoryMap[rawCategory] || String(shopCategory);
              
              const vehicleOverrides = vehicleOverridesRef.current[vehicleName] || {};

              return {
                name: vehicleName,
                brand: brand.trim(),
                type: vehicleType,
                category: translatedCategory,
                operatingTime: v.operatingTime || 0,
                damage: v.damage || 0,
                wear: v.wear || 0,
                dirt: v.dirt || 0,
                fuel: v.fuel || 0,
                fuelMax: v.fuelMax || 0,
                fuelType: v.fuelType,
                price: vehicleOverrides.price !== undefined ? vehicleOverrides.price : (v.sellPrice || v.price || v.value || 0),
                ...vehicleOverrides
              };
            })
          : (prev.vehicles || []),
        // @ts-ignore
        currentMonth: jsonData.currentMonth !== undefined ? jsonData.currentMonth : prev.currentMonth,
        mapName: incomingMapName,
        priceHistory: newPriceHistory
      };
      } catch (e) {
        console.error("Error parsing game data:", e);
        return prev;
      }
    });
    return true;
  };

  const pushToServer = async (jsonData: any) => {
    try {
      await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData)
      });
    } catch (e) {
      console.log("Could not push to server", e);
    }
  };

  // Directory Polling (Local PC)
  useEffect(() => {
    if (!dirHandle) return;
    const interval = setInterval(async () => {
      try {
        // Fetch manual data from server in case another device updated it
        try {
          const res = await fetch('/api/manual-data');
          if (res.ok) {
            const serverManualData = await res.json();
            if (serverManualData && Object.keys(serverManualData).length > 0) {
              manualOverridesRef.current = serverManualData.manualOverrides || manualOverridesRef.current;
              deletedFieldsRef.current = new Set(serverManualData.deletedFields || Array.from(deletedFieldsRef.current));
              manualProductionOverridesRef.current = serverManualData.manualProductionOverrides || manualProductionOverridesRef.current;
              animalOverridesRef.current = serverManualData.animalOverrides || animalOverridesRef.current;
              manualProductionsRef.current = serverManualData.manualProductions || manualProductionsRef.current;
            }
          }
        } catch (e) {
          // Ignore if server is not available
        }

        const fileHandle = await dirHandle.getFileHandle('data.json');
        const file = await fileHandle.getFile();
        
        if (Date.now() - file.lastModified > 30000) {
          if (!isManualMode) clearData();
        } else {
          const text = await file.text();
          const jsonData = JSON.parse(text);
          const updated = processJsonData(jsonData);
          pushToServer(jsonData); // Push to server for other devices
          setIsManualMode(false);
          setSyncStatus('connected');
          if (updated) setLastSync(new Date());
        }
      } catch (e) {
        console.error(e);
        setSyncStatus('error');
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [dirHandle, isManualMode]);

  // Server Polling (For phones/tablets or automatic PC sync)
  useEffect(() => {
    // If we have a local directory handle, we don't need to poll the server for GET, 
    // because we are the ones pushing to it.
    if (dirHandle) return; 

    const handleServerData = (jsonData: any) => {
      // If we are in manual mode (uploaded a file manually, or mock), do not let the server push data to override us!
      if (isManualMode) return;

      if (jsonData && jsonData.isGameRunning === false) {
        clearData();
      } else if (jsonData && (jsonData.fields?.length > 0 || Object.keys(jsonData.storage || {}).length > 0)) {
        if (jsonData._manualData) {
          manualOverridesRef.current = jsonData._manualData.manualOverrides || manualOverridesRef.current;
          deletedFieldsRef.current = new Set(jsonData._manualData.deletedFields || Array.from(deletedFieldsRef.current));
          manualProductionOverridesRef.current = jsonData._manualData.manualProductionOverrides || manualProductionOverridesRef.current;
          animalOverridesRef.current = jsonData._manualData.animalOverrides || animalOverridesRef.current;
          manualProductionsRef.current = jsonData._manualData.manualProductions || manualProductionsRef.current;
        }
        const updated = processJsonData(jsonData);
        setIsManualMode(false);
        setSyncStatus('connected');
        if (updated) setLastSync(new Date());
      }
    };

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const jsonData = await res.json();
          handleServerData(jsonData);
        }
      } catch (e) {
        // Silently fail if server is not available
      }
    }, 5000);
    
    // Initial fetch
    fetch('/api/sync').then(res => res.json()).then(handleServerData).catch(() => {});

    return () => clearInterval(interval);
  }, [dirHandle, isManualMode]);

  const connectLocalFolder = async () => {
    if (!('showDirectoryPicker' in window)) {
      alert("Votre navigateur ne supporte pas cette fonctionnalité. Utilisez l'importation manuelle ou ouvrez l'application sur Chrome/Edge.");
      return;
    }
    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker({ mode: 'read' });
      setDirHandle(handle);
      setIsManualMode(false); // Local folder is not manual mode, it's auto sync
      setSyncStatus('connected');
      
      // Try to read immediately
      try {
        const fileHandle = await handle.getFileHandle('data.json');
        const file = await fileHandle.getFile();
        if (Date.now() - file.lastModified > 30000) {
          clearData();
        } else {
          const text = await file.text();
          const jsonData = JSON.parse(text);
          const updated = processJsonData(jsonData);
          pushToServer(jsonData);
          if (updated) setLastSync(new Date());
        }
      } catch (e) {
        console.log("data.json not found yet, will retry in 5s");
      }
    } catch (err: any) {
      setSyncStatus('error');
      if (err.name === 'SecurityError' || (err.message && err.message.includes('iframe'))) {
        alert("Action bloquée car l'application est dans un aperçu (iframe). Veuillez utiliser l'importation manuelle, ou ouvrez l'URL de l'application dans un nouvel onglet.");
      } else {
        alert("Accès au dossier refusé ou annulé.");
      }
    }
  };

  const handleManualJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const jsonData = JSON.parse(event.target?.result as string);
          
          if (!jsonData.mapName && !jsonData.mapTitle && !jsonData.missionName && !jsonData.mapId) {
            const mapName = window.prompt("Nom de la carte non détecté. Veuillez entrer un nom pour sauvegarder votre progression :", "Ma Carte");
            if (mapName) {
              jsonData.mapTitle = mapName;
            } else {
              jsonData.mapTitle = 'ImportManuel';
            }
          }
          
          const updated = processJsonData(jsonData);
          pushToServer(jsonData); // Push to server for other devices
          setIsManualMode(true);
          setSyncStatus('connected');
          if (updated) setLastSync(new Date());
        } catch (err) {
          alert("Erreur lors de la lecture du fichier JSON.");
        }
      };
      reader.readAsText(file);
    }
  };

  const mapNameRef = useRef<string>('DefaultMap');

  useEffect(() => {
    mapNameRef.current = data.mapName || 'DefaultMap';
  }, [data.mapName]);

  const updateField = React.useCallback((id: string, updates: Partial<Field>) => {
    const currentOverrides = manualOverridesRef.current[id] || {};
    
    // Handle deep merge for precisionFarming
    let newPrecisionFarming = currentOverrides.precisionFarming;
    if (updates.precisionFarming) {
      newPrecisionFarming = {
        ...(currentOverrides.precisionFarming || {}),
        ...updates.precisionFarming
      } as PrecisionFarmingData;
    }

    manualOverridesRef.current = {
      ...manualOverridesRef.current,
      [id]: { 
        ...currentOverrides, 
        ...updates,
        ...(newPrecisionFarming ? { precisionFarming: newPrecisionFarming } : {})
      }
    };
    
    if (mapNameRef.current && mapNameRef.current !== 'DefaultMap') {
      safeStorage.setItem(`manualOverrides_${mapNameRef.current}`, JSON.stringify(manualOverridesRef.current));
    }

    setData(prev => ({
      ...prev,
      fields: prev.fields.map(f => {
        if (f.id === id) {
          return {
            ...f,
            ...updates,
            ...(updates.precisionFarming ? {
              precisionFarming: {
                ...(f.precisionFarming || {}),
                ...updates.precisionFarming
              } as PrecisionFarmingData
            } : {})
          };
        }
        return f;
      })
    }));
  }, []);

  const updateVehicle = React.useCallback((name: string, updates: Partial<Vehicle>) => {
    const currentOverrides = vehicleOverridesRef.current[name] || {};
    vehicleOverridesRef.current = {
      ...vehicleOverridesRef.current,
      [name]: { ...currentOverrides, ...updates }
    };
    
    if (mapNameRef.current && mapNameRef.current !== 'DefaultMap') {
      safeStorage.setItem(`vehicleOverrides_${mapNameRef.current}`, JSON.stringify(vehicleOverridesRef.current));
    }

    setData(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => 
        v.name === name ? { ...v, ...updates } : v
      )
    }));
  }, []);

  const updateAnimal = React.useCallback((id: string, updates: Partial<Animal>) => {
    const currentOverrides = animalOverridesRef.current[id] || {};
    
    // Handle deep merge for products and food if they are objects
    let newProducts: Animal['products'] = currentOverrides.products;
    if (updates.products) {
      newProducts = {
        ...(currentOverrides.products || {}),
        ...updates.products
      } as Record<string, number | ResourceState>;
    }

    let newFood: Animal['food'] = currentOverrides.food;
    if (updates.food && typeof updates.food === 'object') {
      newFood = {
        ...(typeof currentOverrides.food === 'object' ? currentOverrides.food : {}),
        ...updates.food
      } as Record<string, number | ResourceState>;
    }

    animalOverridesRef.current = {
      ...animalOverridesRef.current,
      [id]: { 
        ...currentOverrides, 
        ...updates,
        ...(newProducts ? { products: newProducts } : {}),
        ...(newFood ? { food: newFood } : {})
      }
    };
    
    if (mapNameRef.current && mapNameRef.current !== 'DefaultMap') {
      safeStorage.setItem(`animalOverrides_${mapNameRef.current}`, JSON.stringify(animalOverridesRef.current));
    }

    setData(prev => ({
      ...prev,
      animals: prev.animals.map(a => {
        if (a.id === id) {
          return {
            ...a,
            ...updates,
            ...(updates.products ? {
              products: {
                ...(a.products || {}),
                ...updates.products
              }
            } : {}),
            ...(updates.food && typeof updates.food === 'object' ? {
              food: {
                ...(typeof a.food === 'object' ? a.food : {}),
                ...updates.food
              }
            } : {})
          };
        }
        return a;
      })
    }));
  }, []);

  const removeField = React.useCallback((id: string) => {
    deletedFieldsRef.current.add(id);
    
    if (mapNameRef.current && mapNameRef.current !== 'DefaultMap') {
      safeStorage.setItem(`deletedFields_${mapNameRef.current}`, JSON.stringify(Array.from(deletedFieldsRef.current)));
    } else {
      safeStorage.setItem('deletedFields', JSON.stringify(Array.from(deletedFieldsRef.current)));
    }

    setData(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== id)
    }));
  }, []);

  const addField = React.useCallback((field: Field) => {
    manualOverridesRef.current[field.id] = { 
      ...(manualOverridesRef.current[field.id] || {}),
      ...field 
    };

    if (mapNameRef.current && mapNameRef.current !== 'DefaultMap') {
      safeStorage.setItem(`manualOverrides_${mapNameRef.current}`, JSON.stringify(manualOverridesRef.current));
    }

    setData(prev => {
      const nextData = {
        ...prev,
        fields: [...prev.fields, field]
      };
      if (prev.mapName && prev.mapName !== 'DefaultMap') {
        safeStorage.setItem(`gameData_${prev.mapName}`, JSON.stringify(nextData));
      }
      return nextData;
    });
  }, []);

  const addFields = React.useCallback((fields: Field[]) => {
    fields.forEach(field => {
      manualOverridesRef.current[field.id] = { 
        ...(manualOverridesRef.current[field.id] || {}),
        ...field 
      };
    });
    
    if (mapNameRef.current && mapNameRef.current !== 'DefaultMap') {
      safeStorage.setItem(`manualOverrides_${mapNameRef.current}`, JSON.stringify(manualOverridesRef.current));
    }

    setData(prev => {
      const updatedFields = [...prev.fields];
      fields.forEach(field => {
        const index = updatedFields.findIndex(f => f.id === field.id);
        if (index !== -1) {
          updatedFields[index] = { ...updatedFields[index], ...field };
        } else {
          updatedFields.push(field);
        }
      });
      
      const nextData = { ...prev, fields: updatedFields };
      if (prev.mapName && prev.mapName !== 'DefaultMap') {
        safeStorage.setItem(`gameData_${prev.mapName}`, JSON.stringify(nextData));
      }
      return nextData;
    });
  }, []);

  const toggleProductionOwnership = React.useCallback((name: string) => {
    setData(prev => {
      const currentOwned = prev.productions[name]?.isOwned;
      const newOwned = !currentOwned;
      
      manualProductionOverridesRef.current = {
        ...manualProductionOverridesRef.current,
        [name]: newOwned
      };
      if (mapNameRef.current && mapNameRef.current !== 'DefaultMap') {
        safeStorage.setItem(`manualProductionOverrides_${mapNameRef.current}`, JSON.stringify(manualProductionOverridesRef.current));
      } else {
        safeStorage.setItem('manualProductionOverrides', JSON.stringify(manualProductionOverridesRef.current));
      }

      return {
        ...prev,
        productions: {
          ...prev.productions,
          [name]: {
            ...(prev.productions[name] || { name, inputs: {}, outputs: {} }),
            isOwned: newOwned
          }
        }
      };
    });
  }, []);

  const addManualProduction = React.useCallback((production: ProductionData) => {
    manualProductionsRef.current = {
      ...manualProductionsRef.current,
      [production.name]: production
    };
    if (mapNameRef.current && mapNameRef.current !== 'DefaultMap') {
      safeStorage.setItem(`manualProductions_${mapNameRef.current}`, JSON.stringify(manualProductionsRef.current));
    } else {
      safeStorage.setItem('manualProductions', JSON.stringify(manualProductionsRef.current));
    }

    setData(prev => ({
      ...prev,
      productions: {
        ...prev.productions,
        [production.name]: {
          ...production,
          isOwned: true
        }
      }
    }));
  }, []);

  return (
    <GameDataContext.Provider value={{ data, syncStatus, lastSync, connectLocalFolder, handleManualJsonUpload, updateField, updateAnimal, updateVehicle, removeField, addField, addFields, toggleProductionOwnership, addManualProduction, renameMap }}>
      {children}
    </GameDataContext.Provider>
  );
};
