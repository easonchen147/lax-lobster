import Phaser from 'phaser';

import { UI_THEME } from '@/ui/UiTheme';

export type DeepSeaObstacleKind = 'coral' | 'seaweed' | 'shipwreck';
export type ObstacleHazardFacing = 'up' | 'down';

type ObstacleHitboxScale = {
  width: number;
  height: number;
};

type ObstacleFatalBoundary = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
  centerX: number;
  y: number;
};

const OBSTACLE_HITBOX_SCALE: Record<
  DeepSeaObstacleKind | 'generic',
  ObstacleHitboxScale
> = {
  coral: { width: 0.62, height: 0.72 },
  seaweed: { width: 0.52, height: 0.78 },
  shipwreck: { width: 0.86, height: 0.72 },
  generic: { width: 0.8, height: 0.78 },
};

const quantize = (value: number, step: number, min: number): number =>
  Math.max(min, Math.round(value / step) * step);
const mixChannel = (left: number, right: number, ratio: number): number =>
  Math.round(left + (right - left) * Phaser.Math.Clamp(ratio, 0, 1));
const mixColor = (
  baseColor: number,
  accentColor: number,
  ratio: number,
): number => {
  const base = Phaser.Display.Color.ValueToColor(baseColor);
  const accent = Phaser.Display.Color.ValueToColor(accentColor);

  return Phaser.Display.Color.GetColor(
    mixChannel(base.red, accent.red, ratio),
    mixChannel(base.green, accent.green, ratio),
    mixChannel(base.blue, accent.blue, ratio),
  );
};

export const resolveObstacleTextureDimensions = (
  width: number,
  height: number,
): { width: number; height: number } => ({
  width: quantize(width, 4, 52),
  height: quantize(height, 12, 120),
});

export const resolveObstacleHazardProfile = (
  width: number,
  height: number,
): {
  outerStroke: number;
  innerStroke: number;
  markerRadius: number;
  glowAlpha: number;
} => {
  const base = Math.min(width, height);

  return {
    outerStroke: Math.max(2, Math.round(base * 0.04)),
    innerStroke: Math.max(1, Math.round(base * 0.022)),
    markerRadius: Number(Math.max(2.4, base * 0.055).toFixed(2)),
    glowAlpha: height >= 240 ? 0.24 : 0.2,
  };
};

export const resolveObstacleHitboxScale = (
  kind: DeepSeaObstacleKind | string,
): ObstacleHitboxScale =>
  OBSTACLE_HITBOX_SCALE[kind as DeepSeaObstacleKind] ??
  OBSTACLE_HITBOX_SCALE.generic;

export const resolveObstacleFatalBoundary = (
  kind: DeepSeaObstacleKind | string,
  width: number,
  height: number,
  hazardFacing: ObstacleHazardFacing,
): ObstacleFatalBoundary => {
  const hitboxScale = resolveObstacleHitboxScale(kind);
  const hitboxWidth = width * hitboxScale.width;
  const hitboxHeight = height * hitboxScale.height;
  const left = (width - hitboxWidth) / 2;
  const top = (height - hitboxHeight) / 2;
  const right = left + hitboxWidth;
  const bottom = top + hitboxHeight;

  return {
    left: Number(left.toFixed(2)),
    right: Number(right.toFixed(2)),
    top: Number(top.toFixed(2)),
    bottom: Number(bottom.toFixed(2)),
    width: Number(hitboxWidth.toFixed(2)),
    height: Number(hitboxHeight.toFixed(2)),
    centerX: Number((left + hitboxWidth / 2).toFixed(2)),
    y: Number((hazardFacing === 'down' ? bottom : top).toFixed(2)),
  };
};

export const resolveObstacleFatalMarkerProfile = (
  width: number,
  height: number,
): {
  haloWidth: number;
  haloHeight: number;
  beaconRadius: number;
  coreRadius: number;
  chevronWidth: number;
  chevronHeight: number;
  sideTickLength: number;
  sideTickGap: number;
} => {
  const base = Math.min(width, height);

  return {
    haloWidth: Number(Math.max(28, width * 0.28).toFixed(2)),
    haloHeight: Number(Math.max(16, base * 0.2).toFixed(2)),
    beaconRadius: Number(Math.max(6, base * 0.12).toFixed(2)),
    coreRadius: Number(Math.max(2.4, base * 0.05).toFixed(2)),
    chevronWidth: Number(Math.max(14, base * 0.24).toFixed(2)),
    chevronHeight: Number(Math.max(9, base * 0.14).toFixed(2)),
    sideTickLength: Number(Math.max(10, width * 0.12).toFixed(2)),
    sideTickGap: Number(Math.max(8, base * 0.16).toFixed(2)),
  };
};

