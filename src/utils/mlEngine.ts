import { Point2D, TreeNode, ClassificationHyperparameters, RegressionHyperparameters, RandomForestHyperparameters, EvaluationMetrics } from '../types';
import { calculateGini, calculateEntropy, calculateMSE, calculateMAE, calculateMean, calculateMedian, bootstrapSample, seededRandom } from './math';

let nodeCounter = 0;

/**
 * Entrena un Árbol de Decisión para Clasificación binaria (0 y 1)
 */
export function buildClassificationTree(
  data: Point2D[],
  hyperparams: ClassificationHyperparameters,
  featureNames: [string, string],
  classLabels: [string, string],
  depth: number = 0,
  maxFeatures: 'all' | 1 = 'all'
): TreeNode {
  if (depth === 0) {
    nodeCounter = 0;
  }
  const id = `node_${++nodeCounter}`;

  // Distribución actual de clases
  const count0 = data.filter(d => d.label === 0).length;
  const count1 = data.filter(d => d.label === 1).length;
  const distribution = [count0, count1];
  const samples = data.length;

  // Cálculo de impureza del nodo
  const impurity = hyperparams.criterion === 'gini'
    ? calculateGini(distribution)
    : calculateEntropy(distribution);
  const impurityName = hyperparams.criterion === 'gini' ? 'Gini' : 'Entropía';

  // Predicción mayoritaria en este nodo
  const prediction = count1 >= count0 ? 1 : 0;
  const predictionLabel = classLabels[prediction];

  // Condiciones de parada (Hiperparámetros de regularización)
  const isPure = count0 === 0 || count1 === 0;
  const reachedMaxDepth = depth >= hyperparams.maxDepth;
  const cannotSplitSamples = samples < hyperparams.minSamplesSplit;

  if (isPure || reachedMaxDepth || cannotSplitSamples) {
    return {
      id,
      depth,
      isLeaf: true,
      featureIndex: -1,
      threshold: 0,
      impurity: Math.round(impurity * 1000) / 1000,
      impurityName,
      samples,
      distribution,
      prediction,
      predictionLabel,
    };
  }

  // Búsqueda del mejor corte (split)
  let bestFeature = -1;
  let bestThreshold = 0;
  let bestGain = -Infinity;
  let bestLeftData: Point2D[] = [];
  let bestRightData: Point2D[] = [];

  // Considerar características
  const availableFeatures: number[] = [0, 1];
  let featuresToConsider = availableFeatures;
  if (maxFeatures === 1) {
    // Para Random Forest: elegir aleatoriamente un subconjunto
    featuresToConsider = [Math.random() < 0.5 ? 0 : 1];
  }

  for (const fIndex of featuresToConsider) {
    const values = data.map(d => (fIndex === 0 ? d.x : d.y));
    const sorted = [...new Set(values)].sort((a, b) => a - b);

    // Evaluar puntos medios entre valores únicos consecutivos
    for (let i = 0; i < sorted.length - 1; i++) {
      const threshold = (sorted[i] + sorted[i + 1]) / 2;
      const left = data.filter(d => (fIndex === 0 ? d.x : d.y) <= threshold);
      const right = data.filter(d => (fIndex === 0 ? d.x : d.y) > threshold);

      // Respetar minSamplesLeaf
      if (left.length < hyperparams.minSamplesLeaf || right.length < hyperparams.minSamplesLeaf) {
        continue;
      }

      const leftDist = [left.filter(d => d.label === 0).length, left.filter(d => d.label === 1).length];
      const rightDist = [right.filter(d => d.label === 0).length, right.filter(d => d.label === 1).length];

      const leftImpurity = hyperparams.criterion === 'gini' ? calculateGini(leftDist) : calculateEntropy(leftDist);
      const rightImpurity = hyperparams.criterion === 'gini' ? calculateGini(rightDist) : calculateEntropy(rightDist);

      const weightedChildImpurity = (left.length / samples) * leftImpurity + (right.length / samples) * rightImpurity;
      const gain = impurity - weightedChildImpurity;

      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = fIndex;
        bestThreshold = threshold;
        bestLeftData = left;
        bestRightData = right;
      }
    }
  }

  // Si no se encontró corte viable respetando las restricciones de hoja
  if (bestFeature === -1 || bestGain <= 0.00001) {
    return {
      id,
      depth,
      isLeaf: true,
      featureIndex: -1,
      threshold: 0,
      impurity: Math.round(impurity * 1000) / 1000,
      impurityName,
      samples,
      distribution,
      prediction,
      predictionLabel,
    };
  }

  // Creación recursiva de ramas izquierda y derecha
  const leftChild = buildClassificationTree(
    bestLeftData,
    hyperparams,
    featureNames,
    classLabels,
    depth + 1,
    maxFeatures
  );
  const rightChild = buildClassificationTree(
    bestRightData,
    hyperparams,
    featureNames,
    classLabels,
    depth + 1,
    maxFeatures
  );

  return {
    id,
    depth,
    isLeaf: false,
    featureIndex: bestFeature,
    featureName: featureNames[bestFeature],
    threshold: Math.round(bestThreshold * 100) / 100,
    impurity: Math.round(impurity * 1000) / 1000,
    impurityName,
    samples,
    distribution,
    prediction,
    predictionLabel,
    left: leftChild,
    right: rightChild,
  };
}

