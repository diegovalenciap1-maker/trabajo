import React from 'react';
import { X, BookOpen, Lightbulb, GitFork, TrendingUp, Trees, HelpCircle, CheckCircle } from 'lucide-react';

interface DidacticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DidacticModal({ isOpen, onClose }: DidacticModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3">
          <div className="p-2.5 bg-emerald-500/15 rounded-xl border border-emerald-500/30 text-emerald-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Manual Didáctico: Árboles, Regresión y Random Forest
            </h2>
            <p className="text-xs text-slate-400">
              Conceptos clave, fórmulas explicadas de forma intuitiva y analogías pedagógicas.
            </p>
          </div>
        </div>

        <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* 1. Árbol de Decisión */}
          <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2 mb-2">
              <GitFork className="w-4 h-4" /> 1. Árbol de Decisión (Clasificación)
            </h3>
            <p className="mb-2">
              Un árbol de decisión para clasificación funciona exactamente como un juego de <strong>"20 Preguntas"</strong> o un protocolo médico: en cada nodo se hace una pregunta de tipo <code className="text-emerald-300">¿Característica ≤ Umbral?</code> para separar los datos en dos grupos cada vez más "puros".
            </p>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 mb-2">
              <strong className="text-emerald-400 font-sans block mb-1">Impureza Gini:</strong>
              Gini = 1 - (p₀² + p₁²)
              <span className="text-slate-400 block font-sans text-[10px] mt-1">
                • Vale 0 cuando todos los datos pertenecen a una sola clase (100% puro).
                <br />• Vale 0.5 cuando están 50% y 50% mezclados (máxima incertidumbre).
              </span>
            </div>
            <p className="text-slate-400 text-[11px]">
              <strong>Geometría:</strong> Divide el espacio 2D mediante <em>líneas ortogonales</em> (paralelas a los ejes). No puede trazar diagonales ni curvas suaves con un solo corte.
            </p>
          </section>

          {/* 2. Árbol de Regresión */}
          <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" /> 2. Árbol de Regresión (Valores Continuos)
            </h3>
            <p className="mb-2">
              A diferencia de la clasificación (donde se asigna una etiqueta discreta como "Sano" o "Enfermo"), en regresión se busca predecir un <strong>número real</strong> (por ejemplo, el precio de una casa o el consumo eléctrico).
            </p>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 mb-2">
              <strong className="text-cyan-400 font-sans block mb-1">Predicción en cada hoja:</strong>
              ŷ = Promedio de los datos que cayeron en esa hoja (con criterio MSE).
            </div>
            <p className="text-slate-400 text-[11px]">
              <strong>La Función Escalón:</strong> El modelo aproxima curvas mediante una serie de "peldaños" horizontales. Si el árbol es muy poco profundo, los escalones son muy anchos y no capturan la curva (bajo ajuste). Si es demasiado profundo, genera escalones minúsculos para cada dato (sobreajuste).
            </p>
          </section>

          {/* 3. Random Forest */}
          <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2 mb-2">
              <Trees className="w-4 h-4" /> 3. Random Forest (Bosque Aleatorio)
            </h3>
            <p className="mb-2">
              <strong>Analogía de la junta médica:</strong> Si le pides diagnóstico a un solo médico, puede equivocarse por sus sesgos personales. Si consultas a un panel de 25 especialistas independientes y tomas el <strong>voto mayoritario</strong>, la probabilidad de error se reduce drásticamente.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-[11px]">
              <li>
                <strong>Bagging (Bootstrap):</strong> Cada árbol se alimenta con un conjunto de datos ligeramente distinto creado al tomar muestras con reemplazo.
              </li>
              <li>
                <strong>Random Subspace:</strong> En cada bifurcación se ocultan algunas variables al azar, forzando a los árboles a encontrar patrones alternativos y evitando que un único atributo domine a todos los árboles.
              </li>
            </ul>
          </section>

          {/* 4. Diagnóstico de Hiperparámetros */}
          <section className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-2 mb-2">
              <SlidersIcon className="w-4 h-4" /> 4. Protocolo Didáctico de Calibración
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[10px]">
                  Paso 1
                </span>
                <span>
                  <strong>Comprueba el puntaje de Train vs Test:</strong> Si Train tiene 100% y Test apenas 70%, sufres de sobreajuste. Si ambos están en 60%, sufres de bajo ajuste.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                  Paso 2
                </span>
                <span>
                  <strong>Para frenar sobreajuste:</strong> Reduce <code className="text-emerald-300">max_depth</code>, aumenta <code className="text-sky-300">min_samples_leaf</code> o cambia a Random Forest.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-bold text-[10px]">
                  Paso 3
                </span>
                <span>
                  <strong>Para corregir bajo ajuste:</strong> Aumenta <code className="text-emerald-300">max_depth</code> y permite particiones con <code className="text-sky-300">min_samples_split</code> más pequeño.
                </span>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            ¡Entendido! Volver al Laboratorio
          </button>
        </div>
      </div>
    </div>
  );
}

function SlidersIcon(props: React.SVGProps<SVGSVGElement>) {
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
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
    </svg>
  );
}
