import {
  PLAYER_DATA_KEY,
  PLAYER_DATA_VERSION,
  type PlayerData,
  getDefaultPlayerData,
  sanitizePlayerData,
} from './PlayerData';

type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

type GlobalWithStorage = typeof globalThis & {
  localStorage?: StorageLike;
};

const nativeLocalStorageSetItem = (() => {
  try {
    const storage = (globalThis as GlobalWithStorage).localStorage;
    return storage ? storage.setItem.bind(storage) : null;
  } catch {
    return null;
  }
})();

export { PLAYER_DATA_KEY };
export const DEFAULT_PLAYER_DATA = getDefaultPlayerData();

export class StorageManager {
  private static memoryCache = new Map<string, unknown>();
  private static degraded = false;

  private static getStorage(): StorageLike | null {
    const storage = (globalThis as GlobalWithStorage).localStorage;
    return storage ?? null;
  }

  private static parseJson<T>(raw: string | null): T | null {
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private static clone<T>(value: T): T {
    return structuredClone(value);
  }

  private static migratePlayerData(raw: unknown): PlayerData {
    if (!raw || typeof raw !== 'object') {
      return getDefaultPlayerData();
    }

    const candidate = raw as Partial<PlayerData> & { version?: number };
    return sanitizePlayerData({
      ...candidate,
      version: PLAYER_DATA_VERSION,
    });
  }

  private static commitToStorage(storage: StorageLike, key: string, serialized: string): void {
    storage.setItem(key, serialized);

    if (nativeLocalStorageSetItem && storage.getItem(key) !== serialized) {
      nativeLocalStorageSetItem(key, serialized);
    }
  }

  static save<T>(key: string, data: T): boolean {
    this.memoryCache.set(key, this.clone(data));
    const storage = this.getStorage();
    if (!storage) {
      this.degraded = true;
      return false;
    }

    try {
      this.commitToStorage(storage, key, JSON.stringify(data));
      this.degraded = false;
      return true;
    } catch {
      this.degraded = true;
      return false;
    }
  }

  static load<T>(key: string, fallback: T): T {
    const storage = this.getStorage();
    if (storage) {
      const parsed = this.parseJson<T>(storage.getItem(key));
      if (parsed !== null) {
        this.memoryCache.set(key, this.clone(parsed));
        this.degraded = false;
        return parsed;
      }
    }

    if (this.memoryCache.has(key)) {
      return this.clone(this.memoryCache.get(key) as T);
    }

    return this.clone(fallback);
  }

  static savePlayerData(data: PlayerData): boolean {
    const sanitized = sanitizePlayerData(data);
    return this.save(PLAYER_DATA_KEY, sanitized);
  }

  static loadPlayerData(): PlayerData {
    const storage = this.getStorage();
    const fallback = getDefaultPlayerData();

    if (storage) {
      const parsed = this.parseJson<unknown>(storage.getItem(PLAYER_DATA_KEY));
      if (parsed !== null) {
        const migrated = this.migratePlayerData(parsed);
        this.memoryCache.set(PLAYER_DATA_KEY, this.clone(migrated));
        if (JSON.stringify(parsed) !== JSON.stringify(migrated)) {
          this.savePlayerData(migrated);
        }
        this.degraded = false;
        return migrated;
      }
    }

    if (this.memoryCache.has(PLAYER_DATA_KEY)) {
      return sanitizePlayerData(this.memoryCache.get(PLAYER_DATA_KEY) as Partial<PlayerData>);
    }

    return fallback;
  }

  static flushMemoryToStorage(): boolean {
    const storage = this.getStorage();
    if (!storage) {
      this.degraded = true;
      return false;
    }

    try {
      for (const [key, value] of this.memoryCache.entries()) {
        this.commitToStorage(storage, key, JSON.stringify(value));
      }
      this.degraded = false;
      return true;
    } catch {
      this.degraded = true;
      return false;
    }
  }

  static isDegraded(): boolean {
    return this.degraded;
  }

  static clearForTests(): void {
    this.memoryCache.clear();
    this.degraded = false;
  }

  static resetForTests(): void {
    this.clearForTests();
  }
}
