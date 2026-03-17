import { describe, expect, it } from 'vitest';

import { ScrollManager, resolvePowerUpSpawnY, resolveSpawnRules } from '@/systems/ScrollManager';

describe('ScrollManager', () => {
  it('连续两组安全通道偏移不超过 gapSize 的 60%', () => {
    const manager = new ScrollManager();
    const first = manager.generateObstacleGroup(120);
    const second = manager.generateObstacleGroup(120);

    expect(Math.abs(second.gapY - first.gapY)).toBeLessThanOrEqual(72);
  });

  it('稀有道具拾取后在冷却距离内不能再次生成', () => {
    const manager = new ScrollManager();
    manager.advance(5.2, 1000);
    manager.registerRarePickup('revivePearl');

    expect(manager.canSpawnRare('revivePearl', 1350)).toBe(false);

    manager.advance(30, 1000);
    manager.advance(30, 1000);

    expect(manager.canSpawnRare('revivePearl', 1350)).toBe(true);
  });

  it('开局保护期内不应立刻刷出高压障碍与捕食者', () => {
    const rules = resolveSpawnRules({
      difficulty: {
        minScore: 0,
        gapSize: 120,
        obstacleSpacing: 200,
        predatorChance: 0.2,
        maxPredatorsOnScreen: 1,
        scrollSpeed: 5.2,
      },
      elapsedMs: 1000,
    });

    expect(rules.allowObstacleSpawn).toBe(false);
    expect(rules.gapSize).toBeGreaterThan(120);
    expect(rules.obstacleSpacing).toBeGreaterThan(200);
    expect(rules.predatorChance).toBe(0);
    expect(rules.maxPredatorsOnScreen).toBe(0);
  });

  it('安全期结束后应恢复障碍，但前期仍禁用捕食者', () => {
    const rules = resolveSpawnRules({
      difficulty: {
        minScore: 0,
        gapSize: 120,
        obstacleSpacing: 200,
        predatorChance: 0.2,
        maxPredatorsOnScreen: 1,
        scrollSpeed: 5.2,
      },
      elapsedMs: 4200,
    });

    expect(rules.allowObstacleSpawn).toBe(true);
    expect(rules.gapSize).toBeGreaterThan(120);
    expect(rules.obstacleSpacing).toBeGreaterThan(200);
    expect(rules.predatorChance).toBe(0);
    expect(rules.maxPredatorsOnScreen).toBe(0);
  });

  it('保护期结束后应恢复正常生成强度', () => {
    const rules = resolveSpawnRules({
      difficulty: {
        minScore: 0,
        gapSize: 120,
        obstacleSpacing: 200,
        predatorChance: 0.2,
        maxPredatorsOnScreen: 1,
        scrollSpeed: 5.2,
      },
      elapsedMs: 7000,
    });

    expect(rules.allowObstacleSpawn).toBe(true);
    expect(rules.gapSize).toBe(120);
    expect(rules.obstacleSpacing).toBe(200);
    expect(rules.predatorChance).toBe(0.2);
    expect(rules.maxPredatorsOnScreen).toBe(1);
  });

  it('掉落物应生成在安全通道内部', () => {
    const spawnY = resolvePowerUpSpawnY({
      gapY: 360,
      bottomY: 540,
    });

    expect(spawnY).toBe(450);
  });

  it('掉落物应向龙虾所在泳道轻微偏移，但不能跑出安全通道', () => {
    const spawnY = resolvePowerUpSpawnY({
      gapY: 360,
      bottomY: 540,
      lobsterY: 520,
    });

    expect(spawnY).toBeGreaterThan(450);
    expect(spawnY).toBeLessThanOrEqual(514);
  });
});

