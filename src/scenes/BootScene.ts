import Phaser from 'phaser';

import evolutionConfig from '@/config/LobsterEvolution.json';
import { createButton, createGlowOrb, createOceanBackdrop, createPanelBackground } from '@/ui/UiFactory';
import { createSceneNavigator, ensureSceneInputEnabled } from '@/ui/UiInteraction';
import { getStageTextureKey, UI_THEME } from '@/ui/UiTheme';
import {
  paintLobsterTexture,
  paintObstaclePreviewTexture,
  paintPredatorEelTexture,
  paintPredatorGrouperTexture,
  paintRevivePearlTexture,
  paintShieldBubbleTexture,
  paintSlowCurrentTexture,
} from '@/visuals/DeepSeaVisuals';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    ensureSceneInputEnabled(this);
    const navigate = createSceneNavigator(this);
    const stages = evolutionConfig.stages as Array<{ id: number; color: number }>;
    this.createLobsterTextures(stages);
    this.createWorldTextures();

    this.cameras.main.setBackgroundColor(UI_THEME.colors.oceanTop);
    createOceanBackdrop(this, { bubbleCount: 10, variant: 'menu' });

    createGlowOrb(this, 360, 430, 190, UI_THEME.colors.accentGold, 0.06);

    const heroPanel = this.add.container(360, 472).setDepth(UI_THEME.depths.surface);
    const heroCard = createPanelBackground(this, 600, 360, 'hero', UI_THEME.radii.xl);
    const previewHalo = this.add.circle(-156, -6, 106, UI_THEME.colors.accentTeal, 0.16);
    const preview = this.add.image(-156, -8, getStageTextureKey(0)).setScale(4.6);
    const eyebrow = this.add
      .text(24, -106, '可玩体验版', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '18px',
        color: UI_THEME.colors.textSecondary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const title = this.add
      .text(56, -30, '龙虾海底跑酷', {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '58px',
        color: UI_THEME.colors.textPrimary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(76, 44, '按住下潜，松开上浮，在海底一路进化冲分。', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '24px',
        color: UI_THEME.colors.textSecondary,
        align: 'center',
        wordWrap: { width: 310, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    heroPanel.add([heroCard, previewHalo, preview, eyebrow, title, subtitle]);

    const loadingPanel = this.add.container(360, 810).setDepth(UI_THEME.depths.surface + 1);
    const loadingCard = createPanelBackground(this, 560, 148, 'surface', UI_THEME.radii.lg);
    const loadingLabel = this.add
      .text(0, -38, '正在布置海底赛道', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '24px',
        color: UI_THEME.colors.textSecondary,
      })
      .setOrigin(0.5);
    const track = this.add.rectangle(-196, 14, 392, 18, 0x12324e, 1).setOrigin(0, 0.5);
    const fill = this.add.rectangle(-196, 14, 36, 18, UI_THEME.colors.accentGold, 1).setOrigin(0, 0.5);
    const percentText = this.add
      .text(214, 14, '8%', {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '26px',
        color: UI_THEME.colors.textPrimary,
      })
      .setOrigin(0.5);

    loadingPanel.add([loadingCard, loadingLabel, track, fill, percentText]);

    const skipButton = createButton(this, {
      x: 360,
      y: 1028,
      width: 240,
      height: 70,
      label: '进入海底',
      variant: 'secondary',
      onClick: () => navigate('MenuScene'),
    });

    this.tweens.addCounter({
      from: 8,
      to: 100,
      duration: 920,
      ease: 'Sine.Out',
      onUpdate: (tween) => {
        const value = Math.round(tween.getValue() ?? 0);
        fill.displayWidth = 392 * (value / 100);
        percentText.setText(`${value}%`);
      },
      onComplete: () => navigate('MenuScene'),
    });

    this.tweens.add({ targets: heroPanel, y: 456, duration: 900, ease: 'Sine.Out' });
    this.tweens.add({ targets: skipButton, alpha: 0.75, yoyo: true, duration: 1200, repeat: -1, ease: 'Sine.InOut' });
  }

  private createLobsterTextures(stages: Array<{ id: number; color: number }>): void {
    stages.forEach((stage) => {
      this.createTexture(
        getStageTextureKey(stage.id),
        (graphics) => paintLobsterTexture(graphics, 56, 56, stage.color),
        56,
        56,
      );
    });

    this.createTexture(
      'lobster-body',
      (graphics) => paintLobsterTexture(graphics, 56, 56, stages[0]?.color ?? UI_THEME.colors.accentCoral),
      56,
      56,
    );
  }

  private createWorldTextures(): void {
    this.createTexture(
      'obstacle-coral',
      (graphics) => paintObstaclePreviewTexture(graphics, 'coral', 80, 128),
      80,
      128,
    );

    this.createTexture(
      'obstacle-seaweed',
      (graphics) => paintObstaclePreviewTexture(graphics, 'seaweed', 80, 128),
      80,
      128,
    );

    this.createTexture(
      'obstacle-shipwreck',
      (graphics) => paintObstaclePreviewTexture(graphics, 'shipwreck', 108, 108),
      108,
      108,
    );

    this.createTexture(
      'predator-eel',
      (graphics) => paintPredatorEelTexture(graphics, 96, 40),
      96,
      40,
    );

    this.createTexture(
      'predator-grouper',
      (graphics) => paintPredatorGrouperTexture(graphics, 112, 64),
      112,
      64,
    );

    this.createTexture(
      'powerup-shieldBubble',
      (graphics) => paintShieldBubbleTexture(graphics, 64, 64),
      64,
      64,
    );

    this.createTexture(
      'powerup-slowCurrent',
      (graphics) => paintSlowCurrentTexture(graphics, 64, 64),
      64,
      64,
    );

    this.createTexture(
      'powerup-revivePearl',
      (graphics) => paintRevivePearlTexture(graphics, 64, 64),
      64,
      64,
    );
  }

  private createTexture(
    key: string,
    painter: (graphics: Phaser.GameObjects.Graphics) => void,
    width: number,
    height: number,
  ): void {
    if (this.textures.exists(key)) {
      return;
    }

    const graphics = this.add.graphics();
    graphics.setVisible(false);
    painter(graphics);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}

