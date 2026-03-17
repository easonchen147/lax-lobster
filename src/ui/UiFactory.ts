import Phaser from 'phaser';

import { createContainerHitArea } from '@/ui/UiInteraction';
import { UI_THEME } from '@/ui/UiTheme';
import { GAME } from '@/utils/Constants';

export type PanelTone = 'surface' | 'hero' | 'muted' | 'warning' | 'danger' | 'success';
export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export type BannerWidget = {
  container: Phaser.GameObjects.Container;
  label: Phaser.GameObjects.Text;
};

export type MetricWidget = {
  container: Phaser.GameObjects.Container;
  labelText: Phaser.GameObjects.Text;
  valueText: Phaser.GameObjects.Text;
};

const PANEL_TONES: Record<PanelTone, { fill: number; stroke: number; highlightAlpha: number; shadowAlpha: number }> = {
  surface: { fill: UI_THEME.colors.surface, stroke: UI_THEME.colors.border, highlightAlpha: 0.08, shadowAlpha: 0.28 },
  hero: { fill: UI_THEME.colors.surfaceAlt, stroke: UI_THEME.colors.accentGold, highlightAlpha: 0.12, shadowAlpha: 0.32 },
  muted: { fill: UI_THEME.colors.surfaceMuted, stroke: UI_THEME.colors.borderSoft, highlightAlpha: 0.05, shadowAlpha: 0.22 },
  warning: { fill: 0x5a3b14, stroke: UI_THEME.colors.warning, highlightAlpha: 0.08, shadowAlpha: 0.24 },
  danger: { fill: 0x5b2230, stroke: 0xffa6b3, highlightAlpha: 0.08, shadowAlpha: 0.24 },
  success: { fill: 0x103943, stroke: UI_THEME.colors.success, highlightAlpha: 0.08, shadowAlpha: 0.24 },
};

const BUTTON_VARIANTS: Record<ButtonVariant, { fill: number; stroke: number; textColor: string }> = {
  primary: { fill: UI_THEME.colors.accentGold, stroke: 0xffe7a6, textColor: UI_THEME.colors.textStrong },
  secondary: { fill: UI_THEME.colors.surfaceAlt, stroke: UI_THEME.colors.border, textColor: UI_THEME.colors.textPrimary },
  danger: { fill: UI_THEME.colors.danger, stroke: 0xffbcc6, textColor: UI_THEME.colors.textPrimary },
};

const shiftColor = (value: number, delta: number): number => {
  const color = Phaser.Display.Color.ValueToColor(value);
  const red = Phaser.Math.Clamp(color.red + delta, 0, 255);
  const green = Phaser.Math.Clamp(color.green + delta, 0, 255);
  const blue = Phaser.Math.Clamp(color.blue + delta, 0, 255);
  return Phaser.Display.Color.GetColor(red, green, blue);
};

export const createGlowOrb = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha = 0.12,
  depth = UI_THEME.depths.decor,
): Phaser.GameObjects.Arc => scene.add.circle(x, y, radius, color, alpha).setDepth(depth);

export const createPanelBackground = (
  scene: Phaser.Scene,
  width: number,
  height: number,
  tone: PanelTone = 'surface',
  radius: number = Number(UI_THEME.radii.lg),
): Phaser.GameObjects.Graphics => {
  const palette = PANEL_TONES[tone];
  const graphics = scene.add.graphics();

  graphics.fillStyle(UI_THEME.colors.shadow, palette.shadowAlpha);
  graphics.fillRoundedRect(-width / 2 + 8, -height / 2 + 12, width, height, radius);

  graphics.fillStyle(palette.fill, 0.96);
  graphics.fillRoundedRect(-width / 2, -height / 2, width, height, radius);

  graphics.fillStyle(0xffffff, palette.highlightAlpha);
  graphics.fillRoundedRect(-width / 2 + 10, -height / 2 + 10, width - 20, Math.max(26, height * 0.24), radius - 8);

  graphics.lineStyle(2, palette.stroke, 0.95);
  graphics.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  graphics.lineStyle(1, shiftColor(palette.stroke, 18), 0.4);
  graphics.strokeRoundedRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, radius - 6);

  return graphics;
};

