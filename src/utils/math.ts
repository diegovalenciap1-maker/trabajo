export function calculateGini(distribution: number[]): number {
  const total = distribution.reduce((acc, v) => acc + v, 0);
  if (total === 0) return 0;
  let sumSquares = 0;
  for (const count of distribution) {
    const p = count / total;
    sumSquares += p * p;
  }
  return 1 - sumSquares;
}

export function calculateEntropy(distribution: number[]): number {
  const total = distribution.reduce((acc, v) => acc + v, 0);
  if (total === 0) return 0;
  let entropy = 0;
  for (const count of distribution) {
    if (count > 0) {
      const p = count / total;
      entropy -= p * Math.log2(p);
    }
  }
  return entropy;
}

export function calculateMSE(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const sumSqDiff = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0);
  return sumSqDiff / values.length;
}

export function calculateMAE(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const sumAbsDiff = values.reduce((sum, v) => sum + Math.abs(v - median), 0);
  return sumAbsDiff / values.length;
}

export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

// Pseudo-random deterministic generator for repeatable pedagogical datasets
export function seededRandom(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function bootstrapSample<T>(items: T[], rng: () => number = Math.random): T[] {
  const n = items.length;
  const sample: T[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * n);
    sample.push(items[idx]);
  }
  return sample;
}
