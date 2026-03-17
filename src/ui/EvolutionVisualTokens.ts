import { UI_THEME } from '@/ui/UiTheme';

type EvolutionVisualState = {
  stageColor: number;
  unlocked: boolean;
  selected: boolean;
};

export const resolveEvolutionCardVisualTokens = ({
  stageColor,
  unlocked,
  selected,
}: EvolutionVisualState) => ({
  stageColor,
  frameColor: selected ? UI_THEME.colors.accentGold : unlocked ? UI_THEME.colors.border : UI_THEME.colors.borderSoft,
  frameDetailColor: selected ? 0xffe7a6 : UI_THEME.colors.borderSoft,
  selectedRailColor: selected
    ? UI_THEME.colors.accentGold
    : unlocked
      ? UI_THEME.colors.accentTeal
      : UI_THEME.colors.borderSoft,
  titleRuleColor: selected ? UI_THEME.colors.accentGold : UI_THEME.colors.borderSoft,
  orbitColor: selected ? UI_THEME.colors.accentGold : unlocked ? UI_THEME.colors.borderSoft : 0x57738f,
  progressColor: selected
    ? UI_THEME.colors.accentGold
    : unlocked
      ? UI_THEME.colors.accentTeal
      : UI_THEME.colors.borderSoft,
  contentGlowColor: selected ? UI_THEME.colors.accentGold : unlocked ? UI_THEME.colors.accentTeal : UI_THEME.colors.borderSoft,
  artInnerStrokeColor: selected ? 0xffe7a6 : unlocked ? UI_THEME.colors.borderSoft : 0x57738f,
  stageChipStrokeColor: selected ? 0xffe7a6 : UI_THEME.colors.borderSoft,
  stageChipFillColor: selected ? UI_THEME.colors.accentGold : 0x12324e,
  avatarGlowColor: selected ? UI_THEME.colors.accentGold : unlocked ? UI_THEME.colors.accentTeal : UI_THEME.colors.borderSoft,
});

export const resolveEvolutionSummaryVisualTokens = (stageColor: number) => ({
  stageColor,
  frameColor: UI_THEME.colors.border,
  frameDetailColor: UI_THEME.colors.borderSoft,
  accentLineColor: UI_THEME.colors.borderSoft,
  dividerColor: UI_THEME.colors.borderSoft,
  orbitColor: UI_THEME.colors.border,
  metricRailColor: UI_THEME.colors.borderSoft,
  gridColor: UI_THEME.colors.borderSoft,
  highlightColor: UI_THEME.colors.accentTeal,
  selectionColor: UI_THEME.colors.accentGold,
  haloColor: UI_THEME.colors.accentTeal,
  auraColor: UI_THEME.colors.accentTeal,
  pedestalStrokeColor: UI_THEME.colors.borderSoft,
});
