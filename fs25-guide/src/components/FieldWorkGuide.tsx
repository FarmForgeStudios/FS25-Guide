import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Leaf, 
  Scissors, 
  Tractor, 
  Mountain, 
  Wheat, 
  Circle, 
  BugOff,
  CheckCircle2,
  Circle as CircleOutline,
  Wrench,
  MapPin,
  RotateCcw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useLanguage } from '../lib/LanguageContext';
import { translateFillType } from '../lib/translations';
import { useGameData } from '../lib/GameDataContext';
import { safeStorage } from '../lib/storage';

type Step = {
  id: string;
  titleKey: string;
  optimization: number;
  tools: string[];
  warning?: string;
  icon: React.ElementType;
  descriptionKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
};

const STEPS: Step[] = [
  {
    id: 'chaux',
    titleKey: 'fieldwork.step.chaux.title',
    optimization: 15,
    tools: ['épandeur à chaux'],
    icon: FlaskConical,
    descriptionKey: 'fieldwork.step.chaux.desc',
    color: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-100 dark:bg-slate-900/30',
    borderColor: 'border-slate-200 dark:border-slate-800',
  },
  {
    id: 'fert_1',
    titleKey: 'fieldwork.step.fert.title',
    optimization: 22.5,
    tools: ['Radis oléagineux', 'Engrais solide', 'Engrais liquide', 'Digestat', 'Fumier', 'Lisier'],
    icon: Leaf,
    descriptionKey: 'fieldwork.step.fert1.desc',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'paillis',
    titleKey: 'fieldwork.step.paillis.title',
    optimization: 2.5,
    tools: ['Broyeur'],
    icon: Scissors,
    descriptionKey: 'fieldwork.step.paillis.desc',
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'laboure',
    titleKey: 'fieldwork.step.labour.title',
    optimization: 15,
    tools: [
      'Charrue',
      'Cultivateur'
    ],
    icon: Tractor,
    descriptionKey: 'fieldwork.step.labour.desc',
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'pierres',
    titleKey: 'fieldwork.step.pierres.title',
    optimization: 0,
    tools: ['Ramasse pierres', 'Rouleaux'],
    warning: '- coût de réparation des outils',
    icon: Mountain,
    descriptionKey: 'fieldwork.step.pierres.desc',
    color: 'text-stone-600 dark:text-stone-400',
    bgColor: 'bg-stone-100 dark:bg-stone-900/30',
    borderColor: 'border-stone-200 dark:border-stone-800',
  },
  {
    id: 'semence',
    titleKey: 'fieldwork.step.semence.title',
    optimization: 0,
    tools: ['Semoir', 'Planteuse'],
    icon: Wheat,
    descriptionKey: 'fieldwork.step.semence.desc',
    color: 'text-lime-600 dark:text-lime-400',
    bgColor: 'bg-lime-100 dark:bg-lime-900/30',
    borderColor: 'border-lime-200 dark:border-lime-800',
  },
  {
    id: 'rouleau',
    titleKey: 'fieldwork.step.rouleau.title',
    optimization: 2.5,
    tools: ['Rouleau'],
    icon: Circle,
    descriptionKey: 'fieldwork.step.rouleau.desc',
    color: 'text-zinc-600 dark:text-zinc-400',
    bgColor: 'bg-zinc-100 dark:bg-zinc-900/30',
    borderColor: 'border-zinc-200 dark:border-zinc-800',
  },
  {
    id: 'sarclage',
    titleKey: 'fieldwork.step.sarclage.title',
    optimization: 20,
    tools: [
      'Herbicide',
      'Sarclage',
      'Désherbeur'
    ],
    warning: 'Attention : pénalité de rendement (-15%) avec l\'herbicide',
    icon: BugOff,
    descriptionKey: 'fieldwork.step.sarclage.desc',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  {
    id: 'fert_2',
    titleKey: 'fieldwork.step.fert.title',
    optimization: 22.5,
    tools: ['Engrais solide', 'Engrais liquide', 'Digestat', 'Fumier', 'Lisier'],
    icon: Leaf,
    descriptionKey: 'fieldwork.step.fert2.desc',
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    borderColor: 'border-cyan-200 dark:border-cyan-800',
  },
  {
    id: 'recolte',
    titleKey: 'fieldwork.step.recolte.title',
    optimization: 0,
    tools: ['Moissonneuse-batteuse', 'Récolteuse'],
    icon: Tractor,
    descriptionKey: 'fieldwork.step.recolte.desc',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
  },
];

export function FieldWorkGuide() {
  const { t, language } = useLanguage();
  const { data } = useGameData();
  const [selectedFieldId, setSelectedFieldId] = useState<string>('general');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Load saved state when field changes
  useEffect(() => {
    const mapPrefix = data.mapName ? `${data.mapName}_` : '';
    const savedState = safeStorage.getItem(`fieldWorkGuide_${mapPrefix}${selectedFieldId}`);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (Array.isArray(parsed)) {
          setCompletedSteps(new Set(parsed));
        }
      } catch (e) {
        console.error("Error parsing saved fieldwork state", e);
        setCompletedSteps(new Set());
      }
    } else {
      setCompletedSteps(new Set());
    }
  }, [selectedFieldId, data.mapName]);

  const toggleStep = (id: string) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      
      // Save to local storage
      const mapPrefix = data.mapName ? `${data.mapName}_` : '';
      safeStorage.setItem(`fieldWorkGuide_${mapPrefix}${selectedFieldId}`, JSON.stringify(Array.from(newSet)));
      
      return newSet;
    });
  };

  const resetSteps = () => {
    if (window.confirm(t('common.confirm_reset') || 'Voulez-vous vraiment réinitialiser ce guide ?')) {
      setCompletedSteps(new Set());
      const mapPrefix = data.mapName ? `${data.mapName}_` : '';
      safeStorage.removeItem(`fieldWorkGuide_${mapPrefix}${selectedFieldId}`);
    }
  };

  const currentOptimization = STEPS.reduce((total, step) => {
    if (completedSteps.has(step.id)) {
      return total + step.optimization;
    }
    return total;
  }, 0);

  const ownedFields = data.fields.filter(f => f.isOwned).sort((a, b) => {
    const aNum = parseInt(a.displayId || a.id);
    const bNum = parseInt(b.displayId || b.id);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return (a.displayId || a.id).localeCompare(b.displayId || b.id);
  });

  return (
    <div className="max-w-4xl mx-auto p-4 pb-24 space-y-8">
      <div className="sticky top-0 z-10 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur-md pb-6 pt-4 border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t('fieldwork.title')}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">{t('fieldwork.subtitle')}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400 ml-1" />
              <select
                value={selectedFieldId}
                onChange={(e) => setSelectedFieldId(e.target.value)}
                className="bg-transparent border-none text-sm font-medium text-gray-900 dark:text-white focus:ring-0 cursor-pointer py-1 pr-8"
              >
                <option value="general">Guide Général</option>
                {ownedFields.map(f => (
                  <option key={f.id} value={f.id}>
                    Champ {f.displayId || f.id} {f.crop && f.crop !== 'Inconnu' ? `(${translateFillType(f.crop, language)})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={resetSteps}
              className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title={t('common.reset') || 'Réinitialiser'}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('fieldwork.bonus')}</span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{currentOptimization.toFixed(1)}%</span>
          </div>
          <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-400 transition-all duration-700 ease-out"
              style={{ width: `${Math.min(currentOptimization, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="relative border-l-2 border-gray-200 dark:border-gray-700 ml-4 md:ml-8 space-y-8 mt-8">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.has(step.id);
          const Icon = step.icon;
          const stepNumber = String(index + 1).padStart(2, '0');
          
          return (
            <div 
              key={step.id} 
              className="relative pl-8 md:pl-12 group cursor-pointer"
              onClick={() => toggleStep(step.id)}
            >
              {/* Timeline Dot */}
              <div className={cn(
                "absolute -left-[17px] top-6 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all duration-300 group-hover:scale-110",
                isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : `bg-white dark:bg-gray-800 ${step.borderColor} dark:border-gray-600 ${step.color} dark:text-gray-300`
              )}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>

              {/* Card */}
              <div className={cn(
                "rounded-2xl p-6 border transition-all duration-300",
                isCompleted 
                ? "bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30 shadow-sm" 
                : "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600"
              )}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <span className={cn(
                      "font-mono text-4xl font-black select-none transition-colors",
                      isCompleted ? "text-emerald-200 dark:text-emerald-800/50" : "text-gray-100 dark:text-gray-700"
                    )}>
                      {stepNumber}
                    </span>
                    <div>
                      <h3 className={cn(
                        "text-xl font-bold transition-colors",
                        isCompleted ? "text-emerald-900 dark:text-emerald-400" : "text-gray-900 dark:text-white"
                      )}>
                        {t(step.titleKey)}
                      </h3>
                      {step.optimization > 0 && (
                        <span className={cn(
                          "inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors",
                          isCompleted 
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50" 
                            : `${step.bgColor} ${step.color} ${step.borderColor} dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600`
                        )}>
                          +{step.optimization}% {t('common.yield')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className={cn(
                  "leading-relaxed mb-6 transition-colors",
                  isCompleted ? "text-emerald-800/70 dark:text-emerald-400/70" : "text-gray-600 dark:text-gray-400"
                )}>
                  {t(step.descriptionKey)}
                </p>

                <div className="flex flex-col gap-4 pt-4 border-t border-gray-100/50 dark:border-gray-700/50">
                  <div className="flex items-start gap-2">
                    <Wrench className={cn("w-4 h-4 mt-0.5 flex-shrink-0", isCompleted ? "text-emerald-400 dark:text-emerald-500" : "text-gray-400 dark:text-gray-500")} />
                    <div className="flex flex-wrap gap-2">
                      {step.tools.map(tool => (
                        <span key={tool} className={cn(
                          "px-3 py-1 text-xs font-medium rounded-lg border transition-colors",
                          isCompleted 
                            ? "bg-emerald-100/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30 text-emerald-700 dark:text-emerald-400" 
                            : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                        )}>
                          {translateFillType(tool, language)}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {step.warning && (
                    <div className="self-start inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30">
                      {step.warning}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
