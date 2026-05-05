import React, { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, Upload, Plus, Info, Wifi, X, Check, Sprout, Download, MousePointerClick, FolderSync, Droplets, ZoomIn, ZoomOut, Maximize, Filter, Leaf, RefreshCw } from 'lucide-react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { cn } from '../lib/utils';
import cultureData from '../data-culture.json';
import { useGameData, Field } from '../lib/GameDataContext';
import { useLanguage } from '../lib/LanguageContext';
import { translateFillType } from '../lib/translations';
import { safeStorage } from '../lib/storage';
import { saveImageToDB, getImageFromDB, removeImageFromDB } from '../lib/idb';

// Helper to get crop-specific growth states
const getCropGrowthInfo = (crop: string | undefined) => {
  const c = (crop || '').toUpperCase();
  
  // Default for most grains (Wheat, Barley, Oat, Canola, Soybean, Sorghum, Sunflower, Corn)
  let readyStart = 5;
  let readyEnd = 7;
  let withered = 8;
  
  if (['GRASS', 'MEADOW'].includes(c)) {
    readyStart = 4; readyEnd = 4; withered = -1;
  } else if (['OILSEEDRADISH', 'RADISH'].includes(c)) {
    readyStart = 2; readyEnd = 2; withered = -1;
  } else if (['POTATO', 'SUGARBEET', 'CARROT', 'PARSNIP', 'BEETROOT'].includes(c)) {
    readyStart = 6; readyEnd = 7; withered = 8;
  } else if (['COTTON'].includes(c)) {
    readyStart = 6; readyEnd = 8; withered = 9;
  } else if (['SUGARCANE'].includes(c)) {
    readyStart = 8; readyEnd = 8; withered = -1;
  } else if (['POPLAR'].includes(c)) {
    readyStart = 14; readyEnd = 14; withered = -1;
  } else if (['GRAPE', 'OLIVE'].includes(c)) {
    readyStart = 8; readyEnd = 8; withered = -1;
  } else if (['SPINACH'].includes(c)) {
    readyStart = 4; readyEnd = 4; withered = 5;
  } else if (['PEAS', 'GREENBEANS'].includes(c)) {
    readyStart = 5; readyEnd = 6; withered = 7;
  } else if (['RICE', 'RICE_LONG'].includes(c)) {
    readyStart = 5; readyEnd = 7; withered = 8;
  }
  
  return { readyStart, readyEnd, withered };
};

const getGrowthStateColor = (state?: string, crop?: string) => {
  const c = crop?.toUpperCase();
  if (c === 'FERME' || c === 'FARM') return 'bg-slate-700 dark:bg-slate-800 text-white border-slate-800 dark:border-slate-900';
  if (c === 'FORÊT' || c === 'FORET' || c === 'FOREST') return 'bg-emerald-800 dark:bg-emerald-900 text-white border-emerald-900 dark:border-emerald-950';
  
  if (!state || state === 'Inconnu') return 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500';
  
  const s = state.toLowerCase();
  
  // Numeric states from FS25
  const numState = parseInt(s, 10);
  if (!isNaN(numState)) {
    const { readyStart, readyEnd, withered } = getCropGrowthInfo(crop);
    
    if (numState === 0) return 'bg-stone-700 dark:bg-stone-800 text-white border-stone-800 dark:border-stone-900'; // Plowed/Cultivated
    if (numState === 1) return 'bg-stone-400 dark:bg-stone-500 text-white border-stone-500 dark:border-stone-600'; // Seeded
    if (numState >= 2 && numState < readyStart) return 'bg-emerald-400 dark:bg-emerald-500 text-white border-emerald-500 dark:border-emerald-600'; // Growing
    if (numState >= readyStart && numState <= readyEnd) return 'bg-amber-400 dark:bg-amber-500 text-amber-900 dark:text-amber-50 border-amber-500 dark:border-amber-600'; // Ready
    if (numState === withered) return 'bg-orange-800 dark:bg-orange-900 text-white border-orange-900 dark:border-orange-950'; // Withered
    if (numState > readyEnd && numState !== withered) return 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border-yellow-400 dark:border-yellow-700'; // Harvested
  }

  // String states
  if (s.includes('labour') || s.includes('plowed')) return 'bg-stone-700 dark:bg-stone-800 text-white border-stone-800 dark:border-stone-900';
  if (s.includes('cultivat') || s.includes('travaillé')) return 'bg-stone-500 dark:bg-stone-600 text-white border-stone-600 dark:border-stone-700';
  if (s.includes('seedbed') || s.includes('semence')) return 'bg-stone-400 dark:bg-stone-500 text-white border-stone-500 dark:border-stone-600';
  if (s.includes('grow') || s.includes('croissance')) return 'bg-emerald-400 dark:bg-emerald-500 text-white border-emerald-500 dark:border-emerald-600';
  if (s.includes('ready') || s.includes('récolte')) return 'bg-amber-400 dark:bg-amber-500 text-amber-900 dark:text-amber-50 border-amber-500 dark:border-amber-600';
  if (s.includes('harvested') || s.includes('récolté')) return 'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border-yellow-400 dark:border-yellow-700';
  if (s.includes('withered') || s.includes('fané')) return 'bg-orange-800 dark:bg-orange-900 text-white border-orange-900 dark:border-orange-950';
  
  return 'bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-400 border-emerald-600 dark:border-emerald-500';
};

