import Phaser from 'phaser';

import { createBanner, createButton, createOceanBackdrop, createPanelBackground, createStatPill, type MetricWidget } from '@/ui/UiFactory';
import { createSceneNavigator, ensureSceneInputEnabled } from '@/ui/UiInteraction';
import { formatUiNumber, UI_THEME } from '@/ui/UiTheme';

type GameOverPayload = {
  score: number;
  highScore: number;
  coinsGained: number;
  currentStageName: string;
  newRecord: boolean;
};

export class GameOverScene extends Phaser.Scene {
  private payload: GameOverPayload = {
    score: 0,
    highScore: 0,
    coinsGained: 0,
    currentStageName: '普通龙虾',
    newRecord: false,
  };

  constructor() {
    super('GameOverScene');
  }

  init(data: Partial<GameOverPayload>): void {
    this.payload = {
      score: data.score ?? 0,
      highScore: data.highScore ?? 0,
      coinsGained: data.coinsGained ?? 0,
      currentStageName: data.currentStageName ?? '普通龙虾',
      newRecord: data.newRecord ?? false,
    };
  }

  create(): void {
    ensureSceneInputEnabled(this);
    const navigate = createSceneNavigator(this);
    this.cameras.main.setBackgroundColor(UI_THEME.colors.oceanTop);
    createOceanBackdrop(this, { bubbleCount: 8, variant: 'result' });

    const resultPanel = this.add.container(360, 418).setDepth(UI_THEME.depths.surface + 1);
    const card = createPanelBackground(this, 620, 420, this.payload.newRecord ? 'hero' : 'surface', UI_THEME.radii.xl);
    const title = this.add
      .text(0, -122, this.payload.newRecord ? '破纪录了！' : '本局结束', {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '50px',
        color: UI_THEME.colors.textPrimary,
        fontStyle: 'bold',
        stroke: '#07233d',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setShadow(0, 4, 'rgba(0,0,0,0.42)', 8, false, true);
    const scoreLabel = this.add
      .text(0, -54, '本局得分', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '24px',
        color: UI_THEME.colors.textSecondary,
      })
      .setOrigin(0.5);
    const scoreValue = this.add
      .text(0, 28, '0', {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '94px',
        color: '#ffc857',
        fontStyle: 'bold',
        stroke: '#08233d',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setShadow(0, 6, 'rgba(0,0,0,0.35)', 10, false, true);
    const stageText = this.add
      .text(0, 116, `本局最高形态：${this.payload.currentStageName}`, {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '24px',
        color: UI_THEME.colors.textSecondary,
      })
      .setOrigin(0.5);
    const hintText = this.add
      .text(0, 154, this.payload.newRecord ? '漂亮！继续冲刺，解锁下一只传奇龙虾。' : '再来一局，把这条赛道跑得更漂亮。', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '18px',
        color: UI_THEME.colors.textMuted,
        align: 'center',
        wordWrap: { width: 420, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    resultPanel.add([card, title, scoreLabel, scoreValue, stageText, hintText]);

    if (this.payload.newRecord) {
      const badge = createBanner(this, {
        x: 360,
        y: 202,
        width: 164,
        height: 44,
        text: '新纪录',
        tone: 'hero',
        fontSize: '18px',
        depth: UI_THEME.depths.surface + 3,
      });
      badge.label.setFontFamily(UI_THEME.fonts.display);
      this.tweens.add({ targets: badge.container, scaleX: 1.05, scaleY: 1.05, duration: 620, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    }

    const highScoreCard: MetricWidget = createStatPill(this, {
      x: 196,
      y: 716,
      width: 188,
      height: 108,
      label: '历史最高',
      value: '0',
      accent: UI_THEME.colors.accentTeal,
    });
    const coinsCard: MetricWidget = createStatPill(this, {
      x: 524,
      y: 716,
      width: 188,
      height: 108,
      label: '获得金币',
      value: '+0',
      accent: UI_THEME.colors.accentGold,
    });

    createBanner(this, {
      x: 360,
      y: 834,
      width: 450,
      height: 56,
      text: '结算规则：分数按生存时长累计，每 1 分仍结算为 1 金币。',
      tone: 'surface',
      fontSize: '20px',
      depth: UI_THEME.depths.surface + 1,
    });

    const actionPanel = this.add.container(360, 1004).setDepth(UI_THEME.depths.surface + 1);
    const actionPanelBg = createPanelBackground(this, 452, 280, 'surface', UI_THEME.radii.xl);
    const actionTitle = this.add
      .text(0, -104, '继续行动', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '18px',
        color: UI_THEME.colors.textMuted,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const retryButton = createButton(this, {
      x: 0,
      y: -26,
      width: 370,
      height: 88,
      label: '再来一局',
      subLabel: '马上回到海底赛道继续冲分',
      variant: 'primary',
      pulse: true,
      onClick: () => navigate('GameScene'),
    });

    const homeButton = createButton(this, {
      x: 0,
      y: 84,
      width: 370,
      height: 78,
      label: '返回主页',
      subLabel: '查看当前成长并选择形态',
      variant: 'secondary',
      onClick: () => navigate('MenuScene'),
    });

    actionPanel.add([actionPanelBg, actionTitle, retryButton, homeButton]);

    this.animateResults(scoreValue, highScoreCard, coinsCard);
  }

  private animateResults(
    scoreValue: Phaser.GameObjects.Text,
    highScoreCard: MetricWidget,
    coinsCard: MetricWidget,
  ): void {
    this.tweens.addCounter({
      from: 0,
      to: this.payload.score,
      duration: 820,
      ease: 'Cubic.Out',
      onUpdate: (tween) => {
        const current = Math.round(tween.getValue() ?? 0);
        scoreValue.setText(formatUiNumber(current));
      },
    });

    this.tweens.addCounter({
      from: 0,
      to: this.payload.highScore,
      duration: 740,
      delay: 120,
      ease: 'Cubic.Out',
      onUpdate: (tween) => {
        const current = Math.round(tween.getValue() ?? 0);
        highScoreCard.valueText.setText(formatUiNumber(current));
      },
    });

    this.tweens.addCounter({
      from: 0,
      to: this.payload.coinsGained,
      duration: 760,
      delay: 180,
      ease: 'Cubic.Out',
      onUpdate: (tween) => {
        const current = Math.round(tween.getValue() ?? 0);
        coinsCard.valueText.setText(`+${formatUiNumber(current)}`);
      },
    });
  }
}
