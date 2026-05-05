import React from 'react';
import { useGameData } from '../lib/GameDataContext';
import { useLanguage } from '../lib/LanguageContext';
import { Wheat, Droplets, AlertTriangle, CheckCircle2, Factory, Tractor, Map as MapIcon, Coins, Warehouse } from 'lucide-react';
import { cn } from '../lib/utils';
import { translateFillType } from '../lib/translations';

export function Dashboard() {
  const { data, syncStatus } = useGameData();
  const { t, language } = useLanguage();

  // Calculate stats
  const totalFields = data.fields.filter(f => f.isOwned).length;
  const totalAnimals = data.animals.reduce((acc, a) => acc + (a.count || 0), 0);
  const totalVehicles = data.vehicles?.length || 0;
  
  // Calculate alerts
  const readyFields = data.fields.filter(f => f.isOwned && f.growthState === 'Prêt pour la récolte' || f.growthState === 'Ready for harvest' || f.growthState === 'ready');
  const needsAttentionFields = data.fields.filter(f => f.isOwned && (f.needsFertilizer || f.needsLime || f.needsPlowing || f.needsWeeding));
  
  const hungryAnimals = data.animals.filter(a => {
    const waterLow = a.water && typeof a.water === 'object' && a.water.max > 0 && (a.water.current / a.water.max) < 0.2;
    let foodLow = false;
    if (a.food && typeof a.food === 'object') {
      const totalFood = (a.food as any)['TOTAL'];
      if (totalFood && totalFood.max > 0 && (totalFood.current / totalFood.max) < 0.2) {
        foodLow = true;
      }
    }
    return waterLow || foodLow;
  });

  const stoppedProductions = (Object.values(data.productions) as any[]).filter(p => p.isOwned && p.status === 'Stopped');

  const hasAlerts = readyFields.length > 0 || hungryAnimals.length > 0 || stoppedProductions.length > 0 || needsAttentionFields.length > 0;

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24 space-y-6">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md pb-4 pt-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.subtitle')}</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl transition-colors">
            <MapIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalFields}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wider">{t('dashboard.fields_owned')}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl transition-colors">
            <Tractor className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalVehicles}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wider">{t('dashboard.vehicles')}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl transition-colors">
            <Droplets className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalAnimals}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wider">{t('dashboard.animals')}</div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-4 transition-colors">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl transition-colors">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{(Object.values(data.productions) as any[]).filter(p => p.isOwned).length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wider">{t('dashboard.factories')}</div>
          </div>
        </div>
      </div>

      {/* Storage Summary */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Warehouse className="w-5 h-5 text-emerald-500" />
              {t('tab.storage')}
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {Object.entries(data.storage)
                .filter(([_, val]) => val.level > 0)
                .sort((a, b) => b[1].level - a[1].level)
                .slice(0, 5)
                .map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{translateFillType(key, language)}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(val.level).toLocaleString()} L</span>
                  </div>
                ))}
              {Object.keys(data.storage).filter(k => data.storage[k].level > 0).length === 0 && (
                <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                  {t('storage.empty')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mt-8">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        {t('dashboard.alerts')}
      </h2>

      {!hasAlerts ? (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl p-8 text-center transition-colors">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 dark:text-emerald-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-emerald-900 dark:text-emerald-300">{t('dashboard.no_alerts')}</h3>
          <p className="text-emerald-600 dark:text-emerald-400/80 mt-1">{t('dashboard.no_alerts_desc')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {readyFields.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-5 shadow-sm transition-colors">
              <h3 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-4">
                <Wheat className="w-5 h-5" />
                {t('dashboard.harvest_ready')}
              </h3>
              <div className="space-y-2">
                {readyFields.map(f => (
                  <div key={f.id} className="flex justify-between items-center bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-800/30 transition-colors">
                    <span className="font-medium text-amber-900 dark:text-amber-300">{t('map.field')} {f.displayId || f.id}</span>
                    <span className="text-sm text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-md">{translateFillType(f.crop, language)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hungryAnimals.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800/50 rounded-2xl p-5 shadow-sm transition-colors">
              <h3 className="font-bold text-red-800 dark:text-red-400 flex items-center gap-2 mb-4">
                <Droplets className="w-5 h-5" />
                {t('dashboard.animals_hungry')}
              </h3>
              <div className="space-y-2">
                {hungryAnimals.map(a => (
                  <div key={a.id} className="flex justify-between items-center bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-800/30 transition-colors">
                    <span className="font-medium text-red-900 dark:text-red-300">{translateFillType(a.breed || a.species, language)}</span>
                    <span className="text-sm text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 px-2 py-1 rounded-md">{a.count} {t('dashboard.heads')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {stoppedProductions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800/50 rounded-2xl p-5 shadow-sm transition-colors">
              <h3 className="font-bold text-orange-800 dark:text-orange-400 flex items-center gap-2 mb-4">
                <Factory className="w-5 h-5" />
                {t('dashboard.productions_stopped')}
              </h3>
              <div className="space-y-2">
                {stoppedProductions.map(p => (
                  <div key={p.name} className="flex justify-between items-center bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl border border-orange-100 dark:border-orange-800/30 transition-colors">
                    <span className="font-medium text-orange-900 dark:text-orange-300">{p.name}</span>
                    <span className="text-sm text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 px-2 py-1 rounded-md">{t('dashboard.needs_materials')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {needsAttentionFields.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-5 shadow-sm transition-colors">
              <h3 className="font-bold text-blue-800 dark:text-blue-400 flex items-center gap-2 mb-4">
                <MapIcon className="w-5 h-5" />
                {t('dashboard.fields_attention')}
              </h3>
              <div className="space-y-2">
                {needsAttentionFields.map(f => (
                  <div key={f.id} className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800/30 transition-colors">
                    <span className="font-medium text-blue-900 dark:text-blue-300">{t('map.field')} {f.displayId || f.id}</span>
                    <div className="flex gap-1">
                      {f.needsFertilizer && <span className="text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-1 rounded-md">{t('map.needs_fertilizer')}</span>}
                      {f.needsLime && <span className="text-xs text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md">{t('map.needs_lime')}</span>}
                      {f.needsPlowing && <span className="text-xs text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-md">{t('map.needs_plowing')}</span>}
                      {f.needsWeeding && <span className="text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-1 rounded-md">{t('map.weeds')}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
