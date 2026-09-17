import React, { useState, useMemo } from 'react';
import { AppTab, ClassificationHyperparameters, RegressionHyperparameters, RandomForestHyperparameters } from './types';
import { generateClassificationDatasets, generateRegressionDatasets } from './utils/sampleData';
import { buildClassificationTree, buildRegressionTree, evaluateClassification, evaluateRegression } from './utils/mlEngine';
import { Header } from './components/Header';
import { MetricsBadge } from './components/MetricsBadge';
import { HyperparameterControls } from './components/HyperparameterControls';
import { TreeDiagramSVG } from './components/TreeDiagramSVG';
import { Boundary2DPlot } from './components/Boundary2DPlot';
import { RegressionPlot } from './components/RegressionPlot';
import { RandomForestView } from './components/RandomForestView';
import { HyperparameterLab } from './components/HyperparameterLab';
import { DidacticModal } from './components/DidacticModal';
import { Sparkles, HelpCircle, Compass } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>('classification');
  const [isManualOpen, setIsManualOpen] = useState<boolean>(false);

  // Sample Datasets
  const classDatasets = useMemo(() => generateClassificationDatasets(), []);
  const regDatasets = useMemo(() => generateRegressionDatasets(), []);

  const [selectedClassDatasetId, setSelectedClassDatasetId] = useState<string>(classDatasets[0].id);
  const [selectedRegDatasetId, setSelectedRegDatasetId] = useState<string>(regDatasets[0].id);

  // Active dataset according to current mode
  const activeClassDataset = useMemo(
    () => classDatasets.find((d) => d.id === selectedClassDatasetId) || classDatasets[0],
    [classDatasets, selectedClassDatasetId]
  );

  const activeRegDataset = useMemo(
    () => regDatasets.find((d) => d.id === selectedRegDatasetId) || regDatasets[0],
    [regDatasets, selectedRegDatasetId]
  );

  // Hyperparameters state
  const [classHyperparams, setClassHyperparams] = useState<ClassificationHyperparameters>({
    maxDepth: 3,
    minSamplesSplit: 4,
    minSamplesLeaf: 2,
    criterion: 'gini',
  });

  const [regHyperparams, setRegHyperparams] = useState<RegressionHyperparameters>({
    maxDepth: 3,
    minSamplesSplit: 4,
    minSamplesLeaf: 2,
    criterion: 'mse',
  });

  const [rfHyperparams, setRfHyperparams] = useState<RandomForestHyperparameters>({
    nEstimators: 15,
    maxDepth: 4,
    minSamplesSplit: 4,
    minSamplesLeaf: 1,
    maxFeatures: 'all',
    bootstrap: true,
  });

  // Inference trace for animating node visits in the tree
  const [activeTrace, setActiveTrace] = useState<string[]>([]);

  // Train Classification Tree
  const classTree = useMemo(() => {
    return buildClassificationTree(
      activeClassDataset.trainData,
      classHyperparams,
      activeClassDataset.meta.featureNames,
      (activeClassDataset.meta.classLabels as [string, string]) || ['Clase 0', 'Clase 1']
    );
  }, [activeClassDataset, classHyperparams]);

  // Evaluate Classification Metrics
  const classMetrics = useMemo(() => {
    return evaluateClassification(classTree, activeClassDataset.trainData, activeClassDataset.testData);
  }, [classTree, activeClassDataset]);

  // Train Regression Tree
  const regTree = useMemo(() => {
    return buildRegressionTree(
      activeRegDataset.trainData,
      regHyperparams,
      activeRegDataset.meta.featureNames[0],
      activeRegDataset.meta.targetName
    );
  }, [activeRegDataset, regHyperparams]);

  // Evaluate Regression Metrics
  const regMetrics = useMemo(() => {
    return evaluateRegression(regTree, activeRegDataset.trainData, activeRegDataset.testData);
  }, [regTree, activeRegDataset]);

  // Reset trace on dataset or tab change
  const handleTabChange = (newTab: AppTab) => {
    setCurrentTab(newTab);
    setActiveTrace([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onTabChange={handleTabChange}
        datasets={currentTab === 'regression' ? regDatasets : classDatasets}
        selectedDatasetId={currentTab === 'regression' ? selectedRegDatasetId : selectedClassDatasetId}
        onSelectDataset={(id) => {
          if (currentTab === 'regression') setSelectedRegDatasetId(id);
          else setSelectedClassDatasetId(id);
          setActiveTrace([]);
        }}
        onOpenManual={() => setIsManualOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 1. Árbol de Clasificación */}
        {currentTab === 'classification' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top description banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-400" />
                  Módulo 1: Árbol de Decisión para Clasificación Binaria
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                  {activeClassDataset.meta.description} Observa cómo el algoritmo encuentra el corte óptimo minimizando el índice <strong>{classHyperparams.criterion.toUpperCase()}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                <span>Atributos evaluados:</span>
                <strong className="text-emerald-400 font-mono">
                  {activeClassDataset.meta.featureNames.join(', ')}
                </strong>
              </div>
            </div>

            {/* Diagnostic Metrics & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1 space-y-5">
                <MetricsBadge metrics={classMetrics} isRegression={false} />
                <HyperparameterControls
                  mode="classification"
                  classificationParams={classHyperparams}
                  onClassificationChange={setClassHyperparams}
                />
              </div>

              <div className="lg:col-span-2 space-y-5">
                <Boundary2DPlot
                  trainData={activeClassDataset.trainData}
                  testData={activeClassDataset.testData}
                  tree={classTree}
                  featureNames={activeClassDataset.meta.featureNames}
                  classLabels={(activeClassDataset.meta.classLabels as [string, string]) || ['Clase 0', 'Clase 1']}
                  onProbePoint={(_, trace) => setActiveTrace(trace)}
                />

                {/* SVG Visual Tree Structure */}
                <TreeDiagramSVG root={classTree} activeTrace={activeTrace} isRegression={false} />
              </div>
            </div>
          </div>
        )}

        {/* 2. Árbol de Regresión */}
        {currentTab === 'regression' && (
          <div className="space-y-6 animate-fade-in">
            {/* Top description banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Módulo 2: Árbol de Regresión (Predicción de Valores Continuos)
                </h2>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                  {activeRegDataset.meta.description} En cada hoja, el árbol predice la <strong>media (o mediana)</strong> de los datos que cayeron en ese rango.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-300">
                <span>Variable Objetivo:</span>
                <strong className="text-cyan-400 font-mono">{activeRegDataset.meta.targetName}</strong>
              </div>
            </div>

            {/* Diagnostics & Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-1 space-y-5">
                <MetricsBadge metrics={regMetrics} isRegression={true} />
                <HyperparameterControls
                  mode="regression"
                  regressionParams={regHyperparams}
                  onRegressionChange={setRegHyperparams}
                />
              </div>

              <div className="lg:col-span-2 space-y-5">
                <RegressionPlot
                  trainData={activeRegDataset.trainData}
                  testData={activeRegDataset.testData}
                  tree={regTree}
                  featureName={activeRegDataset.meta.featureNames[0]}
                  targetName={activeRegDataset.meta.targetName}
                  onProbeX={(_, trace) => setActiveTrace(trace)}
                />

                {/* SVG Tree Diagram */}
                <TreeDiagramSVG root={regTree} activeTrace={activeTrace} isRegression={true} />
              </div>
            </div>
          </div>
        )}

        {/* 3. Random Forest View */}
        {currentTab === 'random_forest' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
              {/* Side controls for Forest */}
              <div className="lg:col-span-1 space-y-5">
                <HyperparameterControls
                  mode="random_forest"
                  rfParams={rfHyperparams}
                  onRfChange={setRfHyperparams}
                />

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Teorema Clave:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    Si tienes M árboles no correlacionados con varianza σ², la varianza del ensamble promedio es:
                  </p>
                  <div className="bg-slate-950 p-2 rounded text-center font-mono text-emerald-400 text-xs">
                    Var(Ensemble) ≈ σ² / M
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    ¡Por eso los bosques reducen el error de prueba de manera tan drástica comparados con un solo árbol!
                  </p>
                </div>
              </div>

              {/* Main Visualizer */}
              <div className="lg:col-span-3">
                <RandomForestView
                  trainData={activeClassDataset.trainData}
                  testData={activeClassDataset.testData}
                  featureNames={activeClassDataset.meta.featureNames}
                  classLabels={(activeClassDataset.meta.classLabels as [string, string]) || ['Clase 0', 'Clase 1']}
                  hyperparams={rfHyperparams}
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. Hyperparameter Laboratory */}
        {currentTab === 'hyperparameters_lab' && (
          <div className="space-y-6 animate-fade-in">
            <HyperparameterLab
              trainData={activeClassDataset.trainData}
              testData={activeClassDataset.testData}
              featureNames={activeClassDataset.meta.featureNames}
              classLabels={(activeClassDataset.meta.classLabels as [string, string]) || ['Clase 0', 'Clase 1']}
              onApplyHyperparameters={(params) => {
                setClassHyperparams(params);
                setCurrentTab('classification');
              }}
            />
          </div>
        )}
      </main>

      {/* Educational Guide Modal */}
      <DidacticModal isOpen={isManualOpen} onClose={() => setIsManualOpen(false)} />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        Laboratorio Pedagógico de Machine Learning • Árboles de Decisión, Árboles de Regresión y Random Forest
      </footer>
    </div>
  );
}
