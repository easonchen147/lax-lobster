import Phaser from 'phaser';

import { PowerUp } from './PowerUp';

export class RevivePearl extends PowerUp {
  constructor(scene: Phaser.Scene) {
    super(scene, 'powerup-revivePearl', 0xffd166, 'rare', 0, 1350);
    this.setDisplaySize(60, 60);
    this.syncBodySize(0.62);
  }
}
