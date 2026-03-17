import { describe, expect, it } from 'vitest';

import {
  resolveObstacleFatalBoundary,
  resolveObstacleFatalMarkerProfile,
  resolveObstacleFatalPulseProfile,
  resolveObstacleHazardProfile,
  resolveObstacleTextureDimensions,
  resolveObstacleWarningIntensity,
} from '@/visuals/DeepSeaVisuals';

describe('DeepSeaVisuals', () => {
  it('为大型障碍物生成接近实际尺寸的纹理，避免严重拉伸', () => {
    expect(resolveObstacleTextureDimensions(78, 412)).toEqual({
      width: 80,
      height: 408,
    });
  });

  it('为较小障碍物保留最低纹理尺寸，避免细节过少', () => {
    expect(resolveObstacleTextureDimensions(28, 72)).toEqual({
      width: 52,
      height: 120,
    });
  });

  it('会按障碍物尺寸缩放警示边厚度，避免大小失衡', () => {
    const small = resolveObstacleHazardProfile(52, 120);
    const large = resolveObstacleHazardProfile(124, 408);

    expect(small.outerStroke).toBeGreaterThanOrEqual(2);
    expect(large.outerStroke).toBeGreaterThan(small.outerStroke);
    expect(large.markerRadius).toBeGreaterThan(small.markerRadius);
  });

  it('会让更接近玩家的障碍物获得更强的呼吸发光强度', () => {
    const near = resolveObstacleWarningIntensity(16, 18, 180, 160);
    const mid = resolveObstacleWarningIntensity(92, 68, 180, 160);
    const far = resolveObstacleWarningIntensity(240, 220, 180, 160);

    expect(near).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(0);
    expect(far).toBe(0);
  });

  it('会把死亡阈值对齐到真实 hitbox 边界，而不是贴纹理边缘', () => {
    const coralTop = resolveObstacleFatalBoundary('coral', 80, 408, 'down');
    const coralBottom = resolveObstacleFatalBoundary('coral', 80, 408, 'up');
    const seaweedTop = resolveObstacleFatalBoundary('seaweed', 64, 300, 'down');

    expect(coralTop.y).toBeCloseTo(350.88, 2);
    expect(coralBottom.y).toBeCloseTo(57.12, 2);
    expect(coralTop.left).toBeCloseTo(15.2, 2);
    expect(coralTop.right).toBeCloseTo(64.8, 2);
    expect(seaweedTop.y).toBeCloseTo(267, 0);
  });

  it('会随障碍物尺寸放大顶点致命标识，保证大场景也能看清', () => {
    const small = resolveObstacleFatalMarkerProfile(52, 120);
    const large = resolveObstacleFatalMarkerProfile(124, 408);

    expect(large.haloWidth).toBeGreaterThan(small.haloWidth);
    expect(large.beaconRadius).toBeGreaterThan(small.beaconRadius);
    expect(large.chevronWidth).toBeGreaterThan(small.chevronWidth);
  });

  it('只在真正接近死线时激活中心致命信标脉冲', () => {
    const idle = resolveObstacleFatalPulseProfile(0.18, 0.4, 72, 220);
    const active = resolveObstacleFatalPulseProfile(0.84, 0.9, 72, 220);

    expect(idle.active).toBe(false);
    expect(active.active).toBe(true);
    expect(active.alpha).toBeGreaterThan(idle.alpha);
    expect(active.coreScale).toBeGreaterThan(1);
  });

  it('会随危险程度和节奏脉冲放大中心信标的引导范围', () => {
    const soft = resolveObstacleFatalPulseProfile(0.46, 0.2, 118, 180);
    const hard = resolveObstacleFatalPulseProfile(0.92, 1, 118, 180);

    expect(hard.haloWidth).toBeGreaterThan(soft.haloWidth);
    expect(hard.trailLength).toBeGreaterThan(soft.trailLength);
    expect(hard.trailWidth).toBeGreaterThanOrEqual(soft.trailWidth);
  });
});
