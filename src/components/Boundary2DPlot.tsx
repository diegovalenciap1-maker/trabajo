import React, { useMemo, useState, useRef } from 'react';
import { Point2D, TreeNode } from '../types';
import { predictClassificationWithTrace } from '../utils/mlEngine';
import { Target, Info } from 'lucide-react';

interface Boundary2DPlotProps {
  trainData: Point2D[];
  testData: Point2D[];
  tree: TreeNode;
  featureNames: [string, string];
  classLabels: [string, string];
  onProbePoint?: (point: { x: number; y: number } | null, trace: string[]) => void;
}

export function Boundary2DPlot({
  trainData,
  testData,
  tree,
  featureNames,
  classLabels,
  onProbePoint,
}: Boundary2DPlotProps) {
  const [probe, setProbe] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute bounding box for data with padding
  const { minX, maxX, minY, maxY } = useMemo(() => {
    const all = [...trainData, ...testData];
    if (all.length === 0) return { minX: 0, maxX: 100, minY: 0, maxY: 100 };
    const xs = all.map(p => p.x);
    const ys = all.map(p => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);

    const xPad = (xMax - xMin) * 0.1 || 5;
    const yPad = (yMax - yMin) * 0.1 || 5;

    return {
      minX: xMin - xPad,
      maxX: xMax + xPad,
      minY: yMin - yPad,
      maxY: yMax + yPad,
    };
  }, [trainData, testData]);

  // Generate grid background (decision boundary zones)
  const gridResolution = 45; // 45x45 = 2025 cells for smooth heatmap
  const gridCells = useMemo(() => {
    const cells: { x: number; y: number; width: number; height: number; pred: number; prob: number }[] = [];
    const stepX = (maxX - minX) / gridResolution;
    const stepY = (maxY - minY) / gridResolution;

    for (let i = 0; i < gridResolution; i++) {
      for (let j = 0; j < gridResolution; j++) {
        const xVal = minX + (i + 0.5) * stepX;
        const yVal = minY + (j + 0.5) * stepY;
        const res = predictClassificationWithTrace(tree, { x: xVal, y: yVal });
        cells.push({
          x: minX + i * stepX,
          y: minY + j * stepY,
          width: stepX,
          height: stepY,
          pred: res.prediction,
          prob: res.probClass1,
        });
      }
    }
    return cells;
  }, [tree, minX, maxX, minY, maxY]);

  // Coordinate transforms for SVG viewport
  const svgWidth = 480;
  const svgHeight = 360;
  const padLeft = 45;
  const padBottom = 35;
  const padRight = 15;
  const padTop = 15;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const toSvgX = (x: number) => padLeft + ((x - minX) / (maxX - minX)) * plotWidth;
  const toSvgY = (y: number) => padTop + (1 - (y - minY) / (maxY - minY)) * plotHeight;

  const fromSvgX = (svgX: number) => minX + ((svgX - padLeft) / plotWidth) * (maxX - minX);
  const fromSvgY = (svgY: number) => minY + (1 - (svgY - padTop) / plotHeight) * (maxY - minY);

  // Handle probe interaction
  const handleSvgClickOrMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const clickY = ((e.clientY - rect.top) / rect.height) * svgHeight;

    if (clickX >= padLeft && clickX <= svgWidth - padRight && clickY >= padTop && clickY <= svgHeight - padBottom) {
      const xVal = Math.round(fromSvgX(clickX) * 10) / 10;
      const yVal = Math.round(fromSvgY(clickY) * 10) / 10;
      const point = { x: xVal, y: yVal };
      const { prediction, probClass1, trace } = predictClassificationWithTrace(tree, point);
      setProbe(point);
      onProbePoint?.(point, trace);
    }
  };

  const currentProbeResult = probe ? predictClassificationWithTrace(tree, probe) : null;

  return (
    <div id="boundary-2d-plot-card" className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm" ref={containerRef}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <h4 className="font-semibold text-xs text-slate-100 uppercase tracking-wider">
            Espacio de Características y Frontera de Decisión 2D
          </h4>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{classLabels[0]}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span>{classLabels[1]}</span>
          </div>
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mb-2">
        💡 <em>Didáctica:</em> Los árboles solo hacen cortes <strong>ortogonales (perpendiculares a los ejes)</strong>. Haz clic en cualquier lugar para trazar la predicción en el árbol.
      </p>

      {/* SVG Container */}
      <div className="relative rounded-lg overflow-hidden bg-slate-950 border border-slate-800/80">
        <svg
          id="decision-space-svg"
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto cursor-crosshair select-none"
          onClick={handleSvgClickOrMove}
          onMouseMove={(e) => {
            if (e.buttons === 1) handleSvgClickOrMove(e);
          }}
        >
          {/* Decision boundary grid cells */}
          {gridCells.map((cell, idx) => {
            const sx = toSvgX(cell.x);
            const sy = toSvgY(cell.y + cell.height);
            const sw = (cell.width / (maxX - minX)) * plotWidth;
            const sh = (cell.height / (maxY - minY)) * plotHeight;

            // Opacity based on confidence
            const color = cell.pred === 1 ? 'rgba(244, 63, 94, 0.22)' : 'rgba(16, 185, 129, 0.22)';

            return (
              <rect
                key={`cell_${idx}`}
                x={sx}
                y={sy}
                width={sw + 0.6}
                height={sh + 0.6}
                fill={color}
              />
            );
          })}

          {/* Grid lines and axes */}
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

          {/* Axis Ticks & Labels */}
          <text
            x={padLeft + plotWidth / 2}
            y={svgHeight - 10}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={10}
            fontWeight="bold"
          >
            {featureNames[0]} (Eje X)
          </text>
          <text
            x={12}
            y={padTop + plotHeight / 2}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={10}
            fontWeight="bold"
            transform={`rotate(-90 12 ${padTop + plotHeight / 2})`}
          >
            {featureNames[1]} (Eje Y)
          </text>

          {/* Training points */}
          {trainData.map((pt) => {
            const px = toSvgX(pt.x);
            const py = toSvgY(pt.y);
            const isClass1 = pt.label === 1;
            return (
              <circle
                key={pt.id}
                cx={px}
                cy={py}
                r={4}
                fill={isClass1 ? '#f43f5e' : '#10b981'}
                stroke="#0f172a"
                strokeWidth={1.2}
                className="opacity-90"
              />
            );
          })}

          {/* Test points (rendered with ring border to distinguish) */}
          {testData.map((pt) => {
            const px = toSvgX(pt.x);
            const py = toSvgY(pt.y);
            const isClass1 = pt.label === 1;
            return (
              <circle
                key={`test_${pt.id}`}
                cx={px}
                cy={py}
                r={4.5}
                fill="none"
                stroke={isClass1 ? '#fb7185' : '#34d399'}
                strokeWidth={2}
                strokeDasharray="2 1"
              />
            );
          })}

          {/* Active Probe Point crosshair */}
          {probe && (
            <g>
              <line
                x1={toSvgX(probe.x)}
                y1={padTop}
                x2={toSvgX(probe.x)}
                y2={svgHeight - padBottom}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <line
                x1={padLeft}
                y1={toSvgY(probe.y)}
                x2={svgWidth - padRight}
                y2={toSvgY(probe.y)}
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              <circle
                cx={toSvgX(probe.x)}
                cy={toSvgY(probe.y)}
                r={6}
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Live Probe result banner */}
      <div className="mt-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-400" />
          {probe && currentProbeResult ? (
            <div>
              <span>
                Punto probado: <strong>X = {probe.x}</strong>, <strong>Y = {probe.y}</strong>
              </span>
              <span className="mx-2 text-slate-500">→</span>
              <span>
                Predicción:{' '}
                <strong
                  className={
                    currentProbeResult.prediction === 1 ? 'text-rose-400' : 'text-emerald-400'
                  }
                >
                  {classLabels[currentProbeResult.prediction]}
                </strong>{' '}
                ({Math.round((currentProbeResult.prediction === 1 ? currentProbeResult.probClass1 : 1 - currentProbeResult.probClass1) * 100)}% certeza)
              </span>
            </div>
          ) : (
            <span className="text-slate-400">
              Haz clic en el mapa para simular una predicción y ver el camino en el árbol 👆
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-slate-200"></span> Puntos de Entrenamiento
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full border border-slate-300"></span> Puntos de Prueba (Test)
          </span>
        </div>
      </div>
    </div>
  );
}
