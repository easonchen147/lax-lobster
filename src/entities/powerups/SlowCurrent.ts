import Phaser from 'phaser';

import { PowerUp } from './PowerUp';

export class SlowCurrent extends PowerUp {
  constructor(scene: Phaser.Scene) {
    super(scene, 'powerup-slowCurrent', 0x7bdff2, 'normal', 3500, 0);
    this.setDisplaySize(58, 58);
    this.syncBodySize(0.64);
  }
}
