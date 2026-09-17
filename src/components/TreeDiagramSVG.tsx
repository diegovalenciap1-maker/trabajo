import React, { useMemo } from 'react';
import { TreeNode } from '../types';
import { assignTreeCoordinates } from '../utils/mlEngine';

interface TreeDiagramSVGProps {
  root: TreeNode;
  activeTrace?: string[];
  onNodeHover?: (node: TreeNode | null) => void;
  selectedNodeId?: string | null;
  isRegression?: boolean;
}

export function TreeDiagramSVG({
  root,
  activeTrace = [],
  onNodeHover,
  selectedNodeId,
  isRegression = false,
}: TreeDiagramSVGProps) {
  // Compute tree layout
  const { nodesList, linksList, treeWidth, treeHeight } = useMemo(() => {
    // Calculate layout with dynamic dimensions
    function countLeaves(node?: TreeNode): number {
      if (!node) return 0;
      if (node.isLeaf || (!node.left && !node.right)) return 1;
      return countLeaves(node.left) + countLeaves(node.right);
    }
    function getMaxDepth(node?: TreeNode): number {
      if (!node) return 0;
      return Math.max(
        node.depth,
        getMaxDepth(node.left),
        getMaxDepth(node.right)
      );
    }

    const leafCount = Math.max(1, countLeaves(root));
    const depthCount = Math.max(1, getMaxDepth(root));

    const width = Math.max(780, leafCount * 145);
    const height = Math.max(340, (depthCount + 1) * 95);

    assignTreeCoordinates(root, width, height);

    const nodes: TreeNode[] = [];
    const links: { from: TreeNode; to: TreeNode; side: 'left' | 'right'; condition: string }[] = [];

    function traverse(curr?: TreeNode) {
      if (!curr) return;
      nodes.push(curr);

      if (curr.left) {
        links.push({
          from: curr,
          to: curr.left,
          side: 'left',
          condition: `≤ ${curr.threshold}`,
        });
        traverse(curr.left);
      }
      if (curr.right) {
        links.push({
          from: curr,
          to: curr.right,
          side: 'right',
          condition: `> ${curr.threshold}`,
        });
        traverse(curr.right);
      }
    }

    traverse(root);

    return {
      nodesList: nodes,
      linksList: links,
      treeWidth: width,
      treeHeight: height + 60,
    };
  }, [root]);

  const activeSet = useMemo(() => new Set(activeTrace), [activeTrace]);

  return (
    <div id="tree-diagram-container" className="relative w-full overflow-x-auto bg-slate-950 rounded-xl border border-slate-800 p-4">
      <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Estructura Jerárquica del Árbol (Nodos de Decisión y Hojas)</span>
        </div>
        {activeTrace.length > 0 && (
          <span className="text-amber-400 font-medium animate-pulse">
            📍 Mostrando ruta de inferencia ({activeTrace.length} pasos)
          </span>
        )}
      </div>

      <svg
        id="tree-svg-canvas"
        viewBox={`0 0 ${treeWidth} ${treeHeight}`}
        className="w-full h-auto min-w-[720px] select-none"
        style={{ minHeight: '300px' }}
      >
        <defs>
          <linearGradient id="linkGradientActive" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>
        </defs>

        {/* Links (Branches) */}
        {linksList.map((link, idx) => {
          const x1 = link.from.x ?? 0;
          const y1 = (link.from.y ?? 0) + 24;
          const x2 = link.to.x ?? 0;
          const y2 = (link.to.y ?? 0) - 24;

          const isBranchActive = activeSet.has(link.from.id) && activeSet.has(link.to.id);

          // Bezier control points
          const path = `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`;

          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          return (
            <g key={`link_${idx}`}>
              <path
                d={path}
                fill="none"
                stroke={isBranchActive ? '#f59e0b' : '#334155'}
                strokeWidth={isBranchActive ? 3.5 : 1.5}
                strokeDasharray={isBranchActive ? undefined : 'none'}
                className="transition-colors duration-300"
              />
              {/* Condition label along the branch */}
              <rect
                x={midX - 26}
                y={midY - 8}
                width={52}
                height={16}
                rx={4}
                fill={isBranchActive ? '#78350f' : '#0f172a'}
                stroke={isBranchActive ? '#f59e0b' : '#1e293b'}
                strokeWidth={1}
              />
              <text
                x={midX}
                y={midY + 3.5}
                textAnchor="middle"
                fontSize={9}
                fill={isBranchActive ? '#fef08a' : '#94a3b8'}
                fontWeight={isBranchActive ? 'bold' : 'normal'}
              >
                {link.side === 'left' ? 'Sí' : 'No'} ({link.condition})
              </text>
            </g>
          );
        })}

        {/* Nodes */}
        {nodesList.map((node) => {
          const x = node.x ?? 0;
          const y = node.y ?? 0;
          const isActive = activeSet.has(node.id);
          const isSelected = selectedNodeId === node.id;
          const nodeWidth = 115;
          const nodeHeight = 54;

          // Color coding for leaf nodes
          let leafColor = '#10b981'; // default emerald
          if (node.isLeaf) {
            if (isRegression) {
              leafColor = '#06b6d4'; // cyan
            } else {
              leafColor = node.prediction === 1 ? '#f43f5e' : '#10b981'; // Rose for class 1, Emerald for class 0
            }
          }

          return (
            <g
              key={node.id}
              transform={`translate(${x - nodeWidth / 2}, ${y - nodeHeight / 2})`}
              className="cursor-pointer transition-transform hover:scale-105"
              onMouseEnter={() => onNodeHover?.(node)}
              onMouseLeave={() => onNodeHover?.(null)}
            >
              {/* Outer Card */}
              <rect
                width={nodeWidth}
                height={nodeHeight}
                rx={8}
                fill={
                  node.isLeaf
                    ? '#090d16'
                    : isActive
                    ? '#1e1b18'
                    : '#0f172a'
                }
                stroke={
                  isActive
                    ? '#f59e0b'
                    : isSelected
                    ? '#38bdf8'
                    : node.isLeaf
                    ? leafColor
                    : '#334155'
                }
                strokeWidth={isActive ? 2.5 : node.isLeaf ? 2 : 1}
                className="transition-colors duration-200"
              />

              {/* Node Title / Condition */}
              {!node.isLeaf ? (
                <>
                  <rect
                    width={nodeWidth}
                    height={18}
                    rx={7}
                    fill={isActive ? '#b45309' : '#1e293b'}
                  />
                  <text
                    x={nodeWidth / 2}
                    y={12.5}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight="bold"
                    fill={isActive ? '#ffffff' : '#e2e8f0'}
                  >
                    {node.featureName || `X${node.featureIndex}`} ≤ {node.threshold}
                  </text>
                </>
              ) : (
                <>
                  <rect
                    width={nodeWidth}
                    height={18}
                    rx={7}
                    fill={node.prediction === 1 && !isRegression ? '#881337' : isRegression ? '#0e7490' : '#064e3b'}
                  />
                  <text
                    x={nodeWidth / 2}
                    y={12.5}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight="bold"
                    fill="#ffffff"
                  >
                    {isRegression ? `ŷ = ${node.prediction}` : `Hoja: ${node.predictionLabel || (node.prediction === 1 ? 'Clase 1' : 'Clase 0')}`}
                  </text>
                </>
              )}

              {/* Metrics inside Node */}
              <text x={8} y={30} fontSize={8.5} fill="#94a3b8">
                {node.impurityName}: <tspan fill="#f1f5f9" fontWeight="600">{node.impurity}</tspan>
              </text>
              <text x={8} y={44} fontSize={8.5} fill="#94a3b8">
                Muestras: <tspan fill="#f1f5f9" fontWeight="600">{node.samples}</tspan>
              </text>

              {/* Mini distribution bar for classification */}
              {!isRegression && node.distribution && (
                <g transform={`translate(${nodeWidth - 45}, 24)`}>
                  {(() => {
                    const total = (node.distribution[0] || 0) + (node.distribution[1] || 0);
                    const p0 = total > 0 ? (node.distribution[0] / total) * 36 : 18;
                    const p1 = 36 - p0;
                    return (
                      <>
                        <rect x={0} y={0} width={p0} height={5} fill="#10b981" rx={1} />
                        <rect x={p0} y={0} width={p1} height={5} fill="#f43f5e" rx={1} />
                        <text x={18} y={15} fontSize={7.5} textAnchor="middle" fill="#64748b">
                          [{node.distribution[0]}, {node.distribution[1]}]
                        </text>
                      </>
                    );
                  })()}
                </g>
              )}

              {isRegression && (
                <g transform={`translate(${nodeWidth - 40}, 24)`}>
                  <rect x={0} y={0} width={32} height={14} rx={3} fill="#0e7490" />
                  <text x={16} y={10} fontSize={8} textAnchor="middle" fill="#ecfeff" fontWeight="bold">
                    {node.prediction}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
