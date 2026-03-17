import { describe, expect, it } from 'vitest';

import evolutionConfig from '@/config/LobsterEvolution.json';
import { resolveLobsterDisplaySize } from '@/entities/Lobster';
import { HUD_LAYOUT } from '@/ui/HUD';
import { TIMINGS } from '@/utils/Constants';

describe('HUD and lobster refinement', () => {
  it('keeps shield and revive cards visually separated', () => {
    const shieldBottom = HUD_LAYOUT.shieldCard.y + HUD_LAYOUT.shieldCard.height / 2;
    const reviveTop = HUD_LAYOUT.reviveCard.y - HUD_LAYOUT.reviveCard.height / 2;

    expect(reviveTop - shieldBottom).toBeGreaterThanOrEqual(12);
  });

  it('uses a 2 second invincibility window after shield break', () => {
    expect(TIMINGS.SHIELD_INVINCIBLE_MS).toBe(2000);
  });

  it('grows lobster display size across evolution stages', () => {
    const stages = evolutionConfig.stages as Array<{ id: number; displayScale: number }>;
    const scales = stages.map((stage) => stage.displayScale);

    expect(scales[0]).toBe(1);
    scales.slice(1).forEach((scale, index) => {
      expect(scale).toBeGreaterThan(scales[index]);
    });

    const baseSize = resolveLobsterDisplaySize(scales[0]);
    const maxSize = resolveLobsterDisplaySize(scales[scales.length - 1]);

    expect(maxSize.width).toBeGreaterThan(baseSize.width);
    expect(maxSize.height).toBeGreaterThan(baseSize.height);
  });
});
