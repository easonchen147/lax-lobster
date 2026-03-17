export const UI_THEME = {
  colors: {
    oceanTop: 0x041a2f,
    oceanMid: 0x083b67,
    oceanBottom: 0x0e5f96,
    surface: 0x0b2540,
    surfaceAlt: 0x10385a,
    surfaceDark: 0x061a2d,
    surfaceMuted: 0x29415e,
    border: 0x9bd4ff,
    borderSoft: 0x5ca7d8,
    accentGold: 0xffc857,
    accentTeal: 0x64dfdf,
    accentCoral: 0xff7b54,
    danger: 0xff5d73,
    success: 0x64dfdf,
    warning: 0xffc857,
    shadow: 0x020c16,
    textPrimary: '#f4f8ff',
    textSecondary: '#bfd7e8',
    textMuted: '#8fb5cf',
    textStrong: '#17324a',
    textDanger: '#ffd9df',
  },
  fonts: {
    display: 'Fredoka, Trebuchet MS, Arial Rounded MT Bold, Microsoft YaHei, sans-serif',
    body: 'Nunito, Segoe UI, Microsoft YaHei, sans-serif',
  },
  radii: {
    md: 20,
    lg: 28,
    xl: 36,
    pill: 28,
  },
  depths: {
    backdrop: -50,
    decor: -20,
    surface: 10,
    hud: 40,
    toast: 60,
    modal: 100,
  },
} as const;

export const formatUiNumber = (value: number): string => new Intl.NumberFormat('zh-CN').format(value);

export const getStageTextureKey = (stageId: number): string => `lobster-stage-${stageId}`;

export const getRemainingUnlockScore = (unlockScore: number, currentScore: number): number =>
  Math.max(0, unlockScore - currentScore);