export const resolveObstacleFatalPulseProfile = (
  intensity: number,
  pulse: number,
  width: number,
  height: number,
): {
  active: boolean;
  focus: number;
  alpha: number;
  haloWidth: number;
  haloHeight: number;
  trailWidth: number;
  trailLength: number;
  coreScale: number;
} => {
  const focus = Phaser.Math.Clamp((intensity - 0.28) / 0.72, 0, 1);
  const pulseBlend = Phaser.Math.Clamp(pulse, 0, 1);
  const pulseGain = 0.58 + pulseBlend * 0.42;
  const base = Math.min(width, height);

  return {
    active: focus > 0.04,
    focus: Number(focus.toFixed(3)),
    alpha: Number((focus * (0.24 + pulseBlend * 0.42)).toFixed(3)),
    haloWidth: Number(
      Math.max(32, width * (0.22 + focus * 0.14 * pulseGain)).toFixed(2),
    ),
    haloHeight: Number(
      Math.max(16, base * (0.12 + focus * 0.09 * pulseGain)).toFixed(2),
    ),
    trailWidth: Number(
      Math.max(14, base * (0.18 + focus * 0.12 * pulseGain)).toFixed(2),
    ),
    trailLength: Number(
      Math.max(12, base * (0.24 + focus * 0.18 * pulseGain)).toFixed(2),
    ),
    coreScale: Number((1 + focus * (0.16 + pulseBlend * 0.24)).toFixed(3)),
  };
};

export const resolveObstacleWarningIntensity = (
  horizontalGap: number,
  verticalGap: number,
  horizontalRange: number,
  verticalRange: number,
): number => {
  const horizontalProximity = Phaser.Math.Clamp(
    1 - horizontalGap / Math.max(horizontalRange, 1),
    0,
    1,
  );
  const verticalProximity = Phaser.Math.Clamp(
    1 - verticalGap / Math.max(verticalRange, 1),
    0,
    1,
  );

  return Number(
    (horizontalProximity * (0.55 + verticalProximity * 0.45)).toFixed(3),
  );
};

const generateTexture = (
  scene: Phaser.Scene,
  key: string,
  width: number,
  height: number,
  painter: (
    graphics: Phaser.GameObjects.Graphics,
    width: number,
    height: number,
  ) => void,
): void => {
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = scene.add.graphics();
  graphics.setVisible(false);
  painter(graphics, width, height);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
};

export const ensureObstacleTexture = (
  scene: Phaser.Scene,
  kind: DeepSeaObstacleKind,
  width: number,
  height: number,
  hazardFacing: ObstacleHazardFacing = 'down',
): { key: string; textureWidth: number; textureHeight: number } => {
  const textureSize = resolveObstacleTextureDimensions(width, height);
  const key = `obstacle-runtime-${kind}-${textureSize.width}x${textureSize.height}-${hazardFacing}`;

  generateTexture(
    scene,
    key,
    textureSize.width,
    textureSize.height,
    (graphics, textureWidth, textureHeight) => {
      paintObstacleTexture(
        graphics,
        kind,
        textureWidth,
        textureHeight,
        hazardFacing,
      );
    },
  );

  return {
    key,
    textureWidth: textureSize.width,
    textureHeight: textureSize.height,
  };
};

export const paintObstaclePreviewTexture = (
  graphics: Phaser.GameObjects.Graphics,
  kind: DeepSeaObstacleKind,
  width: number,
  height: number,
  hazardFacing: ObstacleHazardFacing = 'down',
): void => {
  paintObstacleTexture(graphics, kind, width, height, hazardFacing);
};

