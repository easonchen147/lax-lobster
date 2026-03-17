import { describe, expect, it, beforeEach } from 'vitest';
import { GameState } from '../src/data/GameState';

describe('GameState', () => {
  beforeEach(() => {
    GameState.resetInstance();
  });

  it('分数变化时会触发事件并累加得分', () => {
    const state = GameState.getInstance();
    const observed: number[] = [];

    state.on('scoreChanged', (score: number) => {
      observed.push(score);
    });

    state.addScore(10);
    state.addScore(20);

    expect(state.getScore()).toBe(30);
    expect(observed).toEqual([10, 30]);
  });

  it('重置局内状态时会保留当前形态但清空分数与资源', () => {
    const state = GameState.getInstance();
    state.setCurrentStage(3);
    state.setShieldCount(2);
    state.setFreeRevives(1);
    state.addScore(99);

    state.resetRunState();

    expect(state.getCurrentStage()).toBe(3);
    expect(state.getShieldCount()).toBe(0);
    expect(state.getFreeRevives()).toBe(0);
    expect(state.getScore()).toBe(0);
  });

  it('更新护盾和复活次数时会触发对应事件', () => {
    const state = GameState.getInstance();
    const shields: number[] = [];
    const revives: number[] = [];

    state.on('shieldChanged', (count: number) => shields.push(count));
    state.on('freeRevivesChanged', (count: number) => revives.push(count));

    state.setShieldCount(2);
    state.setFreeRevives(1);

    expect(shields).toEqual([2]);
    expect(revives).toEqual([1]);
  });
});
