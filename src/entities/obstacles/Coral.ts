import Phaser from 'phaser';

import { COLORS } from '@/utils/Constants';
import { Obstacle } from './Obstacle';

export class Coral extends Obstacle {
  constructor(scene: Phaser.Scene) {
    super(scene, 'obstacle-coral', COLORS.CORAL);
    this.kind = 'coral';
  }
}