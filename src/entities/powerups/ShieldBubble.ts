import Phaser from 'phaser';

import { PowerUp } from './PowerUp';

export class ShieldBubble extends PowerUp {
  constructor(scene: Phaser.Scene) {
    super(scene, 'powerup-shieldBubble', 0x4cc9f0, 'normal', 0, 0);
    this.setDisplaySize(58, 58);
    this.syncBodySize(0.66);
  }
}
