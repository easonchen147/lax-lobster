import { describe, expect, it } from 'vitest';

import evolutionConfig from '@/config/LobsterEvolution.json';
import { formatUnlockDuration, resolveScoreFromElapsedMs } from '@/utils/Progression';

describe('Progression', () => {
  it('按生存整秒累计分数，避免分数暴涨', () => {
    expect(resolveScoreFromElapsedMs(0)).toBe(0);
    expect(resolveScoreFromElapsedMs(59_999)).toBe(59);
    expect(resolveScoreFromElapsedMs(60_000)).toBe(60);
    expect(resolveScoreFromElapsedMs(299_999)).toBe(299);
    expect(resolveScoreFromElapsedMs(300_000)).toBe(300);
  });

  it('龙虾阶段阈值按分钟级生存时长配置', () => {
    const stages = evolutionConfig.stages as Array<{ id: number; unlockScore: number }>;

    expect(stages.map((stage) => stage.unlockScore)).toEqual([0, 300, 900, 2100, 3900, 6300, 9300, 12900]);
  });

  it('将解锁分数格式化为更直观的时长文案', () => {
    expect(formatUnlockDuration(300)).toBe('约 5 分钟');
    expect(formatUnlockDuration(1200)).toBe('约 20 分钟');
    expect(formatUnlockDuration(125)).toBe('约 2 分 5 秒');
  });
});
