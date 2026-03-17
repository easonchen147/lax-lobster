import { LIMITS } from '@/utils/Constants';

type EventHandler = (...args: unknown[]) => void;

type GameStateEvents = {
  scoreChanged: [number];
  shieldChanged: [number];
  freeRevivesChanged: [number];
  currentStageChanged: [number];
  activeStageChanged: [number];
  unlockedStagesChanged: [number[]];
  storageDegradedChanged: [boolean];
};

class Emitter {
  private listeners = new Map<string, Set<EventHandler>>();

  on<T extends keyof GameStateEvents>(eventName: T, handler: (...args: GameStateEvents[T]) => void): this {
    const bucket = this.listeners.get(eventName as string) ?? new Set<EventHandler>();
    bucket.add(handler as EventHandler);
    this.listeners.set(eventName as string, bucket);
    return this;
  }

  off<T extends keyof GameStateEvents>(eventName: T, handler: (...args: GameStateEvents[T]) => void): this {
    this.listeners.get(eventName as string)?.delete(handler as EventHandler);
    return this;
  }

  protected emit<T extends keyof GameStateEvents>(eventName: T, ...args: GameStateEvents[T]): void {
    this.listeners.get(eventName as string)?.forEach((handler) => handler(...args));
  }
}

export class GameState extends Emitter {
  private static instance: GameState | null = null;
  private score = 0;
  private shieldCount = 0;
  private freeRevives = 0;
  private currentStage = 0;
  private activeStage = 0;
  private unlockedStages = [0];
  private storageDegraded = false;

  static getInstance(): GameState {
    if (!this.instance) {
      this.instance = new GameState();
    }

    return this.instance;
  }

  static resetInstance(): void {
    this.instance = new GameState();
  }

  getScore(): number {
    return this.score;
  }

  getShieldCount(): number {
    return this.shieldCount;
  }

  getFreeRevives(): number {
    return this.freeRevives;
  }

  getCurrentStage(): number {
    return this.currentStage;
  }

  getSelectedStage(): number {
    return this.currentStage;
  }

  getActiveStage(): number {
    return this.activeStage;
  }

  getUnlockedStages(): number[] {
    return [...this.unlockedStages];
  }

  isStorageDegraded(): boolean {
    return this.storageDegraded;
  }

  addScore(points: number): void {
    this.setScore(this.score + points);
  }

  setScore(score: number): void {
    this.score = Math.max(0, Math.floor(score));
    this.emit('scoreChanged', this.score);
  }

  setShieldCount(count: number): void {
    this.shieldCount = Math.max(0, Math.min(LIMITS.MAX_SHIELDS, Math.floor(count)));
    this.emit('shieldChanged', this.shieldCount);
  }

  addShield(): boolean {
    if (this.shieldCount >= LIMITS.MAX_SHIELDS) {
      return false;
    }

    this.setShieldCount(this.shieldCount + 1);
    return true;
  }

  consumeShield(): boolean {
    if (this.shieldCount <= 0) {
      return false;
    }

    this.setShieldCount(this.shieldCount - 1);
    return true;
  }

  setFreeRevives(count: number): void {
    this.freeRevives = Math.max(0, Math.floor(count));
    this.emit('freeRevivesChanged', this.freeRevives);
  }

  consumeFreeRevive(): boolean {
    if (this.freeRevives <= 0) {
      return false;
    }

    this.setFreeRevives(this.freeRevives - 1);
    return true;
  }

  setCurrentStage(stageId: number): void {
    this.currentStage = stageId;
    this.emit('currentStageChanged', this.currentStage);
  }

  setSelectedStage(stageId: number): void {
    this.setCurrentStage(stageId);
  }

  setActiveStage(stageId: number): void {
    this.activeStage = stageId;
    this.emit('activeStageChanged', this.activeStage);
  }

  unlockStage(stageId: number): void {
    if (this.unlockedStages.includes(stageId)) {
      return;
    }

    this.unlockedStages = [...this.unlockedStages, stageId].sort((left, right) => left - right);
    this.emit('unlockedStagesChanged', [...this.unlockedStages]);
  }

  setUnlockedStages(stageIds: number[]): void {
    this.unlockedStages = [...new Set(stageIds)].sort((left, right) => left - right);
    this.emit('unlockedStagesChanged', [...this.unlockedStages]);
  }

  setStorageDegraded(isDegraded: boolean): void {
    this.storageDegraded = isDegraded;
    this.emit('storageDegradedChanged', this.storageDegraded);
  }

  resetRunState(): void {
    this.setScore(0);
    this.setShieldCount(0);
    this.setFreeRevives(0);
    this.setActiveStage(this.currentStage);
  }

  resetRun(): void {
    this.resetRunState();
  }

  resetAll(): void {
    this.score = 0;
    this.shieldCount = 0;
    this.freeRevives = 0;
    this.currentStage = 0;
    this.activeStage = 0;
    this.unlockedStages = [0];
    this.storageDegraded = false;
  }
}