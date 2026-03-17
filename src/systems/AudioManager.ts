export class AudioManager {
  private context: AudioContext | null = null;
  private readonly tones = new Map<string, { frequency: number; duration: number; type: OscillatorType }>([
    ['sfx_click', { frequency: 420, duration: 0.05, type: 'square' }],
    ['sfx_shield_break', { frequency: 260, duration: 0.12, type: 'triangle' }],
    ['sfx_revive', { frequency: 640, duration: 0.2, type: 'sine' }],
    ['sfx_evolve', { frequency: 760, duration: 0.24, type: 'sawtooth' }],
    ['sfx_death', { frequency: 180, duration: 0.18, type: 'square' }],
    ['sfx_powerup', { frequency: 540, duration: 0.12, type: 'triangle' }],
  ]);

  private ensureContext(): AudioContext | null {
    const AudioContextCtor = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) {
      return null;
    }

    this.context ??= new AudioContextCtor();
    if (this.context.state === 'suspended') {
      void this.context.resume();
    }
    return this.context;
  }

  play(key: string): void {
    const tone = this.tones.get(key);
    const context = this.ensureContext();
    if (!tone || !context) {
      return;
    }

    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    const now = context.currentTime;

    oscillator.type = tone.type;
    oscillator.frequency.value = tone.frequency;

    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.08, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + tone.duration);

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + tone.duration);
  }
}