export const createOceanBackdrop = (
  scene: Phaser.Scene,
  options: { bubbleCount?: number; variant?: 'menu' | 'game' | 'result' } = {},
): void => {
  const bubbleCount = options.bubbleCount ?? 12;
  const variant = options.variant ?? 'menu';

  scene.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT / 2, GAME.WIDTH, GAME.HEIGHT, UI_THEME.colors.oceanTop, 1).setDepth(UI_THEME.depths.backdrop);
  scene.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT * 0.32, GAME.WIDTH, GAME.HEIGHT * 0.46, UI_THEME.colors.oceanMid, 0.46).setDepth(UI_THEME.depths.backdrop + 1);
  scene.add.rectangle(GAME.WIDTH / 2, GAME.HEIGHT * 0.78, GAME.WIDTH, GAME.HEIGHT * 0.64, UI_THEME.colors.oceanBottom, 0.32).setDepth(UI_THEME.depths.backdrop + 1);

  createGlowOrb(scene, 104, 112, 170, 0xffffff, 0.08, UI_THEME.depths.decor);
  createGlowOrb(scene, 590, 170, 210, UI_THEME.colors.accentTeal, 0.08, UI_THEME.depths.decor);
  createGlowOrb(scene, 660, 1150, 220, 0x0d6ba8, 0.14, UI_THEME.depths.decor);
  createGlowOrb(scene, 96, 1080, 180, UI_THEME.colors.accentGold, 0.05, UI_THEME.depths.decor);

  [122, 286, 528].forEach((x, index) => {
    scene.add
      .rectangle(x, 220 + index * 48, 84, 520, 0xffffff, 0.032)
      .setAngle(-12 + index * 5)
      .setDepth(UI_THEME.depths.decor);
  });

  if (variant !== 'result') {
    for (let index = 0; index < bubbleCount; index += 1) {
      const bubble = scene.add
        .circle(
          Phaser.Math.Between(24, GAME.WIDTH - 24),
          Phaser.Math.Between(40, GAME.HEIGHT - 40),
          Phaser.Math.Between(2, 6),
          0xf4f8ff,
          variant === 'game' ? 0.14 : 0.2,
        )
        .setDepth(UI_THEME.depths.decor + 1);

      scene.tweens.add({
        targets: bubble,
        y: bubble.y - Phaser.Math.Between(90, 220),
        alpha: variant === 'game' ? 0.03 : 0.05,
        duration: Phaser.Math.Between(2600, 4200),
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          bubble.y = Phaser.Math.Between(GAME.HEIGHT - 120, GAME.HEIGHT + 40);
          bubble.x = Phaser.Math.Between(24, GAME.WIDTH - 24);
          bubble.alpha = variant === 'game' ? 0.16 : 0.22;
        },
      });
    }
  }
};

export const createBanner = (
  scene: Phaser.Scene,
  options: {
    x: number;
    y: number;
    width: number;
    height?: number;
    text: string;
    tone?: PanelTone;
    fontSize?: string;
    depth?: number;
    textColor?: string;
  },
): BannerWidget => {
  const container = scene.add.container(options.x, options.y).setDepth(options.depth ?? UI_THEME.depths.surface);
  const panel = createPanelBackground(scene, options.width, options.height ?? 56, options.tone ?? 'surface', UI_THEME.radii.pill);
  const label = scene.add
    .text(0, 0, options.text, {
      fontFamily: UI_THEME.fonts.body,
      fontSize: options.fontSize ?? '22px',
      color: options.textColor ?? UI_THEME.colors.textPrimary,
      align: 'center',
      stroke: '#07233d',
      strokeThickness: 3,
      wordWrap: { width: options.width - 32, useAdvancedWrap: true },
    })
    .setOrigin(0.5)
    .setShadow(0, 2, 'rgba(1, 10, 18, 0.55)', 4, false, true);

  container.add([panel, label]);
  return { container, label };
};

export const createStatPill = (
  scene: Phaser.Scene,
  options: {
    x: number;
    y: number;
    width: number;
    height?: number;
    label: string;
    value: string;
    tone?: PanelTone;
    accent?: number;
    depth?: number;
    labelFontSize?: string;
    valueFontSize?: string;
  },
): MetricWidget => {
  const height = options.height ?? 96;
  const container = scene.add.container(options.x, options.y).setDepth(options.depth ?? UI_THEME.depths.surface);
  const panel = createPanelBackground(scene, options.width, height, options.tone ?? 'surface', height > 72 ? UI_THEME.radii.lg : UI_THEME.radii.pill);
  const accentLine = scene.add.rectangle(0, -height / 2 + 8, options.width - 28, 4, options.accent ?? UI_THEME.colors.accentTeal, 0.9);
  const labelText = scene.add
    .text(0, -height * 0.22, options.label, {
      fontFamily: UI_THEME.fonts.body,
      fontSize: options.labelFontSize ?? (height > 72 ? '18px' : '16px'),
      color: UI_THEME.colors.textSecondary,
      align: 'center',
    })
    .setOrigin(0.5)
    .setShadow(0, 2, 'rgba(1, 10, 18, 0.45)', 4, false, true);
  const valueText = scene.add
    .text(0, height > 72 ? 14 : 8, options.value, {
      fontFamily: UI_THEME.fonts.display,
      fontSize: options.valueFontSize ?? (height > 72 ? '30px' : '24px'),
      color: UI_THEME.colors.textPrimary,
      align: 'center',
      stroke: '#07233d',
      strokeThickness: 4,
      wordWrap: { width: options.width - 28, useAdvancedWrap: true },
    })
    .setOrigin(0.5)
    .setShadow(0, 3, 'rgba(1, 10, 18, 0.5)', 5, false, true);

  container.add([panel, accentLine, labelText, valueText]);
  return { container, labelText, valueText };
};

