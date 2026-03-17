import Phaser from 'phaser';

import type { Lobster } from '@/entities/Lobster';
import type { IPoolable } from '@/systems/ObjectPool';
import {
  ensureObstacleTexture,
  resolveObstacleFatalPulseProfile,
  resolveObstacleHitboxScale,
  resolveObstacleHazardProfile,
  resolveObstacleWarningIntensity,
  type DeepSeaObstacleKind,
  type ObstacleHazardFacing,
} from '@/visuals/DeepSeaVisuals';
import { scaleByDelta } from '@/utils/MathUtils';

export type ObstacleResetConfig = {
  x: number;
  y: number;
  width: number;
  height: number;
  scrollSpeed: number;
  hazardFacing?: ObstacleHazardFacing;
};

export class Obstacle
  extends Phaser.Physics.Arcade.Sprite
  implements IPoolable
{
  kind = 'generic';
  private scrollSpeed = 0;
  private hazardFacing: ObstacleHazardFacing = 'down';
  private readonly proximityGlow: Phaser.GameObjects.Graphics;
  private readonly pulseOffset = Phaser.Math.Between(0, 240);

  constructor(scene: Phaser.Scene, textureKey: string, tint: number) {
    super(scene, 0, 0, textureKey);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.kind = textureKey.replace('obstacle-', '');
    this.setData('accentTint', tint);
    this.arcadeBody.setAllowGravity(false);
    this.arcadeBody.setImmovable(true);
    this.proximityGlow = scene.add
      .graphics()
      .setDepth(12.4)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setVisible(false);
    this.setActive(false);
    this.setVisible(false);
  }

  private get arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }

  private syncBodySize(displayWidth: number, displayHeight: number): void {
    const hitboxScale = resolveObstacleHitboxScale(this.kind);
    const scaleX = Math.max(Math.abs(this.scaleX), 0.0001);
    const scaleY = Math.max(Math.abs(this.scaleY), 0.0001);
    this.arcadeBody.setSize(
      (displayWidth * hitboxScale.width) / scaleX,
      (displayHeight * hitboxScale.height) / scaleY,
      true,
    );
  }

  reset(config?: ObstacleResetConfig): void {
    if (!config) {
      this.arcadeBody.stop();
      this.clearProximityGlow();
      this.setPosition(-200, -200);
      return;
    }

    this.scrollSpeed = config.scrollSpeed;
    this.hazardFacing = config.hazardFacing ?? 'down';
    if (
      this.kind === 'coral' ||
      this.kind === 'seaweed' ||
      this.kind === 'shipwreck'
    ) {
      const runtimeTexture = ensureObstacleTexture(
        this.scene,
        this.kind as DeepSeaObstacleKind,
        config.width,
        config.height,
        this.hazardFacing,
      );
      this.setTexture(runtimeTexture.key);
    }
    this.setPosition(config.x, config.y);
    this.setDisplaySize(config.width, config.height);
    this.syncBodySize(config.width, config.height);
    this.arcadeBody.enable = true;
  }

  update(delta: number, lobster?: Lobster): void {
    this.x -= scaleByDelta(this.scrollSpeed, delta);
    this.updateProximityGlow(lobster);
  }

  isOutOfBounds(): boolean {
    return this.getBounds().right < -60;
  }

  override setVisible(value: boolean): this {
    super.setVisible(value);
    if (!value) {
      this.clearProximityGlow();
    }
    return this;
  }

  override setActive(value: boolean): this {
    super.setActive(value);
    if (!value) {
      this.clearProximityGlow();
    }
    return this;
  }

  override destroy(fromScene?: boolean): void {
    this.proximityGlow.destroy();
    super.destroy(fromScene);
  }

  private clearProximityGlow(): void {
    this.proximityGlow.clear();
    this.proximityGlow.setVisible(false);
  }

  private resolveFatalBoundaryMetrics(): {
    left: number;
    right: number;
    y: number;
    centerX: number;
    width: number;
  } {
    const body = this.arcadeBody;
    const left = body.x;
    const right = body.x + body.width;

    return {
      left,
      right,
      y: this.hazardFacing === 'down' ? body.y + body.height : body.y,
      centerX: left + body.width / 2,
      width: body.width,
    };
  }

  private updateProximityGlow(lobster?: Lobster): void {
    if (!lobster || !this.active || !this.visible) {
      this.clearProximityGlow();
      return;
    }

    const boundary = this.resolveFatalBoundaryMetrics();
    const horizontalGap =
      lobster.x < boundary.left
        ? boundary.left - lobster.x
        : lobster.x > boundary.right
          ? lobster.x - boundary.right
          : 0;
    const verticalGap = Math.abs(lobster.y - boundary.y);
    const intensity = resolveObstacleWarningIntensity(
      horizontalGap,
      verticalGap,
      180,
      Math.max(132, this.arcadeBody.height * 0.92),
    );

    if (intensity <= 0.05) {
      this.clearProximityGlow();
      return;
    }

    const pulse =
      (Math.sin(((this.scene.time.now + this.pulseOffset) / 120) * Math.PI) +
        1) *
      0.5;
    const alpha = intensity * (0.06 + pulse * 0.1);
    const profile = resolveObstacleHazardProfile(
      this.displayWidth,
      this.displayHeight,
    );
    const fatalPulse = resolveObstacleFatalPulseProfile(
      intensity,
      pulse,
      this.displayWidth,
      this.displayHeight,
    );
    const glowWidth = Math.max(
      profile.markerRadius * 7.5,
      boundary.width * (this.kind === 'shipwreck' ? 0.52 : 0.44),
    );
    const nodePositions =
      this.kind === 'shipwreck'
        ? [
            boundary.left + boundary.width * 0.2,
            boundary.centerX,
            boundary.right - boundary.width * 0.2,
          ]
        : [
            boundary.left + boundary.width * 0.24,
            boundary.centerX,
            boundary.right - boundary.width * 0.24,
          ];

    this.proximityGlow.clear();
    this.proximityGlow.setVisible(true);
    this.proximityGlow.fillStyle(0x86f4ff, alpha * 0.66);
    this.proximityGlow.fillEllipse(
      boundary.centerX,
      boundary.y,
      glowWidth,
      Math.max(12, this.arcadeBody.height * 0.1),
    );

    nodePositions.forEach((nodeX, index) => {
      const nodeScale =
        index === 1
          ? 2.3 * (fatalPulse.active ? fatalPulse.coreScale : 1)
          : 1.9;

      this.proximityGlow.fillStyle(0x9ef7ff, alpha * 0.46);
      this.proximityGlow.fillCircle(
        nodeX,
        boundary.y,
        profile.markerRadius * nodeScale,
      );
      this.proximityGlow.fillStyle(0xffd88f, alpha * 0.96);
      this.proximityGlow.fillCircle(
        nodeX,
        boundary.y,
        profile.markerRadius * (index === 1 ? 1.1 : 0.92),
      );
      this.proximityGlow.fillStyle(0xf2fdff, alpha);
      this.proximityGlow.fillCircle(
        nodeX,
        boundary.y,
        Math.max(1.2, profile.markerRadius * (index === 1 ? 0.46 : 0.34)),
      );
    });

    if (!fatalPulse.active) {
      return;
    }

    const dangerDirection = this.hazardFacing === 'down' ? -1 : 1;
    const trailTipY = boundary.y + dangerDirection * fatalPulse.trailLength;
    const trailBaseY =
      boundary.y + dangerDirection * Math.max(4, fatalPulse.trailLength * 0.2);

    this.proximityGlow.fillStyle(0x9ef7ff, fatalPulse.alpha * 0.42);
    this.proximityGlow.fillEllipse(
      boundary.centerX,
      boundary.y,
      fatalPulse.haloWidth,
      fatalPulse.haloHeight,
    );

    this.proximityGlow.fillStyle(0xffd88f, fatalPulse.alpha * 0.2);
    this.proximityGlow.fillTriangle(
      boundary.centerX,
      trailTipY,
      boundary.centerX - fatalPulse.trailWidth * 0.52,
      trailBaseY,
      boundary.centerX + fatalPulse.trailWidth * 0.52,
      trailBaseY,
    );

    this.proximityGlow.lineStyle(
      Math.max(1, profile.innerStroke),
      0xf7fbff,
      fatalPulse.alpha * 0.96,
    );
    this.proximityGlow.strokeLineShape(
      new Phaser.Geom.Line(
        boundary.centerX - fatalPulse.trailWidth * 0.42,
        trailBaseY,
        boundary.centerX,
        trailTipY,
      ),
    );
    this.proximityGlow.strokeLineShape(
      new Phaser.Geom.Line(
        boundary.centerX + fatalPulse.trailWidth * 0.42,
        trailBaseY,
        boundary.centerX,
        trailTipY,
      ),
    );

    this.proximityGlow.fillStyle(0xf2fdff, fatalPulse.alpha);
    this.proximityGlow.fillCircle(
      boundary.centerX,
      boundary.y,
      Math.max(1.6, profile.markerRadius * 0.72 * fatalPulse.coreScale),
    );
  }
}