const getGrowthStateLabel = (state: string | undefined, crop: string | undefined, t: (key: string) => string) => {
  if (!state || state === 'Inconnu' || state === 'Unknown') return t('map.unknown');
  
  const s = state.toLowerCase();

  // Numeric states from FS25
  const numState = parseInt(s, 10);
  if (!isNaN(numState)) {
    const { readyStart, readyEnd, withered } = getCropGrowthInfo(crop);
    
    if (numState === 0) return t('map.plowed');
    if (numState === 1) return t('map.seedbed');
    if (numState >= 2 && numState < readyStart) return t('map.growing');
    if (numState >= readyStart && numState <= readyEnd) return t('map.ready');
    if (numState === withered) return t('map.withered');
    if (numState > readyEnd && numState !== withered) return t('map.harvested');
  }

  // String states
  if (s.includes('plowed') || s.includes('labour')) return t('map.plowed');
  if (s.includes('cultivat') || s.includes('travaillé')) return t('map.cultivated');
  if (s.includes('seedbed') || s.includes('semence')) return t('map.seedbed');
  if (s.includes('grow') || s.includes('croissance')) return t('map.growing');
  if (s.includes('ready') || s.includes('récolte')) return t('map.ready');
  if (s.includes('harvested') || s.includes('récolté')) return t('map.harvested');
  if (s.includes('withered') || s.includes('fané')) return t('map.withered');
  
  return state;
};

