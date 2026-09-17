import React, { useMemo, useState } from 'react';
import { Point2D, TreeNode } from '../types';
import { predictRegressionWithTrace } from '../utils/mlEngine';
import { TrendingUp, Info, Eye } from 'lucide-react';

interface RegressionPlotProps {
  trainData: Point2D[];
  testData: Point2D[];
  tree: TreeNode;
  featureName: string;
  targetName: string;
  onProbeX?: (x: number, trace: string[]) => void;
}

export function RegressionPlot({
  trainData,
  testData,
  tree,
  featureName,
  targetName,
  onProbeX,
}: RegressionPlotProps) {
  const [probeX, setProbeX] = useState<number | null>(null);
  const [showResiduals, setShowResiduals] = useState<boolean>(true);

  // Compute data bounds
  const { minX, maxX, minY, maxY } = useMemo(() => {
    const all = [...trainData, ...testData];
    if (all.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    const xs = all.map(p => p.x);
    const ys = all.map(p => p.target ?? p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);

    const xPad = (xMax - xMin) * 0.08 || 5;
    const yPad = (yMax - yMin) * 0.12 || 5;

    return {
      minX: xMin - xPad,
      maxX: xMax + xPad,
      minY: Math.max(0, yMin - yPad),
      maxY: yMax + yPad,
    };
  }, [trainData, testData]);

  // Generate dense curve steps for the regression tree
  const stepSegments = useMemo(() => {
    const numSamples = 250;
    const stepSize = (maxX - minX) / numSamples;
    const points: { x: number; y: number }[] = [];

    for (let i = 0; i <= numSamples; i++) {
      const curX = minX + i * stepSize;
      const { prediction } = predictRegressionWithTrace(tree, curX);
      points.push({ x: curX, y: prediction });
    }

    return points;
  }, [tree, minX, maxX]);

  const svgWidth = 520;
  const svgHeight = 340;
  const padLeft = 55;
  const padBottom = 40;
  const padRight = 20;
  const padTop = 20;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const toSvgX = (x: number) => padLeft + ((x - minX) / (maxX - minX)) * plotWidth;
  const toSvgY = (y: number) => padTop + (1 - (y - minY) / (maxY - minY)) * plotHeight;

  const fromSvgX = (svgX: number) => minX + ((svgX - padLeft) / plotWidth) * (maxX - minX);

  const handleMouseMoveOrClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    if (clickX >= padLeft && clickX <= svgWidth - padRight) {
      const xVal = Math.round(fromSvgX(clickX) * 10) / 10;
      const { trace } = predictRegressionWithTrace(tree, xVal);
      setProbeX(xVal);
      onProbeX?.(xVal, trace);
    }
  };

  // Convert step segments to SVG path
  const stepPathD = useMemo(() => {
    if (stepSegments.length === 0) return '';
    let d = `M ${toSvgX(stepSegments[0].x)} ${toSvgY(stepSegments[0].y)}`;
    for (let i = 1; i < stepSegments.length; i++) {
      d += ` L ${toSvgX(stepSegments[i].x)} ${toSvgY(stepSegments[i].y)}`;
    }
    return d;
  }, [stepSegments, minX, maxX, minY, maxY]);

  const currentProbePred = probeX !== null ? predictRegressionWithTrace(tree, probeX).prediction : null;

  return (
    <div id="regression-plot-card" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <h4 className="font-semibold text-xs text-slate-100 uppercase tracking-wider">
            Aproximación por Escalones de Regresión
          </h4>
        </div>

        {/* Residuals toggle */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-residuals-btn"
            onClick={() => setShowResiduals(!showResiduals)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              showResiduals
                ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{showResiduals ? 'Ocultar Residuos' : 'Mostrar Residuos (Errores)'}</span>
          </button>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mb-2">
        💡 <em>Didáctica:</em> A diferencia de una regresión lineal (una sola recta), un árbol de regresión divide el eje X en intervalos constantes y predice el <strong>promedio (media)</strong> en cada intervalo (función escalonada).
      </p>

      {/* SVG Canvas */}
      <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800/80">
        <svg
          id="regression-svg-canvas"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onClick={handleMouseMoveOrClick}
          onMouseMove={(e) => {
            if (e.buttons === 1) handleMouseMoveOrClick(e);
          }}
        >
          {/* Background grid */}
          <line
            x1={padLeft}
            y1={padTop}
            x2={padLeft}
            y2={svgHeight - padBottom}
            stroke="#475569"
            strokeWidth={1.5}
          />
          <line
            x1={padLeft}
            y1={svgHeight - padBottom}
            x2={svgWidth - padRight}
            y2={svgHeight - padBottom}
            stroke="#475569"
            strokeWidth={1.5}
          />

          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((factor) => (
            <line
              key={`grid_${factor}`}
              x1={padLeft}
              y1={padTop + factor * plotHeight}
              x2={svgWidth - padRight}
              y2={padTop + factor * plotHeight}
              stroke="#1e293b"
              strokeDasharray="3 3"
            />
          ))}

          {/* Residual lines (errors) */}
          {showResiduals &&
            trainData.map((pt) => {
              const actualY = pt.target ?? pt.y;
              const { prediction } = predictRegressionWithTrace(tree, pt.x);
              const xPos = toSvgX(pt.x);
              const yActualPos = toSvgY(actualY);
              const yPredPos = toSvgY(prediction);

              return (
                <line
                  key={`res_${pt.id}`}
                  x1={xPos}
                  y1={yActualPos}
                  x2={xPos}
                  y2={yPredPos}
                  stroke="#f43f5e"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  opacity={0.65}
                />
              );
            })}

          {/* Step Function Line (The Regression Tree Prediction) */}
          <path
            d={stepPathD}
            fill="none"
            stroke="#06b6d4"
            strokeWidth={3}
            className="drop-shadow-sm"
          />

          {/* Training Points */}
          {trainData.map((pt) => {
            const actualY = pt.target ?? pt.y;
            return (
              <circle
                key={pt.id}
                cx={toSvgX(pt.x)}
                cy={toSvgY(actualY)}
                r={4}
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth={1.2}
              />
            );
          })}

          {/* Test Points */}
          {testData.map((pt) => {
            const actualY = pt.target ?? pt.y;
            return (
              <circle
                key={`reg_test_${pt.id}`}
                cx={toSvgX(pt.x)}
                cy={toSvgY(actualY)}
                r={4.5}
                fill="none"
                stroke="#a855f7"
                strokeWidth={2}
                strokeDasharray="2 1"
              />
            );
          })}

          {/* Probe indicator */}
          {probeX !== null && currentProbePred !== null && (
            <g>
              <line
                x1={toSvgX(probeX)}
                y1={padTop}
                x2={toSvgX(probeX)}
                y2={svgHeight - padBottom}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <circle
                cx={toSvgX(probeX)}
                cy={toSvgY(currentProbePred)}
                r={6}
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={padLeft + plotWidth / 2}
            y={svgHeight - 10}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={10}
            fontWeight="bold"
          >
            {featureName}
          </text>
          <text
            x={15}
            y={padTop + plotHeight / 2}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={10}
            fontWeight="bold"
            transform={`rotate(-90 15 ${padTop + plotHeight / 2})`}
          >
            {targetName}
          </text>
        </svg>
      </div>

      {/* Banner */}
      <div className="mt-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400" />
          {probeX !== null && currentProbePred !== null ? (
            <div>
              <span>
                Entrada evaluada: <strong>{featureName} = {probeX}</strong>
              </span>
              <span className="mx-2 text-slate-500">→</span>
              <span>
                Predicción continua ŷ:{' '}
                <strong className="text-cyan-400">{currentProbePred}</strong>
              </span>
            </div>
          ) : (
            <span className="text-slate-400">
              Haz clic sobre el gráfico para evaluar cualquier valor en el eje horizontal 👆
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-cyan-400"></span> Función Escalón ŷ
          </span>
          {showResiduals && (
            <span className="flex items-center gap-1 text-rose-400">
              <span className="w-2.5 h-0.5 border-b border-dashed border-rose-400"></span> Residuos (Error)
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
