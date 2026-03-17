import Phaser from 'phaser';

import type { IPoolable } from '@/systems/ObjectPool';
import { scaleByDelta } from '@/utils/MathUtils';

export type PowerUpResetConfig = {
  x: number;
  y: number;
  scrollSpeed: number;
};

export class PowerUp extends Phaser.Physics.Arcade.Sprite implements IPoolable {
  readonly kind: string;
  readonly rarity: 'normal' | 'rare';
  readonly durationMs: number;
  readonly cooldownDistance: number;
  private scrollSpeed = 0;

  constructor(
    scene: Phaser.Scene,
    textureKey: string,
    tint: number,
    rarity: 'normal' | 'rare',
    durationMs: number,
    cooldownDistance: number,
  ) {
    super(scene, 0, 0, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.kind = textureKey.replace('powerup-', '');
    this.rarity = rarity;
    this.durationMs = durationMs;
    this.cooldownDistance = cooldownDistance;
    this.setData('accentTint', tint);
    this.arcadeBody.setAllowGravity(false);
    this.setActive(false);
    this.setVisible(false);
  }

  private get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  protected syncBodySize(scale = 0.72): void {
    const safeScaleX = Math.max(Math.abs(this.scaleX), 0.0001);
    const safeScaleY = Math.max(Math.abs(this.scaleY), 0.0001);
    this.arcadeBody.setSize((this.displayWidth * scale) / safeScaleX, (this.displayHeight * scale) / safeScaleY, true);
  }

  reset(config?: PowerUpResetConfig): void {
    if (!config) {
      this.arcadeBody.stop();
      this.setPosition(-240, -240);
      return;
    }

    this.scrollSpeed = config.scrollSpeed;
    this.setPosition(config.x, config.y);
    this.arcadeBody.enable = true;
  }

  update(delta: number): void {
    this.x -= scaleByDelta(this.scrollSpeed, delta);
  }

  isOutOfBounds(): boolean {
    return this.getBounds().right < -60;
  }
}
