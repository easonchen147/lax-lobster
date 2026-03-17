import Phaser from 'phaser';

export class InputController {
  private pressed = false;
  private readonly latencies: number[] = [];
  private readonly maxSamples = 30;

  constructor(private readonly scene: Phaser.Scene) {
    this.scene.input.mouse?.disableContextMenu();
    this.scene.input.on('pointerdown', this.handlePointerDown, this);
    this.scene.input.on('pointerup', this.handlePointerUp, this);
    this.scene.input.on('pointerupoutside', this.handlePointerUp, this);
    this.scene.input.on('gameout', this.handlePointerUp, this);
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer): void {
    this.pressed = true;
    this.recordLatency(pointer);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    this.pressed = false;
    this.recordLatency(pointer);
  }

  private recordLatency(pointer: Phaser.Input.Pointer): void {
    const eventTimestamp = Number((pointer.event as Event & { timeStamp?: number })?.timeStamp ?? performance.now());
    const latency = Math.max(0, performance.now() - eventTimestamp);
    this.latencies.push(latency);
    if (this.latencies.length > this.maxSamples) {
      this.latencies.shift();
    }
  }

  isPressed(): boolean {
    return this.pressed;
  }

  getAverageLatency(): number {
    if (this.latencies.length === 0) {
      return 0;
    }

    const total = this.latencies.reduce((sum, latency) => sum + latency, 0);
    return Number((total / this.latencies.length).toFixed(2));
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.handlePointerDown, this);
    this.scene.input.off('pointerup', this.handlePointerUp, this);
    this.scene.input.off('pointerupoutside', this.handlePointerUp, this);
    this.scene.input.off('gameout', this.handlePointerUp, this);
  }
}
