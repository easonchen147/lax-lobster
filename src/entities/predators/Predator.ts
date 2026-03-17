import Phaser from 'phaser';
import { IPoolable } from '@/systems/ObjectPool';
import { EFFECTS } from '@/utils/Constants';
import { Lobster } from '@/entities/Lobster';

export type PredatorResetConfig = {
  x: number;
  y: number;
  scrollSpeed: number;
};

type PredatorAiState = 'patrol' | 'chase';

export class Predator extends Phaser.Physics.Arcade.Sprite implements IPoolable {
  protected scrollSpeed = 0;
  protected aiState: PredatorAiState = 'patrol';
  protected patrolBaseY = 0;
  protected senseRange = 200;
  protected speed = 4.8;

  constructor(scene: Phaser.Scene, textureKey: string, tint: number) {
    super(scene, 0, 0, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setData('accentTint', tint);
    this.arcadeBody.setAllowGravity(false);
    this.setActive(false);
    this.setVisible(false);
  }

  private get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  protected syncBodySize(scaleWidth = 0.74, scaleHeight = 0.7): void {
    const safeScaleX = Math.max(Math.abs(this.scaleX), 0.0001);
    const safeScaleY = Math.max(Math.abs(this.scaleY), 0.0001);
    this.arcadeBody.setSize((this.displayWidth * scaleWidth) / safeScaleX, (this.displayHeight * scaleHeight) / safeScaleY, true);
  }

  reset(config?: PredatorResetConfig): void {
    if (!config) {
      this.arcadeBody.stop();
      this.setPosition(-260, -260);
      return;
    }

    this.setPosition(config.x, config.y);
    this.scrollSpeed = config.scrollSpeed;
    this.aiState = 'patrol';
    this.patrolBaseY = config.y;
    this.arcadeBody.enable = true;
  }

  update(delta: number, lobster: Lobster): void {
    if (!this.active) {
      return;
    }

    const deltaScale = delta / 16.6667;
    this.x -= (this.scrollSpeed + this.speed) * deltaScale;

    const distanceToLobster = Phaser.Math.Distance.Between(this.x, this.y, lobster.x, lobster.y);
    if (distanceToLobster <= this.senseRange) {
      this.aiState = 'chase';
    } else if (distanceToLobster >= EFFECTS.PREDATOR_LOSE_RANGE) {
      this.aiState = 'patrol';
    }

    if (this.aiState === 'chase') {
      this.y = Phaser.Math.Linear(this.y, lobster.y, 0.06 * deltaScale);
    } else {
      this.y = this.patrolBaseY + Math.sin(this.scene.time.now * 0.003 + this.x * 0.01) * 28;
    }
  }

  isOutOfBounds(): boolean {
    return this.getBounds().right < -60;
  }
}
