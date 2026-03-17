import evolutionConfig from '@/config/LobsterEvolution.json';

export type LobsterStage = {
  id: number;
  name: string;
  unlockScore: number;
  speedBonus: number;
  shieldCount: number;
  freeRevives: number;
  color: number;
  collisionScale: number;
  displayScale: number;
};

export class EvolutionManager {
  private readonly stages: LobsterStage[];

  constructor(stages: LobsterStage[] = evolutionConfig.stages as LobsterStage[]) {
    this.stages = stages;
  }

  getStages(): LobsterStage[] {
    return this.stages;
  }

  getStage(stageId: number): LobsterStage {
    return this.stages.find((stage) => stage.id === stageId) ?? this.stages[0];
  }

  getHighestUnlockedByScore(score: number): LobsterStage {
    return [...this.stages].reverse().find((stage) => score >= stage.unlockScore) ?? this.stages[0];
  }

  getNewlyUnlockedStageIds(score: number, unlockedStages: number[]): number[] {
    return this.stages
      .filter((stage) => score >= stage.unlockScore && !unlockedStages.includes(stage.id))
      .map((stage) => stage.id);
  }

  resolveActiveStage(score: number, selectedStageId: number): LobsterStage {
    const highestStage = this.getHighestUnlockedByScore(score);
    return highestStage.id > selectedStageId ? highestStage : this.getStage(selectedStageId);
  }
}
