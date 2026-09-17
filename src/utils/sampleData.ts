import { Point2D, DatasetMeta } from '../types';
import { seededRandom } from './math';

export interface DatasetItem {
  id: string;
  name: string;
  category: 'classification' | 'regression';
  meta: DatasetMeta;
  data: Point2D[];
  trainData: Point2D[];
  testData: Point2D[];
}

function splitTrainTest(data: Point2D[], ratio = 0.75): { train: Point2D[]; test: Point2D[] } {
  const train: Point2D[] = [];
  const test: Point2D[] = [];
  data.forEach((pt, i) => {
    if (i % 4 === 0) {
      test.push(pt);
    } else {
      train.push(pt);
    }
  });
  return { train, test };
}

export function generateClassificationDatasets(): DatasetItem[] {
  // 1. Diagnóstico Clínico (Glucosa vs Presión Arterial)
  const rng1 = seededRandom(42);
  const clinicalPoints: Point2D[] = [];
  
  // Healthy (0): lower glucose (70-115), normal pressure (60-85)
  for (let i = 0; i < 40; i++) {
    const x = 75 + rng1() * 45 + (rng1() - 0.5) * 10;
    const y = 65 + rng1() * 25 + (rng1() - 0.5) * 8;
    clinicalPoints.push({
      id: `c0_${i}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      label: 0,
    });
  }
  // Diabetic/Risk (1): higher glucose (110-190) or elevated pressure (80-110)
  for (let i = 0; i < 40; i++) {
    const x = 120 + rng1() * 65 + (rng1() - 0.5) * 15;
    const y = 75 + rng1() * 35 + (rng1() - 0.5) * 10;
    clinicalPoints.push({
      id: `c1_${i}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      label: 1,
    });
  }
  // Add 3 noisy points to demonstrate hyperparameter impact on outliers
  clinicalPoints.push({ id: 'noise_1', x: 80, y: 105, label: 1 });
  clinicalPoints.push({ id: 'noise_2', x: 165, y: 68, label: 0 });
  clinicalPoints.push({ id: 'noise_3', x: 105, y: 95, label: 1 });

  const clinicalSplit = splitTrainTest(clinicalPoints);

  // 2. Lunas No-Lineales (Moons)
  const rng2 = seededRandom(101);
  const moonPoints: Point2D[] = [];
  const nPerMoon = 35;
  for (let i = 0; i < nPerMoon; i++) {
    const theta = (Math.PI * i) / nPerMoon;
    // Top moon (label 0)
    moonPoints.push({
      id: `m0_${i}`,
      x: Math.round((Math.cos(theta) * 2 + (rng2() - 0.5) * 0.4) * 100) / 100,
      y: Math.round((Math.sin(theta) * 2 + (rng2() - 0.5) * 0.4) * 100) / 100,
      label: 0,
    });
    // Bottom inverted moon (label 1)
    moonPoints.push({
      id: `m1_${i}`,
      x: Math.round((1 - Math.cos(theta) * 2 + (rng2() - 0.5) * 0.4) * 100) / 100,
      y: Math.round((0.5 - Math.sin(theta) * 2 + (rng2() - 0.5) * 0.4) * 100) / 100,
      label: 1,
    });
  }
  const moonSplit = splitTrainTest(moonPoints);

  // 3. Círculos Concéntricos (Concentric)
  const rng3 = seededRandom(77);
  const circlePoints: Point2D[] = [];
  for (let i = 0; i < 35; i++) {
    const angle = (2 * Math.PI * i) / 35;
    const rInner = 1.0 + (rng3() - 0.5) * 0.5;
    circlePoints.push({
      id: `circ0_${i}`,
      x: Math.round((Math.cos(angle) * rInner) * 100) / 100,
      y: Math.round((Math.sin(angle) * rInner) * 100) / 100,
      label: 0,
    });
    const rOuter = 2.8 + (rng3() - 0.5) * 0.6;
    circlePoints.push({
      id: `circ1_${i}`,
      x: Math.round((Math.cos(angle) * rOuter) * 100) / 100,
      y: Math.round((Math.sin(angle) * rOuter) * 100) / 100,
      label: 1,
    });
  }
  const circleSplit = splitTrainTest(circlePoints);

  return [
    {
      id: 'clinical',
      name: 'Salud: Glucosa vs Presión',
      category: 'classification',
      meta: {
        name: 'Diagnóstico de Riesgo',
        description: 'Clasificación binaria entre Pacientes Sanos (Verde) y En Riesgo (Rojo) según biomarcadores.',
        featureNames: ['Nivel de Glucosa (mg/dL)', 'Presión Arterial (mmHg)'],
        targetName: 'Condición',
        classLabels: ['Sano / Normal', 'Riesgo / Diabetes'],
        type: 'classification',
      },
      data: clinicalPoints,
      trainData: clinicalSplit.train,
      testData: clinicalSplit.test,
    },
    {
      id: 'moons',
      name: 'Geometría: Dos Lunas Entrelazadas',
      category: 'classification',
      meta: {
        name: 'Lunas No Lineales',
        description: 'Patrón clásico de Machine Learning con fronteras curvas que un árbol aproxima en escalones.',
        featureNames: ['Coordenada X', 'Coordenada Y'],
        targetName: 'Grupo',
        classLabels: ['Luna Superior', 'Luna Inferior'],
        type: 'classification',
      },
      data: moonPoints,
      trainData: moonSplit.train,
      testData: moonSplit.test,
    },
    {
      id: 'circles',
      name: 'Centro vs Anillo Concéntrico',
      category: 'classification',
      meta: {
        name: 'Círculos Concéntricos',
        description: 'Un cluster central rodeado por un anillo exterior. Muestra cómo se requieren múltiples cortes ortogonales.',
        featureNames: ['Eje Horizontal X₁', 'Eje Vertical X₂'],
        targetName: 'Zona',
        classLabels: ['Núcleo Central', 'Anillo Perimetral'],
        type: 'classification',
      },
      data: circlePoints,
      trainData: circleSplit.train,
      testData: circleSplit.test,
    },
  ];
}

