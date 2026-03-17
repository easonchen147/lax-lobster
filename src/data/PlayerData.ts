export interface PlayerData {
  version: number;
  highScore: number;
  coins: number;
  unlockedStages: number[];
  currentStage: number;
  totalGamesPlayed: number;
  lastRunScore: number;
}

export const PLAYER_DATA_VERSION = 1;
export const PLAYER_DATA_KEY = 'lax-lobster.player-data';

export const getDefaultPlayerData = (): PlayerData => ({
  version: PLAYER_DATA_VERSION,
  highScore: 0,
  coins: 0,
  unlockedStages: [0],
  currentStage: 0,
  totalGamesPlayed: 0,
  lastRunScore: 0,
});

export const createDefaultPlayerData = getDefaultPlayerData;

const isFiniteNonNegativeNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0;

export const sanitizePlayerData = (
  raw: Partial<PlayerData> | null | undefined,
): PlayerData => {
  const defaults = getDefaultPlayerData();
  const unlockedStages = Array.isArray(raw?.unlockedStages)
    ? [...new Set(raw.unlockedStages.filter((value): value is number => Number.isInteger(value) && value >= 0))].sort(
        (left, right) => left - right,
      )
    : defaults.unlockedStages;

  const normalizedUnlockedStages = unlockedStages.length > 0 ? unlockedStages : defaults.unlockedStages;
  const currentStage =
    typeof raw?.currentStage === 'number' && normalizedUnlockedStages.includes(raw.currentStage)
      ? raw.currentStage
      : normalizedUnlockedStages[normalizedUnlockedStages.length - 1] ?? defaults.currentStage;

  return {
    version: PLAYER_DATA_VERSION,
    highScore: isFiniteNonNegativeNumber(raw?.highScore) ? Math.floor(raw.highScore) : defaults.highScore,
    coins: isFiniteNonNegativeNumber(raw?.coins) ? Math.floor(raw.coins) : defaults.coins,
    unlockedStages: normalizedUnlockedStages,
    currentStage,
    totalGamesPlayed: isFiniteNonNegativeNumber(raw?.totalGamesPlayed)
      ? Math.floor(raw.totalGamesPlayed)
      : defaults.totalGamesPlayed,
    lastRunScore: isFiniteNonNegativeNumber(raw?.lastRunScore)
      ? Math.floor(raw.lastRunScore)
      : defaults.lastRunScore,
  };
};