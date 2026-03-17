import Phaser from 'phaser';

import { GameConfig } from './config/GameConfig';
import { DeviceDetector } from './utils/DeviceDetector';

const platform = DeviceDetector.getPresentationPlatform();
document.documentElement.dataset.platform = platform;
document.body.dataset.platform = platform;

const game = new Phaser.Game(GameConfig);

(globalThis as typeof globalThis & {
  Phaser?: typeof Phaser;
  __LAX_LOBSTER_GAME__?: Phaser.Game;
}).Phaser = Phaser;
(globalThis as typeof globalThis & {
  __LAX_LOBSTER_GAME__?: Phaser.Game;
}).__LAX_LOBSTER_GAME__ = game;