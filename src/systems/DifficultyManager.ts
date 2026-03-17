export type DifficultyStage = {
  minScore: number;
  scrollSpeed: number;
  gapSize: number;
  obstacleSpacing: number;
  predatorChance: number;
  maxPredatorsOnScreen: number;
};

import defaultDifficultyConfig from '@/config/DifficultyConfig.json';

export class DifficultyManager {
  private lastRarePowerUpDistance = 0;

  constructor(private readonly stages: DifficultyStage[] = defaultDifficultyConfig.stages as DifficultyStage[]) {}

  getCurrentStage(score: number): DifficultyStage {
    const normalizedScore = Math.max(0, score);
    return [...this.stages].reverse().find((stage) => normalizedScore >= stage.minScore) ?? this.stages[0];
  }

  getCurrentParameters(score: number, slowMultiplier = 1): DifficultyStage {
    const stage = this.getCurrentStage(score);
    return {
      ...stage,
      scrollSpeed: Number((stage.scrollSpeed * slowMultiplier).toFixed(2)),
    };
  }

  getDifficulty(score: number, slowMultiplier = 1): DifficultyStage {
    return this.getCurrentParameters(score, slowMultiplier);
  }

  canSpawnRarePowerUp(distanceTraveled: number, cooldownDistance = 1350): boolean {
    if (distanceTraveled - this.lastRarePowerUpDistance < cooldownDistance) {
      return false;
    }

    this.lastRarePowerUpDistance = distanceTraveled;
    return true;
  }
}
