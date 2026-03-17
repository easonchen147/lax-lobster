export const SCORE_PER_SECOND = 1;
export const SECONDS_PER_MINUTE = 60;

export const resolveScoreFromElapsedMs = (elapsedMs: number): number =>
  Math.max(0, Math.floor(elapsedMs / 1000) * SCORE_PER_SECOND);

export const getUnlockDurationSeconds = (unlockScore: number): number =>
  Math.max(0, Math.floor(unlockScore / SCORE_PER_SECOND));

export const formatUnlockDuration = (unlockScore: number): string => {
  const totalSeconds = getUnlockDurationSeconds(unlockScore);

  if (totalSeconds < SECONDS_PER_MINUTE) {
    return `约 ${totalSeconds} 秒`;
  }

  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;

  if (seconds === 0) {
    return `约 ${minutes} 分钟`;
  }

  return `约 ${minutes} 分 ${seconds} 秒`;
};
