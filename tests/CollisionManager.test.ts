import Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

import { CollisionManager } from '@/systems/CollisionManager';

const makeBody = (x: number, y: number, width: number, height: number) => ({ x, y, width, height, enable: true });
const makeBounds = (x: number, y: number, width: number, height: number) => new Phaser.Geom.Rectangle(x, y, width, height);

describe('CollisionManager', () => {
  it('avoids false positive damage when only render bounds overlap', () => {
    const manager = new CollisionManager();
    const onObstacleHit = vi.fn();

    const lobster = {
      active: true,
      body: makeBody(10, 10, 16, 20),
      getBounds: () => makeBounds(0, 0, 60, 60),
    };
    const obstacle = {
      active: true,
      body: makeBody(80, 80, 24, 80),
      getBounds: () => makeBounds(0, 0, 120, 240),
    };

    manager.process(lobster as never, [obstacle as never], [], [], {
      onObstacleHit,
      onPredatorHit: vi.fn(),
      onPowerUpHit: vi.fn(),
    });

    expect(onObstacleHit).not.toHaveBeenCalled();
  });

  it('still triggers damage when physics bodies really overlap', () => {
    const manager = new CollisionManager();
    const onObstacleHit = vi.fn();

    const lobster = {
      active: true,
      body: makeBody(20, 20, 18, 24),
      getBounds: () => makeBounds(20, 20, 18, 24),
    };
    const obstacle = {
      active: true,
      body: makeBody(28, 24, 40, 120),
      getBounds: () => makeBounds(0, 0, 120, 240),
    };

    manager.process(lobster as never, [obstacle as never], [], [], {
      onObstacleHit,
      onPredatorHit: vi.fn(),
      onPowerUpHit: vi.fn(),
    });

    expect(onObstacleHit).toHaveBeenCalledTimes(1);
  });
});