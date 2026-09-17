import React from 'react';
import { AppTab, DatasetMeta } from '../types';
import { GitFork, TrendingUp, Trees, Sliders, BookOpen, Database } from 'lucide-react';
import { DatasetItem } from '../utils/sampleData';

interface HeaderProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  datasets: DatasetItem[];
  selectedDatasetId: string;
  onSelectDataset: (id: string) => void;
  onOpenManual: () => void;
}

export function Header({
  currentTab,
  onTabChange,
  datasets,
  selectedDatasetId,
  onSelectDataset,
  onOpenManual,
}: HeaderProps) {
  const filteredDatasets = datasets.filter((d) => {
    if (currentTab === 'regression') return d.category === 'regression';
    return d.category === 'classification';
  });

  return (
    <header id="main-app-header" className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Trees className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Laboratorio de Árboles y Random Forest
                <span className="hidden md:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Didáctico
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Aprende Clasificación, Regresión y Ajuste de Hiperparámetros de forma visual e interactiva
              </p>
            </div>
          </div>

          {/* Actions: Dataset selector & Manual */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentTab !== 'hyperparameters_lab' && (
              <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400 text-[11px] hidden sm:inline">Datos:</span>
                <select
                  id="dataset-select"
                  value={selectedDatasetId}
                  onChange={(e) => onSelectDataset(e.target.value)}
                  className="bg-transparent border-none text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                >
                  {filteredDatasets.map((d) => (
                    <option key={d.id} value={d.id} className="bg-slate-900 text-slate-200">
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              id="open-manual-btn"
              onClick={onOpenManual}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Manual Didáctico</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav id="app-nav-tabs" className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80 overflow-x-auto">
          <button
            id="tab-classification"
            onClick={() => onTabChange('classification')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'classification'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitFork className="w-4 h-4" />
            <span>1. Árbol de Clasificación</span>
          </button>

          <button
            id="tab-regression"
            onClick={() => onTabChange('regression')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'regression'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>2. Árbol de Regresión</span>
          </button>

          <button
            id="tab-random-forest"
            onClick={() => onTabChange('random_forest')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'random_forest'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Trees className="w-4 h-4" />
            <span>3. Random Forest (Ensemble)</span>
          </button>

          <button
            id="tab-hyperparameters"
            onClick={() => onTabChange('hyperparameters_lab')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'hyperparameters_lab'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>4. Laboratorio de Hiperparámetros</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
