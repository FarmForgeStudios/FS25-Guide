import React, { useState, useEffect } from 'react';
import { Sprout, Calendar, ArrowRight, Wifi, Map as MapIcon, Droplets, Edit2, Trash2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import cultureData from '../data-culture.json';
import { useGameData } from '../lib/GameDataContext';
import { ItemIcon } from '../lib/icons';
import { useLanguage } from '../lib/LanguageContext';
import { translateFillType } from '../lib/translations';

function getMonthIndices(rangeStr: string, monthNames: string[]): number[] {
  if (!rangeStr || rangeStr === 'N/A') return [];
  const parts = rangeStr.split('-').map(s => s.trim());
  
  const findIdx = (str: string) => {
    const s = str.toLowerCase().replace('é', 'e').replace('û', 'u').replace('è', 'e').replace('fèv', 'fev').replace('déc', 'dec');
    return monthNames.findIndex(m => {
      const mNorm = m.toLowerCase().replace('è', 'e').replace('é', 'e').replace('fèv', 'fev').replace('déc', 'dec');
      return s.startsWith(mNorm.substring(0, 3));
    });
  };

  if (parts.length === 1) {
    const idx = findIdx(parts[0]);
    return idx !== -1 ? [idx] : [];
  }

  const startIdx = findIdx(parts[0]);
  const endIdx = findIdx(parts[1]);

  if (startIdx === -1 || endIdx === -1) return [];

  const result = [];
  let current = startIdx;
  while (true) {
    result.push(current);
    if (current === endIdx) break;
    current = (current + 1) % 12;
  }
  return result;
}

function getRecommendedNextCrops(currentCropName: string, monthNames: string[]) {
  const currentCrop = cultureData.find(c => c.name === currentCropName);
  if (!currentCrop) return [];

  const harvestIndices = getMonthIndices(currentCrop.harvestIn, monthNames);
  if (harvestIndices.length === 0) return [];

  const lastHarvestMonth = harvestIndices[harvestIndices.length - 1];
  
  const window = [
    lastHarvestMonth,
    (lastHarvestMonth + 1) % 12,
    (lastHarvestMonth + 2) % 12
  ];

  return cultureData.filter(c => {
    if (c.name === currentCropName) return false;
    const plantIndices = getMonthIndices(c.plantIn, monthNames);
    return plantIndices.some(m => window.includes(m));
  }).slice(0, 5);
}

function FieldCard({ field, monthNames, updateField, removeField, t, language }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(field.displayId || field.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const recommended = getRecommendedNextCrops(field.crop, monthNames);
  const cropInfo = cultureData.find(c => c.name === field.crop);

  const handleSave = () => {
    updateField(field.id, { displayId: editName });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(field.displayId || field.id);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (showDeleteConfirm) {
      removeField(field.id);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm relative group">
      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setIsEditing(true)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title={t('rotation.rename')}>
          <Edit2 className="w-4 h-4" />
        </button>
        <button onClick={handleDelete} className={cn("p-1.5 rounded-md transition-colors", showDeleteConfirm ? "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-900/30" : "text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30")} title={t('rotation.delete')}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between items-start mb-4 pr-16">
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2 mb-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 rounded px-2 py-1 text-sm font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
              <button onClick={handleSave} className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded" title={t('rotation.save')}>
                <Check className="w-4 h-4" />
              </button>
              <button onClick={handleCancel} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title={t('rotation.cancel')}>
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {field.id.startsWith('manual_') 
                ? (field.displayId ? `${t('map.field.number')} ${field.displayId}` : t('map.field.manual')) 
                : (field.displayId ? `${t('map.field.number')} ${field.displayId}` : `${t('map.field.number')} ${field.id}`)}
            </h3>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">{field.size ? field.size.toFixed(2) : 0} ha</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-1.5">
            <ItemIcon type={field.crop} className="w-4 h-4" />
            {translateFillType(field.crop, language)}
          </div>
          <div className="flex gap-1">
            {field.needsFertilizer && (
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400" title={t('map.field.needs_fert')}>
                <Droplets className="w-3 h-3" />
              </div>
            )}
            {field.needsLime && (
              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400" title={t('map.field.needs_lime')}>
                <Droplets className="w-3 h-3" />
              </div>
            )}
            {field.needsPlowing && (
              <div className="w-6 h-6 rounded-full bg-amber-900/10 dark:bg-amber-900/30 flex items-center justify-center text-amber-800 dark:text-amber-500" title={t('map.field.needs_plow')}>
                <Droplets className="w-3 h-3" />
              </div>
            )}
            {field.needsWeeding && (
              <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400" title={t('map.field.needs_weed')}>
                <Droplets className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {cropInfo && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            {t('rotation.plant')} : {cropInfo.plantIn}
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            {t('rotation.harvest')} : {cropInfo.harvestIn}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          {t('rotation.recommended')}
        </div>
        {recommended.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {recommended.map((rec: any) => (
              <div key={rec.name} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                <ItemIcon type={rec.name} className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium text-gray-700 dark:text-gray-300">{translateFillType(rec.name, language)}</span>
                <ArrowRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400">{rec.plantIn}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">{t('rotation.no_recommendation')}</p>
        )}
      </div>
    </div>
  );
}

export function CropRotation() {
  const { data, syncStatus, lastSync, updateField, removeField } = useGameData();
  const { t, language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState<number>(1);
  const [showAllFields, setShowAllFields] = useState(false);

  const monthNames = Array.from({ length: 12 }, (_, i) => t(`month.${i + 1}`));

  useEffect(() => {
    if (data.currentMonth !== undefined) {
      setCurrentMonth(data.currentMonth);
    }
  }, [data]);

  const displayFields = data.fields.filter(f => {
    if (showAllFields) return true;
    // For manual fields, only show if they have a custom display number
    if (f.id.startsWith('manual_')) {
      return !!f.displayId;
    }
    // For regular fields, show if owned
    return f.isOwned === true;
  });

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24 space-y-6">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md pb-4 pt-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('rotation.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('rotation.subtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            syncStatus === 'connected' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : 
            syncStatus === 'error' ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
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

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            {showAllFields ? t('rotation.all_fields') : t('rotation.owned_fields')}
          </h2>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showAllFields} 
              onChange={(e) => setShowAllFields(e.target.checked)}
              className="rounded text-emerald-600 focus:ring-emerald-500 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
            {t('rotation.show_all')}
          </label>
        </div>
        
        {displayFields.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {t('rotation.no_fields')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayFields.map(field => (
              <FieldCard 
                key={field.id} 
                field={field} 
                monthNames={monthNames} 
                updateField={updateField} 
                removeField={removeField}
                t={t}
                language={language}
              />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          {t('rotation.calendar')}
          <span className="ml-2 text-sm font-normal text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-800/30">
            {t('rotation.current_month')} : {monthNames[currentMonth - 1]}
          </span>
        </h2>
        
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm overflow-auto max-h-[70vh]">
          <table className="w-full text-sm text-left relative">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-medium bg-gray-50 dark:bg-gray-900/50">{t('map.field.crops')}</th>
                {monthNames.map((month, i) => {
                  const isCurrentMonth = currentMonth === i + 1;
                  return (
                    <th key={i} className={cn(
                      "px-2 py-3 font-medium text-center text-xs relative bg-gray-50 dark:bg-gray-900/50",
                      isCurrentMonth ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-400 font-bold border-x-2 border-t-2 border-emerald-500 dark:border-emerald-600" : ""
                    )}>
                      {month}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {cultureData.map((culture, index, arr) => {
                const plantIndices = getMonthIndices(culture.plantIn, monthNames);
                const harvestIndices = getMonthIndices(culture.harvestIn, monthNames);
                const isLastRow = index === arr.length - 1;
                
                return (
                  <tr key={culture.name} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center gap-2">
                      <ItemIcon type={culture.name} className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      {translateFillType(culture.name, language)}
                    </td>
                    {monthNames.map((_, i) => {
                      const isPlanting = plantIndices.includes(i);
                      const isHarvesting = harvestIndices.includes(i);
                      const isCurrentMonth = currentMonth === i + 1;
                      
                      return (
                        <td key={i} className={cn(
                          "px-1 py-3 text-center relative",
                          isCurrentMonth ? "bg-emerald-50/50 dark:bg-emerald-900/20 border-x-2 border-emerald-500 dark:border-emerald-600" : "",
                          isCurrentMonth && isLastRow ? "border-b-2" : ""
                        )}>
                          {isPlanting && isHarvesting ? (
                            <div className="w-full h-6 rounded bg-gradient-to-r from-emerald-400 to-amber-400 opacity-80" />
                          ) : isPlanting ? (
                            <div className="w-full h-6 rounded bg-emerald-400 opacity-80" />
                          ) : isHarvesting ? (
                            <div className="w-full h-6 rounded bg-amber-400 opacity-80" />
                          ) : (
                            <div className="w-full h-6 rounded bg-gray-100/50 dark:bg-gray-700/50" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 px-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-400 opacity-80" />
            <span>{t('rotation.planting_period')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-400 opacity-80" />
            <span>{t('rotation.harvest_period')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