/**
 * Predice la clase y retorna la ruta de nodos visitados
 */
export function predictClassificationWithTrace(
  root: TreeNode,
  point: { x: number; y: number }
): { prediction: number; probClass1: number; trace: string[] } {
  const trace: string[] = [];
  let curr: TreeNode | undefined = root;

  while (curr) {
    trace.push(curr.id);
    if (curr.isLeaf || !curr.left || !curr.right) {
      const dist = curr.distribution || [1, 0];
      const total = dist[0] + dist[1];
      const p1 = total > 0 ? dist[1] / total : curr.prediction;
      return {
        prediction: curr.prediction,
        probClass1: p1,
        trace,
      };
    }

    const val = curr.featureIndex === 0 ? point.x : point.y;
    if (val <= curr.threshold) {
      curr = curr.left;
    } else {
      curr = curr.right;
    }
  }

  return { prediction: 0, probClass1: 0, trace };
}

/**
 * Entrena un Árbol de Regresión
 */
export function buildRegressionTree(
  data: Point2D[],
  hyperparams: RegressionHyperparameters,
  featureName: string,
  targetName: string,
  depth: number = 0
): TreeNode {
  if (depth === 0) {
    nodeCounter = 0;
  }
  const id = `reg_node_${++nodeCounter}`;
  const samples = data.length;
  const yValues = data.map(d => d.target ?? d.y);

  // Predicción en este nodo: Media (para MSE) o Mediana (para MAE)
  const prediction = hyperparams.criterion === 'mse' ? calculateMean(yValues) : calculateMedian(yValues);
  const impurity = hyperparams.criterion === 'mse' ? calculateMSE(yValues) : calculateMAE(yValues);
  const impurityName = hyperparams.criterion === 'mse' ? 'MSE' : 'MAE';

  const reachedMaxDepth = depth >= hyperparams.maxDepth;
  const cannotSplitSamples = samples < hyperparams.minSamplesSplit;
  const varianceZero = impurity < 0.0001;

  if (reachedMaxDepth || cannotSplitSamples || varianceZero) {
    return {
      id,
      depth,
      isLeaf: true,
      featureIndex: -1,
      threshold: 0,
      impurity: Math.round(impurity * 100) / 100,
      impurityName,
      samples,
      prediction: Math.round(prediction * 100) / 100,
      predictionLabel: `${Math.round(prediction * 100) / 100}`,
    };
  }

  // Búsqueda del mejor punto de corte en X
  const sortedX = [...new Set(data.map(d => d.x))].sort((a, b) => a - b);
  let bestThreshold = 0;
  let bestLoss = Infinity;
  let bestLeftData: Point2D[] = [];
  let bestRightData: Point2D[] = [];

  for (let i = 0; i < sortedX.length - 1; i++) {
    const threshold = (sortedX[i] + sortedX[i + 1]) / 2;
    const left = data.filter(d => d.x <= threshold);
    const right = data.filter(d => d.x > threshold);

    if (left.length < hyperparams.minSamplesLeaf || right.length < hyperparams.minSamplesLeaf) {
      continue;
    }

    const leftY = left.map(d => d.target ?? d.y);
    const rightY = right.map(d => d.target ?? d.y);

    const leftLoss = hyperparams.criterion === 'mse' ? calculateMSE(leftY) : calculateMAE(leftY);
    const rightLoss = hyperparams.criterion === 'mse' ? calculateMSE(rightY) : calculateMAE(rightY);

    const totalWeightedLoss = (left.length / samples) * leftLoss + (right.length / samples) * rightLoss;

    if (totalWeightedLoss < bestLoss) {
      bestLoss = totalWeightedLoss;
      bestThreshold = threshold;
      bestLeftData = left;
      bestRightData = right;
    }
  }

  if (bestLoss >= impurity || bestLeftData.length === 0 || bestRightData.length === 0) {
    return {
      id,
      depth,
      isLeaf: true,
      featureIndex: -1,
      threshold: 0,
      impurity: Math.round(impurity * 100) / 100,
      impurityName,
      samples,
      prediction: Math.round(prediction * 100) / 100,
      predictionLabel: `${Math.round(prediction * 100) / 100}`,
    };
  }

  const leftChild = buildRegressionTree(bestLeftData, hyperparams, featureName, targetName, depth + 1);
  const rightChild = buildRegressionTree(bestRightData, hyperparams, featureName, targetName, depth + 1);

  return {
    id,
    depth,
    isLeaf: false,
    featureIndex: 0,
    featureName,
    threshold: Math.round(bestThreshold * 100) / 100,
    impurity: Math.round(impurity * 100) / 100,
    impurityName,
    samples,
    prediction: Math.round(prediction * 100) / 100,
    predictionLabel: `${Math.round(prediction * 100) / 100}`,
    left: leftChild,
    right: rightChild,
  };
}

