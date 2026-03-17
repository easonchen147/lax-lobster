import Phaser from 'phaser';
import obstacleConfig from '@/config/ObstacleConfig.json';
import powerUpConfig from '@/config/PowerUpConfig.json';
import { Lobster } from '@/entities/Lobster';
import { Coral } from '@/entities/obstacles/Coral';
import { Obstacle } from '@/entities/obstacles/Obstacle';
import { Seaweed } from '@/entities/obstacles/Seaweed';
import { Shipwreck } from '@/entities/obstacles/Shipwreck';
import { ShieldBubble } from '@/entities/powerups/ShieldBubble';
import { SlowCurrent } from '@/entities/powerups/SlowCurrent';
import { PowerUp } from '@/entities/powerups/PowerUp';
import { Eel } from '@/entities/predators/Eel';
import { Grouper } from '@/entities/predators/Grouper';
import { Predator } from '@/entities/predators/Predator';
import { DifficultyStage } from '@/systems/DifficultyManager';
import { ObjectPool } from '@/systems/ObjectPool';
import { GAME, TIMINGS } from '@/utils/Constants';
import { clamp, randomInt, scaleByDelta } from '@/utils/MathUtils';

export type ObstacleGroup = {
  topHeight: number;
  bottomY: number;
  gapY: number;
};

type UpdateContext = {
  score: number;
  difficulty: DifficultyStage;
  slowCurrentActive: boolean;
  elapsedMs: number;
  lobster?: Lobster;
};

type ObstacleConfigItem = {
  key: 'coral' | 'seaweed' | 'shipwreck';
  color: number;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  weight: number;
};

type PowerUpProbability = {
  minScore: number;
  chance: number;
};

type PowerUpConfigItem = {
  key: 'shieldBubble' | 'slowCurrent' | 'revivePearl';
  rarity: 'normal' | 'rare';
  durationMs: number;
  cooldownDistance: number;
  probabilityByScore: PowerUpProbability[];
};

export type SpawnRules = DifficultyStage & {
  allowObstacleSpawn: boolean;
  preferGapAroundLobster: boolean;
};

export type SpawnRuleContext = {
  difficulty: DifficultyStage;
  elapsedMs: number;
};

export type ObstacleLayout = {
  top: {
    y: number;
    height: number;
  };
  bottom: {
    y: number;
    height: number;
  };
};

const obstacleFactories = {
  coral: (scene: Phaser.Scene) => new Coral(scene),
  seaweed: (scene: Phaser.Scene) => new Seaweed(scene),
  shipwreck: (scene: Phaser.Scene) => new Shipwreck(scene),
};

const predatorFactories = {
  eel: (scene: Phaser.Scene) => new Eel(scene),
  grouper: (scene: Phaser.Scene) => new Grouper(scene),
};

const powerUpFactories = {
  shieldBubble: (scene: Phaser.Scene) => new ShieldBubble(scene),
  slowCurrent: (scene: Phaser.Scene) => new SlowCurrent(scene),
};

export const resolveSpawnRules = ({ difficulty, elapsedMs }: SpawnRuleContext): SpawnRules => {
  const inSafeStart = elapsedMs < TIMINGS.SAFE_START_MS;
  const inEasyStart = elapsedMs < TIMINGS.EASY_START_MS;

  return {
    ...difficulty,
    allowObstacleSpawn: !inSafeStart,
    preferGapAroundLobster: inEasyStart,
    gapSize: inEasyStart ? Math.round(difficulty.gapSize * 1.25) : difficulty.gapSize,
    obstacleSpacing: inEasyStart ? Math.round(difficulty.obstacleSpacing * 1.35) : difficulty.obstacleSpacing,
    predatorChance: inEasyStart ? 0 : difficulty.predatorChance,
    maxPredatorsOnScreen: inEasyStart ? 0 : difficulty.maxPredatorsOnScreen,
  };
};

export type PowerUpSpawnContext = {
  gapY: number;
  bottomY: number;
  lobsterY?: number;
};

