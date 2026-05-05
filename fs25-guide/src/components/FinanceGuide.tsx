import React, { useState, useEffect } from 'react';
import { TrendingUp, Wifi, Search, DollarSign, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';
import { ItemIcon } from '../lib/icons';
import cultureData from '../data-culture.json';
import productionData from '../data-production.json';
import { useGameData } from '../lib/GameDataContext';
import { useLanguage } from '../lib/LanguageContext';
import { translateFillType } from '../lib/translations';

type PricePoint = {
  time: string;
  price: number;
};

type PriceHistory = Record<string, PricePoint[]>;

export function FinanceGuide() {
  const { data, syncStatus, lastSync } = useGameData();
  const { t, language } = useLanguage();
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const allItems = React.useMemo(() => {
    const items = new Set<string>();
    cultureData.forEach(c => items.add(c.name));
    productionData.forEach(p => {
      p.outputs.forEach(o => items.add(o));
    });
    
    // Add outputs from live productions
    Object.values(data.productions || {}).forEach((p: any) => {
      if (p && p.outputs) {
        Object.keys(p.outputs).forEach(o => items.add(o));
      }
    });

    items.add('Paille');
    items.add('Foin');
    items.add('Enrubannage');
    items.add('Ensilage');
    
    return Array.from(items).sort((a, b) => 
      translateFillType(a, language).localeCompare(translateFillType(b, language))
    );
  }, [data.productions, language]);

  useEffect(() => {
    const initialPrices: Record<string, number> = {};
    
    cultureData.forEach(c => {
      const priceNum = parseInt(c.avgPrice.replace(/[^0-9]/g, ''));
      if (!isNaN(priceNum)) {
        initialPrices[c.name] = priceNum;
      }
    });
    
    setCurrentPrices(initialPrices);
    setSelectedItem(cultureData[0]?.name || null);
  }, [language]);

  useEffect(() => {
    if (data.prices && Object.keys(data.prices).length > 0) {
      setCurrentPrices(prev => ({ ...prev, ...data.prices }));
    }
  }, [data.prices]);

  const filteredItems = allItems.filter(item => 
    translateFillType(item, language).toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPrice = (itemName: string) => {
    if (currentPrices[itemName]) return currentPrices[itemName];
    const lowerItem = itemName.toLowerCase();
    const upperItem = itemName.toUpperCase().replace(/\s+/g, '_');
    const translatedItem = translateFillType(itemName, language).toLowerCase();

    const match = Object.keys(currentPrices).find(k => {
      const lowerK = k.toLowerCase();
      const upperK = k.toUpperCase().replace(/\s+/g, '_');
      const translatedK = translateFillType(k, language).toLowerCase();
      
      return lowerK === lowerItem || 
             upperK === upperItem || 
             translatedK === lowerItem ||
             lowerK === translatedItem ||
             translatedK === translatedItem;
    });
    if (match) return currentPrices[match];
    return null;
  };

  const getHistory = (itemName: string) => {
    const history = data.priceHistory || {};
    if (history[itemName]) return Array.isArray(history[itemName]) ? history[itemName] : [];
    
    const lowerItem = itemName.toLowerCase();
    const upperItem = itemName.toUpperCase().replace(/\s+/g, '_');
    const translatedItem = translateFillType(itemName, language).toLowerCase();

    const match = Object.keys(history).find(k => {
      const lowerK = k.toLowerCase();
      const upperK = k.toUpperCase().replace(/\s+/g, '_');
      const translatedK = translateFillType(k, language).toLowerCase();
      
      return lowerK === lowerItem || 
             upperK === upperItem || 
             translatedK === lowerItem ||
             lowerK === translatedItem ||
             translatedK === translatedItem;
    });
    const result = match ? history[match] : [];
    return Array.isArray(result) ? result : [];
  };

  const selectedHistory = selectedItem ? getHistory(selectedItem) : [];
  const currentPrice = selectedItem ? getPrice(selectedItem) : null;
  
  let trend = 0;
  let trendPercent = 0;
  if (Array.isArray(selectedHistory) && selectedHistory.length >= 2) {
    try {
      const last = selectedHistory[selectedHistory.length - 1]?.price || 0;
      const prev = selectedHistory[selectedHistory.length - 2]?.price || 0;
      if (last > prev) trend = 1;
      else if (last < prev) trend = -1;
      
      if (prev > 0) {
        const calculatedTrend = Math.abs((last - prev) / prev * 100);
        trendPercent = isFinite(calculatedTrend) ? calculatedTrend : 0;
      }
    } catch (e) {
      console.error("Error calculating trend:", e);
    }
  }

  const minPrice = (Array.isArray(selectedHistory) && selectedHistory.length > 0) ? selectedHistory.reduce((min, d) => Math.min(min, Number(d?.price) || 0), Infinity) : 0;
  const maxPrice = (Array.isArray(selectedHistory) && selectedHistory.length > 0) ? selectedHistory.reduce((max, d) => Math.max(max, Number(d?.price) || 0), -Infinity) : 1000;
  const safeMinPrice = isFinite(minPrice) ? minPrice : 0;
  const safeMaxPrice = isFinite(maxPrice) ? maxPrice : 1000;
  const domainPadding = Math.max((safeMaxPrice - safeMinPrice) * 0.1, safeMaxPrice * 0.1, 10);

  const calculatedMin = Math.max(0, safeMinPrice - domainPadding);
  const calculatedMax = Math.max(calculatedMin + 10, safeMaxPrice + domainPadding);
  const yAxisMin = isFinite(calculatedMin) ? calculatedMin : 0;
  const yAxisMax = isFinite(calculatedMax) ? calculatedMax : 1000;

  const marketData = React.useMemo(() => {
    if (!selectedItem || !data.market) return null;
    
    try {
      const lowerItem = selectedItem.toLowerCase();
      const upperItem = selectedItem.toUpperCase().replace(/\s+/g, '_');
      const translatedItem = translateFillType(selectedItem, language).toLowerCase();

      // Try various matching strategies
      return data.market[selectedItem] || 
             data.market[upperItem] ||
             Object.values(data.market || {}).find((m: any) => 
               (typeof m?.name === 'string' && m.name.toLowerCase() === lowerItem) || 
               (typeof m?.name === 'string' && m.name.toLowerCase() === translatedItem) ||
               (typeof m?.name === 'string' && m.name.toUpperCase().replace(/\s+/g, '_') === upperItem)
             );
    } catch (e) {
      console.error("Error getting market data:", e);
      return null;
    }
  }, [selectedItem, data.market, language]);

  const stations = Array.isArray(marketData?.stations) ? marketData.stations : [];
  
  const sellingStations = stations.filter(s => s && s.price > 0).sort((a, b) => (b.price || 0) - (a.price || 0));
  const buyingStations = stations.filter(s => s && s.buyPrice && s.buyPrice > 0).sort((a, b) => (a.buyPrice || 0) - (b.buyPrice || 0));
  
  const bestSellPrice = sellingStations.length > 0 ? (sellingStations[0]?.price || 0) : 0;
  const bestBuyPrice = buyingStations.length > 0 ? (buyingStations[0]?.buyPrice || 0) : 0;

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24 space-y-6">
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md pb-4 pt-2 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('finance.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.subtitle')}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input 
              type="text"
              placeholder={t('finance.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm flex flex-col h-[500px]">
            <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {filteredItems.map(item => {
                const price = getPrice(item);
                const isSelected = selectedItem === item;
                
                return (
                  <button
                    key={item}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors",
                      isSelected 
                        ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50" 
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent"
                    )}
                  >
                    <span className={cn(
                      "font-medium text-sm flex items-center gap-2", 
                      isSelected ? "text-emerald-900 dark:text-emerald-100" : "text-gray-700 dark:text-gray-300"
                    )}>
                      <ItemIcon type={item} className="w-4 h-4" />
                      {translateFillType(item, language)}
                    </span>
                    {price !== null && price !== undefined ? (
                      <span className={cn(
                        "text-sm font-semibold", 
                        isSelected ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-gray-100"
                      )}>
                        {Number(price).toLocaleString(language, { maximumFractionDigits: 0 })} €
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedItem ? (
            <div className="space-y-4">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                      <ItemIcon type={selectedItem} className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      {translateFillType(selectedItem, language)}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('finance.avg_price')}</p>
                  </div>
                  
                  <div className="text-right">
                    {(currentPrice !== null && currentPrice !== undefined) ? (
                      <>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {Number(currentPrice).toLocaleString(language, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                        </div>
                        {trend !== 0 && (
                          <div className={cn(
                            "flex items-center justify-end gap-1 text-sm font-medium mt-1",
                            trend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          )}>
                            <TrendingUp className={cn("w-4 h-4", trend < 0 && "rotate-180")} />
                            {trend > 0 ? "+" : "-"}{trendPercent.toFixed(2)}%
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-400 dark:text-gray-500 text-sm italic">
                        {t('finance.waiting_data')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  {selectedHistory.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                      <LineChart data={selectedHistory} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" strokeOpacity={0.2} className="dark:stroke-gray-700" />
                        <XAxis 
                          dataKey="time" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          dy={10}
                        />
                        <YAxis 
                          domain={[yAxisMin, yAxisMax]}
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 12, fill: '#6b7280' }}
                          tickFormatter={(val) => `${Number(val || 0).toLocaleString(language)} €`}
                          dx={-10}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--tw-colors-gray-800)', color: 'var(--tw-colors-gray-100)' }}
                          formatter={(value: any) => [`${Number(value || 0).toLocaleString(language)} €`, t('finance.price')]}
                          labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="price" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ r: 4, strokeWidth: 2, fill: 'currentColor' }}
                          activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                          animationDuration={500}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      <Activity className="w-12 h-12 mb-3 opacity-20" />
                      <p>{t('finance.no_chart_data')}</p>
                      <p className="text-sm mt-1">{t('finance.keep_sync')}</p>
                    </div>
                  )}
                </div>
              </div>

              {sellingStations.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('finance.sell_points')}</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {sellingStations.map((station, index) => {
                      const isBest = station.price === bestSellPrice;
                      return (
                        <div 
                          key={`${station.name}-${index}`} 
                          className={cn(
                            "flex items-center justify-between p-4 transition-colors",
                            isBest ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              isBest ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"
                            )} />
                            <span className={cn("font-medium", isBest ? "text-emerald-900 dark:text-emerald-100" : "text-gray-700 dark:text-gray-300")}>
                              {station.name}
                            </span>
                            {isBest && (
                              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                                {t('finance.best_price')}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={cn("font-bold", isBest ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-white")}>
                              {Number(station.price || 0).toLocaleString(language, { maximumFractionDigits: 0 })} €
                            </div>
                            {(station.trend !== undefined && station.trend !== 0) && (
                              <div className={cn(
                                "text-xs flex items-center justify-end gap-1",
                                station.trend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                              )}>
                                <TrendingUp className={cn("w-3 h-3", station.trend < 0 && "rotate-180")} />
                                {(station.variation !== undefined && Number(station.variation) > 0) && <span>{Number(station.variation).toFixed(1)}%</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {buyingStations.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('finance.buy_points')}</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {buyingStations.map((station, index) => {
                      const isBest = station.buyPrice === bestBuyPrice;
                      return (
                        <div 
                          key={`${station.name}-${index}`} 
                          className={cn(
                            "flex items-center justify-between p-4 transition-colors",
                            isBest ? "bg-blue-50/50 dark:bg-blue-900/10" : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              isBest ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                            )} />
                            <span className={cn("font-medium", isBest ? "text-blue-900 dark:text-blue-100" : "text-gray-700 dark:text-gray-300")}>
                              {station.name}
                            </span>
                            {isBest && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-medium">
                                {t('finance.best_price')}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={cn("font-bold", isBest ? "text-blue-700 dark:text-blue-400" : "text-gray-900 dark:text-white")}>
                              {Number(station.buyPrice || 0).toLocaleString(language, { maximumFractionDigits: 0 })} €
                            </div>
                            {(station.trend !== undefined && station.trend !== 0) && (
                              <div className={cn(
                                "text-xs flex items-center justify-end gap-1",
                                station.trend > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                              )}>
                                <TrendingUp className={cn("w-3 h-3", station.trend < 0 && "rotate-180")} />
                                {(station.variation !== undefined && Number(station.variation) > 0) && <span>{Number(station.variation).toFixed(1)}%</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center h-full flex flex-col items-center justify-center min-h-[500px]">
              <DollarSign className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('finance.select_product')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