/**
 * Predice valor continuo en árbol de regresión
 */
export function predictRegressionWithTrace(
  root: TreeNode,
  x: number
): { prediction: number; trace: string[] } {
  const trace: string[] = [];
  let curr: TreeNode | undefined = root;

  while (curr) {
    trace.push(curr.id);
    if (curr.isLeaf || !curr.left || !curr.right) {
      return { prediction: curr.prediction, trace };
    }
    if (x <= curr.threshold) {
      curr = curr.left;
    } else {
      curr = curr.right;
    }
  }
  return { prediction: 0, trace };
}

/**
 * Estructura de un Bosque Aleatorio (Random Forest)
 */
export interface RandomForestModel {
  trees: { id: number; tree: TreeNode; oobScore?: number }[];
  predict: (point: { x: number; y: number }) => {
    prediction: number;
    votes: number[];
    probability: number;
  };
}

export function buildRandomForest(
  trainData: Point2D[],
  hyperparams: RandomForestHyperparameters,
  featureNames: [string, string],
  classLabels: [string, string]
): RandomForestModel {
  const trees: { id: number; tree: TreeNode; oobScore?: number }[] = [];
  const baseHp: ClassificationHyperparameters = {
    maxDepth: hyperparams.maxDepth,
    minSamplesSplit: hyperparams.minSamplesSplit,
    minSamplesLeaf: hyperparams.minSamplesLeaf,
    criterion: 'gini',
  };

  const featureSubsample = hyperparams.maxFeatures === 'all' ? 'all' : 1;

  for (let i = 0; i < hyperparams.nEstimators; i++) {
    const rng = seededRandom(i * 17 + 73);
    const sample = hyperparams.bootstrap ? bootstrapSample(trainData, rng) : [...trainData];
    const tree = buildClassificationTree(
      sample,
      baseHp,
      featureNames,
      classLabels,
      0,
      featureSubsample
    );
    trees.push({ id: i + 1, tree });
  }

  const predict = (point: { x: number; y: number }) => {
    let votes0 = 0;
    let votes1 = 0;
    for (const item of trees) {
      const { prediction } = predictClassificationWithTrace(item.tree, point);
      if (prediction === 1) votes1++;
      else votes0++;
    }
    const total = votes0 + votes1;
    const prob1 = total > 0 ? votes1 / total : 0;
    return {
      prediction: votes1 >= votes0 ? 1 : 0,
      votes: [votes0, votes1],
      probability: prob1,
    };
  };

  return { trees, predict };
}

/**
 * Cuenta profundidad real y hojas del árbol
 */
export function getTreeStats(node: TreeNode): { maxDepth: number; leafCount: number } {
  if (node.isLeaf || (!node.left && !node.right)) {
    return { maxDepth: node.depth, leafCount: 1 };
  }
  const leftStats = node.left ? getTreeStats(node.left) : { maxDepth: node.depth, leafCount: 0 };
  const rightStats = node.right ? getTreeStats(node.right) : { maxDepth: node.depth, leafCount: 0 };

  return {
    maxDepth: Math.max(leftStats.maxDepth, rightStats.maxDepth),
    leafCount: leftStats.leafCount + rightStats.leafCount,
  };
}

/**
 * Evalúa métricas y diagnostica Sobreajuste vs Bajo Ajuste
 */
