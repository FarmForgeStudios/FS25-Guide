import React from 'react';
import { useGameData } from '../lib/GameDataContext';
import { useLanguage } from '../lib/LanguageContext';
import { Tractor, Wrench, Droplets, Clock, Wifi, Edit2, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { translateFillType } from '../lib/translations';

export function Vehicles() {
  const { data, syncStatus, lastSync, updateVehicle } = useGameData();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = React.useState<'vehicles' | 'equipment'>('vehicles');
  const [editingPrice, setEditingPrice] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState<string>('');

  const allVehicles = data.vehicles || [];

  // Filtering logic
  const filteredItems = allVehicles.filter(v => {
    const category = v.category?.toLowerCase() || '';
    // Remove Big-bags and Palettes
    if (category.includes('bigbag') || category.includes('pallet') || category.includes('palette')) {
      return false;
    }
    return true;
  });

  const selfPropelled = filteredItems.filter(v => v.fuelMax > 0);
  const equipment = filteredItems.filter(v => v.fuelMax === 0);

  const currentItems = activeTab === 'vehicles' ? selfPropelled : equipment;

  const formatHours = (ms: number) => {
    const hours = ms / (1000 * 60 * 60);
    return hours.toFixed(1);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(language, {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const totalValue = filteredItems.reduce((sum, v) => sum + (v.price || 0), 0);

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24 space-y-6">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md pb-4 pt-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('vehicles.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('vehicles.subtitle')}</p>
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

        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Sub-tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'vehicles' 
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              {t('vehicles.tab_vehicles')} ({selfPropelled.length})
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeTab === 'equipment' 
                  ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm" 
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              )}
            >
              {t('vehicles.tab_equipment')} ({equipment.length})
            </button>
          </div>
          
          {totalValue > 0 && (
            <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg font-medium text-sm flex items-center gap-2">
              <span>{t('vehicles.total_value') || 'Valeur totale'} :</span>
              <span className="font-bold">{formatCurrency(totalValue)}</span>
            </div>
          )}
        </div>
      </div>

      {currentItems.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <Tractor className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {activeTab === 'vehicles' ? t('vehicles.no_vehicles') : t('vehicles.no_equipment')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
            {activeTab === 'vehicles' ? t('vehicles.no_vehicles_desc') : t('vehicles.no_equipment_desc')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentItems.map((v, idx) => {
            const condition = 100 - (v.damage * 100);
            const paint = 100 - (v.wear * 100);
            const fuelPercent = v.fuelMax > 0 ? (v.fuel / v.fuelMax) * 100 : 0;
            
            return (
              <div key={`${v.name}-${idx}`} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      {v.brand && (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wider">
                          {v.brand}
                        </span>
                      )}
                      {editingPrice === v.name ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-20 text-xs px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateVehicle(v.name, { price: parseFloat(editValue) || 0 });
                                setEditingPrice(null);
                              } else if (e.key === 'Escape') {
                                setEditingPrice(null);
                              }
                            }}
                          />
                          <button
                            onClick={() => {
                              updateVehicle(v.name, { price: parseFloat(editValue) || 0 });
                              setEditingPrice(null);
                            }}
                            className="p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPrice(v.name);
                            setEditValue(v.price ? v.price.toString() : '');
                          }}
                          className="group flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                        >
                          {(v.price || 0) > 0 ? formatCurrency(v.price || 0) : t('vehicles.set_price')}
                          <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      )}
                    </div>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white line-clamp-1" title={v.name}>{v.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {v.category}
                      </span>
                      {v.type && (
                        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded italic">
                          {v.type}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl shrink-0 ml-2">
                    <Tractor className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Condition */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                        <Wrench className="w-4 h-4 text-emerald-500" />
                        {t('vehicles.condition')}
                      </div>
                      <span className={cn("font-semibold", condition < 50 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white")}>
                        {Math.round(condition)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-500", condition < 30 ? "bg-red-500" : condition < 70 ? "bg-amber-500" : "bg-emerald-500")}
                        style={{ width: `${condition}%` }}
                      />
                    </div>
                  </div>

                  {/* Paint */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        {t('vehicles.paint')}
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {Math.round(paint)}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-400 transition-all duration-500"
                        style={{ width: `${paint}%` }}
                      />
                    </div>
                  </div>

                  {/* Fuel */}
                  {v.fuelMax > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                          <Droplets className={cn("w-4 h-4", v.fuelType === 'ELECTRICCHARGE' ? "text-yellow-500" : "text-amber-600")} />
                          {v.fuelType ? translateFillType(v.fuelType, language) : t('vehicles.fuel')}
                        </div>
                        <span className={cn("font-semibold", fuelPercent < 20 ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white")}>
                          {Math.round(v.fuel)} / {Math.round(v.fuelMax)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", 
                            fuelPercent < 20 ? "bg-red-500" : 
                            v.fuelType === 'ELECTRICCHARGE' ? "bg-yellow-400" : "bg-amber-500"
                          )}
                          style={{ width: `${fuelPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Operating Time */}
                  <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <span>{formatHours(v.operatingTime)} {t('vehicles.hours')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
