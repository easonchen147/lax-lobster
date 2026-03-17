import { describe, expect, it } from 'vitest';

import { resolvePresentationPlatform } from '@/utils/DeviceDetector';

describe('DeviceDetector platform presentation', () => {
  it('detects desktop fullscreen presentation for wide fine-pointer screens', () => {
    expect(
      resolvePresentationPlatform({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        maxTouchPoints: 0,
        viewportWidth: 1440,
        viewportHeight: 900,
        coarsePointer: false,
      }),
    ).toBe('desktop');
  });

  it('keeps mobile presentation for narrow coarse-pointer screens', () => {
    expect(
      resolvePresentationPlatform({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
        maxTouchPoints: 5,
        viewportWidth: 390,
        viewportHeight: 844,
        coarsePointer: true,
      }),
    ).toBe('mobile');
  });
});