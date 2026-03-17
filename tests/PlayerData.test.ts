import { describe, expect, it } from 'vitest';
import { getDefaultPlayerData, sanitizePlayerData } from '@/data/PlayerData';

describe('PlayerData', () => {
  it('返回默认玩家数据', () => {
    expect(getDefaultPlayerData()).toEqual({
      version: 1,
      highScore: 0,
      coins: 0,
      unlockedStages: [0],
      currentStage: 0,
      totalGamesPlayed: 0,
      lastRunScore: 0,
    });
  });

  it('清洗非法数据并保留可用字段', () => {
    expect(
      sanitizePlayerData({
        highScore: 220,
        coins: -1,
        unlockedStages: [0, 2, 2, -3],
        currentStage: 8,
        totalGamesPlayed: 4,
        lastRunScore: 63,
      }),
    ).toEqual({
      version: 1,
      highScore: 220,
      coins: 0,
      unlockedStages: [0, 2],
      currentStage: 2,
      totalGamesPlayed: 4,
      lastRunScore: 63,
    });
  });

  it('会拦截 Infinity 这类异常数值', () => {
    expect(
      sanitizePlayerData({
        highScore: Number.POSITIVE_INFINITY,
        coins: Number.POSITIVE_INFINITY,
        totalGamesPlayed: Number.POSITIVE_INFINITY,
        lastRunScore: Number.POSITIVE_INFINITY,
      }),
    ).toEqual(getDefaultPlayerData());
  });
});