export interface IPoolable {
  setActive(active: boolean): this;
  setVisible(visible: boolean): this;
  reset(config?: unknown): void;
}

export class ObjectPool<T extends IPoolable> {
  private readonly available: T[] = [];
  private readonly inUse = new Set<T>();

  constructor(private readonly factory: () => T, initialSize = 0) {
    for (let index = 0; index < initialSize; index += 1) {
      const item = this.factory();
      item.setActive(false).setVisible(false);
      this.available.push(item);
    }
  }

  acquire(config?: unknown): T {
    const item = this.available.pop() ?? this.factory();
    item.reset(config);
    item.setActive(true).setVisible(true);
    this.inUse.add(item);
    return item;
  }

  release(item: T): void {
    if (!this.inUse.has(item)) {
      return;
    }

    this.inUse.delete(item);
    item.setActive(false).setVisible(false);
    this.available.push(item);
  }

  getActiveItems(): T[] {
    return [...this.inUse];
  }

  releaseWhere(predicate: (item: T) => boolean): void {
    for (const item of this.getActiveItems()) {
      if (predicate(item)) {
        this.release(item);
      }
    }
  }

  destroy(destroyer: (item: T) => void): void {
    [...this.available, ...this.inUse].forEach(destroyer);
    this.available.length = 0;
    this.inUse.clear();
  }
}