export const resolvePowerUpSpawnY = ({ gapY, bottomY, lobsterY }: PowerUpSpawnContext): number => {
  const lanePadding = 26;
  const minY = Math.round(gapY + lanePadding);
  const maxY = Math.round(bottomY - lanePadding);
  const laneCenter = Math.round((gapY + bottomY) / 2);

  if (maxY <= minY) {
    return laneCenter;
  }

  if (typeof lobsterY !== 'number') {
    return laneCenter;
  }

  const clampedLobsterY = clamp(Math.round(lobsterY), minY, maxY);
  return clamp(Math.round(Phaser.Math.Linear(laneCenter, clampedLobsterY, 0.62)), minY, maxY);
};

export const resolveObstacleLayout = (group: ObstacleGroup, screenHeight = GAME.HEIGHT): ObstacleLayout => {
  const topHeight = Math.max(0, group.topHeight);
  const bottomHeight = Math.max(0, screenHeight - group.bottomY);

  return {
    top: {
      y: topHeight / 2,
      height: topHeight,
    },
    bottom: {
      y: group.bottomY + bottomHeight / 2,
      height: bottomHeight,
    },
  };
};

export class ScrollManager {
  private lastGapY = GAME.HEIGHT * 0.45;
  private distanceTraveled = 0;
  private nextObstacleDistance = 0;
  private nextPredatorCheckDistance = 220;
  private rarePickupDistance = new Map<string, number>();
  private readonly scene?: Phaser.Scene;
  private readonly obstaclePools = new Map<string, ObjectPool<Obstacle>>();
  private readonly predatorPools = new Map<string, ObjectPool<Predator>>();
  private readonly powerUpPools = new Map<string, ObjectPool<PowerUp>>();
  private readonly obstacleTypes = obstacleConfig.types as ObstacleConfigItem[];
  private readonly powerUpTypes = powerUpConfig.types as PowerUpConfigItem[];

  constructor(scene?: Phaser.Scene) {
    this.scene = scene;

    if (!scene) {
      return;
    }

    this.obstaclePools.set('coral', new ObjectPool(() => obstacleFactories.coral(scene), 4));
    this.obstaclePools.set('seaweed', new ObjectPool(() => obstacleFactories.seaweed(scene), 4));
    this.obstaclePools.set('shipwreck', new ObjectPool(() => obstacleFactories.shipwreck(scene), 2));
    this.predatorPools.set('eel', new ObjectPool(() => predatorFactories.eel(scene), 1));
    this.predatorPools.set('grouper', new ObjectPool(() => predatorFactories.grouper(scene), 1));
    this.powerUpPools.set('shieldBubble', new ObjectPool(() => powerUpFactories.shieldBubble(scene), 2));
    this.powerUpPools.set('slowCurrent', new ObjectPool(() => powerUpFactories.slowCurrent(scene), 2));
  }

  advance(scrollSpeed: number, delta: number): number {
    const moved = scaleByDelta(scrollSpeed, delta);
    this.distanceTraveled += moved;
    return moved;
  }

  update(delta: number, context: UpdateContext): void {
    if (!this.scene) {
      this.advance(context.difficulty.scrollSpeed, delta);
      return;
    }

    const spawnRules = resolveSpawnRules({
      difficulty: context.difficulty,
      elapsedMs: context.elapsedMs,
    });

    this.advance(context.difficulty.scrollSpeed, delta);
    this.updateObstacles(delta, context.lobster);
    this.updatePredators(delta, context.lobster);
    this.updatePowerUps(delta);
    this.releaseOutOfBounds();

    if (spawnRules.allowObstacleSpawn && this.shouldSpawnObstacle(spawnRules.obstacleSpacing)) {
      const obstacleGroup = this.spawnObstacleGroup(
        spawnRules,
        spawnRules.preferGapAroundLobster ? context.lobster?.y : undefined,
      );
      if (obstacleGroup) {
        this.maybeSpawnPowerUp(context.score, spawnRules.scrollSpeed, obstacleGroup, context.lobster?.y);
      }
    }

    if (
      spawnRules.maxPredatorsOnScreen > 0 &&
      this.shouldCheckPredator() &&
      this.getActivePredators().length < spawnRules.maxPredatorsOnScreen &&
      Math.random() < spawnRules.predatorChance
    ) {
      this.spawnPredator(spawnRules.scrollSpeed);
    }
  }