export const paintLobsterTexture = (
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  accentColor: number,
): void => {
  const centerX = width * 0.5;
  const shadowColor = 0x03131d;
  const shellDark = mixColor(0x081924, accentColor, 0.12);
  const shellBase = mixColor(0x123243, accentColor, 0.28);
  const shellCore = mixColor(0x195068, accentColor, 0.44);
  const shellGlow = mixColor(0x9df3ff, accentColor, 0.52);
  const eyeGlow = mixColor(0xe6feff, accentColor, 0.32);

  graphics.fillStyle(shadowColor, 0.34);
  graphics.fillEllipse(centerX, height * 0.72, width * 0.44, height * 0.2);

  graphics.fillStyle(shellDark, 0.96);
  graphics.fillTriangle(
    width * 0.28,
    height * 0.28,
    width * 0.1,
    height * 0.12,
    width * 0.16,
    height * 0.46,
  );
  graphics.fillTriangle(
    width * 0.72,
    height * 0.28,
    width * 0.9,
    height * 0.12,
    width * 0.84,
    height * 0.46,
  );
  graphics.fillEllipse(centerX, height * 0.6, width * 0.48, height * 0.36);
  graphics.fillEllipse(centerX, height * 0.3, width * 0.34, height * 0.22);
  graphics.fillTriangle(
    centerX,
    height * 0.9,
    width * 0.34,
    height * 0.72,
    width * 0.42,
    height * 0.98,
  );
  graphics.fillTriangle(
    centerX,
    height * 0.9,
    width * 0.66,
    height * 0.72,
    width * 0.58,
    height * 0.98,
  );

  graphics.fillStyle(shellBase, 0.98);
  graphics.fillTriangle(
    width * 0.3,
    height * 0.28,
    width * 0.14,
    height * 0.14,
    width * 0.2,
    height * 0.44,
  );
  graphics.fillTriangle(
    width * 0.7,
    height * 0.28,
    width * 0.86,
    height * 0.14,
    width * 0.8,
    height * 0.44,
  );
  graphics.fillEllipse(centerX, height * 0.6, width * 0.4, height * 0.3);
  graphics.fillEllipse(centerX, height * 0.3, width * 0.28, height * 0.18);
  graphics.fillRoundedRect(
    centerX - width * 0.08,
    height * 0.38,
    width * 0.16,
    height * 0.36,
    width * 0.06,
  );
  graphics.fillTriangle(
    centerX,
    height * 0.88,
    width * 0.38,
    height * 0.74,
    width * 0.46,
    height * 0.96,
  );
  graphics.fillTriangle(
    centerX,
    height * 0.88,
    width * 0.62,
    height * 0.74,
    width * 0.54,
    height * 0.96,
  );

  graphics.fillStyle(shellCore, 0.9);
  [0.44, 0.54, 0.64].forEach((ratio) => {
    graphics.fillEllipse(centerX, height * ratio, width * 0.24, height * 0.065);
  });
  graphics.fillEllipse(centerX, height * 0.26, width * 0.16, height * 0.05);
  graphics.fillCircle(width * 0.24, height * 0.37, width * 0.045);
  graphics.fillCircle(width * 0.76, height * 0.37, width * 0.045);

  graphics.lineStyle(2.2, shellGlow, 0.5);
  graphics.strokeEllipse(centerX, height * 0.6, width * 0.4, height * 0.3);
  graphics.strokeEllipse(centerX, height * 0.3, width * 0.28, height * 0.18);
  graphics.strokeLineShape(
    new Phaser.Geom.Line(
      width * 0.26,
      height * 0.18,
      width * 0.14,
      height * 0.06,
    ),
  );
  graphics.strokeLineShape(
    new Phaser.Geom.Line(
      width * 0.74,
      height * 0.18,
      width * 0.86,
      height * 0.06,
    ),
  );

  graphics.lineStyle(2, shellGlow, 0.42);
  [
    [width * 0.36, height * 0.64, width * 0.18, height * 0.8],
    [width * 0.44, height * 0.7, width * 0.28, height * 0.86],
    [width * 0.64, height * 0.64, width * 0.82, height * 0.8],
    [width * 0.56, height * 0.7, width * 0.72, height * 0.86],
  ].forEach(([fromX, fromY, toX, toY]) => {
    graphics.strokeLineShape(new Phaser.Geom.Line(fromX, fromY, toX, toY));
  });

  graphics.fillStyle(shellGlow, 0.2);
  graphics.fillEllipse(centerX, height * 0.2, width * 0.2, height * 0.08);
  graphics.fillCircle(width * 0.34, height * 0.54, width * 0.026);
  graphics.fillCircle(width * 0.66, height * 0.54, width * 0.026);
  graphics.fillCircle(width * 0.5, height * 0.68, width * 0.03);

  graphics.fillStyle(eyeGlow, 0.95);
  graphics.fillCircle(
    width * 0.44,
    height * 0.24,
    Math.max(1.6, width * 0.026),
  );
  graphics.fillCircle(
    width * 0.56,
    height * 0.24,
    Math.max(1.6, width * 0.026),
  );
  graphics.fillStyle(0x04121a, 0.95);
  graphics.fillCircle(
    width * 0.44,
    height * 0.24,
    Math.max(0.6, width * 0.011),
  );
  graphics.fillCircle(
    width * 0.56,
    height * 0.24,
    Math.max(0.6, width * 0.011),
  );
};

