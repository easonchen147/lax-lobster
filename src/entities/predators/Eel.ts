import Phaser from 'phaser';

import { Predator } from './Predator';

export class Eel extends Predator {
  constructor(scene: Phaser.Scene) {
    super(scene, 'predator-eel', 0x6fffe9);
    this.speed = 6.2;
    this.senseRange = 250;
    this.setDisplaySize(76, 28);
    this.syncBodySize(0.76, 0.56);
  }
}
