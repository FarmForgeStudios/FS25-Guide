import React, { useState } from 'react';
import { Tractor, Sprout, Map as MapIcon, PawPrint, Factory, Warehouse, TrendingUp, Languages, ChevronLeft, ChevronRight, LayoutDashboard, Bot, Sun, Moon, Heart } from 'lucide-react';
import { cn } from './lib/utils';
import { FieldWorkGuide } from './components/FieldWorkGuide';
import { InteractiveMap } from './components/InteractiveMap';
import { AnimalProduction } from './components/AnimalProduction';
import { ProductionGuide } from './components/ProductionGuide';
import { CropRotation } from './components/CropRotation';
import { Dashboard } from './components/Dashboard';
import { Vehicles } from './components/Vehicles';
import { StorageGuide } from './components/StorageGuide';
import { FinanceGuide } from './components/FinanceGuide';
import { AIAssistant } from './components/AIAssistant';
import { GameDataProvider, useGameData } from './lib/GameDataContext';
import { LanguageProvider, useLanguage } from './lib/LanguageContext';
import { ThemeProvider, useTheme } from './lib/ThemeContext';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { data } = useGameData();
  const { theme, toggleTheme } = useTheme();

  const tabs = [
    { id: 'dashboard', icon: LayoutDashboard, label: t('tab.dashboard') },
    { id: 'guide', icon: Tractor, label: t('tab.guide') },
    { id: 'map', icon: MapIcon, label: t('tab.map') },
    { id: 'vehicles', icon: Tractor, label: t('tab.vehicles') },
    { id: 'cultures', icon: Sprout, label: t('tab.rotation') },
    { id: 'stockage', icon: Warehouse, label: t('tab.storage') },
    { id: 'productions', icon: Factory, label: t('tab.productions') },
    { id: 'animaux', icon: PawPrint, label: t('tab.animals') },
    { id: 'finances', icon: TrendingUp, label: t('tab.finance') },
    { id: 'ai', icon: Bot, label: t('tab.ai') },
  ];

  return (
    <div className="h-[100dvh] bg-gray-50 dark:bg-gray-900 flex flex-col md:flex-row overflow-hidden transition-colors">
      {/* Desktop Sidebar */}
      <nav className={cn("hidden md:flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 shrink-0 transition-all duration-300 relative", isSidebarCollapsed ? "w-20" : "w-64")}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shadow-sm z-50"
        >
          {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div className={cn("p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center transition-all duration-300", isSidebarCollapsed ? "px-2" : "")}>
          <div className={cn("bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shadow-inner transition-all duration-300", isSidebarCollapsed ? "w-10 h-10 mb-0" : "w-16 h-16 mb-3")}>
            <Tractor className={cn("transition-all duration-300", isSidebarCollapsed ? "w-5 h-5" : "w-8 h-8")} />
          </div>
          {!isSidebarCollapsed && <h2 className="font-black text-xl text-gray-900 dark:text-white tracking-tight text-center leading-tight whitespace-nowrap">FS25<br/>WebSync</h2>}
        </div>
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 overflow-x-hidden">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={isSidebarCollapsed ? tab.label : undefined}
              className={cn(
                "w-full flex items-center px-3 py-3 rounded-xl font-medium transition-all",
                isSidebarCollapsed ? "justify-center" : "gap-3",
                activeTab === tab.id 
                  ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" 
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              <tab.icon className={cn("shrink-0 transition-all duration-300", isSidebarCollapsed ? "w-6 h-6" : "w-5 h-5", activeTab === tab.id ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500")} />
              {!isSidebarCollapsed && <span className="truncate">{tab.label}</span>}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2">
          <a
            href="https://www.paypal.com/donate/?business=farmforgestudios@gmail.com&currency_code=EUR"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "w-full flex items-center justify-center p-2 rounded-lg transition-colors border shadow-sm",
              isSidebarCollapsed ? "" : "gap-2",
              "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40"
            )}
            title="Faire un don via PayPal"
          >
            <Heart className={cn("shrink-0", isSidebarCollapsed ? "w-5 h-5" : "w-4 h-4")} />
            {!isSidebarCollapsed && <span className="font-bold text-sm tracking-wide uppercase">Don</span>}
          </a>
          <button
            onClick={toggleTheme}
            className={cn(
              "w-full flex items-center justify-center p-2 rounded-lg transition-colors",
              "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
            )}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className={cn("flex bg-gray-100 dark:bg-gray-700 rounded-lg", isSidebarCollapsed ? "p-2 items-center justify-center font-bold text-xs" : "p-1")}>
            {isSidebarCollapsed ? (
              <span className="text-gray-500 dark:text-gray-400 uppercase">{language}</span>
            ) : (
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as any)}
                className="flex-1 bg-transparent px-2 py-1.5 text-center rounded-md text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white outline-none cursor-pointer appearance-none dark:bg-gray-700"
                style={{ textAlignLast: 'center' }}
              >
                <option value="fr">Français (FR)</option>
                <option value="en">English (EN)</option>
                <option value="de">Deutsch (DE)</option>
                <option value="es">Español (ES)</option>
                <option value="it">Italiano (IT)</option>
                <option value="pt">Português (PT)</option>
                <option value="pl">Polski (PL)</option>
                <option value="ro">Română (RO)</option>
              </select>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <main className="flex-1 overflow-y-auto pb-24 md:pb-6">
          <header className="relative h-48 md:h-56 w-full overflow-hidden shrink-0 shadow-md z-40 mb-4">
            <img 
              src="https://cdn.akamai.steamstatic.com/steam/apps/2300320/library_hero.jpg" 
              alt="Farming Simulator 25 Banner" 
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-center justify-end pb-6">
              {/* Mobile Language & Theme Switcher */}
              <div className="md:hidden absolute top-4 right-4 flex gap-2">
                <a
                  href="https://www.paypal.com/donate/?business=farmforgestudios@gmail.com&currency_code=EUR"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-rose-500/80 backdrop-blur-md border border-rose-400/50 rounded-full py-1.5 px-3 text-white hover:bg-rose-600 transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Faire un don via PayPal"
                >
                  <Heart className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Don</span>
                </a>
                <button
                  onClick={toggleTheme}
                  className="bg-black/40 backdrop-blur-md border border-white/20 rounded-full p-2 text-white hover:bg-white/10 transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <div className="flex bg-black/40 backdrop-blur-md border border-white/20 rounded-full p-1 pl-3">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="bg-transparent text-white text-[10px] font-bold uppercase tracking-wider outline-none cursor-pointer appearance-none"
                  >
                    <option value="fr" className="text-black">FR</option>
                    <option value="en" className="text-black">EN</option>
                    <option value="de" className="text-black">DE</option>
                    <option value="es" className="text-black">ES</option>
                    <option value="it" className="text-black">IT</option>
                    <option value="pt" className="text-black">PT</option>
                    <option value="pl" className="text-black">PL</option>
                    <option value="ro" className="text-black">RO</option>
                  </select>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white/70 tracking-tighter drop-shadow-2xl text-center px-4 italic uppercase">
                Farming Simulator 25
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className="h-[1px] w-8 bg-orange-500" />
                <p className="text-orange-500 font-bold tracking-[0.3em] text-xs md:text-sm uppercase drop-shadow-lg">
                  {data.mapName && data.mapName !== 'DefaultMap' && data.mapName !== 'UnknownMap' ? data.mapName : t('header.subtitle')}
                </p>
                <div className="h-[1px] w-8 bg-orange-500" />
              </div>
            </div>
          </header>
          
          <div className={activeTab === 'dashboard' ? 'block' : 'hidden'}><Dashboard /></div>
          <div className={activeTab === 'guide' ? 'block' : 'hidden'}><FieldWorkGuide /></div>
          <div className={activeTab === 'map' ? 'block' : 'hidden'}><InteractiveMap /></div>
          <div className={activeTab === 'vehicles' ? 'block' : 'hidden'}><Vehicles /></div>
          <div className={activeTab === 'cultures' ? 'block' : 'hidden'}><CropRotation /></div>
          <div className={activeTab === 'productions' ? 'block' : 'hidden'}><ProductionGuide /></div>
          <div className={activeTab === 'animaux' ? 'block' : 'hidden'}><AnimalProduction /></div>
          <div className={activeTab === 'stockage' ? 'block' : 'hidden'}><StorageGuide /></div>
          <div className={activeTab === 'finances' ? 'block' : 'hidden'}>
            <ErrorBoundary>
              <FinanceGuide />
            </ErrorBoundary>
          </div>
          <div className={activeTab === 'ai' ? 'block h-full' : 'hidden'}><AIAssistant /></div>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-[env(safe-area-inset-bottom)] z-50 overflow-x-auto transition-colors">
          <div className="max-w-2xl mx-auto px-2 h-16 flex items-center justify-between min-w-[380px] gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center w-14 h-full space-y-1 transition-colors",
                  activeTab === tab.id ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}

import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <GameDataProvider>
          <AppContent />
        </GameDataProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