export function generateRegressionDatasets(): DatasetItem[] {
  // 1. Vivienda: Superficie (m²) vs Precio (Miles de USD)
  const rng1 = seededRandom(2025);
  const housePoints: Point2D[] = [];
  for (let i = 0; i < 50; i++) {
    const x = 40 + (i * 3.5) + (rng1() - 0.5) * 4;
    // Price roughly quadratic with plateau and realistic noise
    const basePrice = 50 + 1.2 * x + 0.005 * x * x;
    const noise = (rng1() - 0.5) * 40;
    const y = Math.max(30, basePrice + noise);
    housePoints.push({
      id: `h_${i}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      target: Math.round(y * 10) / 10,
    });
  }
  // Add 2 outliers to demonstrate sensitivity to noise vs min_samples_leaf
  housePoints.push({ id: 'h_out1', x: 95, y: 320, target: 320 });
  housePoints.push({ id: 'h_out2', x: 180, y: 140, target: 140 });

  const houseSplit = splitTrainTest(housePoints);

  // 2. Onda Sinusoidal No-Lineal con Ruido
  const rng2 = seededRandom(314);
  const sinePoints: Point2D[] = [];
  for (let i = 0; i < 55; i++) {
    const x = -3 + (i * 6) / 54;
    const cleanY = Math.sin(x) * 10 + Math.cos(x * 1.8) * 3;
    const noise = (rng2() - 0.5) * 3.5;
    const y = cleanY + noise;
    sinePoints.push({
      id: `s_${i}`,
      x: Math.round(x * 100) / 100,
      y: Math.round(y * 100) / 100,
      target: Math.round(y * 100) / 100,
    });
  }
  const sineSplit = splitTrainTest(sinePoints);

  // 3. Eficiencia Energética Térmica
  const rng3 = seededRandom(888);
  const tempPoints: Point2D[] = [];
  for (let i = 0; i < 48; i++) {
    const x = -5 + (i * 45) / 47; // Temperature from -5°C to 40°C
    // Ideal consumption around 21°C, increases on extremes
    const comfortDist = Math.abs(x - 21);
    const consumption = 15 + Math.pow(comfortDist, 1.4) * 0.8 + (rng3() - 0.5) * 8;
    tempPoints.push({
      id: `t_${i}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(consumption * 10) / 10,
      target: Math.round(consumption * 10) / 10,
    });
  }
  const tempSplit = splitTrainTest(tempPoints);

  return [
    {
      id: 'housing',
      name: 'Inmobiliaria: Superficie vs Precio',
      category: 'regression',
      meta: {
        name: 'Precio de Inmuebles',
        description: 'Relación continua entre metros cuadrados y precio de venta. Un árbol divide en rangos de superficie y predice el promedio.',
        featureNames: ['Superficie (m²)', 'Precio (Miles $)'],
        targetName: 'Precio estimado (Miles USD)',
        type: 'regression',
      },
      data: housePoints,
      trainData: houseSplit.train,
      testData: houseSplit.test,
    },
    {
      id: 'sine',
      name: 'Función Sinusoidal No Lineal (Con Ruido)',
      category: 'regression',
      meta: {
        name: 'Aproximación por Escalones',
        description: 'Demuestra cómo un árbol de regresión aproxima funciones onduladas dividiendo el eje X en intervalos constantes.',
        featureNames: ['Variable X', 'Variable Y'],
        targetName: 'Valor Y',
        type: 'regression',
      },
      data: sinePoints,
      trainData: sineSplit.train,
      testData: sineSplit.test,
    },
    {
      id: 'energy',
      name: 'Consumo Eléctrico vs Temperatura Ext.',
      category: 'regression',
      meta: {
        name: 'Consumo Climatización',
        description: 'Comportamiento en forma de U: aumenta con mucho frío o mucho calor.',
        featureNames: ['Temperatura Exterior (°C)', 'Consumo (kWh/día)'],
        targetName: 'Consumo kWh',
        type: 'regression',
      },
      data: tempPoints,
      trainData: tempSplit.train,
      testData: tempSplit.test,
    },
  ];
}
