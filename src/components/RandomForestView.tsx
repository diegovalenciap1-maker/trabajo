import React, { useState, useMemo } from 'react';
import { Point2D, RandomForestHyperparameters, TreeNode } from '../types';
import { buildClassificationTree, buildRandomForest, predictClassificationWithTrace, evaluateClassification } from '../utils/mlEngine';
import { TreeDiagramSVG } from './TreeDiagramSVG';
import { Trees, Split, ShieldCheck, CheckCircle, Vote, Info, BarChart2 } from 'lucide-react';

interface RandomForestViewProps {
  trainData: Point2D[];
  testData: Point2D[];
  featureNames: [string, string];
  classLabels: [string, string];
  hyperparams: RandomForestHyperparameters;
}

export function RandomForestView({
  trainData,
  testData,
  featureNames,
  classLabels,
  hyperparams,
}: RandomForestViewProps) {
  const [selectedTreeIndex, setSelectedTreeIndex] = useState<number>(0);
  const [probePoint, setProbePoint] = useState<{ x: number; y: number } | null>(null);

  // Train a Single Standalone Tree with same depth for comparison
  const singleTree = useMemo(() => {
    return buildClassificationTree(
      trainData,
      {
        maxDepth: hyperparams.maxDepth,
        minSamplesSplit: hyperparams.minSamplesSplit,
        minSamplesLeaf: 1,
        criterion: 'gini',
      },
      featureNames,
      classLabels
    );
  }, [trainData, hyperparams.maxDepth, hyperparams.minSamplesSplit, featureNames, classLabels]);

  // Train the Random Forest Model
  const rfModel = useMemo(() => {
    return buildRandomForest(trainData, hyperparams, featureNames, classLabels);
  }, [trainData, hyperparams, featureNames, classLabels]);

  // Evaluate single tree vs forest
  const singleTreeMetrics = useMemo(() => {
    return evaluateClassification(singleTree, trainData, testData);
  }, [singleTree, trainData, testData]);

  const forestAccuracy = useMemo(() => {
    let correct = 0;
    for (const pt of testData) {
      const pred = rfModel.predict(pt);
      if (pred.prediction === pt.label) correct++;
    }
    return Math.round((correct / testData.length) * 1000) / 10;
  }, [rfModel, testData]);

  // Bounds for 2D plots
  const { minX, maxX, minY, maxY } = useMemo(() => {
    const all = [...trainData, ...testData];
    const xs = all.map(p => p.x);
    const ys = all.map(p => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);

    const xPad = (xMax - xMin) * 0.08 || 5;
    const yPad = (yMax - yMin) * 0.08 || 5;

    return {
      minX: xMin - xPad,
      maxX: xMax + xPad,
      minY: yMin - yPad,
      maxY: yMax + yPad,
    };
  }, [trainData, testData]);

  // Generate grid predictions for Single Tree vs Forest
  const resolution = 32;
  const { singleGrid, forestGrid } = useMemo(() => {
    const sGrid: { x: number; y: number; width: number; height: number; pred: number }[] = [];
    const fGrid: { x: number; y: number; width: number; height: number; pred: number; prob: number }[] = [];

    const stepX = (maxX - minX) / resolution;
    const stepY = (maxY - minY) / resolution;

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const xVal = minX + (i + 0.5) * stepX;
        const yVal = minY + (j + 0.5) * stepY;

        const sRes = predictClassificationWithTrace(singleTree, { x: xVal, y: yVal });
        sGrid.push({
          x: minX + i * stepX,
          y: minY + j * stepY,
          width: stepX,
          height: stepY,
          pred: sRes.prediction,
        });

        const fRes = rfModel.predict({ x: xVal, y: yVal });
        fGrid.push({
          x: minX + i * stepX,
          y: minY + j * stepY,
          width: stepX,
          height: stepY,
          pred: fRes.prediction,
          prob: fRes.probability,
        });
      }
    }

    return { singleGrid: sGrid, forestGrid: fGrid };
  }, [singleTree, rfModel, minX, maxX, minY, maxY]);

  // Selected tree inside the forest
  const activeTreeObj = rfModel.trees[selectedTreeIndex] || rfModel.trees[0];

  // Probe evaluation across all trees
  const probeVotes = useMemo(() => {
    if (!probePoint) return null;
    const votes: { treeId: number; prediction: number }[] = [];
    for (const t of rfModel.trees) {
      const res = predictClassificationWithTrace(t.tree, probePoint);
      votes.push({ treeId: t.id, prediction: res.prediction });
    }
    const count0 = votes.filter(v => v.prediction === 0).length;
    const count1 = votes.filter(v => v.prediction === 1).length;
    return {
      votes,
      count0,
      count1,
      majority: count1 >= count0 ? 1 : 0,
      confidence: Math.round((Math.max(count0, count1) / (count0 + count1)) * 100),
    };
  }, [probePoint, rfModel]);

  const svgWidth = 320;
  const svgHeight = 240;
  const pad = 24;
  const plotW = svgWidth - 2 * pad;
  const plotH = svgHeight - 2 * pad;

  const toSvgX = (x: number) => pad + ((x - minX) / (maxX - minX)) * plotW;
  const toSvgY = (y: number) => pad + (1 - (y - minY) / (maxY - minY)) * plotH;
  const fromSvgX = (sx: number) => minX + ((sx - pad) / plotW) * (maxX - minX);
  const fromSvgY = (sy: number) => minY + (1 - (sy - pad) / plotH) * (maxY - minY);

  const handlePlotClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = ((e.clientX - rect.left) / rect.width) * svgWidth;
    const sy = ((e.clientY - rect.top) / rect.height) * svgHeight;
    if (sx >= pad && sx <= svgWidth - pad && sy >= pad && sy <= svgHeight - pad) {
      setProbePoint({
        x: Math.round(fromSvgX(sx) * 10) / 10,
        y: Math.round(fromSvgY(sy) * 10) / 10,
      });
    }
  };

  return (
    <div id="random-forest-module" className="space-y-6">
      {/* Pedagogical Header Card */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
              <Trees className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                ¿Por qué Random Forest supera a un Árbol Individual?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Un solo árbol tiene <strong>alta varianza</strong> (se rompe o sobreajusta con ruido). Random Forest combina un comité de árboles diversos para lograr una frontera suave y robusta.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Árbol Único</span>
              <span className="text-sm font-bold text-amber-400">{singleTreeMetrics.testScore}% Acc</span>
            </div>
            <div className="text-slate-500 font-bold">vs</div>
            <div className="bg-slate-900/90 border border-emerald-500/40 px-3 py-1.5 rounded-lg text-right">
              <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">Random Forest</span>
              <span className="text-sm font-bold text-emerald-400">{forestAccuracy}% Acc</span>
            </div>
          </div>
        </div>

        {/* 3 Didactic Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 text-xs">
            <strong className="text-emerald-400 flex items-center gap-1.5 mb-1">
              <Split className="w-3.5 h-3.5" /> 1. Bagging (Bootstrap)
            </strong>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Cada árbol se entrena con un subconjunto aleatorio con reemplazo de los datos (~63.2% de datos únicos).
            </p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 text-xs">
            <strong className="text-sky-400 flex items-center gap-1.5 mb-1">
              <ShuffleIcon className="w-3.5 h-3.5" /> 2. Subespacio Aleatorio
            </strong>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              En cada división, solo se evalúa una muestra aleatoria de variables (<code className="text-sky-300">max_features</code>), descorrelacionando los árboles.
            </p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/60 text-xs">
            <strong className="text-amber-400 flex items-center gap-1.5 mb-1">
              <Vote className="w-3.5 h-3.5" /> 3. Votación Mayoritaria
            </strong>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              La clase ganadora es la elegida por la mayoría. Los errores individuales se cancelan por la Ley de los Grandes Números.
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-side Visual Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Single Tree Boundary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>1 Árbol Solitario</span>
              <span className="text-slate-400 text-[11px] font-normal">(Rígido y Propenso a Ruido)</span>
            </h4>
            <span className="text-xs text-slate-400">Profundidad: {hyperparams.maxDepth}</span>
          </div>

          <div className="rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto cursor-crosshair"
              onClick={handlePlotClick}
            >
              {singleGrid.map((c, idx) => (
                <rect
                  key={`sg_${idx}`}
                  x={toSvgX(c.x)}
                  y={toSvgY(c.y + c.height)}
                  width={(c.width / (maxX - minX)) * plotW + 0.5}
                  height={(c.height / (maxY - minY)) * plotH + 0.5}
                  fill={c.pred === 1 ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)'}
                />
              ))}
              {trainData.map(pt => (
                <circle
                  key={`pt_${pt.id}`}
                  cx={toSvgX(pt.x)}
                  cy={toSvgY(pt.y)}
                  r={3.5}
                  fill={pt.label === 1 ? '#f43f5e' : '#10b981'}
                />
              ))}
              {probePoint && (
                <circle
                  cx={toSvgX(probePoint.x)}
                  cy={toSvgY(probePoint.y)}
                  r={6}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </svg>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Fronteras con cortes ortogonales afilados. Puede crear "islas" aisladas para capturar puntos con ruido.
          </p>
        </div>

        {/* Random Forest Boundary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>Random Forest ({hyperparams.nEstimators} Árboles)</span>
              <span className="text-slate-400 text-[11px] font-normal">(Ensemble Colectivo)</span>
            </h4>
            <span className="text-xs text-emerald-400 font-medium">Frontera Suavizada</span>
          </div>

          <div className="rounded-lg overflow-hidden bg-slate-950 border border-slate-800">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto cursor-crosshair"
              onClick={handlePlotClick}
            >
              {forestGrid.map((c, idx) => (
                <rect
                  key={`fg_${idx}`}
                  x={toSvgX(c.x)}
                  y={toSvgY(c.y + c.height)}
                  width={(c.width / (maxX - minX)) * plotW + 0.5}
                  height={(c.height / (maxY - minY)) * plotH + 0.5}
                  fill={
                    c.pred === 1
                      ? `rgba(244, 63, 94, ${0.15 + c.prob * 0.35})`
                      : `rgba(16, 185, 129, ${0.15 + (1 - c.prob) * 0.35})`
                  }
                />
              ))}
              {trainData.map(pt => (
                <circle
                  key={`f_pt_${pt.id}`}
                  cx={toSvgX(pt.x)}
                  cy={toSvgY(pt.y)}
                  r={3.5}
                  fill={pt.label === 1 ? '#f43f5e' : '#10b981'}
                />
              ))}
              {probePoint && (
                <circle
                  cx={toSvgX(probePoint.x)}
                  cy={toSvgY(probePoint.y)}
                  r={6}
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              )}
            </svg>
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            El promedio de votaciones genera transiciones suaves en gradiente de certeza, eliminando el ruido.
          </p>
        </div>
      </div>

      {/* Live Voting Inspector */}
      <div id="voting-inspector-card" className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Vote className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Simulador de Votación del Bosque (Haz clic en los gráficos para probar)
            </h4>
          </div>
          {probePoint && (
            <span className="text-xs text-amber-400 font-mono">
              X = {probePoint.x}, Y = {probePoint.y}
            </span>
          )}
        </div>

        {probeVotes ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-3 rounded-lg border border-slate-800 mb-3">
              <div>
                <span className="text-xs text-slate-400 block">Resultado de la Votación:</span>
                <span className="text-base font-bold text-slate-100">
                  {classLabels[probeVotes.majority]}{' '}
                  <span className="text-xs font-normal text-emerald-400">
                    ({probeVotes.confidence}% de los árboles coinciden)
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-xs text-emerald-400 font-bold block">{probeVotes.count0} votos</span>
                  <span className="text-[10px] text-slate-400">{classLabels[0]}</span>
                </div>
                <div className="w-32 h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${(probeVotes.count0 / (probeVotes.count0 + probeVotes.count1)) * 100}%` }}
                    className="bg-emerald-500 h-full"
                  />
                  <div
                    style={{ width: `${(probeVotes.count1 / (probeVotes.count0 + probeVotes.count1)) * 100}%` }}
                    className="bg-rose-500 h-full"
                  />
                </div>
                <div className="text-left">
                  <span className="text-xs text-rose-400 font-bold block">{probeVotes.count1} votos</span>
                  <span className="text-[10px] text-slate-400">{classLabels[1]}</span>
                </div>
              </div>
            </div>

            {/* Micro tree cards in the forest */}
            <div className="text-xs text-slate-400 mb-2">
              Voto individual de cada uno de los {hyperparams.nEstimators} árboles:
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-slate-950/60 rounded-lg border border-slate-800/60">
              {probeVotes.votes.map((v) => (
                <div
                  key={`vote_${v.treeId}`}
                  className={`px-2 py-1 rounded text-[11px] font-mono flex items-center gap-1 border ${
                    v.prediction === 0
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  <span>Árbol #{v.treeId}:</span>
                  <strong>{v.prediction === 0 ? classLabels[0].slice(0, 5) : classLabels[1].slice(0, 5)}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-lg border border-dashed border-slate-800">
            👆 Haz clic sobre cualquiera de los gráficos superiores para colocar una observación y ver cómo vota cada árbol del bosque en tiempo real.
          </div>
        )}
      </div>

      {/* Tree Inspector Carousel */}
      <div id="forest-tree-inspector" className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-sky-400" />
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Inspeccionar Árboles Individuales del Bosque
            </h4>
          </div>
          <span className="text-xs text-slate-400">
            Viendo Árbol #{selectedTreeIndex + 1} de {rfModel.trees.length}
          </span>
        </div>

        {/* Tree Selector Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
          {rfModel.trees.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => setSelectedTreeIndex(idx)}
              className={`px-3 py-1 text-xs rounded-md whitespace-nowrap border transition-all ${
                selectedTreeIndex === idx
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500 font-bold'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Árbol #{t.id}
            </button>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 mb-2">
          💡 Nota cómo cada árbol tiene cortes ligeramente distintos debido al <strong>muestreo bootstrap</strong> y al <strong>subespacio aleatorio</strong>.
        </p>

        {activeTreeObj && (
          <TreeDiagramSVG root={activeTreeObj.tree} />
        )}
      </div>
    </div>
  );
}

function ShuffleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      viewBox="0 0 24 24"
    >
      <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
    </svg>
  );
}
