import Phaser from 'phaser';

import { GameState } from '@/data/GameState';
import { EvolutionManager } from '@/systems/EvolutionManager';
import { createBanner, createPanelBackground, createStatPill, type BannerWidget, type MetricWidget } from '@/ui/UiFactory';
import { formatUiNumber, UI_THEME } from '@/ui/UiTheme';
import { TIMINGS } from '@/utils/Constants';

export const HUD_LAYOUT = {
  scoreCard: { x: 138, y: 78, width: 190, height: 96 },
  stageCard: { x: 360, y: 78, width: 226, height: 96 },
  resourcePanel: { x: 594, y: 98, width: 170, height: 176 },
  shieldCard: { x: 594, y: 56, width: 144, height: 68 },
  reviveCard: { x: 594, y: 138, width: 144, height: 68 },
  warningBanner: { x: 330, y: 160, width: 348, height: 54 },
} as const;

export class HUD {
  private readonly scoreCard: MetricWidget;
  private readonly stageCard: MetricWidget;
  private readonly shieldCard: MetricWidget;
  private readonly reviveCard: MetricWidget;
  private readonly resourcePanel: Phaser.GameObjects.Graphics;
  private readonly warningBanner: BannerWidget;
  private readonly evolutionManager = new EvolutionManager();
  private lastScoreUpdate = 0;

  private readonly scoreChangedHandler = (score: number): void => {
    this.scoreCard.valueText.setText(formatUiNumber(score));
    this.scene.tweens.killTweensOf(this.scoreCard.container);
    this.scoreCard.container.setScale(1);
    this.scene.tweens.add({
      targets: this.scoreCard.container,
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 120,
      yoyo: true,
      ease: 'Quad.Out',
    });

    if (score > 0 && score % 10 === 0) {
      const floatingText = this.scene.add
        .text(138, 20, '+10', {
          fontFamily: UI_THEME.fonts.display,
          fontSize: '26px',
          color: '#ffc857',
          stroke: '#07233d',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(UI_THEME.depths.toast);

      this.scene.tweens.add({
        targets: floatingText,
        y: floatingText.y - 34,
        alpha: 0,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 520,
        ease: 'Quad.Out',
        onComplete: () => floatingText.destroy(),
      });
    }
  };

  private readonly shieldChangedHandler = (count: number): void => {
    this.shieldCard.valueText.setText(`${count}`);
  };

  private readonly freeReviveChangedHandler = (count: number): void => {
    this.reviveCard.valueText.setText(`${count}`);
  };

  private readonly storageChangedHandler = (visible: boolean): void => {
    this.warningBanner.container.setVisible(visible);
  };

  private readonly activeStageChangedHandler = (stageId: number): void => {
    const stageName = this.evolutionManager.getStage(stageId).name;
    this.stageCard.valueText.setText(stageName);
  };

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly gameState: GameState,
  ) {
    this.resourcePanel = createPanelBackground(
      scene,
      HUD_LAYOUT.resourcePanel.width,
      HUD_LAYOUT.resourcePanel.height,
      'muted',
      UI_THEME.radii.xl,
    )
      .setDepth(UI_THEME.depths.hud - 1)
      .setPosition(HUD_LAYOUT.resourcePanel.x, HUD_LAYOUT.resourcePanel.y);

    this.scoreCard = createStatPill(scene, {
      ...HUD_LAYOUT.scoreCard,
      label: '分数',
      value: '0',
      accent: UI_THEME.colors.accentGold,
      depth: UI_THEME.depths.hud,
    });
    this.stageCard = createStatPill(scene, {
      ...HUD_LAYOUT.stageCard,
      label: '当前形态',
      value: this.evolutionManager.getStage(this.gameState.getActiveStage()).name,
      accent: UI_THEME.colors.accentTeal,
      depth: UI_THEME.depths.hud,
      valueFontSize: '18px',
    });
    this.shieldCard = createStatPill(scene, {
      ...HUD_LAYOUT.shieldCard,
      label: '护盾',
      value: `${this.gameState.getShieldCount()}`,
      accent: UI_THEME.colors.accentTeal,
      depth: UI_THEME.depths.hud,
      valueFontSize: '24px',
      labelFontSize: '15px',
      tone: 'surface',
    });
    this.reviveCard = createStatPill(scene, {
      ...HUD_LAYOUT.reviveCard,
      label: '复活',
      value: `${this.gameState.getFreeRevives()}`,
      accent: UI_THEME.colors.accentGold,
      depth: UI_THEME.depths.hud,
      valueFontSize: '24px',
      labelFontSize: '15px',
      tone: 'surface',
    });
    this.warningBanner = createBanner(scene, {
      ...HUD_LAYOUT.warningBanner,
      text: '当前为内存模式，本次进度不会自动持久化。',
      tone: 'warning',
      fontSize: '15px',
      depth: UI_THEME.depths.hud,
    });
    this.warningBanner.container.setVisible(gameState.isStorageDegraded());

    this.gameState.on('scoreChanged', this.scoreChangedHandler);
    this.gameState.on('shieldChanged', this.shieldChangedHandler);
    this.gameState.on('freeRevivesChanged', this.freeReviveChangedHandler);
    this.gameState.on('storageDegradedChanged', this.storageChangedHandler);
    this.gameState.on('activeStageChanged', this.activeStageChangedHandler);
  }

  update(time: number): void {
    if (time - this.lastScoreUpdate < TIMINGS.HUD_SCORE_INTERVAL) {
      return;
    }

    this.lastScoreUpdate = time;
    this.scoreCard.valueText.setText(formatUiNumber(this.gameState.getScore()));
  }

  destroy(): void {
    this.gameState.off('scoreChanged', this.scoreChangedHandler);
    this.gameState.off('shieldChanged', this.shieldChangedHandler);
    this.gameState.off('freeRevivesChanged', this.freeReviveChangedHandler);
    this.gameState.off('storageDegradedChanged', this.storageChangedHandler);
    this.gameState.off('activeStageChanged', this.activeStageChangedHandler);

    this.scoreCard.container.destroy(true);
    this.stageCard.container.destroy(true);
    this.shieldCard.container.destroy(true);
    this.reviveCard.container.destroy(true);
    this.resourcePanel.destroy();
    this.warningBanner.container.destroy(true);
  }
}
