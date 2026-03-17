export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const lerp = (from: number, to: number, alpha: number): number => {
  return from + (to - from) * alpha;
};

export const randomFloat = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(randomFloat(min, max + 1));
};

export const chance = (probability: number): boolean => {
  return Math.random() < probability;
};

export const pickWeighted = <T extends { weight: number }>(items: T[]): T => {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const threshold = Math.random() * totalWeight;
  let cursor = 0;

  for (const item of items) {
    cursor += item.weight;
    if (threshold <= cursor) {
      return item;
    }
  }

  return items[items.length - 1];
};

export const scaleByDelta = (valuePerFrame: number, delta: number): number => {
  return valuePerFrame * (delta / 16.6667);
};
