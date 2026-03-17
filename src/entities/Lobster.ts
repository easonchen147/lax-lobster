import Phaser from 'phaser';

import type { LobsterStage } from '@/systems/EvolutionManager';
import { getStageTextureKey } from '@/ui/UiTheme';
import { LIMITS, PHYSICS, TIMINGS } from '@/utils/Constants';

const LOBSTER_BASE_DISPLAY = {
  width: 36,
  height: 48,
} as const;

const resolveLobsterTextureKey = (scene: Phaser.Scene, stageId: number): string => {
  const stageTexture = getStageTextureKey(stageId);
  return scene.textures.exists(stageTexture) ? stageTexture : 'lobster-body';
};

export const resolveLobsterDisplaySize = (
  displayScale = 1,
): { width: number; height: number } => ({
  width: Number((LOBSTER_BASE_DISPLAY.width * displayScale).toFixed(2)),
  height: Number((LOBSTER_BASE_DISPLAY.height * displayScale).toFixed(2)),
});

export class Lobster extends Phaser.Physics.Arcade.Sprite {
  private readonly shieldGraphics: Phaser.GameObjects.Graphics;
  private readonly baseCollisionWidth = 20;
  private readonly baseCollisionHeight = 28;
  private floatSpeed: number = PHYSICS.FLOAT_SPEED;
  private diveForce: number = PHYSICS.DIVE_FORCE;
  private invincibleUntil = 0;
  private shieldCount = 0;
  private freeRevives = 0;
  private boundaryHits: number[] = [];
  private currentStageId = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, stage?: LobsterStage) {
    super(scene, x, y, stage ? resolveLobsterTextureKey(scene, stage.id) : 'lobster-body');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(5);
    const initialDisplaySize = resolveLobsterDisplaySize(stage?.displayScale ?? 1);
    this.setDisplaySize(initialDisplaySize.width, initialDisplaySize.height);
    this.arcadeBody().setAllowGravity(false);
    this.arcadeBody().setCollideWorldBounds(false);
    this.syncCollisionBody(this.baseCollisionWidth, this.baseCollisionHeight);
    this.shieldGraphics = scene.add.graphics().setDepth(4);
    if (stage) {
      this.applyStage(stage);
    }
  }

  private arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  private syncCollisionBody(displayWidth: number, displayHeight: number): void {
    const scaleX = Math.max(Math.abs(this.scaleX), 0.0001);
    const scaleY = Math.max(Math.abs(this.scaleY), 0.0001);
    this.arcadeBody().setSize(displayWidth / scaleX, displayHeight / scaleY, true);
  }

  getStageId(): number {
    return this.currentStageId;
  }

  getShieldCount(): number {
    return this.shieldCount;
  }

  getFreeRevives(): number {
    return this.freeRevives;
  }

  addShield(): boolean {
    if (this.shieldCount >= LIMITS.MAX_SHIELDS) {
      return false;
    }

    this.shieldCount += 1;
    this.updateShieldVisuals();
    return true;
  }

  consumeShield(): boolean {
    if (this.shieldCount <= 0) {
      return false;
    }

    this.shieldCount -= 1;
    this.setInvincible(TIMINGS.SHIELD_INVINCIBLE_MS);
    this.updateShieldVisuals();
    return true;
  }

  consumeFreeRevive(): boolean {
    if (this.freeRevives <= 0) {
      return false;
    }

    this.freeRevives -= 1;
    return true;
  }

  setStage(stage: LobsterStage): void {
    this.applyStage(stage);
  }

  applyStage(stage: LobsterStage, mode: 'reset' | 'upgrade' = 'reset'): void {
    this.currentStageId = stage.id;
    this.floatSpeed = Number((PHYSICS.FLOAT_SPEED * (1 + stage.speedBonus)).toFixed(2));
    this.diveForce = Math.min(PHYSICS.DIVE_FORCE + Math.min(stage.id, 2) * 0.4, 8.8);

    const textureKey = resolveLobsterTextureKey(this.scene, stage.id);
    this.setTexture(textureKey);
    if (textureKey === 'lobster-body') {
      this.setTint(stage.color);
    } else {
      this.clearTint();
    }

    const displaySize = resolveLobsterDisplaySize(stage.displayScale);
    this.setDisplaySize(displaySize.width, displaySize.height);
    this.syncCollisionBody(this.baseCollisionWidth * stage.collisionScale, this.baseCollisionHeight * stage.collisionScale);
    if (mode === 'upgrade') {
      this.shieldCount = Math.max(this.shieldCount, stage.shieldCount);
      this.freeRevives = Math.max(this.freeRevives, stage.freeRevives);
    } else {
      this.shieldCount = stage.shieldCount;
      this.freeRevives = stage.freeRevives;
    }
    this.updateShieldVisuals();
  }

  update(delta: number, isPressed: boolean, playAreaHeight: number): void {
    const now = this.scene.time.now;
    const velocityY = (isPressed ? this.diveForce : -this.floatSpeed) * 60;
    this.arcadeBody().setVelocityY(velocityY);

    if (this.y <= 40) {
      this.y = 40;
      this.arcadeBody().setVelocityY(Math.abs(this.arcadeBody().velocity.y) * 0.5 + 150);
      this.registerBoundaryHit(now);
    }

    if (this.y >= playAreaHeight - 40) {
      this.y = playAreaHeight - 40;
      this.arcadeBody().setVelocityY(-Math.abs(this.arcadeBody().velocity.y) * 0.5 - 150);
      this.registerBoundaryHit(now);
    }

    this.updateVisuals();
    void delta;
  }

  updateLobster(delta: number, isPressed: boolean, playAreaHeight: number): void {
    this.update(delta, isPressed, playAreaHeight);
  }

  setShieldVisualCount(count: number): void {
    this.shieldCount = Math.max(0, Math.min(LIMITS.MAX_SHIELDS, count));
    this.updateShieldVisuals();
  }

  setInvincible(durationMs: number): void {
    this.invincibleUntil = Math.max(this.invincibleUntil, this.scene.time.now + durationMs);
  }

  isInvincible(): boolean {
    return this.scene.time.now < this.invincibleUntil;
  }

  reviveAt(x: number, y: number): void {
    this.setPosition(x, y);
    this.arcadeBody().setVelocity(0, 0);
    this.setInvincible(LIMITS.REVIVE_INVINCIBLE);
  }

  revive(x: number, y: number): void {
    this.reviveAt(x, y);
  }

  resetState(): void {
    this.boundaryHits = [];
    this.invincibleUntil = 0;
    this.arcadeBody().setVelocity(0, 0);
    this.alpha = 1;
    this.updateShieldVisuals();
  }

  private registerBoundaryHit(now: number): void {
    this.boundaryHits.push(now);
    this.boundaryHits = this.boundaryHits.filter((time) => now - time <= LIMITS.BOUNDARY_HIT_WINDOW);
    if (this.boundaryHits.length >= 2) {
      this.setInvincible(LIMITS.BOUNDARY_INVINCIBLE);
      this.boundaryHits = [];
    }
  }

  private updateVisuals(): void {
    if (this.isInvincible()) {
      this.alpha = Math.floor(this.scene.time.now / 80) % 2 === 0 ? 0.35 : 1;
    } else {
      this.alpha = 1;
    }
    this.updateShieldVisuals();
  }

  private updateShieldVisuals(): void {
    this.shieldGraphics.clear();
    if (this.shieldCount <= 0) {
      return;
    }

    const baseRadius = Math.max(this.displayWidth, this.displayHeight) * 0.6;
    const radiusStep = Math.max(7, Math.min(this.displayWidth, this.displayHeight) * 0.22);

    this.shieldGraphics.lineStyle(2, 0x4cc9f0, 0.9);
    for (let index = 0; index < this.shieldCount; index += 1) {
      this.shieldGraphics.strokeCircle(this.x, this.y, baseRadius + index * radiusStep);
    }
  }

  override destroy(fromScene?: boolean): void {
    this.shieldGraphics.destroy();
    super.destroy(fromScene);
  }
}
