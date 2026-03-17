export type PresentationPlatform = 'desktop' | 'mobile';

export type PresentationProbe = {
  userAgent: string;
  maxTouchPoints: number;
  viewportWidth: number;
  viewportHeight: number;
  coarsePointer: boolean;
};

export const resolvePresentationPlatform = (probe: PresentationProbe): PresentationPlatform => {
  const mobileUa = /Android|iPhone|iPad|iPod|Mobile/i.test(probe.userAgent);
  const narrowViewport = Math.min(probe.viewportWidth, probe.viewportHeight) < 768;
  const touchHeavyDevice = probe.maxTouchPoints > 0 && probe.coarsePointer;

  return mobileUa || narrowViewport || touchHeavyDevice ? 'mobile' : 'desktop';
};

export class DeviceDetector {
  private static getProbe(): PresentationProbe {
    const coarsePointer = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(pointer: coarse)').matches
      : false;

    return {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      maxTouchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints : 0,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
      viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 720,
      coarsePointer,
    };
  }

  static getPresentationPlatform(): PresentationPlatform {
    return resolvePresentationPlatform(this.getProbe());
  }

  static isMobile(): boolean {
    return this.getPresentationPlatform() === 'mobile';
  }

  static isTouchDevice(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  static getTargetFPS(): number {
    return this.isMobile() ? 30 : 60;
  }

  static getScaleMode(): 'FIT' | 'RESIZE' {
    return 'FIT';
  }
}