export const createButton = (
  scene: Phaser.Scene,
  options: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    subLabel?: string;
    variant?: ButtonVariant;
    depth?: number;
    hitPadding?: number;
    pulse?: boolean;
    pulseScale?: number;
    onClick: () => void;
  },
): Phaser.GameObjects.Container => {
  const variant = BUTTON_VARIANTS[options.variant ?? 'secondary'];
  const button = scene.add.container(options.x, options.y).setDepth(options.depth ?? UI_THEME.depths.surface + 2);
  const shadow = scene.add.graphics();
  const face = scene.add.graphics();
  const label = scene.add
    .text(0, options.subLabel ? -8 : 0, options.label, {
      fontFamily: UI_THEME.fonts.display,
      fontSize: options.subLabel ? '30px' : '28px',
      color: variant.textColor,
      fontStyle: 'bold',
      align: 'center',
      stroke: options.variant === 'primary' ? '#f7d885' : '#08233d',
      strokeThickness: options.variant === 'primary' ? 1 : 4,
    })
    .setOrigin(0.5)
    .setShadow(0, 3, 'rgba(1, 10, 18, 0.42)', 5, false, true);
  const subLabel = options.subLabel
    ? scene.add
        .text(0, 24, options.subLabel, {
          fontFamily: UI_THEME.fonts.body,
          fontSize: '16px',
          color: options.variant === 'primary' ? '#4b5662' : UI_THEME.colors.textSecondary,
          align: 'center',
        })
        .setOrigin(0.5)
    : undefined;

  const radius = Math.min(Number(UI_THEME.radii.xl), Math.floor(options.height / 2));
  const hitPadding = options.hitPadding ?? 16;
  const pulseScale = options.pulseScale ?? 1.025;
  let hovered = false;
  let pressed = false;
  let locked = false;
  let pulseTween: Phaser.Tweens.Tween | undefined;

  const draw = (): void => {
    const fill = pressed ? shiftColor(variant.fill, -16) : hovered ? shiftColor(variant.fill, 12) : variant.fill;
    const stroke = hovered ? shiftColor(variant.stroke, 12) : variant.stroke;

    shadow.clear();
    shadow.fillStyle(UI_THEME.colors.shadow, pressed ? 0.18 : 0.28);
    shadow.fillRoundedRect(-options.width / 2 + 6, -options.height / 2 + (pressed ? 8 : 12), options.width, options.height, radius);

    face.clear();
    face.fillStyle(fill, 1);
    face.fillRoundedRect(-options.width / 2, -options.height / 2, options.width, options.height, radius);
    face.fillStyle(0xffffff, hovered ? 0.12 : 0.08);
    face.fillRoundedRect(-options.width / 2 + 10, -options.height / 2 + 10, options.width - 20, Math.max(20, options.height * 0.28), radius - 10);
    face.lineStyle(2, stroke, 0.95);
    face.strokeRoundedRect(-options.width / 2, -options.height / 2, options.width, options.height, radius);
  };

  const stopPulse = (): void => {
    pulseTween?.stop();
    pulseTween?.remove();
    pulseTween = undefined;
  };

  const startPulse = (): void => {
    if (!options.pulse || hovered || pressed || pulseTween || !scene.sys.isActive()) {
      return;
    }

    pulseTween = scene.tweens.add({
      targets: button,
      scaleX: pulseScale,
      scaleY: pulseScale,
      duration: 860,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
      onStop: () => {
        pulseTween = undefined;
      },
    });
  };

  const triggerClick = (): void => {
    if (locked || !button.active || !button.input?.enabled) {
      return;
    }

    locked = true;
    pressed = false;
    button.y = options.y;
    button.setScale(1);
    draw();
    stopPulse();
    button.disableInteractive();
    options.onClick();
  };

  draw();
  button.add([shadow, face, label]);
  if (subLabel) {
    button.add(subLabel);
  }

  startPulse();
  button.once(Phaser.GameObjects.Events.DESTROY, stopPulse);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, stopPulse);

  button
    .setSize(options.width + hitPadding * 2, options.height + hitPadding * 2)
    .setInteractive(createContainerHitArea(options.width, options.height, hitPadding), Phaser.Geom.Rectangle.Contains)
    .on('pointerover', () => {
      if (locked) {
        return;
      }
      hovered = true;
      stopPulse();
      button.y = options.y;
      if (!pressed) {
        button.setScale(1.015);
      }
      draw();
    })
    .on('pointerout', () => {
      hovered = false;
      if (pressed) {
        pressed = false;
      }
      button.y = options.y;
      button.setScale(1);
      draw();
      stopPulse();
      startPulse();
    })
    .on('pointerdown', () => {
      if (locked) {
        return;
      }
      pressed = true;
      stopPulse();
      button.setScale(0.96);
      button.y = options.y + 4;
      draw();
    })
    .on('pointerup', () => {
      if (!pressed || locked) {
        return;
      }
      triggerClick();
    })
    .on('pointerupoutside', () => {
      if (!pressed || locked) {
        return;
      }

      pressed = false;
      button.y = options.y;
      button.setScale(hovered ? 1.015 : 1);
      draw();
      startPulse();
    });

  return button;
};
