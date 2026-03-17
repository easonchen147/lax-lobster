import { describe, expect, it } from 'vitest';
import difficultyConfig from '../src/config/DifficultyConfig.json';
import { DifficultyManager } from '../src/systems/DifficultyManager';

describe('DifficultyManager', () => {
  it('按离散阶梯返回难度参数', () => {
    const manager = new DifficultyManager(difficultyConfig.stages);

    expect(manager.getCurrentStage(0).scrollSpeed).toBe(5.2);
    expect(manager.getCurrentStage(130).gapSize).toBe(115);
    expect(manager.getCurrentStage(260).predatorChance).toBe(0.07);
    expect(manager.getCurrentStage(9999).maxPredatorsOnScreen).toBe(1);
  });

  it('稀有道具冷却距离未到时不能再次刷新', () => {
    const manager = new DifficultyManager(difficultyConfig.stages);

    expect(manager.canSpawnRarePowerUp(1350)).toBe(true);
    expect(manager.canSpawnRarePowerUp(2000)).toBe(false);
    expect(manager.canSpawnRarePowerUp(2700)).toBe(true);
  });
});