export const paintPredatorEelTexture = (
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void => {
  const midY = height * 0.5;
  graphics.fillStyle(0x062a37, 0.96);
  graphics.fillEllipse(width * 0.42, midY, width * 0.72, height * 0.54);
  graphics.fillTriangle(width * 0.12, midY, 0, height * 0.18, 0, height * 0.82);

  graphics.fillStyle(0x1d5f74, 0.98);
  graphics.fillEllipse(width * 0.44, midY, width * 0.66, height * 0.42);
  graphics.fillEllipse(width * 0.78, midY, width * 0.18, height * 0.28);

  graphics.fillStyle(0x8ff6ff, 0.42);
  graphics.fillEllipse(
    width * 0.4,
    midY - height * 0.1,
    width * 0.24,
    height * 0.12,
  );
  graphics.fillEllipse(
    width * 0.6,
    midY - height * 0.06,
    width * 0.18,
    height * 0.08,
  );

  graphics.fillStyle(0xbef8ff, 0.95);
  graphics.fillCircle(
    width * 0.72,
    midY - height * 0.1,
    Math.max(1.8, height * 0.08),
  );
  graphics.fillStyle(0x06223c, 0.95);
  graphics.fillCircle(
    width * 0.72,
    midY - height * 0.1,
    Math.max(0.8, height * 0.04),
  );

  graphics.lineStyle(2, 0x9df3ff, 0.35);
  graphics.strokeEllipse(width * 0.44, midY, width * 0.68, height * 0.42);
};

export const paintPredatorGrouperTexture = (
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void => {
  const midY = height * 0.5;
  graphics.fillStyle(0x152434, 0.98);
  graphics.fillEllipse(width * 0.42, midY, width * 0.64, height * 0.72);
  graphics.fillTriangle(
    width * 0.62,
    midY,
    width * 0.96,
    height * 0.18,
    width * 0.96,
    height * 0.82,
  );

  graphics.fillStyle(0x5b4f52, 0.98);
  graphics.fillEllipse(width * 0.4, midY, width * 0.56, height * 0.6);
  graphics.fillTriangle(
    width * 0.6,
    midY,
    width * 0.9,
    height * 0.24,
    width * 0.9,
    height * 0.76,
  );
  graphics.fillTriangle(
    width * 0.28,
    height * 0.26,
    width * 0.14,
    height * 0.12,
    width * 0.2,
    height * 0.42,
  );

  graphics.fillStyle(0xc9b29a, 0.28);
  [0.26, 0.36, 0.46, 0.56].forEach((ratio) => {
    graphics.fillRoundedRect(
      width * ratio,
      height * 0.24,
      width * 0.03,
      height * 0.52,
      2,
    );
  });

  graphics.fillStyle(0x9df3ff, 0.18);
  graphics.fillEllipse(
    width * 0.34,
    midY - height * 0.14,
    width * 0.16,
    height * 0.1,
  );

  graphics.fillStyle(0xcdeef9, 0.92);
  graphics.fillCircle(
    width * 0.3,
    midY - height * 0.08,
    Math.max(2, height * 0.07),
  );
  graphics.fillStyle(0x06223c, 0.95);
  graphics.fillCircle(
    width * 0.3,
    midY - height * 0.08,
    Math.max(0.8, height * 0.035),
  );
};

export const paintShieldBubbleTexture = (
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void => {
  const radius = Math.min(width, height) * 0.34;
  const cx = width * 0.5;
  const cy = height * 0.5;
  graphics.fillStyle(0x081f34, 0.16);
  graphics.fillCircle(cx, cy, radius + 8);

  graphics.lineStyle(4, 0x8eefff, 0.95);
  graphics.strokeCircle(cx, cy, radius);
  graphics.lineStyle(2, 0xd8fbff, 0.8);
  graphics.strokeCircle(cx, cy, radius - 6);

  graphics.fillStyle(0x64dfdf, 0.2);
  graphics.fillCircle(cx, cy, radius - 8);
  graphics.fillStyle(0xe6feff, 0.36);
  graphics.fillEllipse(cx - 8, cy - 10, radius * 0.7, radius * 0.42);
  graphics.fillCircle(cx + 12, cy + 10, 3);
  graphics.fillCircle(cx - 18, cy + 4, 2);
};

export const paintSlowCurrentTexture = (
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void => {
  const cx = width * 0.5;
  const cy = height * 0.5;
  graphics.lineStyle(4, 0x86f4ff, 0.9);
  graphics.strokeEllipse(cx, cy, width * 0.62, height * 0.42);
  graphics.strokeEllipse(cx, cy, width * 0.38, height * 0.64);
  graphics.lineStyle(2, 0xbffaff, 0.5);
  graphics.beginPath();
  graphics.arc(
    cx,
    cy,
    width * 0.22,
    Phaser.Math.DegToRad(210),
    Phaser.Math.DegToRad(18),
    false,
  );
  graphics.strokePath();
  graphics.beginPath();
  graphics.arc(
    cx,
    cy,
    width * 0.3,
    Phaser.Math.DegToRad(36),
    Phaser.Math.DegToRad(162),
    false,
  );
  graphics.strokePath();
  graphics.fillStyle(0x7bdff2, 0.18);
  graphics.fillCircle(cx, cy, width * 0.18);
};

export const paintRevivePearlTexture = (
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
): void => {
  const cx = width * 0.5;
  const cy = height * 0.5;
  graphics.fillStyle(0x1d1d34, 0.96);
  graphics.fillEllipse(cx, cy + 5, width * 0.58, height * 0.52);
  graphics.fillStyle(0x8c6eb7, 0.9);
  graphics.fillEllipse(cx, cy + 2, width * 0.52, height * 0.42);
  graphics.fillStyle(0xfff3d6, 0.98);
  graphics.fillCircle(cx, cy - 2, Math.min(width, height) * 0.16);
  graphics.fillStyle(0xffffff, 0.58);
  graphics.fillCircle(cx - 5, cy - 8, 4);
  graphics.lineStyle(2, 0xd9c6ff, 0.45);
  graphics.strokeEllipse(cx, cy + 2, width * 0.52, height * 0.42);
};

export const decorateGameBackdrop = (scene: Phaser.Scene): void => {
  const farSilhouettes = scene.add
    .graphics()
    .setDepth(UI_THEME.depths.backdrop + 2);
  farSilhouettes.fillStyle(0x07273b, 0.24);
  farSilhouettes.fillEllipse(92, 936, 180, 220);
  farSilhouettes.fillEllipse(642, 968, 220, 260);
  farSilhouettes.fillRoundedRect(228, 878, 74, 250, 32);
  farSilhouettes.fillRoundedRect(490, 844, 86, 288, 36);
  farSilhouettes.fillTriangle(352, 930, 404, 1068, 450, 930);
  farSilhouettes.fillTriangle(568, 968, 620, 1140, 674, 968);

  const midGlow = scene.add.graphics().setDepth(UI_THEME.depths.decor + 1);
  midGlow.fillStyle(0x0f6f92, 0.1);
  midGlow.fillEllipse(592, 230, 240, 180);
  midGlow.fillStyle(0x64dfdf, 0.06);
  midGlow.fillEllipse(110, 1072, 180, 140);
  midGlow.fillEllipse(636, 1116, 220, 150);

  const foreground = scene.add.graphics().setDepth(UI_THEME.depths.decor + 2);
  foreground.fillStyle(0x081b2d, 0.48);
  foreground.fillRoundedRect(-20, 1024, 140, 288, 42);
  foreground.fillRoundedRect(604, 1004, 156, 312, 46);
  foreground.fillStyle(0x11414a, 0.4);
  foreground.fillRoundedRect(18, 1062, 18, 150, 9);
  foreground.fillRoundedRect(46, 1028, 20, 188, 10);
  foreground.fillRoundedRect(82, 1080, 14, 122, 7);
  foreground.fillRoundedRect(632, 1046, 16, 156, 8);
  foreground.fillRoundedRect(664, 1018, 18, 194, 9);
  foreground.fillRoundedRect(698, 1088, 14, 118, 7);
  foreground.fillStyle(0x9df3ff, 0.09);
  foreground.fillCircle(54, 1118, 5);
  foreground.fillCircle(668, 1090, 4);
};

const paintObstacleTexture = (
  graphics: Phaser.GameObjects.Graphics,
  kind: DeepSeaObstacleKind,
  width: number,
  height: number,
  hazardFacing: ObstacleHazardFacing,
): void => {
  if (kind === 'coral') {
    paintCoralObstacle(graphics, width, height, hazardFacing);
    return;
  }

  if (kind === 'seaweed') {
    paintSeaweedObstacle(graphics, width, height, hazardFacing);
    return;
  }

  paintShipwreckObstacle(graphics, width, height, hazardFacing);
};

const paintCoralObstacle = (
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  hazardFacing: ObstacleHazardFacing,
): void => {
  const centerX = width * 0.5;
  const branchWidth = Math.max(10, width * 0.16);
  const baseHeight = Math.max(34, height * 0.18);
  const topY = 16;
  const bottomY = height - baseHeight - 12;
  const leftX = width * 0.26;
  const rightX = width * 0.74;
  const hazard = resolveObstacleHazardProfile(width, height);
  const fatalBoundary = resolveObstacleFatalBoundary(
    'coral',
    width,
    height,
    hazardFacing,
  );
  const fatalMarker = resolveObstacleFatalMarkerProfile(width, height);

  paintObstacleSeparationGlow(
    graphics,
    width,
    fatalBoundary.y,
    hazardFacing,
    hazard,
    fatalMarker,
  );

  graphics.fillStyle(0x240f24, 0.94);
  graphics.fillRoundedRect(
    centerX - branchWidth / 2,
    topY + 12,
    branchWidth,
    bottomY - topY,
    branchWidth / 2,
  );
  graphics.fillRoundedRect(
    leftX - branchWidth / 2,
    height * 0.24,
    branchWidth,
    height * 0.36,
    branchWidth / 2,
  );
  graphics.fillRoundedRect(
    rightX - branchWidth / 2,
    height * 0.2,
    branchWidth,
    height * 0.38,
    branchWidth / 2,
  );
  graphics.fillRoundedRect(
    width * 0.18 - branchWidth / 2,
    height * 0.54,
    branchWidth * 0.84,
    height * 0.22,
    branchWidth / 2,
  );
  graphics.fillRoundedRect(
    width * 0.82 - branchWidth / 2,
    height * 0.52,
    branchWidth * 0.84,
    height * 0.22,
    branchWidth / 2,
  );

  graphics.fillStyle(0x803c62, 0.98);
  graphics.fillRoundedRect(
    centerX - branchWidth * 0.34,
    topY,
    branchWidth * 0.68,
    bottomY - topY,
    branchWidth / 2,
  );
  graphics.fillRoundedRect(
    leftX - branchWidth * 0.28,
    height * 0.24,
    branchWidth * 0.56,
    height * 0.34,
    branchWidth / 2,
  );
  graphics.fillRoundedRect(
    rightX - branchWidth * 0.28,
    height * 0.2,
    branchWidth * 0.56,
    height * 0.36,
    branchWidth / 2,
  );
  graphics.fillRoundedRect(
    width * 0.18 - branchWidth * 0.22,
    height * 0.54,
    branchWidth * 0.44,
    height * 0.18,
    branchWidth / 2,
  );
  graphics.fillRoundedRect(
    width * 0.82 - branchWidth * 0.22,
    height * 0.52,
    branchWidth * 0.44,
    height * 0.18,
    branchWidth / 2,
  );

  graphics.fillStyle(0xbe6d9c, 0.54);
  [topY + 18, height * 0.28, height * 0.44, height * 0.62].forEach((y) => {
    graphics.fillEllipse(
      centerX + branchWidth * 0.18,
      y,
      branchWidth * 0.72,
      Math.max(14, height * 0.08),
    );
  });
  graphics.fillEllipse(leftX, height * 0.34, branchWidth * 0.82, height * 0.09);
  graphics.fillEllipse(rightX, height * 0.3, branchWidth * 0.82, height * 0.09);

  graphics.fillStyle(0x9df3ff, 0.12);
  graphics.fillCircle(width * 0.22, height * 0.14, 2.4);
  graphics.fillCircle(width * 0.68, height * 0.26, 2.6);
  graphics.fillCircle(width * 0.78, height * 0.72, 3.2);

  graphics.fillStyle(0x4f1b3f, 0.98);
  graphics.fillEllipse(centerX, height - 12, width * 0.4, baseHeight);

  graphics.lineStyle(hazard.outerStroke, 0x8feaff, 0.18);
  graphics.strokeRoundedRect(
    centerX - branchWidth * 0.34,
    topY,
    branchWidth * 0.68,
    bottomY - topY,
    branchWidth / 2,
  );
  graphics.strokeRoundedRect(
    leftX - branchWidth * 0.28,
    height * 0.24,
    branchWidth * 0.56,
    height * 0.34,
    branchWidth / 2,
  );
  graphics.strokeRoundedRect(
    rightX - branchWidth * 0.28,
    height * 0.2,
    branchWidth * 0.56,
    height * 0.36,
    branchWidth / 2,
  );

  paintHazardSweep(
    graphics,
    fatalBoundary.left + fatalBoundary.width * 0.08,
    fatalBoundary.right - fatalBoundary.width * 0.08,
    fatalBoundary.y,
    fatalBoundary.width * 0.14,
    hazard,
  );
  paintHazardNodes(
    graphics,
    [
      fatalBoundary.left + fatalBoundary.width * 0.22,
      fatalBoundary.centerX,
      fatalBoundary.right - fatalBoundary.width * 0.22,
    ],
    fatalBoundary.y,
    hazard,
  );
  paintFatalThresholdMarker(
    graphics,
    fatalBoundary.centerX,
    fatalBoundary.y,
    hazardFacing,
    hazard,
    fatalMarker,
  );
};

const paintSeaweedObstacle = (
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  hazardFacing: ObstacleHazardFacing,
): void => {
  const stems = [
    { x: width * 0.22, w: width * 0.12, h: height * 0.82, y: height * 0.14 },
    { x: width * 0.5, w: width * 0.14, h: height * 0.9, y: height * 0.08 },
    { x: width * 0.76, w: width * 0.11, h: height * 0.84, y: height * 0.12 },
  ];
  const hazard = resolveObstacleHazardProfile(width, height);
  const fatalBoundary = resolveObstacleFatalBoundary(
    'seaweed',
    width,
    height,
    hazardFacing,
  );
  const fatalMarker = resolveObstacleFatalMarkerProfile(width, height);

  paintObstacleSeparationGlow(
    graphics,
    width,
    fatalBoundary.y,
    hazardFacing,
    hazard,
    fatalMarker,
  );

  graphics.fillStyle(0x07212a, 0.94);
  stems.forEach((stem) => {
    graphics.fillRoundedRect(
      stem.x - stem.w / 2,
      stem.y,
      stem.w,
      stem.h,
      stem.w / 2,
    );
  });

  graphics.fillStyle(0x14454f, 0.98);
  stems.forEach((stem) => {
    graphics.fillRoundedRect(
      stem.x - stem.w * 0.34,
      stem.y,
      stem.w * 0.68,
      stem.h,
      stem.w / 2,
    );
    graphics.fillEllipse(stem.x, stem.y + 8, stem.w * 1.1, 28);
  });

  graphics.fillStyle(0x2c8a7b, 0.84);
  stems.forEach((stem, index) => {
    const glowX = stem.x + (index - 1) * 2;
    graphics.fillRoundedRect(
      glowX - stem.w * 0.11,
      stem.y + 18,
      stem.w * 0.22,
      stem.h - 32,
      stem.w / 3,
    );
  });

  graphics.fillStyle(0x9df3ff, 0.1);
  graphics.fillEllipse(width * 0.2, height * 0.2, width * 0.08, 24);
  graphics.fillEllipse(width * 0.48, height * 0.34, width * 0.08, 22);
  graphics.fillEllipse(width * 0.78, height * 0.28, width * 0.08, 22);

  graphics.lineStyle(hazard.outerStroke, 0x8feaff, 0.16);
  stems.forEach((stem) => {
    graphics.strokeRoundedRect(
      stem.x - stem.w * 0.34,
      stem.y,
      stem.w * 0.68,
      stem.h,
      stem.w / 2,
    );
  });

  paintHazardSweep(
    graphics,
    fatalBoundary.left + fatalBoundary.width * 0.1,
    fatalBoundary.right - fatalBoundary.width * 0.1,
    fatalBoundary.y,
    fatalBoundary.width * 0.12,
    hazard,
  );
  paintHazardNodes(
    graphics,
    [
      fatalBoundary.left + fatalBoundary.width * 0.2,
      fatalBoundary.centerX,
      fatalBoundary.right - fatalBoundary.width * 0.2,
    ],
    fatalBoundary.y,
    hazard,
  );
  paintFatalThresholdMarker(
    graphics,
    fatalBoundary.centerX,
    fatalBoundary.y,
    hazardFacing,
    hazard,
    fatalMarker,
  );
};

const paintShipwreckObstacle = (
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  hazardFacing: ObstacleHazardFacing,
): void => {
  const hullHeight = Math.max(72, height * 0.34);
  const hullY = height - hullHeight - 18;
  const mastWidth = Math.max(18, width * 0.18);
  const mastHeight = Math.max(120, height * 0.46);
  const mastX = width * 0.5 - mastWidth / 2;
  const mastY = Math.max(12, hullY - mastHeight + 14);
  const hazard = resolveObstacleHazardProfile(width, height);
  const fatalBoundary = resolveObstacleFatalBoundary(
    'shipwreck',
    width,
    height,
    hazardFacing,
  );
  const fatalMarker = resolveObstacleFatalMarkerProfile(width, height);

  paintObstacleSeparationGlow(
    graphics,
    width,
    fatalBoundary.y,
    hazardFacing,
    hazard,
    fatalMarker,
  );

  graphics.fillStyle(0x1e1820, 0.95);
  graphics.fillRoundedRect(width * 0.18, hullY, width * 0.64, hullHeight, 18);
  graphics.fillRoundedRect(mastX, mastY, mastWidth, mastHeight, 10);

  graphics.fillStyle(0x5a4338, 0.98);
  graphics.fillRoundedRect(
    width * 0.2,
    hullY + 8,
    width * 0.6,
    hullHeight - 12,
    16,
  );
  graphics.fillRoundedRect(mastX + 3, mastY, mastWidth - 6, mastHeight, 8);

  graphics.fillStyle(0x8b6e58, 0.48);
  [0.3, 0.42, 0.54, 0.66].forEach((ratio) => {
    graphics.fillRoundedRect(
      width * ratio,
      hullY + 16,
      width * 0.05,
      hullHeight - 28,
      4,
    );
  });

  graphics.fillStyle(0x0d2233, 0.92);
  graphics.fillCircle(width * 0.34, hullY + hullHeight * 0.42, width * 0.08);
  graphics.fillCircle(width * 0.66, hullY + hullHeight * 0.42, width * 0.08);
  graphics.fillRoundedRect(width * 0.46, mastY + 12, width * 0.08, 22, 4);

  graphics.lineStyle(2, 0x9edbf0, 0.18);
  graphics.strokeRoundedRect(
    width * 0.2,
    hullY + 8,
    width * 0.6,
    hullHeight - 12,
    16,
  );
  graphics.strokeCircle(width * 0.34, hullY + hullHeight * 0.42, width * 0.08);
  graphics.strokeCircle(width * 0.66, hullY + hullHeight * 0.42, width * 0.08);

  graphics.lineStyle(hazard.outerStroke, 0x8feaff, 0.16);
  graphics.strokeRoundedRect(
    width * 0.2,
    hullY + 8,
    width * 0.6,
    hullHeight - 12,
    16,
  );
  graphics.strokeRoundedRect(mastX + 3, mastY, mastWidth - 6, mastHeight, 8);

  paintHazardSweep(
    graphics,
    fatalBoundary.left + fatalBoundary.width * 0.06,
    fatalBoundary.right - fatalBoundary.width * 0.06,
    fatalBoundary.y,
    fatalBoundary.width * 0.18,
    hazard,
  );
  paintHazardNodes(
    graphics,
    [
      fatalBoundary.left + fatalBoundary.width * 0.18,
      fatalBoundary.centerX,
      fatalBoundary.right - fatalBoundary.width * 0.18,
    ],
    fatalBoundary.y,
    hazard,
  );
  paintFatalThresholdMarker(
    graphics,
    fatalBoundary.centerX,
    fatalBoundary.y,
    hazardFacing,
    hazard,
    fatalMarker,
  );
};

const paintObstacleSeparationGlow = (
  graphics: Phaser.GameObjects.Graphics,
  width: number,
  boundaryY: number,
  hazardFacing: ObstacleHazardFacing,
  hazard: ReturnType<typeof resolveObstacleHazardProfile>,
  fatalMarker: ReturnType<typeof resolveObstacleFatalMarkerProfile>,
): void => {
  const dangerDirection = hazardFacing === 'down' ? -1 : 1;
  const fadeY =
    boundaryY + dangerDirection * Math.max(12, fatalMarker.chevronHeight * 1.1);

  graphics.fillStyle(0x051823, 0.22);
  graphics.fillEllipse(
    width * 0.5,
    fadeY,
    width * 0.78,
    Math.max(24, fatalMarker.haloHeight * 1.5),
  );
  graphics.fillStyle(0x86f4ff, hazard.glowAlpha);
  graphics.fillEllipse(
    width * 0.5,
    boundaryY,
    width * 0.52,
    Math.max(14, fatalMarker.haloHeight * 0.84),
  );
};

const paintHazardSweep = (
  graphics: Phaser.GameObjects.Graphics,
  startX: number,
  endX: number,
  y: number,
  glowWidth: number,
  hazard: ReturnType<typeof resolveObstacleHazardProfile>,
): void => {
  graphics.lineStyle(hazard.outerStroke, 0x9ef4ff, 0.58);
  graphics.strokeLineShape(new Phaser.Geom.Line(startX, y, endX, y));
  graphics.lineStyle(hazard.innerStroke, 0xffd88f, 0.92);
  graphics.strokeLineShape(
    new Phaser.Geom.Line(
      startX + glowWidth * 0.12,
      y,
      endX - glowWidth * 0.12,
      y,
    ),
  );
};

const paintHazardNodes = (
  graphics: Phaser.GameObjects.Graphics,
  xValues: number[],
  yValues: number | number[],
  hazard: ReturnType<typeof resolveObstacleHazardProfile>,
): void => {
  xValues.forEach((x, index) => {
    const y = Array.isArray(yValues)
      ? (yValues[index] ?? yValues[yValues.length - 1])
      : yValues;
    graphics.fillStyle(0x90f7ff, hazard.glowAlpha + 0.08);
    graphics.fillCircle(x, y, hazard.markerRadius * 1.65);
    graphics.fillStyle(0xffd88f, 0.9);
    graphics.fillCircle(x, y, hazard.markerRadius);
    graphics.fillStyle(0xeefcff, 0.95);
    graphics.fillCircle(x, y, Math.max(1.2, hazard.markerRadius * 0.42));
  });
};

const paintFatalThresholdMarker = (
  graphics: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  hazardFacing: ObstacleHazardFacing,
  hazard: ReturnType<typeof resolveObstacleHazardProfile>,
  marker: ReturnType<typeof resolveObstacleFatalMarkerProfile>,
): void => {
  const dangerDirection = hazardFacing === 'down' ? -1 : 1;
  const chevronTipY = y + dangerDirection * marker.chevronHeight;
  const chevronBaseY =
    y + dangerDirection * Math.max(2.5, marker.chevronHeight * 0.2);
  const tickLeftInner = x - marker.sideTickGap;
  const tickRightInner = x + marker.sideTickGap;
  const tickLeftOuter = tickLeftInner - marker.sideTickLength;
  const tickRightOuter = tickRightInner + marker.sideTickLength;

  graphics.fillStyle(0x86f4ff, 0.2);
  graphics.fillEllipse(x, y, marker.haloWidth, marker.haloHeight);

  graphics.fillStyle(0xffd88f, 0.16);
  graphics.fillTriangle(
    x,
    chevronTipY,
    x - marker.chevronWidth * 0.52,
    chevronBaseY,
    x + marker.chevronWidth * 0.52,
    chevronBaseY,
  );

  graphics.lineStyle(hazard.innerStroke, 0xfaf4cf, 0.88);
  graphics.strokeLineShape(
    new Phaser.Geom.Line(tickLeftOuter, y, tickLeftInner, y),
  );
  graphics.strokeLineShape(
    new Phaser.Geom.Line(tickRightInner, y, tickRightOuter, y),
  );
  graphics.strokeLineShape(
    new Phaser.Geom.Line(
      x - marker.chevronWidth * 0.42,
      chevronBaseY,
      x,
      chevronTipY,
    ),
  );
  graphics.strokeLineShape(
    new Phaser.Geom.Line(
      x + marker.chevronWidth * 0.42,
      chevronBaseY,
      x,
      chevronTipY,
    ),
  );

  graphics.fillStyle(0x122f3c, 0.94);
  graphics.fillTriangle(
    x,
    y - marker.beaconRadius,
    x + marker.beaconRadius,
    y,
    x,
    y + marker.beaconRadius,
  );
  graphics.fillTriangle(
    x,
    y - marker.beaconRadius,
    x - marker.beaconRadius,
    y,
    x,
    y + marker.beaconRadius,
  );

  graphics.lineStyle(Math.max(1, hazard.innerStroke), 0xffd88f, 0.94);
  graphics.strokeTriangle(
    x,
    y - marker.beaconRadius,
    x + marker.beaconRadius,
    y,
    x,
    y + marker.beaconRadius,
  );
  graphics.strokeTriangle(
    x,
    y - marker.beaconRadius,
    x - marker.beaconRadius,
    y,
    x,
    y + marker.beaconRadius,
  );

  graphics.fillStyle(0xf2fdff, 0.98);
  graphics.fillCircle(x, y, marker.coreRadius);
};
