import Phaser from 'phaser';

import { COLORS } from '@/utils/Constants';
import { Obstacle } from './Obstacle';

export class Seaweed extends Obstacle {
  constructor(scene: Phaser.Scene) {
    super(scene, 'obstacle-seaweed', COLORS.SEAWEED);
    this.kind = 'seaweed';
  }
}