import { describe, expect, it } from 'vitest';

import {
  resolveEvolutionCardVisualTokens,
  resolveEvolutionSummaryVisualTokens,
} from '@/ui/EvolutionVisualTokens';
import { UI_THEME } from '@/ui/UiTheme';

describe('EvolutionCard visual tokens', () => {
  it('does not use stage red as structural frame color for unlocked cards', () => {
    const tokens = resolveEvolutionCardVisualTokens({
      stageColor: UI_THEME.colors.accentCoral,
      unlocked: true,
      selected: false,
    });

    expect(tokens.frameColor).not.toBe(UI_THEME.colors.accentCoral);
    expect(tokens.frameDetailColor).toBe(UI_THEME.colors.borderSoft);
    expect(tokens.selectedRailColor).not.toBe(UI_THEME.colors.accentCoral);
    expect(tokens.titleRuleColor).not.toBe(UI_THEME.colors.accentCoral);
    expect(tokens.orbitColor).not.toBe(UI_THEME.colors.accentCoral);
    expect(tokens.progressColor).not.toBe(UI_THEME.colors.accentCoral);
    expect(tokens.contentGlowColor).toBe(UI_THEME.colors.accentTeal);
    expect(tokens.avatarGlowColor).toBe(UI_THEME.colors.accentTeal);
  });

  it('reserves gold emphasis for the selected card only', () => {
    const selected = resolveEvolutionCardVisualTokens({
      stageColor: UI_THEME.colors.accentCoral,
      unlocked: true,
      selected: true,
    });
    const normal = resolveEvolutionCardVisualTokens({
      stageColor: UI_THEME.colors.accentCoral,
      unlocked: true,
      selected: false,
    });

    expect(selected.selectedRailColor).toBe(UI_THEME.colors.accentGold);
    expect(selected.progressColor).toBe(UI_THEME.colors.accentGold);
    expect(normal.selectedRailColor).toBe(UI_THEME.colors.accentTeal);
  });

  it('does not use stage red as structural summary colors', () => {
    const tokens = resolveEvolutionSummaryVisualTokens(UI_THEME.colors.accentCoral);

    expect(tokens.frameColor).not.toBe(UI_THEME.colors.accentCoral);
    expect(tokens.frameDetailColor).toBe(UI_THEME.colors.borderSoft);
    expect(tokens.accentLineColor).not.toBe(UI_THEME.colors.accentCoral);
    expect(tokens.dividerColor).not.toBe(UI_THEME.colors.accentCoral);
    expect(tokens.orbitColor).not.toBe(UI_THEME.colors.accentCoral);
    expect(tokens.metricRailColor).not.toBe(UI_THEME.colors.accentCoral);
    expect(tokens.haloColor).toBe(UI_THEME.colors.accentTeal);
    expect(tokens.auraColor).toBe(UI_THEME.colors.accentTeal);
    expect(tokens.pedestalStrokeColor).toBe(UI_THEME.colors.borderSoft);
  });
});
