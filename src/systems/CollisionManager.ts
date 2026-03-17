import Phaser from 'phaser';
import { Lobster } from '@/entities/Lobster';
import { Obstacle } from '@/entities/obstacles/Obstacle';
import { Predator } from '@/entities/predators/Predator';
import { PowerUp } from '@/entities/powerups/PowerUp';

export type CollisionHandlers = {
  onObstacleHit: (obstacle: Obstacle) => void;
  onPredatorHit: (predator: Predator) => void;
  onPowerUpHit: (powerUp: PowerUp) => void;
};

type BodyLike = {
  x: number;
  y: number;
  width: number;
  height: number;
  enable?: boolean;
};

type CollisionTarget = {
  body?: BodyLike | null;
  getBounds: () => Phaser.Geom.Rectangle;
};

export const getCollisionRect = (target: CollisionTarget): Phaser.Geom.Rectangle => {
  const body = target.body;
  if (body && body.enable !== false) {
    return new Phaser.Geom.Rectangle(body.x, body.y, body.width, body.height);
  }

  return target.getBounds();
};

export class CollisionManager {
  process(
    lobster: Lobster,
    obstacles: Obstacle[],
    predators: Predator[],
    powerUps: PowerUp[],
    handlers: CollisionHandlers,
  ): void {
    if (!lobster.active) {
      return;
    }

    const lobsterBounds = getCollisionRect(lobster);

    for (const obstacle of obstacles) {
      if (obstacle.active && Phaser.Geom.Intersects.RectangleToRectangle(lobsterBounds, getCollisionRect(obstacle))) {
        handlers.onObstacleHit(obstacle);
        return;
      }
    }

    for (const predator of predators) {
      if (predator.active && Phaser.Geom.Intersects.RectangleToRectangle(lobsterBounds, getCollisionRect(predator))) {
        handlers.onPredatorHit(predator);
        return;
      }
    }

    for (const powerUp of powerUps) {
      if (powerUp.active && Phaser.Geom.Intersects.RectangleToRectangle(lobsterBounds, getCollisionRect(powerUp))) {
        handlers.onPowerUpHit(powerUp);
      }
    }
  }
}
