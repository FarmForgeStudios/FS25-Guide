import React, { useState, useEffect } from 'react';
import { Factory, ArrowRight, ArrowDown, Wifi, PackageOpen, Package, Info, Edit2, Check, X, Plus, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import productionData from '../data-production.json';
import cultureData from '../data-culture.json';
import { useGameData } from '../lib/GameDataContext';
import { ItemIcon } from '../lib/icons';
import { useLanguage } from '../lib/LanguageContext';
import { translateFillType } from '../lib/translations';
import { safeStorage } from '../lib/storage';

export function ProductionGuide() {
  const { data, syncStatus, lastSync, toggleProductionOwnership, addManualProduction } = useGameData();
  const { t, language } = useLanguage();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [mapProductions, setMapProductions] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFactoryName, setNewFactoryName] = useState('');

  const handleAddManual = () => {
    const name = newFactoryName.trim();
    if (!name) return;

    // Check if we have static data for this factory to pre-fill inputs/outputs
    const staticMatch = productionData.find(p => 
      p.name.toLowerCase() === name.toLowerCase() ||
      translateFillType(p.name, language).toLowerCase() === name.toLowerCase()
    );

    const inputs: Record<string, { current: number; max: number }> = {};
    const outputs: Record<string, { current: number; max: number }> = {};

    if (staticMatch) {
      staticMatch.inputs.forEach(input => {
        inputs[input.toUpperCase()] = { current: 0, max: 100000 };
      });
      staticMatch.outputs.forEach(output => {
        outputs[output.toUpperCase()] = { current: 0, max: 100000 };
      });
    }

    addManualProduction({
      name: staticMatch ? staticMatch.name : name,
      inputs,
      outputs,
      isOwned: true
    });
    setNewFactoryName('');
    setShowAddModal(false);
  };

  useEffect(() => {
    const fetchMapProductions = async () => {
      try {
        const res = await fetch('/api/map-productions');
        if (res.ok) {
          const data = await res.json();
          if (data.productions) {
            setMapProductions(data.productions);
          }
        }
      } catch (e) {
        console.error("Failed to fetch map productions", e);
      }
    };
    fetchMapProductions();
  }, []);

  useEffect(() => {
    const initialPrices: Record<string, number> = {};
    cultureData.forEach(c => {
      const priceNum = parseInt(c.avgPrice.replace(/[^0-9]/g, ''));
      if (!isNaN(priceNum)) {
        initialPrices[c.name] = priceNum;
      }
    });
    setPrices(initialPrices);
  }, []);

  useEffect(() => {
    if (Object.keys(data.prices).length > 0) {
      setPrices(prev => ({ ...prev, ...data.prices }));
    }
  }, [data.prices]);

  const getPrice = (itemName: string) => {
    if (prices[itemName]) return prices[itemName];
    const lowerItem = itemName.toLowerCase();
    const match = Object.keys(prices).find(k => k.toLowerCase() === lowerItem);
    if (match) return prices[match];
    return null;
  };

  const getProductionInfo = (prodName: string) => {
    // Try exact match
    if (data.productions[prodName]) return data.productions[prodName];
    
    // Try case-insensitive match
    const lowerName = prodName.toLowerCase();
    const match = Object.keys(data.productions).find(k => k.toLowerCase() === lowerName);
    if (match) return data.productions[match];
    
    // Try partial match (e.g., "Moulin" matching "Moulin à grain")
    const partialMatch = Object.keys(data.productions).find(k => 
      k.toLowerCase().includes(lowerName) || lowerName.includes(k.toLowerCase())
    );
    if (partialMatch) return data.productions[partialMatch];
    
    return null;
  };

  const getStorageInfo = (itemName: string) => {
    if (data.storage[itemName]) return data.storage[itemName];
    const lowerItem = itemName.toLowerCase();
    const match = Object.keys(data.storage).find(k => k.toLowerCase() === lowerItem);
    if (match) return data.storage[match];
    return { level: 0, capacity: 0 };
  };

  const [showAllFactories, setShowAllFactories] = useState(true);

  const [customNames, setCustomNames] = useState<Record<string, string>>(() => {
    const saved = safeStorage.getItem('factoryCustomNames');
    return saved ? JSON.parse(saved) : {};
  });
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleSaveName = (originalName: string) => {
    const newNames = { ...customNames, [originalName]: editValue };
    setCustomNames(newNames);
    safeStorage.setItem('factoryCustomNames', JSON.stringify(newNames));
    setEditingName(null);
  };

  const allProductions = React.useMemo(() => {
    const staticProds = [...productionData];
    const liveProds = Object.keys(data.productions);
    
    // Create a combined list starting with static data
    const combined = [...staticProds];
    
    // Add map productions if not already present
    mapProductions.forEach(mapProd => {
      const exists = combined.some(p => 
        p.name.toLowerCase() === mapProd.name.toLowerCase() ||
        mapProd.name.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(mapProd.name.toLowerCase())
      );
      if (!exists) {
        combined.push({ ...mapProd, isMapMod: true });
      }
    });
    
    // Add ANY owned production from live data that isn't matched yet
    liveProds.forEach(liveName => {
      const liveInfo = data.productions[liveName];
      if (!liveInfo.isOwned) return;

      const exists = combined.some(p => 
        p.name.toLowerCase() === liveName.toLowerCase() ||
        liveName.toLowerCase().includes(p.name.toLowerCase()) ||
        p.name.toLowerCase().includes(liveName.toLowerCase())
      );
      
      if (!exists) {
        combined.push({
          name: liveName,
          inputs: Object.keys(liveInfo.inputs || {}),
          outputs: Object.keys(liveInfo.outputs || {})
        });
      }
    });
    
    // Filter based on ownership if requested
    const filtered = combined.filter(prod => {
      if (showAllFactories) return true;
      const liveProd = getProductionInfo(prod.name);
      return liveProd?.isOwned === true;
    });

    // Sort: Owned first, then alphabetical
    return filtered.sort((a, b) => {
      const liveA = getProductionInfo(a.name);
      const liveB = getProductionInfo(b.name);
      if (liveA?.isOwned && !liveB?.isOwned) return -1;
      if (!liveA?.isOwned && liveB?.isOwned) return 1;
      return translateFillType(a.name, language).localeCompare(translateFillType(b.name, language));
    });
  }, [data.productions, language, showAllFactories, mapProductions]);

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-6">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md pb-4 pt-2 border-b border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('production.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('production.subtitle')}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              syncStatus === 'connected' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : 
              syncStatus === 'error' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
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

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setShowAllFactories(false)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                !showAllFactories ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              {t('production.owned')}
            </button>
            <button
              onClick={() => setShowAllFactories(true)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                showAllFactories ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              {t('production.all')}
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t('production.add_manual')}
          </button>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-xl border border-gray-100 dark:border-gray-700">
            <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('production.add_manual')}</h2>
            <input
              type="text"
              value={newFactoryName}
              onChange={(e) => setNewFactoryName(e.target.value)}
              placeholder="Nom de l'usine..."
              className="w-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddManual();
                if (e.key === 'Escape') setShowAddModal(false);
              }}
            />
            
            {newFactoryName.trim().length > 0 && (
              <div className="max-h-40 overflow-y-auto mb-4 border border-gray-100 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                {productionData
                  .filter(p => translateFillType(p.name, language).toLowerCase().includes(newFactoryName.toLowerCase()))
                  .map(p => (
                    <button
                      key={p.name}
                      onClick={() => {
                        setNewFactoryName(translateFillType(p.name, language));
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-50 dark:border-gray-700 last:border-0"
                    >
                      {translateFillType(p.name, language)}
                    </button>
                  ))}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddManual}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
              >
                {t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {allProductions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <Factory className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('production.no_productions')}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('production.no_productions_desc')}</p>
          </div>
        ) : (
          allProductions.map((prod, index) => {
            const liveProd = getProductionInfo(prod.name);
          
          // Use live inputs/outputs if available and this is a dynamic production
          const inputs = liveProd && Object.keys(liveProd.inputs).length > 0 ? Object.keys(liveProd.inputs) : prod.inputs;
          const outputs = liveProd && Object.keys(liveProd.outputs).length > 0 ? Object.keys(liveProd.outputs) : prod.outputs;
          
          return (
            <div key={`${prod.name}-${index}`} className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
              {liveProd?.isOwned && (
                <div className="absolute top-0 right-0">
                  <div className="bg-emerald-600 dark:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-sm">
                    {t('production.in_possession')}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                  <Factory className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {editingName === prod.name ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="border border-indigo-300 dark:border-indigo-500/50 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-lg font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName(prod.name);
                            if (e.key === 'Escape') setEditingName(null);
                          }}
                        />
                        <button onClick={() => handleSaveName(prod.name)} className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded">
                          <Check className="w-5 h-5" />
                        </button>
                        <button onClick={() => setEditingName(null)} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <h3 className="font-bold text-xl text-gray-900 dark:text-white pr-2">
                          {customNames[prod.name] || translateFillType(prod.name, language)}
                        </h3>
                        <button
                          onClick={() => {
                            setEditingName(prod.name);
                            setEditValue(customNames[prod.name] || translateFillType(prod.name, language));
                          }}
                          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-opacity p-1"
                          title="Modifier le nom"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {(prod as any).isMapMod && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-wider">
                        Mod
                      </span>
                    )}
                  </div>
                  {liveProd?.status && (
                    <span className={cn(
                      "text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 w-fit",
                      liveProd.status.toLowerCase().includes('running') || liveProd.status.toLowerCase().includes('actif') 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                        : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    )}>
                      {liveProd.status.toLowerCase().includes('running') || liveProd.status.toLowerCase().includes('actif') ? '⚡' : '⏸'} {liveProd.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {inputs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      <PackageOpen className="w-4 h-4" />
                      {t('production.raw_materials')}
                    </div>
                    <div className="space-y-2">
                      {inputs.map(input => {
                        // Priority: Live production data, then fallback to 0 (NOT global storage)
                        // Try exact key, then upper case, then match by translated name
                        const inputInfo = liveProd?.inputs[input] || 
                                        liveProd?.inputs[input.toUpperCase()] || 
                                        Object.entries(liveProd?.inputs || {}).find(([k]) => 
                                          translateFillType(k, language).toLowerCase() === translateFillType(input, language).toLowerCase()
                                        )?.[1] || 
                                        { current: 0, max: 1000 };
                        const percentage = inputInfo.max > 0 
                          ? Math.min(100, Math.max(0, (inputInfo.current / inputInfo.max) * 100)) 
                          : 0;

                        return (
                          <div key={input} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-2">
                              <div className="flex items-center gap-2">
                                <ItemIcon type={input} className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">{translateFillType(input, language)}</span>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {Math.round(inputInfo.current).toLocaleString(language)} L / {Math.round(inputInfo.max).toLocaleString(language)} L
                              </span>
                            </div>
                            
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-500" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className={cn("relative", inputs.length === 0 && "md:col-span-2")}>
                  {inputs.length > 0 && (
                    <>
                      <div className="hidden md:flex absolute -left-6 top-1/2 -translate-y-1/2 items-center justify-center w-8 h-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-gray-400 dark:text-gray-500 z-10">
                        <ArrowRight className="w-4 h-4" />
                      </div>
                      <div className="flex md:hidden items-center justify-center w-full py-2 text-gray-400 dark:text-gray-500">
                        <ArrowDown className="w-4 h-4" />
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    <Package className="w-4 h-4" />
                    {t('production.finished_products')}
                  </div>
                  <div className="space-y-2">
                    {outputs.map(output => {
                      const price = getPrice(output);
                      // Priority: Live production data, then fallback to 0
                      const outputInfo = liveProd?.outputs[output] || 
                                       liveProd?.outputs[output.toUpperCase()] || 
                                       Object.entries(liveProd?.outputs || {}).find(([k]) => 
                                         translateFillType(k, language).toLowerCase() === translateFillType(output, language).toLowerCase()
                                       )?.[1] || 
                                       { current: 0, max: 1000 };
                      const storage = outputInfo.current;
                      const totalValue = price && storage > 0 ? (price * storage) / 1000 : 0;

                      return (
                        <div key={output} className="flex justify-between items-center p-2.5 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800/30">
                          <div className="flex items-center gap-2">
                            <ItemIcon type={output} className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            <div>
                              <span className="font-medium text-emerald-900 dark:text-emerald-100 block">{translateFillType(output, language)}</span>
                              {storage > 0 && (
                                <span className="text-xs text-emerald-700/80 dark:text-emerald-400/70 font-medium">
                                  {t('production.in_stock')}: {Math.round(storage).toLocaleString(language)} L
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {price ? (
                              <>
                                {storage > 0 && (
                                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 block">
                                    {totalValue.toLocaleString(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                                  </span>
                                )}
                                <span className={cn("text-xs text-emerald-600/80 dark:text-emerald-500/80", storage > 0 ? "font-normal" : "font-semibold text-emerald-700 dark:text-emerald-400")}>
                                  {storage > 0 ? `${t('production.unit_price')}: ` : "+ "}{price.toLocaleString(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}/1000L
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-emerald-600/60 dark:text-emerald-500/60">{t('production.unknown_price')}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {liveProd?.recipes && liveProd.recipes.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    <Info className="w-4 h-4" />
                    {t('production.costs') || 'Coûts de production'}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {liveProd.recipes.map((recipe, rIdx) => (
                      <div key={rIdx} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-gray-100 block text-sm">{translateFillType(recipe.name, language)}</span>
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm inline-block mt-1",
                            recipe.status.toLowerCase() === 'active' 
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                              : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                          )}>
                            {recipe.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {recipe.costPerHour.toLocaleString(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} / h
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {recipe.costPerMonth.toLocaleString(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })} / {t('month') || 'mois'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <button
                  onClick={() => toggleProductionOwnership(prod.name)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                    liveProd?.isOwned 
                      ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50" 
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
                  )}
                >
                  {liveProd?.isOwned ? <Trash2 className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {liveProd?.isOwned ? t('production.toggle_unowned') : t('production.toggle_owned')}
                </button>
                <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  {t('production.connect_game')}
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
}
