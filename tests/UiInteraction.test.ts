import Phaser from 'phaser';
import { describe, expect, it, vi } from 'vitest';

import { createContainerHitArea, createSceneNavigator, ensureSceneInputEnabled } from '@/ui/UiInteraction';

describe('UiInteraction', () => {
  it('keeps container hit area aligned with Phaser container local coordinates', () => {
    const hitArea = createContainerHitArea(356, 86, 16);

    expect(hitArea.x).toBe(0);
    expect(hitArea.y).toBe(0);
    expect(hitArea.width).toBe(388);
    expect(hitArea.height).toBe(118);
    expect(Phaser.Geom.Rectangle.Contains(hitArea, 194, 59)).toBe(true);
    expect(Phaser.Geom.Rectangle.Contains(hitArea, 194, -47)).toBe(false);
  });

  it('navigates only once for an active scene and disables input immediately', () => {
    const start = vi.fn();
    const scene = {
      input: { enabled: true },
      scene: { start },
      sys: { isActive: () => true },
    };

    const navigate = createSceneNavigator(scene);

    expect(navigate('GameScene')).toBe(true);
    expect(scene.input.enabled).toBe(false);
    expect(start).toHaveBeenCalledWith('GameScene', undefined);
    expect(navigate('MenuScene')).toBe(false);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('does not navigate when the scene is already inactive', () => {
    const start = vi.fn();
    const scene = {
      input: { enabled: true },
      scene: { start },
      sys: { isActive: () => false },
    };

    const navigate = createSceneNavigator(scene);

    expect(navigate('GameScene')).toBe(false);
    expect(scene.input.enabled).toBe(true);
    expect(start).not.toHaveBeenCalled();
  });

  it('reactivates input for recycled scenes before rebuilding UI', () => {
    const scene = {
      input: { enabled: false },
    };

    ensureSceneInputEnabled(scene);

    expect(scene.input.enabled).toBe(true);
  });

  it('safely skips input reactivation when a scene has no input plugin', () => {
    expect(() => ensureSceneInputEnabled({})).not.toThrow();
  });
});
