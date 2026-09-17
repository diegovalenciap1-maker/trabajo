import { Sliders, HelpCircle, RotateCcw, Zap } from 'lucide-react';
import { ClassificationHyperparameters, RegressionHyperparameters, RandomForestHyperparameters } from '../types';

interface HyperparameterControlsProps {
  mode: 'classification' | 'regression' | 'random_forest';
  classificationParams?: ClassificationHyperparameters;
  onClassificationChange?: (params: ClassificationHyperparameters) => void;
  regressionParams?: RegressionHyperparameters;
  onRegressionChange?: (params: RegressionHyperparameters) => void;
  rfParams?: RandomForestHyperparameters;
  onRfChange?: (params: RandomForestHyperparameters) => void;
}

export function HyperparameterControls({
  mode,
  classificationParams,
  onClassificationChange,
  regressionParams,
  onRegressionChange,
  rfParams,
  onRfChange,
}: HyperparameterControlsProps) {
  // Helpers for presets
  const applyPreset = (presetType: 'underfit' | 'optimal' | 'overfit') => {
    if (mode === 'classification' && classificationParams && onClassificationChange) {
      if (presetType === 'underfit') {
        onClassificationChange({
          ...classificationParams,
          maxDepth: 1,
          minSamplesSplit: 16,
          minSamplesLeaf: 8,
        });
      } else if (presetType === 'optimal') {
        onClassificationChange({
          ...classificationParams,
          maxDepth: 3,
          minSamplesSplit: 4,
          minSamplesLeaf: 2,
        });
      } else {
        onClassificationChange({
          ...classificationParams,
          maxDepth: 8,
          minSamplesSplit: 2,
          minSamplesLeaf: 1,
        });
      }
    } else if (mode === 'regression' && regressionParams && onRegressionChange) {
      if (presetType === 'underfit') {
        onRegressionChange({
          ...regressionParams,
          maxDepth: 1,
          minSamplesSplit: 18,
          minSamplesLeaf: 8,
        });
      } else if (presetType === 'optimal') {
        onRegressionChange({
          ...regressionParams,
          maxDepth: 3,
          minSamplesSplit: 4,
          minSamplesLeaf: 2,
        });
      } else {
        onRegressionChange({
          ...regressionParams,
          maxDepth: 7,
          minSamplesSplit: 2,
          minSamplesLeaf: 1,
        });
      }
    } else if (mode === 'random_forest' && rfParams && onRfChange) {
      if (presetType === 'underfit') {
        onRfChange({
          ...rfParams,
          nEstimators: 3,
          maxDepth: 1,
          minSamplesSplit: 12,
        });
      } else if (presetType === 'optimal') {
        onRfChange({
          ...rfParams,
          nEstimators: 15,
          maxDepth: 4,
          minSamplesSplit: 4,
        });
      } else {
        onRfChange({
          ...rfParams,
          nEstimators: 25,
          maxDepth: 8,
          minSamplesSplit: 2,
        });
      }
    }
  };

  return (
    <div id="hyperparameter-control-panel" className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" />
          <h3 className="font-semibold text-sm text-slate-100">Control de Hiperparámetros</h3>
        </div>

        {/* Quick Presets for didactic exploration */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Probar:</span>
          <button
            id="preset-underfit-btn"
            onClick={() => applyPreset('underfit')}
            className="px-2 py-1 text-[11px] font-medium rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 transition-colors"
            title="Ajusta hiperparámetros para ver bajo ajuste (underfitting)"
          >
            Bajo Ajuste
          </button>
          <button
            id="preset-optimal-btn"
            onClick={() => applyPreset('optimal')}
            className="px-2 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-colors"
            title="Ajusta hiperparámetros a una zona equilibrada de generalización"
          >
            Óptimo
          </button>
          <button
            id="preset-overfit-btn"
            onClick={() => applyPreset('overfit')}
            className="px-2 py-1 text-[11px] font-medium rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
            title="Ajusta hiperparámetros al extremo para ver sobreajuste (overfitting)"
          >
            Sobreajuste
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* 1. max_depth */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-200 flex items-center gap-1.5">
              <span>Profundidad Máxima (<code className="text-emerald-400">max_depth</code>)</span>
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-100 font-bold">
              {mode === 'classification'
                ? classificationParams?.maxDepth
                : mode === 'regression'
                ? regressionParams?.maxDepth
                : rfParams?.maxDepth}
            </span>
          </div>
          <input
            id="slider-max-depth"
            type="range"
            min="1"
            max="8"
            step="1"
            value={
              mode === 'classification'
                ? classificationParams?.maxDepth ?? 3
                : mode === 'regression'
                ? regressionParams?.maxDepth ?? 3
                : rfParams?.maxDepth ?? 4
            }
            onChange={(e) => {
              const val = Number(e.target.value);
              if (mode === 'classification' && classificationParams && onClassificationChange) {
                onClassificationChange({ ...classificationParams, maxDepth: val });
              } else if (mode === 'regression' && regressionParams && onRegressionChange) {
                onRegressionChange({ ...regressionParams, maxDepth: val });
              } else if (mode === 'random_forest' && rfParams && onRfChange) {
                onRfChange({ ...rfParams, maxDepth: val });
              }
            }}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            {(() => {
              const depth =
                mode === 'classification'
                  ? (classificationParams?.maxDepth ?? 3)
                  : mode === 'regression'
                  ? (regressionParams?.maxDepth ?? 3)
                  : (rfParams?.maxDepth ?? 4);

              if (depth === 1) {
                return '🔹 Profundidad 1: Muñón de decisión (Decision Stump). Genera alto sesgo (subajuste).';
              }
              if (depth >= 6) {
                return '⚠️ Profundidad alta: El árbol puede memorizar ruido individual y aislar puntos aislados.';
              }
              return '✅ Profundidad moderada: Permite particiones expresivas manteniendo buena generalización.';
            })()}
          </p>
        </div>

        {/* 2. min_samples_split */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium text-slate-200">
              Muestras mínimas para dividir (<code className="text-sky-400">min_samples_split</code>)
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-100 font-bold">
              {mode === 'classification'
                ? classificationParams?.minSamplesSplit
                : mode === 'regression'
                ? regressionParams?.minSamplesSplit
                : rfParams?.minSamplesSplit}
            </span>
          </div>
          <input
            id="slider-min-samples-split"
            type="range"
            min="2"
            max="18"
            step="1"
            value={
              mode === 'classification'
                ? classificationParams?.minSamplesSplit ?? 2
                : mode === 'regression'
                ? regressionParams?.minSamplesSplit ?? 2
                : rfParams?.minSamplesSplit ?? 2
            }
            onChange={(e) => {
              const val = Number(e.target.value);
              if (mode === 'classification' && classificationParams && onClassificationChange) {
                onClassificationChange({ ...classificationParams, minSamplesSplit: val });
              } else if (mode === 'regression' && regressionParams && onRegressionChange) {
                onRegressionChange({ ...regressionParams, minSamplesSplit: val });
              } else if (mode === 'random_forest' && rfParams && onRfChange) {
                onRfChange({ ...rfParams, minSamplesSplit: val });
              }
            }}
            className="w-full accent-sky-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Si un nodo tiene menos de este número de datos, se convierte en hoja y se detiene la ramificación.
          </p>
        </div>

        {/* 3. min_samples_leaf (for Single Trees) */}
        {mode !== 'random_forest' && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-200">
                Muestras mínimas por hoja (<code className="text-violet-400">min_samples_leaf</code>)
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-100 font-bold">
                {mode === 'classification'
                  ? classificationParams?.minSamplesLeaf
                  : regressionParams?.minSamplesLeaf}
              </span>
            </div>
            <input
              id="slider-min-samples-leaf"
              type="range"
              min="1"
              max="10"
              step="1"
              value={
                mode === 'classification'
                  ? classificationParams?.minSamplesLeaf ?? 1
                  : regressionParams?.minSamplesLeaf ?? 1
              }
              onChange={(e) => {
                const val = Number(e.target.value);
                if (mode === 'classification' && classificationParams && onClassificationChange) {
                  onClassificationChange({ ...classificationParams, minSamplesLeaf: val });
                } else if (mode === 'regression' && regressionParams && onRegressionChange) {
                  onRegressionChange({ ...regressionParams, minSamplesLeaf: val });
                }
              }}
              className="w-full accent-violet-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Garantiza que ninguna hoja final tenga menos de este umbral de observaciones. Suaviza fronteras.
            </p>
          </div>
        )}

        {/* 4. Criterion for Classification / Regression */}
        {mode === 'classification' && classificationParams && onClassificationChange && (
          <div>
            <span className="text-xs font-medium text-slate-200 block mb-1.5">
              Criterio de División (<code className="text-amber-400">criterion</code>)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="criterion-gini-btn"
                type="button"
                onClick={() => onClassificationChange({ ...classificationParams, criterion: 'gini' })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                  classificationParams.criterion === 'gini'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold">Impureza Gini</div>
                <div className="text-[10px] text-slate-400">1 - ∑ pᵢ² (Estándar CART, computacionalmente rápido)</div>
              </button>
              <button
                id="criterion-entropy-btn"
                type="button"
                onClick={() => onClassificationChange({ ...classificationParams, criterion: 'entropy' })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                  classificationParams.criterion === 'entropy'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold">Entropía (Info Gain)</div>
                <div className="text-[10px] text-slate-400">-∑ pᵢ log₂(pᵢ) (Teoría de Shannon)</div>
              </button>
            </div>
          </div>
        )}

        {mode === 'regression' && regressionParams && onRegressionChange && (
          <div>
            <span className="text-xs font-medium text-slate-200 block mb-1.5">
              Criterio de Error (<code className="text-amber-400">criterion</code>)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="criterion-mse-btn"
                type="button"
                onClick={() => onRegressionChange({ ...regressionParams, criterion: 'mse' })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                  regressionParams.criterion === 'mse'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold">MSE (Error Cuadrático)</div>
                <div className="text-[10px] text-slate-400">Predice la Media. Penaliza fuertemente errores grandes.</div>
              </button>
              <button
                id="criterion-mae-btn"
                type="button"
                onClick={() => onRegressionChange({ ...regressionParams, criterion: 'mae' })}
                className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                  regressionParams.criterion === 'mae'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="font-semibold">MAE (Error Absoluto)</div>
                <div className="text-[10px] text-slate-400">Predice la Mediana. Robusto frente a valores atípicos.</div>
              </button>
            </div>
          </div>
        )}

        {/* 5. Random Forest Specific Hyperparameters */}
        {mode === 'random_forest' && rfParams && onRfChange && (
          <div className="space-y-3 pt-2 border-t border-slate-800">
            {/* n_estimators */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-200">
                  Número de Árboles (<code className="text-amber-400">n_estimators</code>)
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-100 font-bold">
                  {rfParams.nEstimators} árboles
                </span>
              </div>
              <input
                id="slider-n-estimators"
                type="range"
                min="3"
                max="25"
                step="2"
                value={rfParams.nEstimators}
                onChange={(e) => onRfChange({ ...rfParams, nEstimators: Number(e.target.value) })}
                className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                💡 A diferencia de la profundidad, añadir más árboles a un Random Forest <strong>nunca provoca sobreajuste</strong>; estabiliza la varianza colectiva.
              </p>
            </div>

            {/* max_features & bootstrap */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Subespacio (<code className="text-indigo-400">max_features</code>)
                </label>
                <select
                  id="select-max-features"
                  value={rfParams.maxFeatures}
                  onChange={(e) => onRfChange({ ...rfParams, maxFeatures: e.target.value as any })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-md p-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">Todas (m = 2)</option>
                  <option value="1">Aleatorio (1 feature)</option>
                </select>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Descorrelaciona árboles.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-300 block mb-1">
                  Muestreo (<code className="text-sky-400">bootstrap</code>)
                </label>
                <button
                  id="toggle-bootstrap-btn"
                  type="button"
                  onClick={() => onRfChange({ ...rfParams, bootstrap: !rfParams.bootstrap })}
                  className={`w-full py-1.5 px-2 rounded-md text-xs font-medium border text-center transition-all ${
                    rfParams.bootstrap
                      ? 'bg-sky-500/20 border-sky-500 text-sky-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {rfParams.bootstrap ? 'Activado (Con Reemplazo)' : 'Desactivado (Datos Idénticos)'}
                </button>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Bagging: ~63.2% datos únicos.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