  getDistanceTraveled(): number {
    return this.distanceTraveled;
  }

  shouldSpawnObstacle(obstacleSpacing: number): boolean {
    if (this.distanceTraveled < this.nextObstacleDistance) {
      return false;
    }

    this.nextObstacleDistance = this.distanceTraveled + obstacleSpacing;
    return true;
  }

  shouldCheckPredator(): boolean {
    if (this.distanceTraveled < this.nextPredatorCheckDistance) {
      return false;
    }

    this.nextPredatorCheckDistance = this.distanceTraveled + 180;
    return true;
  }

  generateObstacleGroup(gapSize: number, screenHeight = GAME.HEIGHT, focusY?: number): ObstacleGroup {
    const minGapY = 120;
    const maxGapY = screenHeight - 120 - gapSize;
    const maxDelta = gapSize * 0.6;
    let rawGapY = this.lastGapY + randomInt(-Math.round(maxDelta), Math.round(maxDelta));

    if (typeof focusY === 'number') {
      const preferredGapY = clamp(Math.round(focusY - gapSize / 2), minGapY, maxGapY);
      rawGapY = Phaser.Math.Linear(rawGapY, preferredGapY, 0.72);
    }

    const gapY = clamp(Math.round(rawGapY), minGapY, maxGapY);
    this.lastGapY = gapY;

    return {
      topHeight: gapY,
      bottomY: gapY + gapSize,
      gapY,
    };
  }

  getActiveObstacles(): Obstacle[] {
    return [...this.obstaclePools.values()].flatMap((pool) => pool.getActiveItems());
  }

  getActivePredators(): Predator[] {
    return [...this.predatorPools.values()].flatMap((pool) => pool.getActiveItems());
  }

  getActivePowerUps(): PowerUp[] {
    return [...this.powerUpPools.values()].flatMap((pool) => pool.getActiveItems());
  }

  registerRarePickup(key: string): void {
    this.rarePickupDistance.set(key, this.distanceTraveled);
  }

  canSpawnRare(key: string, cooldownDistance: number): boolean {
    const lastPickup = this.rarePickupDistance.get(key);
    if (lastPickup === undefined) {
      return true;
    }

    return this.distanceTraveled - lastPickup >= cooldownDistance;
  }

  releasePowerUp(powerUp: PowerUp): void {
    const pool = this.powerUpPools.get(powerUp.kind);
    pool?.release(powerUp);
  }

  reset(): void {
    this.lastGapY = GAME.HEIGHT * 0.45;
    this.distanceTraveled = 0;
    this.nextObstacleDistance = 0;
    this.nextPredatorCheckDistance = 220;
    this.rarePickupDistance.clear();
  }

  destroy(): void {
    const destroyPoolItem = <T extends { destroy: () => void }>(item: T): void => {
      item.destroy();
    };

    this.obstaclePools.forEach((pool) => pool.destroy((item) => destroyPoolItem(item as typeof item & { destroy: () => void })));
    this.predatorPools.forEach((pool) => pool.destroy((item) => destroyPoolItem(item as typeof item & { destroy: () => void })));
    this.powerUpPools.forEach((pool) => pool.destroy((item) => destroyPoolItem(item as typeof item & { destroy: () => void })));
    this.obstaclePools.clear();
    this.predatorPools.clear();
    this.powerUpPools.clear();
    this.reset();
  }

