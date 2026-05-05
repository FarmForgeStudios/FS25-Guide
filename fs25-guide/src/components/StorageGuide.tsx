import React, { useState, useEffect } from 'react';
import { Warehouse, Wifi, Package, Droplets } from 'lucide-react';
import { cn } from '../lib/utils';
import cultureData from '../data-culture.json';
import { useGameData } from '../lib/GameDataContext';
import { ItemIcon } from '../lib/icons';
import { useLanguage } from '../lib/LanguageContext';
import { translateFillType } from '../lib/translations';

type StorageItem = {
  name: string;
  level: number;
  capacity: number;
};

export function StorageGuide() {
  const { data, syncStatus, lastSync } = useGameData();
  const { t, language } = useLanguage();
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [showEmpty, setShowEmpty] = useState(false);

  const balesList = [
    { name: 'STRAW', key: 'straw' },
    { name: 'DRYGRASS_WINDROW', key: 'dryGrass_windrow' },
    { name: 'SILAGE', key: 'silage' }
  ];

  const pelletsList = [
    { name: 'STRAWPELLETS', key: 'strawpellets' },
    { name: 'HAYPELLETS', key: 'haypellets' }
  ];

  const hiddenList = ['FORAGE', 'FORAGE_MIXING', 'MANURE', 'LIQUIDMANURE'];

  const seedsAndFertilizersList = [
    { name: 'SEEDS', key: 'SEEDS' },
    { name: 'FERTILIZER', key: 'FERTILIZER' },
    { name: 'LIQUIDFERTILIZER', key: 'LIQUIDFERTILIZER' },
    { name: 'HERBICIDE', key: 'HERBICIDE' }
  ];

  useEffect(() => {
    const items: StorageItem[] = [];
    const specializedKeys = [
      ...seedsAndFertilizersList.map(i => i.key.toLowerCase()),
      ...seedsAndFertilizersList.map(i => i.name.toLowerCase()),
      ...balesList.map(i => i.key.toLowerCase()),
      ...balesList.map(i => i.name.toLowerCase()),
      ...pelletsList.map(i => i.key.toLowerCase()),
      ...pelletsList.map(i => i.name.toLowerCase()),
      ...hiddenList.map(i => i.toLowerCase())
    ];
    
    Object.keys(data.storage).forEach(key => {
      const lowerKey = key.toLowerCase();
      const isSpecialized = specializedKeys.includes(lowerKey) || 
                           specializedKeys.includes(translateFillType(key, language).toLowerCase());
      
      if (!isSpecialized) {
        items.push({
          name: key,
          level: data.storage[key].level,
          capacity: data.storage[key].capacity > 0 ? data.storage[key].capacity : 100000
        });
      }
    });

    cultureData.forEach(c => {
      const lowerName = c.name.toLowerCase();
      const isSpecialized = specializedKeys.includes(lowerName);
      
      if (!isSpecialized && !items.find(i => i.name.toLowerCase() === lowerName)) {
        items.push({
          name: c.name,
          level: 0,
          capacity: 100000
        });
      }
    });

    // Add Straw Pellets if missing
    if (!items.find(i => i.name.toLowerCase() === 'strawpellets')) {
      items.push({
        name: 'STRAWPELLETS',
        level: 0,
        capacity: 100000
      });
    }

    setStorageItems(items);
  }, [data.storage, language]);

  const displayItems = storageItems
    .filter(item => showEmpty || item.level > 0)
    .sort((a, b) => b.level - a.level);

  const getStorageLevel = (key: string) => {
    let total = 0;
    const searchKeys = new Set([
      key.toLowerCase(), 
      key.toUpperCase(),
      // Add common aliases
      ...(key.toLowerCase() === 'seeds' ? ['seeds', 'semences'] : []),
      ...(key.toLowerCase() === 'fertilizer' ? ['fertilizer', 'engrais'] : []),
      ...(key.toLowerCase() === 'liquidfertilizer' ? ['liquidfertilizer', 'liquid_fertilizer'] : []),
      ...(key.toLowerCase() === 'herbicide' ? ['herbicide'] : []),
      ...(key.toLowerCase() === 'drygrass_windrow' ? ['drygrass_windrow', 'drygrass'] : [])
    ]);

    Object.keys(data.storage).forEach(k => {
      const translated = translateFillType(k, language).toLowerCase();
      if (searchKeys.has(k.toLowerCase()) || searchKeys.has(translated)) {
        total += data.storage[k].level;
      }
    });

    return total;
  };

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md pb-4 pt-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('storage.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('storage.subtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            syncStatus === 'connected' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : 
            syncStatus === 'error' ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          )}>
            <div className="flex items-center gap-2">
              <Wifi className={cn("w-4 h-4", syncStatus === 'connected' && "animate-pulse")} />
              {syncStatus === 'connected' ? t('animals.sync.status') : syncStatus === 'error' ? t('animals.sync.error') : t('animals.sync.offline')}
            </div>
          </div>
          {lastSync && syncStatus === 'connected' && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('animals.sync.last')} : {new Date(lastSync).toLocaleTimeString(language)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              {t('storage.silos')}
            </h2>
            <button
              onClick={() => setShowEmpty(!showEmpty)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-lg font-medium transition-all",
                showEmpty 
                  ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" 
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              {t('storage.show_empty')}
            </button>
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-5">
            {displayItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Warehouse className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p>{t('storage.empty_silos')}</p>
              </div>
            ) : displayItems.map(item => {
              const percentage = item.capacity > 0 ? Math.min(100, Math.max(0, (item.level / item.capacity) * 100)) : 0;
              
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                      <ItemIcon type={item.name} className="w-4 h-4 text-amber-500" />
                      {translateFillType(item.name, language)}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className={cn("font-semibold", item.level > 0 ? "text-gray-900 dark:text-white" : "")}>
                        {Math.round(item.level).toLocaleString(language)}
                      </span>
                      <span className="text-gray-400 dark:text-gray-500 mx-1">/</span>
                      <span className="text-gray-500 dark:text-gray-400">{Math.round(item.capacity).toLocaleString(language)} L</span>
                    </div>
                  </div>
                  
                  <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        percentage > 90 ? "bg-red-500" : percentage > 75 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            {t('storage.bales')}
          </h2>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
            {balesList.map(item => {
              const level = getStorageLevel(item.key);
              return { ...item, level };
            })
              .filter(item => item.level > 0)
              .map(item => (
                <div key={item.name} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg">
                      <ItemIcon type={item.name} className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-amber-900 dark:text-amber-100">{translateFillType(item.name, language)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
                      {Math.round(item.level).toLocaleString(language)} L
                    </div>
                    <div className="text-xs text-amber-600/70 dark:text-amber-500/70">
                      {t('storage.total_volume')}
                    </div>
                  </div>
                </div>
              ))}
            
            {balesList.map(item => getStorageLevel(item.key)).every(l => l === 0) && syncStatus === 'connected' && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p>{t('storage.empty_bales')}</p>
              </div>
            )}
            
            {syncStatus !== 'connected' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm text-gray-500 dark:text-gray-400 flex items-start gap-2">
                <Wifi className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  {t('storage.connect_game')}
                </p>
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mt-8">
            <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            {t('storage.seeds_fertilizers')}
          </h2>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
            {seedsAndFertilizersList.map(item => {
              const level = getStorageLevel(item.key);
              return { ...item, level };
            })
              .filter(item => item.level > 0)
              .map(item => (
                <div key={item.name} className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg">
                      <ItemIcon type={item.name} className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-blue-900 dark:text-blue-100">{translateFillType(item.name, language)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                      {Math.round(item.level).toLocaleString(language)} L
                    </div>
                    <div className="text-xs text-blue-600/70 dark:text-blue-500/70">
                      {t('storage.total_volume')}
                    </div>
                  </div>
                </div>
              ))}
            
            {seedsAndFertilizersList.map(item => getStorageLevel(item.key)).every(l => l === 0) && syncStatus === 'connected' && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p>{t('storage.empty_seeds')}</p>
              </div>
            )}
            
            {syncStatus !== 'connected' && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-sm text-gray-500 dark:text-gray-400 flex items-start gap-2">
                <Wifi className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  {t('storage.connect_game')}
                </p>
              </div>
            )}
          </div>

          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mt-8">
            <Package className="w-5 h-5 text-amber-600 dark:text-amber-500" />
            {t('storage.pellets')}
          </h2>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
            {pelletsList.map(item => {
              const level = getStorageLevel(item.key);
              return { ...item, level };
            })
              .filter(item => item.level > 0)
              .map(item => (
                <div key={item.name} className="flex items-center justify-between p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg">
                      <ItemIcon type={item.name} className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-amber-900 dark:text-amber-100">{translateFillType(item.name, language)}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-400">
                      {Math.round(item.level).toLocaleString(language)} L
                    </div>
                    <div className="text-xs text-amber-600/70 dark:text-amber-500/70">
                      {t('storage.total_volume')}
                    </div>
                  </div>
                </div>
              ))}
            
            {pelletsList.map(item => getStorageLevel(item.key)).every(l => l === 0) && syncStatus === 'connected' && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Package className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p>{t('storage.empty_pellets')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
