import React, { useState, useMemo } from 'react';
import { Point2D, ClassificationHyperparameters } from '../types';
import { buildClassificationTree, evaluateClassification } from '../utils/mlEngine';
import { LineChart, Activity, Sliders, CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, ArrowRight } from 'lucide-react';

interface HyperparameterLabProps {
  trainData: Point2D[];
  testData: Point2D[];
  featureNames: [string, string];
  classLabels: [string, string];
  onApplyHyperparameters: (params: ClassificationHyperparameters) => void;
}

export function HyperparameterLab({
  trainData,
  testData,
  featureNames,
  classLabels,
  onApplyHyperparameters,
}: HyperparameterLabProps) {
  const [selectedDepth, setSelectedDepth] = useState<number>(3);
  const [minSamplesSplit, setMinSamplesSplit] = useState<number>(2);
  const [minSamplesLeaf, setMinSamplesLeaf] = useState<number>(1);
  const [criterion, setCriterion] = useState<'gini' | 'entropy'>('gini');

  // Compute live complexity curve across depths 1 to 8
  const complexityCurve = useMemo(() => {
    const points: { depth: number; trainScore: number; testScore: number; status: string }[] = [];

    for (let d = 1; d <= 8; d++) {
      const tree = buildClassificationTree(
        trainData,
        {
          maxDepth: d,
          minSamplesSplit,
          minSamplesLeaf,
          criterion,
        },
        featureNames,
        classLabels
      );
      const metrics = evaluateClassification(tree, trainData, testData);
      points.push({
        depth: d,
        trainScore: metrics.trainScore,
        testScore: metrics.testScore,
        status: metrics.overfittingStatus,
      });
    }

    return points;
  }, [trainData, testData, minSamplesSplit, minSamplesLeaf, criterion, featureNames, classLabels]);

  const currentPoint = complexityCurve.find((p) => p.depth === selectedDepth) || complexityCurve[2];

  // SVG Chart Dimensions
  const svgWidth = 560;
  const svgHeight = 260;
  const padLeft = 45;
  const padBottom = 35;
  const padRight = 25;
  const padTop = 25;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const toSvgX = (depth: number) => padLeft + ((depth - 1) / 7) * plotW;
  const toSvgY = (score: number) => padTop + (1 - (score - 40) / 60) * plotH; // 40% to 100%

  const trainLineD = useMemo(() => {
    return complexityCurve.reduce((acc, pt, i) => {
      const cmd = i === 0 ? 'M' : 'L';
      return `${acc} ${cmd} ${toSvgX(pt.depth)} ${toSvgY(pt.trainScore)}`;
    }, '');
  }, [complexityCurve]);

  const testLineD = useMemo(() => {
    return complexityCurve.reduce((acc, pt, i) => {
      const cmd = i === 0 ? 'M' : 'L';
      return `${acc} ${cmd} ${toSvgX(pt.depth)} ${toSvgY(pt.testScore)}`;
    }, '');
  }, [complexityCurve]);

  return (
    <div id="hyperparameter-pedagogical-lab" className="space-y-6">
      {/* Introduction Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-slate-100">
            El Dilema Sesgo-Varianza (Bias-Variance Tradeoff)
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
          Los <strong>hiperparámetros</strong> no se aprenden automáticamente durante el entrenamiento; son las "perillas" de control que el científico de datos ajusta para regular la complejidad del modelo. Su misión principal es encontrar el equilibrio perfecto entre <strong>no subajustar</strong> (quedarse corto) y <strong>no sobreajustar</strong> (memorizar el ruido).
        </p>
      </div>

      {/* Interactive Complexity Curve */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-emerald-400" />
              Curva de Precisión vs Profundidad (max_depth)
            </h4>
            <span className="text-xs text-slate-400">
              Observa cómo la precisión en entrenamiento sube continuamente, pero la de prueba cae cuando inicia el sobreajuste.
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-sky-400 rounded-full"></span>
              <span className="text-slate-300">Entrenamiento (Train)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-emerald-400 rounded-full"></span>
              <span className="text-slate-300">Prueba (Generalización)</span>
            </div>
          </div>
        </div>

        {/* SVG Curve Canvas */}
        <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto select-none">
            {/* Zones Background */}
            {/* Underfitting Zone (Depth 1-2) */}
            <rect
              x={padLeft}
              y={padTop}
              width={toSvgX(2.5) - padLeft}
              height={plotH}
              fill="rgba(245, 158, 11, 0.08)"
            />
            <text x={padLeft + 12} y={padTop + 18} fill="#f59e0b" fontSize={10} fontWeight="bold">
              Bajo Ajuste (Alto Sesgo)
            </text>

            {/* Optimal Zone (Depth 2.5 - 4.5) */}
            <rect
              x={toSvgX(2.5)}
              y={padTop}
              width={toSvgX(4.5) - toSvgX(2.5)}
              height={plotH}
              fill="rgba(16, 185, 129, 0.08)"
            />
            <text x={toSvgX(3.5)} y={padTop + 18} fill="#10b981" fontSize={10} fontWeight="bold" textAnchor="middle">
              Zona Óptima de Generalización
            </text>

            {/* Overfitting Zone (Depth 4.5 - 8) */}
            <rect
              x={toSvgX(4.5)}
              y={padTop}
              width={svgWidth - padRight - toSvgX(4.5)}
              height={plotH}
              fill="rgba(244, 63, 94, 0.08)"
            />
            <text x={svgWidth - padRight - 12} y={padTop + 18} fill="#f43f5e" fontSize={10} fontWeight="bold" textAnchor="end">
              Sobreajuste (Alta Varianza)
            </text>

            {/* Horizontal Grid lines */}
            {[50, 70, 90, 100].map((score) => (
              <g key={`grid_${score}`}>
                <line
                  x1={padLeft}
                  y1={toSvgY(score)}
                  x2={svgWidth - padRight}
                  y2={toSvgY(score)}
                  stroke="#1e293b"
                  strokeDasharray="2 2"
                />
                <text x={padLeft - 6} y={toSvgY(score) + 3} fill="#64748b" fontSize={9} textAnchor="end">
                  {score}%
                </text>
              </g>
            ))}

            {/* Vertical grid lines (depths 1 to 8) */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
              <g key={`d_grid_${d}`}>
                <line
                  x1={toSvgX(d)}
                  y1={padTop}
                  x2={toSvgX(d)}
                  y2={svgHeight - padBottom}
                  stroke="#1e293b"
                />
                <text x={toSvgX(d)} y={svgHeight - padBottom + 16} fill="#94a3b8" fontSize={9} textAnchor="middle">
                  d={d}
                </text>
              </g>
            ))}

            {/* Train Line */}
            <path d={trainLineD} fill="none" stroke="#38bdf8" strokeWidth={2.5} />
            {complexityCurve.map((pt) => (
              <circle
                key={`train_pt_${pt.depth}`}
                cx={toSvgX(pt.depth)}
                cy={toSvgY(pt.trainScore)}
                r={4}
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            ))}

            {/* Test Line */}
            <path d={testLineD} fill="none" stroke="#34d399" strokeWidth={2.5} />
            {complexityCurve.map((pt) => (
              <circle
                key={`test_pt_${pt.depth}`}
                cx={toSvgX(pt.depth)}
                cy={toSvgY(pt.testScore)}
                r={4}
                fill="#34d399"
                stroke="#0f172a"
                strokeWidth={1.5}
              />
            ))}

            {/* Active Depth Indicator Line */}
            <line
              x1={toSvgX(selectedDepth)}
              y1={padTop}
              x2={toSvgX(selectedDepth)}
              y2={svgHeight - padBottom}
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="3 3"
            />
            <circle
              cx={toSvgX(selectedDepth)}
              cy={toSvgY(currentPoint.testScore)}
              r={7}
              fill="#f59e0b"
              stroke="#ffffff"
              strokeWidth={2}
            />
          </svg>
        </div>

        {/* Interactive Depth Scrubber and Metrics for Selected Depth */}
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[240px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-300 font-medium">
                Deslizar Profundidad (<code className="text-amber-400">max_depth = {selectedDepth}</code>):
              </span>
              <span className="font-bold text-slate-100">Nivel {selectedDepth} de 8</span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={selectedDepth}
              onChange={(e) => setSelectedDepth(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Entrenamiento:</span>
              <strong className="text-sky-400 text-base">{currentPoint.trainScore}%</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Prueba (Generalización):</span>
              <strong className="text-emerald-400 text-base">{currentPoint.testScore}%</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Diferencia (Brecha):</span>
              <strong
                className={`text-base ${
                  currentPoint.trainScore - currentPoint.testScore > 12
                    ? 'text-rose-400'
                    : 'text-slate-200'
                }`}
              >
                {(currentPoint.trainScore - currentPoint.testScore).toFixed(1)}%
              </strong>
            </div>
            <button
              onClick={() => {
                onApplyHyperparameters({
                  maxDepth: selectedDepth,
                  minSamplesSplit,
                  minSamplesLeaf,
                  criterion,
                });
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Aplicar al Árbol</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Didactic Reference Table of All Hyperparameters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h4 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-sky-400" />
          Guía Didáctica de Hiperparámetros de Árboles y Bosques
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">Hiperparámetro</th>
                <th className="py-2.5 px-3">¿Qué controla?</th>
                <th className="py-2.5 px-3">Si es muy bajo</th>
                <th className="py-2.5 px-3">Si es muy alto</th>
                <th className="py-2.5 px-3">Consejo Práctico</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-emerald-400">max_depth</td>
                <td className="py-3 px-3">Profundidad máxima del árbol.</td>
                <td className="py-3 px-3 text-amber-400">Underfitting (modelo muy simple).</td>
                <td className="py-3 px-3 text-rose-400">Overfitting (memoriza el ruido).</td>
                <td className="py-3 px-3">Empezar con 3 a 5 para visualización o validar con GridSearch.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-sky-400">min_samples_split</td>
                <td className="py-3 px-3">Mínimo de datos para evaluar un nuevo corte.</td>
                <td className="py-3 px-3 text-rose-400">Permite cortes con 2 muestras (overfitting).</td>
                <td className="py-3 px-3 text-amber-400">Frena divisiones muy temprano (underfitting).</td>
                <td className="py-3 px-3">Valores de 4 a 10 protegen contra outliers.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-violet-400">min_samples_leaf</td>
                <td className="py-3 px-3">Mínimo de datos requeridos en cada hoja final.</td>
                <td className="py-3 px-3 text-rose-400">Hojas con 1 solo punto (alta varianza).</td>
                <td className="py-3 px-3 text-amber-400">Hojas excesivamente pobladas y poco específicas.</td>
                <td className="py-3 px-3">Subir a 2 o 5 suaviza notablemente las fronteras de decisión.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-amber-400">criterion</td>
                <td className="py-3 px-3">Fórmula para medir la calidad del corte (Gini / Entropía / MSE).</td>
                <td className="py-3 px-3 text-slate-400">N/A</td>
                <td className="py-3 px-3 text-slate-400">N/A</td>
                <td className="py-3 px-3">Gini suele ser un poco más rápido de computar; los resultados suelen ser similares.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-amber-300">n_estimators</td>
                <td className="py-3 px-3">Número de árboles en el Random Forest.</td>
                <td className="py-3 px-3 text-amber-400">Varianza aún no estabilizada.</td>
                <td className="py-3 px-3 text-slate-400">Mayor coste computacional (pero no overfittea).</td>
                <td className="py-3 px-3">100 a 300 en producción. En didáctica 15-25 bastan.</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-mono font-bold text-teal-400">max_features</td>
                <td className="py-3 px-3">Variables evaluadas al azar en cada split.</td>
                <td className="py-3 px-3 text-slate-300">Árboles muy diversos y descorrelacionados.</td>
                <td className="py-3 px-3 text-slate-300">Árboles muy similares entre sí.</td>
                <td className="py-3 px-3">Usa raíz cuadrada (&radic;p) para clasificación y p/3 para regresión.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