export function evaluateClassification(
  tree: TreeNode,
  trainData: Point2D[],
  testData: Point2D[]
): EvaluationMetrics {
  let trainCorrect = 0;
  for (const pt of trainData) {
    const { prediction } = predictClassificationWithTrace(tree, pt);
    if (prediction === pt.label) trainCorrect++;
  }
  const trainScore = Math.round((trainCorrect / trainData.length) * 1000) / 10;

  let testCorrect = 0;
  for (const pt of testData) {
    const { prediction } = predictClassificationWithTrace(tree, pt);
    if (prediction === pt.label) testCorrect++;
  }
  const testScore = Math.round((testCorrect / testData.length) * 1000) / 10;

  const stats = getTreeStats(tree);

  // Diagnóstico pedagógico
  let overfittingStatus: 'underfitting' | 'optimal' | 'overfitting' = 'optimal';
  let overfittingExplanation = '';

  const gap = trainScore - testScore;

  if (trainScore < 75 && testScore < 75) {
    overfittingStatus = 'underfitting';
    overfittingExplanation = 'Bajo Ajuste (Alto Sesgo): El árbol es demasiado superficial o simple (poca profundidad) y no logra capturar el patrón básico de los datos.';
  } else if (gap > 14 && trainScore >= 95) {
    overfittingStatus = 'overfitting';
    overfittingExplanation = 'Sobreajuste (Alta Varianza): El árbol memorizó el ruido y puntos atípicos del set de entrenamiento, perdiendo capacidad de generalización en datos nuevos.';
  } else {
    overfittingStatus = 'optimal';
    overfittingExplanation = 'Zona Óptima: Buen balance entre sesgo y varianza. El modelo generaliza adecuadamente tanto en entrenamiento como en prueba.';
  }

  return {
    trainScore,
    testScore,
    scoreLabel: 'Precisión (Accuracy %)',
    overfittingStatus,
    overfittingExplanation,
    treeDepth: stats.maxDepth,
    leafCount: stats.leafCount,
  };
}

export function evaluateRegression(
  tree: TreeNode,
  trainData: Point2D[],
  testData: Point2D[]
): EvaluationMetrics {
  const trainErrors = trainData.map(pt => {
    const { prediction } = predictRegressionWithTrace(tree, pt.x);
    return Math.pow((pt.target ?? pt.y) - prediction, 2);
  });
  const trainMse = Math.round(calculateMean(trainErrors) * 10) / 10;

  const testErrors = testData.map(pt => {
    const { prediction } = predictRegressionWithTrace(tree, pt.x);
    return Math.pow((pt.target ?? pt.y) - prediction, 2);
  });
  const testMse = Math.round(calculateMean(testErrors) * 10) / 10;

  const stats = getTreeStats(tree);

  let overfittingStatus: 'underfitting' | 'optimal' | 'overfitting' = 'optimal';
  let overfittingExplanation = '';

  if (trainMse > 100 && testMse > 100) {
    overfittingStatus = 'underfitting';
    overfittingExplanation = 'Bajo Ajuste: El árbol tiene muy pocos cortes y predice valores constantes demasiado amplios con alto error.';
  } else if (testMse > trainMse * 2.2 && trainMse < 20) {
    overfittingStatus = 'overfitting';
    overfittingExplanation = 'Sobreajuste: El árbol se dividió hasta aislar puntos individuales (ruido), disparando el error en datos nuevos.';
  } else {
    overfittingStatus = 'optimal';
    overfittingExplanation = 'Zona Óptima: Aproximación en escalones equilibrada con buen error de generalización.';
  }

  return {
    trainScore: trainMse,
    testScore: testMse,
    scoreLabel: 'Error Cuadrático Medio (MSE)',
    overfittingStatus,
    overfittingExplanation,
    treeDepth: stats.maxDepth,
    leafCount: stats.leafCount,
  };
}

/**
 * Asigna coordenadas espaciales a los nodos del árbol para renderizado SVG
 */
export function assignTreeCoordinates(root: TreeNode, width: number = 800, height: number = 420): void {
  function getSubtreeWidth(node?: TreeNode): number {
    if (!node) return 0;
    if (node.isLeaf || (!node.left && !node.right)) return 1;
    return getSubtreeWidth(node.left) + getSubtreeWidth(node.right);
  }

  const totalLeaves = Math.max(1, getSubtreeWidth(root));
  let currentLeafIndex = 0;

  function setCoordinates(node?: TreeNode, depth: number = 0): void {
    if (!node) return;

    const yPos = 40 + depth * 75;

    if (node.isLeaf || (!node.left && !node.right)) {
      const xPos = ((currentLeafIndex + 0.5) / totalLeaves) * width;
      currentLeafIndex++;
      node.x = xPos;
      node.y = yPos;
      return;
    }

    setCoordinates(node.left, depth + 1);
    setCoordinates(node.right, depth + 1);

    const leftX = node.left?.x ?? 0;
    const rightX = node.right?.x ?? width;
    node.x = (leftX + rightX) / 2;
    node.y = yPos;
  }

  setCoordinates(root, 0);
}
