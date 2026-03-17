import Phaser from 'phaser';

import { COLORS } from '@/utils/Constants';
import { Obstacle } from './Obstacle';

export class Shipwreck extends Obstacle {
  constructor(scene: Phaser.Scene) {
    super(scene, 'obstacle-shipwreck', COLORS.SHIPWRECK);
    this.kind = 'shipwreck';
  }
}