  private spawnObstacleGroup(difficulty: DifficultyStage, focusY?: number): ObstacleGroup | undefined {
    if (!this.scene) {
      return undefined;
    }

    const group = this.generateObstacleGroup(difficulty.gapSize, GAME.HEIGHT, focusY);
    const layout = resolveObstacleLayout(group);
    const spawnX = GAME.WIDTH + 120;
    const topConfig = this.pickObstacleType();
    const bottomConfig = this.pickObstacleType();

    const topObstacle = this.obstaclePools.get(topConfig.key)?.acquire({
      x: spawnX,
      y: layout.top.y,
      width: randomInt(topConfig.minWidth, topConfig.maxWidth),
      height: layout.top.height,
      scrollSpeed: difficulty.scrollSpeed,
      color: topConfig.color,
      hazardFacing: 'down',
    });

    const bottomObstacle = this.obstaclePools.get(bottomConfig.key)?.acquire({
      x: spawnX,
      y: layout.bottom.y,
      width: randomInt(bottomConfig.minWidth, bottomConfig.maxWidth),
      height: layout.bottom.height,
      scrollSpeed: difficulty.scrollSpeed,
      color: bottomConfig.color,
      hazardFacing: 'up',
    });

    topObstacle?.setDepth(12);
    bottomObstacle?.setDepth(12);
    return group;
  }

  private spawnPredator(scrollSpeed: number): void {
    if (!this.scene) {
      return;
    }

    const key = Math.random() < 0.5 ? 'eel' : 'grouper';
    const pool = this.predatorPools.get(key);
    pool?.acquire({
      x: GAME.WIDTH + 160,
      y: randomInt(180, GAME.HEIGHT - 180),
      scrollSpeed,
    }).setDepth(16);
  }

  private maybeSpawnPowerUp(score: number, scrollSpeed: number, group: ObstacleGroup, lobsterY?: number): void {
    if (!this.scene || Math.random() > 0.32) {
      return;
    }

    const spawnable = this.powerUpTypes
      .filter((config) => config.key in powerUpFactories)
      .filter((config) => Math.random() < this.resolvePowerUpChance(config, score));

    if (spawnable.length === 0) {
      return;
    }

    const selected = spawnable[randomInt(0, spawnable.length - 1)];
    const pool = this.powerUpPools.get(selected.key);
    const powerUpSpeed = Math.max(3.8, Number((scrollSpeed - 0.8).toFixed(2)));
    pool?.acquire({
      x: GAME.WIDTH + 128,
      y: resolvePowerUpSpawnY({
        gapY: group.gapY,
        bottomY: group.bottomY,
        lobsterY,
      }),
      scrollSpeed: powerUpSpeed,
    }).setDepth(14);
  }

  private resolvePowerUpChance(config: PowerUpConfigItem, score: number): number {
    const stage = [...config.probabilityByScore]
      .reverse()
      .find((item) => score >= item.minScore) ?? config.probabilityByScore[0];

    return stage?.chance ?? 0;
  }

  private pickObstacleType(): ObstacleConfigItem {
    const totalWeight = this.obstacleTypes.reduce((sum, item) => sum + item.weight, 0);
    let cursor = Math.random() * totalWeight;

    for (const item of this.obstacleTypes) {
      cursor -= item.weight;
      if (cursor <= 0) {
        return item;
      }
    }

    return this.obstacleTypes[0];
  }

  private updateObstacles(delta: number, lobster?: Lobster): void {
    for (const obstacle of this.getActiveObstacles()) {
      obstacle.update(delta, lobster);
    }
  }

  private updatePredators(delta: number, lobster?: Lobster): void {
    for (const predator of this.getActivePredators()) {
      if (lobster) {
        predator.update(delta, lobster);
      } else {
        predator.x -= scaleByDelta(5.5, delta);
      }
    }
  }

  private updatePowerUps(delta: number): void {
    for (const powerUp of this.getActivePowerUps()) {
      powerUp.update(delta);
    }
  }

  private releaseOutOfBounds(): void {
    for (const [key, pool] of this.obstaclePools) {
      for (const item of pool.getActiveItems()) {
        if (item.isOutOfBounds()) {
          this.obstaclePools.get(key)?.release(item);
        }
      }
    }

    for (const [key, pool] of this.predatorPools) {
      for (const item of pool.getActiveItems()) {
        if (item.isOutOfBounds()) {
          this.predatorPools.get(key)?.release(item);
        }
      }
    }

    for (const [key, pool] of this.powerUpPools) {
      for (const item of pool.getActiveItems()) {
        if (item.isOutOfBounds()) {
          this.powerUpPools.get(key)?.release(item);
        }
      }
    }
  }
}


