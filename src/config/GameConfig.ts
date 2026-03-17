import Phaser from 'phaser';

import { BootScene } from '@/scenes/BootScene';
import { EvolutionScene } from '@/scenes/EvolutionScene';
import { GameOverScene } from '@/scenes/GameOverScene';
import { GameScene } from '@/scenes/GameScene';
import { MenuScene } from '@/scenes/MenuScene';
import { DeviceDetector } from '@/utils/DeviceDetector';
import { GAME } from '@/utils/Constants';

const scaleMode = DeviceDetector.getScaleMode() === 'RESIZE' ? Phaser.Scale.RESIZE : Phaser.Scale.FIT;

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  backgroundColor: '#021b33',
  fps: {
    target: DeviceDetector.getTargetFPS(),
    forceSetTimeOut: true,
  },
  scale: {
    mode: scaleMode,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: GAME.WIDTH,
    height: GAME.HEIGHT,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  input: {
    mouse: {
      preventDefaultDown: true,
    },
    touch: {
      capture: true,
    },
  },
  scene: [BootScene, MenuScene, GameScene, GameOverScene, EvolutionScene],
};
