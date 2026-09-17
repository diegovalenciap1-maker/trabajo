import { EvaluationMetrics } from '../types';
import { CheckCircle2, AlertTriangle, AlertOctagon, Layers, GitFork } from 'lucide-react';

interface MetricsBadgeProps {
  metrics: EvaluationMetrics;
  isRegression?: boolean;
}

export function MetricsBadge({ metrics, isRegression = false }: MetricsBadgeProps) {
  const isOptimal = metrics.overfittingStatus === 'optimal';
  const isOverfit = metrics.overfittingStatus === 'overfitting';
  const isUnderfit = metrics.overfittingStatus === 'underfitting';

  return (
    <div id="metrics-summary-card" className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Diagnóstico del Modelo
          </span>
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isOptimal
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : isOverfit
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isOptimal && <CheckCircle2 className="w-3.5 h-3.5" />}
            {isOverfit && <AlertOctagon className="w-3.5 h-3.5" />}
            {isUnderfit && <AlertTriangle className="w-3.5 h-3.5" />}
            <span>
              {isOptimal
                ? 'Óptimo (Buena Generalización)'
                : isOverfit
                ? 'Sobreajuste (Overfitting)'
                : 'Bajo Ajuste (Underfitting)'}
            </span>
          </div>
        </div>

        {/* Info stats */}
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Profundidad real:</span>
            <strong className="text-slate-200">{metrics.treeDepth}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <GitFork className="w-3.5 h-3.5 text-sky-400" />
            <span>Hojas totales:</span>
            <strong className="text-slate-200">{metrics.leafCount}</strong>
          </div>
        </div>
      </div>

      {/* Numerical Scores */}
      <div className="grid grid-cols-2 gap-3 mt-3">
        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/60">
          <span className="text-[11px] text-slate-400 block font-medium">
            Entrenamiento (Train {isRegression ? 'MSE' : 'Acc'})
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-slate-100">
              {metrics.trainScore}
            </span>
            <span className="text-xs text-slate-400">
              {isRegression ? '' : '%'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Datos con los que aprendió
          </span>
        </div>

        <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/60">
          <span className="text-[11px] text-slate-400 block font-medium">
            Prueba (Test / Validación)
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span
              className={`text-xl font-bold ${
                isOptimal
                  ? 'text-emerald-400'
                  : isOverfit
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }`}
            >
              {metrics.testScore}
            </span>
            <span className="text-xs text-slate-400">
              {isRegression ? '' : '%'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            Datos no vistos (generalización)
          </span>
        </div>
      </div>

      {/* Pedagogical explanation banner */}
      <div className="mt-3 text-xs leading-relaxed text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
        <strong className="text-slate-200 block mb-0.5">💡 Explicación Didáctica:</strong>
        {metrics.overfittingExplanation}
      </div>
    </div>
  );
}
