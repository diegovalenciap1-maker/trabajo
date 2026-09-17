export interface Point2D {
  id: string;
  x: number; // Feature 1 (e.g., Ancho, Horas de estudio, etc.)
  y: number; // Feature 2 or Target value
  label?: number; // 0, 1 (Classification target)
  target?: number; // Continuous value (Regression target)
}

export interface DatasetMeta {
  name: string;
  description: string;
  featureNames: [string, string];
  targetName: string;
  classLabels?: string[];
  type: 'classification' | 'regression';
}

export interface TreeNode {
  id: string;
  depth: number;
  isLeaf: boolean;
  featureIndex: number; // 0 for feature 1 (x), 1 for feature 2 (y)
  featureName?: string;
  threshold: number;
  impurity: number; // Gini, Entropy, or MSE/MAE
  impurityName: string;
  samples: number;
  distribution?: number[]; // [countClass0, countClass1, ...]
  prediction: number; // Class label or continuous predicted value
  predictionLabel?: string;
  left?: TreeNode;
  right?: TreeNode;
  // Layout coordinates for SVG rendering
  x?: number;
  y?: number;
  width?: number;
}

export interface ClassificationHyperparameters {
  maxDepth: number;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  criterion: 'gini' | 'entropy';
}

export interface RegressionHyperparameters {
  maxDepth: number;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  criterion: 'mse' | 'mae';
}

export interface RandomForestHyperparameters {
  nEstimators: number;
  maxDepth: number;
  minSamplesSplit: number;
  minSamplesLeaf: number;
  maxFeatures: 'all' | 'sqrt' | 1;
  bootstrap: boolean;
}

export interface EvaluationMetrics {
  trainScore: number; // Accuracy (%) or R² / MSE
  testScore: number;
  scoreLabel: string;
  overfittingStatus: 'underfitting' | 'optimal' | 'overfitting';
  overfittingExplanation: string;
  treeDepth: number;
  leafCount: number;
}

export type AppTab = 'classification' | 'regression' | 'random_forest' | 'hyperparameters_lab';
