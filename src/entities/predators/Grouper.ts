import Phaser from 'phaser';

import { Predator } from './Predator';

export class Grouper extends Predator {
  constructor(scene: Phaser.Scene) {
    super(scene, 'predator-grouper', 0xf4a261);
    this.speed = 4.8;
    this.senseRange = 200;
    this.setDisplaySize(92, 44);
    this.syncBodySize(0.7, 0.62);
  }
}
