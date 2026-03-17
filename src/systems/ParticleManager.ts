import Phaser from 'phaser';

type EffectPreset = {
  color: number;
  count: number;
  spread: number;
  duration: number;
  size: number;
};

const effectPresets: Record<string, EffectPreset> = {
  effect_shield_break: { color: 0x00bfff, count: 8, spread: 48, duration: 260, size: 4 },
  effect_death: { color: 0xff4d6d, count: 12, spread: 80, duration: 420, size: 5 },
  effect_evolve: { color: 0xffc857, count: 20, spread: 110, duration: 900, size: 5 },
  effect_powerup: { color: 0x64dfdf, count: 10, spread: 44, duration: 260, size: 4 },
  effect_bubble: { color: 0xf4f8ff, count: 6, spread: 32, duration: 1200, size: 3 },
};

export class ParticleManager {
  constructor(private readonly scene: Phaser.Scene) {}

  play(effectKey: keyof typeof effectPresets, x: number, y: number): void {
    const preset = effectPresets[effectKey];
    for (let index = 0; index < preset.count; index += 1) {
      const particle = this.scene.add.circle(x, y, preset.size, preset.color, 0.9);
      particle.setDepth(30);
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const distance = Phaser.Math.FloatBetween(preset.spread * 0.3, preset.spread);
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;
      const finalAlpha = effectKey === 'effect_bubble' ? 0.1 : 0;

      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: finalAlpha,
        scale: 0.2,
        duration: preset.duration,
        ease: effectKey === 'effect_evolve' ? 'Sine.Out' : 'Quad.Out',
        onComplete: () => particle.destroy(),
      });
    }
  }
}