// At the top of InteractiveMap.tsx, after imports
const FieldDetailsCard = ({ 
  field, 
  updateField, 
  removeField, 
  onClose 
}: { 
  field: Field, 
  updateField: (id: string, updates: Partial<Field>) => void, 
  removeField: (id: string) => void,
  onClose?: () => void 
}) => {
  const { t, language } = useLanguage();

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm mb-4">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {field.id.startsWith('manual_') 
            ? (field.displayId ? `${t('map.field.number')} ${field.displayId}` : t('map.field.manual')) 
            : `${t('map.field.number')} ${field.id}`}
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {field.id.startsWith('manual_') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Numéro du champ</label>
            <input 
              type="text" 
              value={field.displayId || ''}
              placeholder="Ex: 42"
              onChange={(e) => updateField(field.id, { displayId: e.target.value })}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('map.crop_type')}</label>
          <select 
            value={field.crop}
            onChange={(e) => updateField(field.id, { crop: e.target.value })}
            className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
          >
            <option value="Inconnu">{t('map.select')}</option>
            <optgroup label={t('map.special')}>
              <option value="FARM">{t('map.farm')}</option>
              <option value="FOREST">{t('map.forest')}</option>
            </optgroup>
            <optgroup label={t('map.crops')}>
              {cultureData.map(c => (
                <option key={c.name} value={c.name}>{translateFillType(c.name, language)}</option>
              ))}
            </optgroup>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('map.farmland_size')}</label>
            <input 
              type="number" 
              step="0.01"
              value={field.farmlandSize ? Math.round(field.farmlandSize * 100) / 100 : (field.size ? Math.round(field.size * 100) / 100 : '')}
              onChange={(e) => updateField(field.id, { farmlandSize: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('map.field_size')}</label>
            <input 
              type="number" 
              step="0.01"
              value={field.fieldSize || ''}
              onChange={(e) => updateField(field.id, { fieldSize: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="bg-gray-50/80 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">{t('map.growth_state')}</label>
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full border flex-shrink-0", getGrowthStateColor(field.growthState, field.crop))}></div>
              <select 
                value={getGrowthStateLabel(field.growthState, field.crop, t)}
                onChange={(e) => updateField(field.id, { growthState: e.target.value })}
                className="w-full bg-transparent font-medium text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
              >
                <option value={t('map.unknown')}>{t('map.unknown')}</option>
                <option value={t('map.plowed')}>{t('map.plowed')}</option>
                <option value={t('map.cultivated')}>{t('map.cultivated')}</option>
                <option value={t('map.seedbed')}>{t('map.seedbed')}</option>
                <option value={t('map.growing')}>{t('map.growing')}</option>
                <option value={t('map.ready')}>{t('map.ready')}</option>
                <option value={t('map.harvested')}>{t('map.harvested')}</option>
                <option value={t('map.withered')}>{t('map.withered')}</option>
              </select>
            </div>
          </div>
          
          <div className="bg-gray-50/80 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">{t('map.owner')}</label>
            <button 
              onClick={() => updateField(field.id, { isOwned: !field.isOwned })}
              className="font-medium text-sm flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
            >
              {field.isOwned ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t('map.you')}</span>
              ) : (
                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5"><X className="w-4 h-4" /> {t('map.not_owned')}</span>
              )}
            </button>
          </div>

          <div className="bg-gray-50/80 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">{t('map.field.needs_fert')}</label>
            <button 
              onClick={() => updateField(field.id, { needsFertilizer: !field.needsFertilizer })}
              className="font-medium text-sm flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
            >
              {field.needsFertilizer ? (
                <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t('map.yes')}</span>
              ) : (
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t('map.no')}</span>
              )}
            </button>
          </div>

          <div className="bg-gray-50/80 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">{t('map.field.needs_lime')}</label>
            <button 
              onClick={() => updateField(field.id, { needsLime: !field.needsLime })}
              className="font-medium text-sm flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
            >
              {field.needsLime ? (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t('map.yes')}</span>
              ) : (
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t('map.no')}</span>
              )}
            </button>
          </div>

          <div className="bg-gray-50/80 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">{t('map.field.needs_plow')}</label>
            <button 
              onClick={() => updateField(field.id, { needsPlowing: !field.needsPlowing })}
              className="font-medium text-sm flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
            >
              {field.needsPlowing ? (
                <span className="text-amber-800 dark:text-amber-500 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t('map.yes')}</span>
              ) : (
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t('map.no')}</span>
              )}
            </button>
          </div>

          <div className="bg-gray-50/80 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
            <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">{t('map.field.needs_weed')}</label>
            <button 
              onClick={() => updateField(field.id, { needsWeeding: !field.needsWeeding })}
              className="font-medium text-sm flex items-center gap-2 hover:opacity-80 transition-opacity w-full text-left"
            >
              {field.needsWeeding ? (
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t('map.yes')}</span>
              ) : (
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5"><Check className="w-4 h-4" /> {t('map.no')}</span>
              )}
            </button>
          </div>
        </div>

        {/* Technical Details Section */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 border border-blue-100 dark:border-blue-800/30 mt-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-3 flex items-center gap-2">
            <MapIcon className="w-4 h-4" />
            Détails Techniques
          </h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {field.plannedFruit && field.plannedFruit !== 'NONE' && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Culture prévue:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{translateFillType(field.plannedFruit, language)}</span>
              </div>
            )}
            {field.groundType && field.groundType !== 'UNKNOWN' && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Type de sol:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{field.groundType}</span>
              </div>
            )}
            {field.sprayType && field.sprayType !== 'NONE' && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Type de pulvérisation:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{field.sprayType}</span>
              </div>
            )}
            {field.sprayLevel !== undefined && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Niveau pulvérisation:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{field.sprayLevel}</span>
              </div>
            )}
            {field.limeLevel !== undefined && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Niveau chaux:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{field.limeLevel}</span>
              </div>
            )}
            {field.plowLevel !== undefined && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Niveau labour:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{field.plowLevel}</span>
              </div>
            )}
            {field.rollerLevel !== undefined && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Niveau roulage:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{field.rollerLevel}</span>
              </div>
            )}
            {field.stubbleShredLevel !== undefined && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Niveau broyage:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{field.stubbleShredLevel}</span>
              </div>
            )}
            {field.stoneLevel !== undefined && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Niveau pierres:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{field.stoneLevel}</span>
              </div>
            )}
            {field.waterLevel !== undefined && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Niveau eau:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{field.waterLevel}</span>
              </div>
            )}
            {field.weedState !== undefined && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">État mauvaises herbes:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{field.weedState}</span>
              </div>
            )}
            {field.lastGrowthState !== undefined && (
              <div className="flex justify-between items-center border-b border-blue-100 dark:border-blue-800/30 pb-1">
                <span className="text-gray-500 dark:text-gray-400">Dernier état croissance:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{field.lastGrowthState}</span>
              </div>
            )}
          </div>
        </div>

        {field.crop !== 'Inconnu' && (field.fieldSize || field.size || field.farmlandSize) && (field.fieldSize || field.size || field.farmlandSize)! > 0 && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 rounded-xl p-4 mt-4">
            <h4 className="text-sm font-medium text-emerald-800 dark:text-emerald-400 mb-2">{t('map.estimations')}</h4>
            {(() => {
              // Try to find the crop in cultureData ignoring case and accents
              const normalizedCrop = field.crop.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const cropInfo = cultureData.find(c => {
                const normalizedC = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                // Map EN to FR for matching if necessary
                const frTranslations: Record<string, string> = {
                  'wheat': 'ble', 'barley': 'orge', 'canola': 'colza', 'oat': 'avoine', 'sorghum': 'sorgho',
                  'sunflower': 'tournesol', 'soybean': 'soja', 'corn': 'mais', 'maize': 'mais', 'potato': 'pomme de terre', 'potatoes': 'pomme de terre',
                  'sugarbeet': 'betterave', 'sugarbeets': 'betterave sucrieres', 'sugarcane': 'canne a sucre', 'cotton': 'coton', 'grape': 'raisin',
                  'olive': 'olives', 'spinach': 'epinards', 'peas': 'petits pois', 'greenbeans': 'haricots verts',
                  'rice': 'riz', 'rice_long': 'riz long grain', 'grass': 'herbe', 'meadow': 'herbe', 'oilseedradish': 'radis oleagineux', 'carrot': 'carottes', 'parsnip': 'panais', 'clover': 'trefle', 'alfalfa': 'luzerne'
                };
                
                // Allow matching "betterave" to "betterave sucrieres" just in case it falls back to common name.
                if (normalizedCrop === 'betterave' && normalizedC.includes('betterave')) return true;
                
                // Specific handling for NFD chars being funny sometimes.
                if (normalizedC === normalizedCrop || normalizedC.replace(/s$/, '') === normalizedCrop.replace(/s$/, '')) return true;

                return frTranslations[normalizedCrop] === normalizedC || frTranslations[normalizedC] === normalizedCrop;
              });

              if (!cropInfo || cropInfo.yieldPerHa === 'N/A' || cropInfo.avgPrice === 'N/A') return null;
              
              // We extract the digits out of the strings (e.g. "17,800 l" -> 17800)
              const yieldNumStr = cropInfo.yieldPerHa.replace(/,/g, '').replace(/[^0-9]/g, '');
              const priceNumStr = cropInfo.avgPrice.replace(/,/g, '').replace(/[^0-9]/g, '');
              
              const yieldNum = parseInt(yieldNumStr);
              const priceNum = parseInt(priceNumStr);
              
              if (isNaN(yieldNum) || isNaN(priceNum)) return null;

              const actualSize = field.fieldSize || field.farmlandSize || field.size || 0;
              const totalYield = yieldNum * actualSize;
              const totalRevenue = (totalYield / 1000) * priceNum;

              if (isNaN(totalYield) || isNaN(totalRevenue)) return null;

              return (
                <div className="space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
                  <div className="flex justify-between">
                    <span>{t('map.estimated_harvest')}</span>
                    <span className="font-semibold">{Math.round(totalYield).toLocaleString(language)} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('map.estimated_revenue')}</span>
                    <span className="font-semibold">{totalRevenue.toLocaleString(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Precision Farming Panel */}
        <div className="bg-zinc-900 dark:bg-black/40 border border-zinc-800 dark:border-zinc-800/50 rounded-xl p-4 mt-4 text-zinc-300 shadow-inner">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
            <Leaf className="w-4 h-4 text-emerald-500" />
            {t('map.pf.env_score')}
          </h4>
          
          {(() => {
            const pf = field.precisionFarming || {
              environmentalScore: 50,
              nitrogen: 15.0,
              ph: 7.5,
              weedControl: 15.0,
              soilSampling: 7.5,
              tillage: 5.0,
              soilType: 'Inconnu'
            };

            const updatePf = (key: keyof typeof pf, value: any) => {
              updateField(field.id, {
                precisionFarming: { ...pf, [key]: value }
              });
            };

            const renderBar = (label: string, value: number, max: number, key: keyof typeof pf) => {
              const percent = Math.min(100, Math.max(0, (value / max) * 100));
              return (
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-medium uppercase tracking-wider w-1/3 truncate" title={label}>{label}</span>
                  <div className="flex-1 h-2 bg-zinc-700 dark:bg-zinc-800 rounded-full overflow-hidden flex cursor-pointer"
                       onClick={(e) => {
                         const rect = e.currentTarget.getBoundingClientRect();
                         const clickX = e.clientX - rect.left;
                         const newPercent = clickX / rect.width;
                         const newValue = Math.round(newPercent * max * 10) / 10;
                         updatePf(key, newValue);
                       }}>
                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="font-bold text-white w-8 text-right">{value.toFixed(1)}</span>
                </div>
              );
            };

            return (
              <div className="space-y-4">
                {/* Total Score Bar */}
                <div className="space-y-1">
                  <div className="text-center font-black text-2xl text-white mb-2">{Math.round(pf.environmentalScore)}</div>
                  <div className="relative h-3 w-full bg-zinc-800 dark:bg-zinc-900 rounded-full overflow-hidden cursor-pointer"
                       onClick={(e) => {
                         const rect = e.currentTarget.getBoundingClientRect();
                         const clickX = e.clientX - rect.left;
                         const newPercent = clickX / rect.width;
                         updatePf('environmentalScore', Math.round(newPercent * 100));
                       }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 opacity-80" />
                    <div className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)] transition-all duration-300" style={{ left: `${pf.environmentalScore}%`, transform: 'translateX(-50%)' }} />
                  </div>
                </div>

                <div className="space-y-2.5 pt-3 border-t border-zinc-800 dark:border-zinc-800/50">
                  {renderBar(t('map.pf.nitrogen'), pf.nitrogen, 30, 'nitrogen')}
                  {renderBar(t('map.pf.ph'), pf.ph, 15, 'ph')}
                  {renderBar(t('map.pf.weed_control'), pf.weedControl, 30, 'weedControl')}
                  {renderBar(t('map.pf.soil_sampling'), pf.soilSampling, 15, 'soilSampling')}
                  {renderBar(t('map.pf.tillage'), pf.tillage, 10, 'tillage')}
                </div>

                <div className="pt-3 border-t border-zinc-800 dark:border-zinc-800/50 flex justify-between items-center text-xs">
                  <span className="uppercase tracking-wider font-medium">{t('map.pf.soil_type')}</span>
                  <select 
                    value={pf.soilType}
                    onChange={(e) => updatePf('soilType', e.target.value)}
                    className="bg-zinc-800 dark:bg-zinc-900 text-white border border-zinc-700 dark:border-zinc-800 rounded px-2 py-1 outline-none focus:border-emerald-500"
                  >
                    <option value="Inconnu">{t('map.unknown')}</option>
                    <option value="Sableux">Sableux</option>
                    <option value="Sablo-limoneux">Sablo-limoneux</option>
                    <option value="Limoneux">Limoneux</option>
                    <option value="Argilo-limoneux">Argilo-limoneux</option>
                  </select>
                </div>
              </div>
            );
          })()}
        </div>

        <button 
          onClick={() => {
            removeField(field.id);
            if (onClose) onClose();
          }}
          className="w-full py-2.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors mt-4"
        >
          {t('map.delete_field')}
        </button>
      </div>
    </div>
  );
};

export function InteractiveMap() {
  const { data, syncStatus, lastSync, connectLocalFolder, handleManualJsonUpload, updateField, removeField, addField, addFields, renameMap } = useGameData();
  const { t, language } = useLanguage();
  const [pdaImage, setPdaImage] = useState<string | null>(null);
  const pdaImageTimestampRef = useRef<number>(0);
  const [showModModal, setShowModModal] = useState(false);
  const [mapSize, setMapSize] = useState<number>(2048); // Default 2km map
  const [showOnlyOwned, setShowOnlyOwned] = useState(false);
  const [showFieldNumbers, setShowFieldNumbers] = useState(true);
  
  // Manual Mode
  const [isAddingField, setIsAddingField] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  const [autoSyncEnabled, setAutoSyncEnabled] = useState(() => {
    return safeStorage.getItem('autoSyncEnabled') === 'true';
  });
  const [autoSyncInterval, setAutoSyncInterval] = useState(() => {
    return Number(safeStorage.getItem('autoSyncInterval')) || 30;
  });

  useEffect(() => {
    safeStorage.setItem('autoSyncEnabled', String(autoSyncEnabled));
  }, [autoSyncEnabled]);

  useEffect(() => {
    safeStorage.setItem('autoSyncInterval', String(autoSyncInterval));
  }, [autoSyncInterval]);
  const dataFieldsRef = useRef(data.fields);

  useEffect(() => {
    dataFieldsRef.current = data.fields;
  }, [data.fields]);

  const [lastAutoSync, setLastAutoSync] = useState<Date | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    const performAutoSync = async () => {
      try {
        const saveRes = await fetch('/api/scan-savegame');
        if (!saveRes.ok) return;
        
        const saveData = await saveRes.json();
        const farmlands = saveData.farmlands || [];
        const fieldStates = saveData.fieldStates || [];
        
        if (fieldStates.length > 0) {
          setLastAutoSync(new Date());
        }
        
        const newFieldsToAdd: Field[] = [];
        
        fieldStates.forEach((state: any) => {
          const existingField = dataFieldsRef.current.find(f => f.id === state.id);
          const isOwned = farmlands.some((f: any) => f.id === state.id && f.isOwned);
          
          const crop = state.fruitType ? state.fruitType.toUpperCase() : 'Inconnu';
          const growthState = state.growthState || 'Inconnu';
          const needsFertilizer = parseInt(state.fertilizer) < 2;
          const needsLime = parseInt(state.lime) === 0;
          const needsPlowing = parseInt(state.plow) > 0;
          const needsWeeding = parseInt(state.weed) > 0;
          
          if (existingField) {
            if (
              existingField.crop !== crop ||
              existingField.growthState !== growthState ||
              existingField.needsFertilizer !== needsFertilizer ||
              existingField.needsLime !== needsLime ||
              existingField.needsPlowing !== needsPlowing ||
              existingField.needsWeeding !== needsWeeding ||
              existingField.isOwned !== isOwned
            ) {
              updateField(existingField.id, {
                crop,
                growthState,
                needsFertilizer,
                needsLime,
                needsPlowing,
                needsWeeding,
                isOwned
              });
            }
          } else {
            // Try to find if this field ID was previously known but deleted or just not in current data
            // We use 50, 50 as fallback, but addFields will now upsert
            newFieldsToAdd.push({
              id: state.id,
              x: 50,
              y: 50,
              crop,
              growthState,
              needsFertilizer,
              needsLime,
              needsPlowing,
              needsWeeding,
              isOwned
            });
          }
        });
        
        if (newFieldsToAdd.length > 0) {
          addFields(newFieldsToAdd);
          // If we added new fields, try to fetch their real coordinates automatically
          fetch('/api/auto-fields').then(res => res.json()).then(data => {
            const modFields = data.fields || [];
            if (modFields.length > 0) {
              const fieldsWithCoords = newFieldsToAdd.map(nf => {
                const mf = modFields.find((m: any) => m.id === nf.id);
                if (mf) {
                  return { ...nf, x: mf.x, y: mf.z };
                }
                return null;
              }).filter(Boolean) as Field[];
              
              if (fieldsWithCoords.length > 0) {
                addFields(fieldsWithCoords);
              }
            }
          }).catch(() => {});
        }
      } catch (e) {
        console.error("Auto-sync failed", e);
      }
    };

    if (autoSyncEnabled) {
      performAutoSync();
      intervalId = setInterval(performAutoSync, autoSyncInterval * 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [autoSyncEnabled, autoSyncInterval, updateField, addFields]);

  const selectedField = data.fields.find(f => f.id === selectedFieldId) || null;

  // Load saved PDA image and map size on mount
  useEffect(() => {
    const loadSavedMapData = async () => {
      // First try to load from IndexedDB using specific mapName
      const dbKey = data.mapName && data.mapName !== 'DefaultMap' && data.mapName !== 'UnknownMap' 
        ? `pdaImage_${data.mapName}` 
        : 'pdaImage';
      
      let savedImage = await getImageFromDB(dbKey);
      
      // Fallback to old localStorage method
      if (!savedImage) {
        savedImage = safeStorage.getItem('pdaImage');
        // If we found it in localStorage, migrate it to DB
        if (savedImage) {
          saveImageToDB(dbKey, savedImage).catch(console.warn);
        }
      }
      
      if (savedImage) {
        setPdaImage(savedImage);
        
        // Push it to the server so other devices like smartphones can access it across server restarts
        try {
          fetch('/api/pda-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: savedImage, mapName: data.mapName || 'global' })
          }).catch(console.warn);
        } catch (e) {}
      } else {
        setPdaImage(null);
      }
      
      const savedMapSize = safeStorage.getItem(`mapSize_${data.mapName}`) || safeStorage.getItem('mapSize');
      if (savedMapSize) {
        setMapSize(parseInt(savedMapSize, 10));
      }
    };
    
    loadSavedMapData();
  }, [data.mapName]);

  // Auto-sync fields if connected and empty
  useEffect(() => {
    if (syncStatus === 'connected' && data.fields.length === 0) {
      autoFetchFields();
    }
  }, [syncStatus, data.fields.length]);

  const detectAndSetMapSize = (base64: string) => {
    const img = new Image();
    img.onload = () => {
      const savedMapSize = safeStorage.getItem(`mapSize_${data.mapName}`) || safeStorage.getItem('mapSize');
      if (savedMapSize) {
        // If the user already saved a map size, let's respect it and not auto-overwrite.
        // We only auto-detect if no size was saved yet.
        return;
      }
      
      let selectedSize = 2048;
      const width = img.naturalWidth;
      // Many maps are 2048 world units but use 1024px PDA image. 
      // Auto-detect larger maps, but default to 2048.
      if (width > 2048) {
        if ([4096, 8192, 16384].includes(width)) {
          selectedSize = width;
        } else {
          // Fallback: find the closest standard size above 2048
          const sizes = [4096, 8192, 16384];
          selectedSize = sizes.reduce((prev, curr) => 
            Math.abs(curr - width) < Math.abs(prev - width) ? curr : prev
          );
        }
      }
      
      setMapSize(selectedSize);
      if (data.mapName && data.mapName !== 'DefaultMap' && data.mapName !== 'UnknownMap') {
        safeStorage.setItem(`mapSize_${data.mapName}`, selectedSize.toString());
      } else {
        safeStorage.setItem('mapSize', selectedSize.toString());
      }
    };
    img.src = base64;
  };

  // Poll server for PDA image
  useEffect(() => {
    const fetchPdaImage = async () => {
      try {
        const queryParams = new URLSearchParams({
          t: pdaImageTimestampRef.current.toString(),
          mapName: data.mapName || 'global'
        });
        const res = await fetch(`/api/pda-image?${queryParams.toString()}`);
        if (res.ok) {
          const apiData = await res.json();
          // Only overwrite our map if the server actively sends a NEW image.
          // If server sends null but we have one in IDB, ignore the server null to prevent wipe,
          // UNLESS the user actively deleted it (in which case they deleted it locally too).
          if (!apiData.unchanged && apiData.image) {
            setPdaImage(apiData.image);
            pdaImageTimestampRef.current = apiData.timestamp;
            detectAndSetMapSize(apiData.image);
          } else if (apiData.unchanged && apiData.timestamp) {
            pdaImageTimestampRef.current = apiData.timestamp;
          }
        }
      } catch (e) {
        // Silently fail
      }
    };

    const interval = setInterval(fetchPdaImage, 5000);
    fetchPdaImage(); // Initial fetch

    return () => clearInterval(interval);
  }, []);

  const handleMapSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setMapSize(newSize);
    if (data.mapName && data.mapName !== 'DefaultMap' && data.mapName !== 'UnknownMap') {
      safeStorage.setItem(`mapSize_${data.mapName}`, newSize.toString());
    } else {
      safeStorage.setItem('mapSize', newSize.toString());
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isDds = file.name.toLowerCase().endsWith('.dds');
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        if (isDds) {
          try {
            const res = await fetch('/api/convert-dds', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ image: base64 })
            });
            if (res.ok) {
              const data = await res.json();
              saveAndSetImage(data.image);
            } else {
              alert("Erreur lors de la conversion du fichier DDS.");
            }
          } catch (e) {
            alert("Erreur lors de la conversion du fichier DDS.");
          }
        } else {
          saveAndSetImage(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveAndSetImage = async (base64: string) => {
    let targetMapName = data.mapName;
    if (targetMapName === 'DefaultMap' || targetMapName === 'UnknownMap') {
      const newName = window.prompt("Nom de la carte non détecté. Veuillez entrer un nom pour associer cette carte et sauvegarder votre progression :", "Ma Carte");
      if (newName) {
        targetMapName = newName;
        renameMap(newName);
      } else {
        targetMapName = 'ImportManuel';
        renameMap('ImportManuel');
      }
    }
  
    setPdaImage(base64);
    
    // Save to IndexedDB
    const dbKey = targetMapName !== 'DefaultMap' && targetMapName !== 'UnknownMap' 
        ? `pdaImage_${targetMapName}` 
        : 'pdaImage';
    try {
      await saveImageToDB(dbKey, base64);
    } catch (e) {
      console.warn("Impossible de sauvegarder l'image dans IndexedDB.", e);
    }
    
    detectAndSetMapSize(base64);
    
    // Push to server
    try {
      await fetch('/api/pda-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mapName: targetMapName })
      });
    } catch (e) {
      console.error("Failed to push PDA image to server", e);
    }
  };

  const autoFetchMap = async () => {
    try {
      const res = await fetch('/api/auto-map-image');
      if (res.ok) {
        const data = await res.json();
        if (data.image) {
          saveAndSetImage(data.image);
        }
      } else {
        const err = await res.json();
        alert(`Impossible de trouver la carte automatiquement : ${err.error || 'Erreur inconnue'}`);
      }
    } catch (e) {
      alert("Erreur lors de la récupération automatique de la carte.");
    }
  };

  const autoFetchFields = async () => {
    try {
      // 1. Get field positions from the mod
      const fieldsRes = await fetch('/api/auto-fields');
      let modFields = [];
      if (fieldsRes.ok) {
        const data = await fieldsRes.json();
        modFields = data.fields || [];
      }

      // 2. Get ownership and field states from the savegame
      const saveRes = await fetch('/api/scan-savegame');
      let farmlands = [];
      let fieldStates = [];
      if (saveRes.ok) {
        const data = await saveRes.json();
        farmlands = data.farmlands || [];
        fieldStates = data.fieldStates || [];
      }

      const fieldsToAdd: Field[] = [];

      // Combine data
      if (modFields.length > 0) {
        modFields.forEach((f: any) => {
          const state = fieldStates.find((fs: any) => fs.id === f.id);
          const isOwned = farmlands.some((fl: any) => fl.id === f.id && fl.isOwned);
          
          fieldsToAdd.push({
            id: f.id,
            x: f.x,
            y: f.z,
            crop: state && state.fruitType ? state.fruitType.toUpperCase() : 'Inconnu',
            growthState: state ? state.growthState : 'Inconnu',
            needsFertilizer: state ? (parseInt(state.fertilizer) < 2) : false,
            needsLime: state ? (parseInt(state.lime) === 0) : false,
            needsPlowing: state ? (parseInt(state.plow) > 0) : false,
            needsWeeding: state ? (parseInt(state.weed) > 0) : false,
            isOwned: isOwned
          });
        });
      }

      // Also add fields from savegame that might not have positions in mod
      fieldStates.forEach((state: any) => {
        if (!fieldsToAdd.some(f => f.id === state.id)) {
          const isOwned = farmlands.some((fl: any) => fl.id === state.id && fl.isOwned);
          fieldsToAdd.push({
            id: state.id,
            x: 50,
            y: 50,
            crop: state.fruitType ? state.fruitType.toUpperCase() : 'Inconnu',
            growthState: state.growthState || 'Inconnu',
            needsFertilizer: parseInt(state.fertilizer) < 2,
            needsLime: parseInt(state.lime) === 0,
            needsPlowing: parseInt(state.plow) > 0,
            needsWeeding: parseInt(state.weed) > 0,
            isOwned: isOwned
          });
        }
      });

      if (fieldsToAdd.length > 0) {
        addFields(fieldsToAdd);
        alert(`${fieldsToAdd.length} champs détectés avec leurs cultures et états !`);
      } else {
        alert("Aucun champ détecté. Assurez-vous que votre sauvegarde et vos mods sont accessibles.");
      }
    } catch (e) {
      console.error("Error fetching fields", e);
      alert("Erreur lors de la récupération automatique des champs.");
    }
  };

  const removePdaImage = async () => {
    setPdaImage(null);
    safeStorage.removeItem('pdaImage');
    
    // Remove from IndexedDB
    const dbKey = data.mapName && data.mapName !== 'DefaultMap' && data.mapName !== 'UnknownMap' 
        ? `pdaImage_${data.mapName}` 
        : 'pdaImage';
    try {
      await removeImageFromDB(dbKey);
    } catch (e) {
      console.warn("Impossible de supprimer l'image d'IndexedDB.", e);
    }

    try {
      await fetch('/api/pda-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null })
      });
    } catch (e) {}
  };

  const getFieldCoordinates = (field: any) => {
    // Manual fields are already saved as percentages (0-100)
    if (field.id.startsWith('manual_')) {
      return { left: `${field.x}%`, top: `${field.y}%` };
    }
    
    // Mod fields are in world coordinates (e.g. -1024 to 1024 for a 2048 map)
    // We need to convert them to percentages
    const radius = mapSize / 2;
    const percentX = ((field.x + radius) / mapSize) * 100;
    // Use field.z from the Lua mod, or field.y if it exists
    const zCoord = field.z !== undefined ? field.z : field.y;
    const percentY = ((zCoord + radius) / mapSize) * 100;
    
    return { left: `${percentX}%`, top: `${percentY}%` };
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!isAddingField || !mapRef.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const newId = `manual_${Date.now()}`;
    addField({
      id: newId,
      x,
      y,
      crop: 'Blé',
      growthState: 'Inconnu'
    });
    
    setSelectedFieldId(newId);
    setIsAddingField(false);
  };

  const handleFieldClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedFieldId(id);
    setIsAddingField(false);
    
    // Scroll to details on mobile
    if (window.innerWidth < 1024) {
      setTimeout(() => {
        document.getElementById('field-details-panel')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 pb-24 space-y-6">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md pb-4 pt-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('map.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('map.subtitle')}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <button 
              onClick={() => setShowModModal(true)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                syncStatus === 'connected' ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" : 
                syncStatus === 'error' ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              <Wifi className={cn("w-4 h-4", syncStatus === 'connected' && "animate-pulse")} />
              {syncStatus === 'connected' ? t('animals.sync.status') : syncStatus === 'error' ? t('map.sync_error') : t('map.connect_game')}
            </button>
          </div>
          {lastSync && syncStatus === 'connected' && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('animals.sync.last')} : {new Date(lastSync).toLocaleTimeString(language)}
            </span>
          )}
        </div>
      </div>

      {!pdaImage ? (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center bg-gray-50 dark:bg-gray-800/50">
          <MapIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('map.import_pda')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {t('map.import_pda_desc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex flex-col gap-2">
              <button 
                onClick={autoFetchMap}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 cursor-pointer transition-colors"
              >
                <MapIcon className="w-5 h-5" />
                Récupérer automatiquement la carte
              </button>
              <button 
                onClick={autoFetchFields}
                className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-medium rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 cursor-pointer transition-colors"
              >
                <MousePointerClick className="w-4 h-4" />
                Détecter tous les champs du mod
              </button>
            </div>
            <label className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-medium rounded-xl hover:bg-emerald-700 cursor-pointer transition-colors">
              <Upload className="w-5 h-5" />
              {t('map.choose_image')}
              <input type="file" accept="image/*,.dds" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex overflow-x-auto pb-2 gap-2 snap-x hide-scrollbar">
              <button
                onClick={() => setIsAddingField(!isAddingField)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors snap-start",
                  isAddingField ? "bg-emerald-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <MousePointerClick className="w-4 h-4" />
                {isAddingField ? t('map.manual.clicking') : t('map.manual.add')}
              </button>
              
              <button
                onClick={() => setShowOnlyOwned(!showOnlyOwned)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors snap-start",
                  showOnlyOwned ? "bg-emerald-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <Filter className="w-4 h-4" />
                {showOnlyOwned ? t('map.show_owned') : t('map.show_all')}
              </button>

              <button
                onClick={() => setShowFieldNumbers(!showFieldNumbers)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors snap-start",
                  !showFieldNumbers ? "bg-emerald-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                )}
              >
                <Info className="w-4 h-4" />
                {showFieldNumbers ? t('map.hide_numbers') : t('map.show_numbers')}
              </button>
              
              <button
                onClick={removePdaImage}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors snap-start"
              >
                {t('map.change_map')}
              </button>

              <button
                onClick={autoFetchMap}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors snap-start"
                title="Récupérer automatiquement la carte"
              >
                <MapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Auto</span>
              </button>

              <button
                onClick={autoFetchFields}
                className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors snap-start"
                title="Détecter automatiquement tous les champs"
              >
                <MousePointerClick className="w-4 h-4" />
                <span className="hidden sm:inline">Champs</span>
              </button>

              <div className="flex-shrink-0 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 snap-start">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={autoSyncEnabled}
                    onChange={(e) => setAutoSyncEnabled(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <RefreshCw className={cn("w-4 h-4", autoSyncEnabled && "animate-spin")} />
                    Auto-Sync
                  </span>
                </label>
                {autoSyncEnabled && (
                  <div className="flex items-center gap-2">
                    <select 
                      value={autoSyncInterval}
                      onChange={(e) => setAutoSyncInterval(Number(e.target.value))}
                      className="text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-1 py-0.5 outline-none text-gray-700 dark:text-gray-300"
                    >
                      <option value={10}>10s</option>
                      <option value={30}>30s</option>
                      <option value={60}>1m</option>
                      <option value={300}>5m</option>
                    </select>
                    {lastAutoSync && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        {lastAutoSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 flex items-center gap-2 ml-auto snap-start">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('map.map_size')}</label>
                <select 
                  value={mapSize}
                  onChange={handleMapSizeChange}
                  className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg p-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value={1024}>1x (1km)</option>
                  <option value={2048}>Standard (2km)</option>
                  <option value={4096}>4x (4km)</option>
                  <option value={8192}>16x (8km)</option>
                  <option value={16384}>64x (16km)</option>
                </select>
              </div>
            </div>

            <div className="relative group">
              <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={8}
                centerOnInit={true}
                wheel={{ step: 0.1 }}
                doubleClick={{ disabled: true }}
              >
                {({ zoomIn, zoomOut, resetTransform }) => (
                  <>
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                      <button onClick={() => zoomIn()} className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-md rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                        <ZoomIn className="w-5 h-5" />
                      </button>
                      <button onClick={() => zoomOut()} className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-md rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                        <ZoomOut className="w-5 h-5" />
                      </button>
                      <button onClick={() => resetTransform()} className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur shadow-md rounded-lg text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-colors">
                        <Maximize className="w-5 h-5" />
                      </button>
                    </div>

                    <TransformComponent
                      wrapperClass="!w-full !h-auto"
                      contentClass="!w-full !h-auto"
                    >
                      <div 
                        ref={mapRef}
                        onClick={handleMapClick}
                        className={cn(
                          "relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 w-full max-w-[800px] mx-auto shadow-inner",
                          isAddingField && "cursor-crosshair ring-2 ring-emerald-500"
                        )}
                      >
                        <img src={pdaImage} alt="PDA Map" className="w-full h-auto block select-none pointer-events-none" />
                        
                        {data.fields
                          .filter(field => !showOnlyOwned || field.isOwned)
                          .map(field => {
                            if (!field.id.startsWith('manual_') && field.x === 0 && (field.z === 0 || field.y === 0)) {
                              return null;
                            }
                            
                            const colorClass = getGrowthStateColor(field.growthState, field.crop);
                            const isHovered = hoveredFieldId === field.id;
                            
                            return (
                              <div 
                                key={field.id}
                                className="absolute z-10"
                                style={getFieldCoordinates(field)}
                                onMouseEnter={() => setHoveredFieldId(field.id)}
                                onMouseLeave={() => setHoveredFieldId(null)}
                              >
                                <button
                                  onClick={(e) => handleFieldClick(e, field.id)}
                                  className={cn(
                                    "w-5 h-5 -ml-2.5 -mt-2.5 sm:w-7 sm:h-7 sm:-ml-3.5 sm:-mt-3.5 rounded-full flex items-center justify-center transform transition-all hover:scale-110 shadow-md border-2",
                                    selectedField?.id === field.id ? "ring-4 ring-emerald-600/30 z-20 scale-110 " + colorClass : colorClass,
                                    !field.isOwned && "opacity-80 scale-90 sm:scale-100"
                                  )}
                                >
                                  {showFieldNumbers && (
                                    <span className="text-[8px] sm:text-[11px] font-bold">
                                      {field.displayId || field.id.replace('manual_', '')}
                                    </span>
                                  )}
                                </button>
                                
                                {isHovered && (
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50 pointer-events-none">
                                    <div className="font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-1 mb-2">
                                      {field.id.startsWith('manual_') 
                                        ? (field.displayId ? `${t('map.field.number')} ${field.displayId}` : t('map.field.manual')) 
                                        : `${t('map.field.number')} ${field.id.replace('manual_', '')}`}
                                    </div>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">{t('map.crops')}:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{translateFillType(field.crop, language)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">{t('map.farmland_size')}:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{field.farmlandSize !== undefined ? field.farmlandSize.toFixed(2) : (field.size ? field.size.toFixed(2) : 0)} ha</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">{t('map.field_size')}:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{field.fieldSize !== undefined ? field.fieldSize.toFixed(2) : 0} ha</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">{t('map.growth_state')}:</span>
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{getGrowthStateLabel(field.growthState, field.crop, t)}</span>
                                      </div>
                                      
                                      <div className="flex gap-1 pt-1 mt-1 border-t border-gray-100 dark:border-gray-700">
                                        {field.needsFertilizer && <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400" title={t('map.needs_fertilizer')}><Droplets className="w-3 h-3" /></div>}
                                        {field.needsLime && <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400" title={t('map.needs_lime')}><Droplets className="w-3 h-3" /></div>}
                                        {field.needsPlowing && <div className="w-5 h-5 rounded-full bg-amber-900/10 dark:bg-amber-900/30 flex items-center justify-center text-amber-800 dark:text-amber-500" title={t('map.needs_plowing')}><Droplets className="w-3 h-3" /></div>}
                                        {field.needsWeeding && <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400" title={t('map.weeds')}><Droplets className="w-3 h-3" /></div>}
                                      </div>
                                    </div>
                                    <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-b border-r border-gray-200 dark:border-gray-700 rotate-45"></div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </TransformComponent>
                  </>
                )}
              </TransformWrapper>
            </div>
          </div>

          <div className="space-y-4 h-[calc(100vh-12rem)] overflow-y-auto pr-2" id="field-details-panel">
            {selectedField ? (
              <FieldDetailsCard 
                field={selectedField} 
                updateField={updateField} 
                removeField={removeField} 
                onClose={() => setSelectedFieldId(null)} 
              />
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center h-full flex flex-col items-center justify-center min-h-[300px] sticky top-24">
                <MapIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">{t('map.select_field_desc')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {showModModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="border-b border-gray-100 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <FolderSync className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {t('map.mod_conn_title')}
              </h2>
              <button onClick={() => setShowModModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('map.mod_conn_desc')}
              </p>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                <h3 className="font-semibold text-emerald-900 dark:text-emerald-300 mb-2 text-sm flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  {t('map.mod_update_required')}
                </h3>
                <p className="text-sm text-emerald-800 dark:text-emerald-400/80 mb-3">
                  {t('map.installer_desc')}
                </p>
                <a 
                  href="/Install-FS25-WebSync-Local.bat" 
                  download="Install-FS25-WebSync-Local.bat"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {t('map.download_installer')}
                </a>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm">{t('map.instructions')}</h3>
                <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <li>{t('map.inst_1')}</li>
                  <li>{t('map.inst_2')} <code className="bg-white dark:bg-gray-800 px-1 py-0.5 rounded border border-gray-200 dark:border-gray-600">Documents / My Games / FarmingSimulator2025 / modSettings / FS25_WebSync</code></li>
                  <li>{t('map.inst_3')}</li>
                </ol>
              </div>

              <button 
                onClick={connectLocalFolder}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors"
              >
                <FolderSync className="w-5 h-5" />
                {t('map.select_mod_folder')}
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-sm font-medium">{t('map.or')}</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              <label className="w-full flex items-center justify-center gap-2 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <Upload className="w-5 h-5" />
                {t('map.import_json')}
                <input type="file" accept=".json" className="hidden" onChange={handleManualJsonUpload} />
              </label>
              
              <button 
                onClick={() => setShowModModal(false)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mt-4"
              >
                <X className="w-5 h-5" />
                Fermer
              </button>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                {t('map.preview_note')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
