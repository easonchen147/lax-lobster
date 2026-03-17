import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_PLAYER_DATA,
  PLAYER_DATA_KEY,
  StorageManager,
} from '../src/data/StorageManager';

describe('StorageManager', () => {
  beforeEach(() => {
    localStorage.clear();
    StorageManager.resetForTests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('保存后可以正确读取玩家数据', () => {
    const next = {
      ...DEFAULT_PLAYER_DATA,
      highScore: 256,
      coins: 99,
      unlockedStages: [0, 1, 2],
      currentStage: 2,
      lastRunScore: 144,
    };

    const saved = StorageManager.savePlayerData(next);
    const loaded = StorageManager.loadPlayerData();

    expect(saved).toBe(true);
    expect(loaded).toEqual(next);
    expect(StorageManager.isDegraded()).toBe(false);
  });

  it('LocalStorage 写入失败时自动降级到内存模式', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const next = {
      ...DEFAULT_PLAYER_DATA,
      highScore: 512,
    };

    const saved = StorageManager.savePlayerData(next);
    const loaded = StorageManager.loadPlayerData();

    expect(saved).toBe(false);
    expect(StorageManager.isDegraded()).toBe(true);
    expect(loaded.highScore).toBe(512);
  });

  it('当 LocalStorage 恢复可用时会自动退出降级模式并持久化内存数据', () => {
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementationOnce(() => {
        throw new Error('QuotaExceededError');
      })
      .mockImplementation(() => undefined);

    const degradedData = {
      ...DEFAULT_PLAYER_DATA,
      highScore: 777,
      coins: 123,
    };

    StorageManager.savePlayerData(degradedData);
    const recovered = StorageManager.savePlayerData({
      ...degradedData,
      highScore: 888,
    });

    expect(recovered).toBe(true);
    expect(StorageManager.isDegraded()).toBe(false);
    expect(StorageManager.loadPlayerData().highScore).toBe(888);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('损坏数据会回退到默认值', () => {
    localStorage.setItem(PLAYER_DATA_KEY, '{not-valid-json');

    const loaded = StorageManager.loadPlayerData();

    expect(loaded).toEqual(DEFAULT_PLAYER_DATA);
  });

  it('旧版本数据会执行迁移', () => {
    localStorage.setItem(
      PLAYER_DATA_KEY,
      JSON.stringify({
        version: 0,
        highScore: 123,
        coins: 4,
        unlockedStages: [0, 1],
      }),
    );

    const loaded = StorageManager.loadPlayerData();

    expect(loaded.version).toBe(1);
    expect(loaded.highScore).toBe(123);
    expect(loaded.currentStage).toBe(1);
    expect(loaded.totalGamesPlayed).toBe(0);
    expect(loaded.lastRunScore).toBe(0);
  });
});
