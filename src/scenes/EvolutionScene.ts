import Phaser from 'phaser';

import { GameState } from '@/data/GameState';
import { sanitizePlayerData } from '@/data/PlayerData';
import { StorageManager } from '@/data/StorageManager';
import { EvolutionManager } from '@/systems/EvolutionManager';
import {
  createBanner,
  createButton,
  createGlowOrb,
  createOceanBackdrop,
  createPanelBackground,
  createStatPill,
} from '@/ui/UiFactory';
import { createSceneNavigator, ensureSceneInputEnabled } from '@/ui/UiInteraction';
import {
  EVOLUTION_LAYOUT,
  resolveEvolutionCardPosition,
  resolveEvolutionSummaryGeometry,
  resolveEvolutionSummaryMetricPosition,
} from '@/ui/EvolutionLayout';
import { resolveEvolutionSummaryVisualTokens } from '@/ui/EvolutionVisualTokens';
import { EvolutionCard } from '@/ui/EvolutionCard';
import { formatUiNumber, getStageTextureKey, UI_THEME } from '@/ui/UiTheme';
import { formatUnlockDuration } from '@/utils/Progression';

const STAGE_SHOWCASE_COPY = [
  '均衡起步型，适合先摸清海底赛道节奏。',
  '机动强化型，更适合快速穿越密集缝隙。',
  '稳压护甲型，面对连续障碍更从容。',
  '高速突围型，适合在压迫节奏中抢线路。',
  '深潜压场型，容错和成长反馈更强。',
  '中后期统治型，适合稳定拉高生存时长。',
  '高阶爆发型，已经进入传奇进化区间。',
  '终极展示型，海底赛道的完全体主角。',
] as const;

const resolveStageShowcaseCopy = (stageId: number): string =>
  STAGE_SHOWCASE_COPY[stageId] ?? '持续冲分，继续解锁更强大的深海形态。';

const createSummaryMetric = (
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  value: string,
  accent: number,
) => {
  const metric = createStatPill(scene, {
    x: 0,
    y: 0,
    width: EVOLUTION_LAYOUT.summary.stats.metricWidth,
    height: EVOLUTION_LAYOUT.summary.stats.metricHeight,
    label,
    value,
    accent,
    tone: 'surface',
    depth: UI_THEME.depths.surface + 2,
    labelFontSize: '13px',
    valueFontSize: '26px',
  });

  metric.container.setPosition(x, y);
  return metric.container;
};

export class EvolutionScene extends Phaser.Scene {
  private readonly evolutionManager = new EvolutionManager();

  constructor() {
    super('EvolutionScene');
  }

  create(): void {
    ensureSceneInputEnabled(this);
    const navigate = createSceneNavigator(this);
    const playerData = StorageManager.loadPlayerData();
    const stages = this.evolutionManager.getStages();
    const currentStage = this.evolutionManager.getStage(playerData.currentStage);
    const nextLockedStage = stages.find((stage) => !playerData.unlockedStages.includes(stage.id));
    const previewTexture = this.textures.exists(getStageTextureKey(currentStage.id))
      ? getStageTextureKey(currentStage.id)
      : 'lobster-body';
    const summaryTokens = resolveEvolutionSummaryVisualTokens(currentStage.color);
    const summaryGeometry = resolveEvolutionSummaryGeometry();

    this.cameras.main.setBackgroundColor(UI_THEME.colors.oceanTop);
    createOceanBackdrop(this, { bubbleCount: 10, variant: 'menu' });
    createGlowOrb(this, 556, 252, 148, summaryTokens.haloColor, 0.08);

    this.add
      .text(360, EVOLUTION_LAYOUT.titleY, '进化中心', {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '50px',
        color: UI_THEME.colors.textPrimary,
        fontStyle: 'bold',
        stroke: '#07233d',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setShadow(0, 4, 'rgba(0,0,0,0.35)', 8, false, true);

    this.add
      .text(360, EVOLUTION_LAYOUT.subtitleY, '挑选出战形态，规划接下来的海底进化路线。', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '20px',
        color: UI_THEME.colors.textSecondary,
      })
      .setOrigin(0.5);

    const summary = this.add
      .container(EVOLUTION_LAYOUT.summary.x, EVOLUTION_LAYOUT.summary.y)
      .setDepth(UI_THEME.depths.surface + 1);
    const summaryLayout = EVOLUTION_LAYOUT.summary;
    const previewLayout = summaryLayout.preview;
    const infoLayout = summaryLayout.info;
    const summaryPanel = createPanelBackground(
      this,
      summaryLayout.width,
      summaryLayout.height,
      'surface',
      UI_THEME.radii.xl,
    );
    const summaryHalo = this.add.circle(172, -100, 144, summaryTokens.haloColor, 0.1);
    const summaryScanlines = this.add.graphics();
    summaryScanlines.fillStyle(0xffffff, 0.035);
    for (let y = -summaryLayout.height / 2 + 34; y <= summaryLayout.height / 2 - 22; y += 12) {
      summaryScanlines.fillRect(-summaryLayout.width / 2 + 28, y, summaryLayout.width - 56, 1);
    }
    const summaryDivider = this.add.rectangle(-54, -2, 2, 212, summaryTokens.dividerColor, 0.26);
    const summaryAccent = this.add.rectangle(
      0,
      -summaryLayout.height / 2 + 18,
      summaryLayout.width - 54,
      3,
      summaryTokens.accentLineColor,
      0.35,
    );
    const summaryFrame = this.add.graphics();
    summaryFrame.lineStyle(2, summaryTokens.frameColor, 0.88);
    summaryFrame.strokeRoundedRect(
      -summaryLayout.width / 2 + 10,
      -summaryLayout.height / 2 + 10,
      summaryLayout.width - 20,
      summaryLayout.height - 20,
      UI_THEME.radii.xl - 10,
    );
    summaryFrame.lineStyle(3, summaryTokens.frameDetailColor, 0.72);
    const frameLeft = -summaryLayout.width / 2 + 18;
    const frameRight = summaryLayout.width / 2 - 18;
    const frameTop = -summaryLayout.height / 2 + 18;
    const frameBottom = summaryLayout.height / 2 - 18;
    const cornerLength = 30;
    summaryFrame.lineBetween(frameLeft, frameTop + cornerLength, frameLeft, frameTop);
    summaryFrame.lineBetween(frameLeft, frameTop, frameLeft + cornerLength, frameTop);
    summaryFrame.lineBetween(frameRight - cornerLength, frameTop, frameRight, frameTop);
    summaryFrame.lineBetween(frameRight, frameTop, frameRight, frameTop + cornerLength);
    summaryFrame.lineBetween(frameLeft, frameBottom - cornerLength, frameLeft, frameBottom);
    summaryFrame.lineBetween(frameLeft, frameBottom, frameLeft + cornerLength, frameBottom);
    summaryFrame.lineBetween(frameRight - cornerLength, frameBottom, frameRight, frameBottom);
    summaryFrame.lineBetween(frameRight, frameBottom - cornerLength, frameRight, frameBottom);
    const previewShell = createPanelBackground(
      this,
      previewLayout.width,
      previewLayout.height,
      'hero',
      30,
    ).setPosition(previewLayout.x, previewLayout.y);
    const previewOrbitOuter = this.add
      .circle(previewLayout.x, previewLayout.y - 6, 92)
      .setStrokeStyle(2, summaryTokens.orbitColor, 0.42)
      .setFillStyle(0x000000, 0);
    const previewOrbitInner = this.add
      .circle(previewLayout.x, previewLayout.y - 6, 68)
      .setStrokeStyle(1, UI_THEME.colors.border, 0.24)
      .setFillStyle(0x000000, 0);
    const previewAuraOuter = this.add.circle(previewLayout.x, previewLayout.y - 4, 78, summaryTokens.auraColor, 0.2);
    const previewAuraInner = this.add.circle(previewLayout.x, previewLayout.y - 4, 56, 0xffffff, 0.06);
    const previewPedestal = this.add.ellipse(previewLayout.x, previewLayout.y + 62, 118, 28, 0x04111b, 0.4);
    previewPedestal.setStrokeStyle(1, summaryTokens.pedestalStrokeColor, 0.26);
    const previewShadow = this.add.ellipse(previewLayout.x, previewLayout.y + 60, 92, 24, 0x04111b, 0.3);
    const preview = this.add.image(previewLayout.x, previewLayout.y - 4, previewTexture).setScale(3.35);
    if (previewTexture === 'lobster-body') {
      preview.setTint(currentStage.color);
    }
    const previewStageChip = createBanner(this, {
      x: 0,
      y: 0,
      width: 92,
      height: 30,
      text: `阶段 ${currentStage.id + 1}`,
      tone: 'surface',
      fontSize: '12px',
      depth: UI_THEME.depths.surface + 2,
    });
    previewStageChip.container.setPosition(previewLayout.x, previewLayout.y - 88);
    const previewLabel = this.add
      .text(previewLayout.x, previewLayout.y + 88, '当前主角', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '13px',
        color: UI_THEME.colors.textMuted,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const infoPlate = createPanelBackground(this, infoLayout.width, infoLayout.height, 'muted', 30).setPosition(
      infoLayout.x,
      infoLayout.y,
    );
    const infoAura = this.add.circle(infoLayout.x + 98, infoLayout.y - 10, 126, summaryTokens.haloColor, 0.08);
    const infoGrid = this.add.graphics();
    infoGrid.lineStyle(1, summaryTokens.gridColor, 0.1);
    for (let offset = -132; offset <= 132; offset += 44) {
      infoGrid.lineBetween(infoLayout.x - 150, infoLayout.y - 58 + offset / 6, infoLayout.x + 150, infoLayout.y - 58 + offset / 6);
    }
    for (let offset = -132; offset <= 132; offset += 52) {
      infoGrid.lineBetween(infoLayout.x + offset, infoLayout.y - 78, infoLayout.x + offset, infoLayout.y + 78);
    }
    const infoEyebrow = this.add
      .text(infoLayout.x - 146, infoLayout.y - 50, '进化档案', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '14px',
        color: '#a7e7ff',
        fontStyle: 'bold',
      })
      .setOrigin(0, 0.5);
    const infoSubEyebrow = this.add
      .text(infoLayout.x - 146, infoLayout.y - 32, 'EVOLUTION DOSSIER', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '10px',
        color: UI_THEME.colors.textMuted,
        letterSpacing: 2,
      })
      .setOrigin(0, 0.5);
    const stageWatermark = this.add
      .text(infoLayout.x + 122, infoLayout.y - 2, `${currentStage.id + 1}`.padStart(2, '0'), {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '86px',
        color: UI_THEME.colors.textPrimary,
      })
      .setOrigin(0.5)
      .setAlpha(0.08);
    infoEyebrow.setPosition(summaryGeometry.eyebrow.left, summaryGeometry.eyebrow.y);
    infoEyebrow.setFontSize('15px');
    infoSubEyebrow.setPosition(summaryGeometry.subEyebrow.left, summaryGeometry.subEyebrow.y);
    infoSubEyebrow.setFontSize('11px');
    stageWatermark.setPosition(summaryGeometry.watermark.x, summaryGeometry.watermark.y);
    stageWatermark.setFontSize('74px');
    stageWatermark.setAlpha(0.06);
    const routeBadge = createBanner(this, {
      x: 0,
      y: 0,
      width: summaryGeometry.routeBadge.width,
      height: summaryGeometry.routeBadge.height,
      text: `成长路线 ${currentStage.id + 1}/${stages.length}`,
      tone: 'surface',
      fontSize: '13px',
      depth: UI_THEME.depths.surface + 2,
    });
    routeBadge.container.setPosition(summaryGeometry.routeBadge.x, summaryGeometry.routeBadge.y);
    const currentBadge = createBanner(this, {
      x: 0,
      y: 0,
      width: summaryGeometry.currentBadge.width,
      height: summaryGeometry.currentBadge.height,
      text: '当前出战',
      tone: 'hero',
      fontSize: '13px',
      depth: UI_THEME.depths.surface + 2,
    });
    currentBadge.container.setPosition(summaryGeometry.currentBadge.x, summaryGeometry.currentBadge.y);

    const stageTitleFontSize =
      Array.from(currentStage.name).length >= 9
        ? '26px'
        : Array.from(currentStage.name).length >= 7
          ? '28px'
          : '32px';
    const stageName = this.add
      .text(summaryGeometry.title.x, summaryGeometry.title.y, currentStage.name, {
        fontFamily: UI_THEME.fonts.display,
        fontSize: Array.from(currentStage.name).length >= 8 ? '28px' : '30px',
        color: UI_THEME.colors.textPrimary,
        fontStyle: 'bold',
        stroke: '#07233d',
        strokeThickness: 4,
        wordWrap: { width: summaryGeometry.title.width, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    const stageDescriptor = this.add
      .text(infoLayout.x, infoLayout.y - 10, resolveStageShowcaseCopy(currentStage.id), {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '13px',
        color: UI_THEME.colors.textMuted,
        align: 'center',
        wordWrap: { width: 332, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    const stageBuff = this.add
      .text(
        infoLayout.x,
        infoLayout.y + 18,
        `速度 +${Math.round(currentStage.speedBonus * 100)}% · 护盾 ${currentStage.shieldCount} · 复活 ${currentStage.freeRevives}`,
        {
          fontFamily: UI_THEME.fonts.body,
          fontSize: '14px',
          color: UI_THEME.colors.textSecondary,
          align: 'center',
          wordWrap: { width: 334, useAdvancedWrap: true },
        },
      )
      .setOrigin(0.5);
    stageName.setPosition(summaryGeometry.title.left, summaryGeometry.title.y);
    stageName.setFontSize(stageTitleFontSize);
    stageName.setOrigin(0, 0.5);
    stageName.setWordWrapWidth(summaryGeometry.title.width, true);
    stageDescriptor.setPosition(summaryGeometry.descriptor.left, summaryGeometry.descriptor.y);
    stageDescriptor.setFontSize('15px');
    stageDescriptor.setColor(UI_THEME.colors.textSecondary);
    stageDescriptor.setAlign('left');
    stageDescriptor.setWordWrapWidth(summaryGeometry.descriptor.width, true);
    stageDescriptor.setOrigin(0, 0.5);
    stageBuff.setPosition(summaryGeometry.buff.left, summaryGeometry.buff.y);
    stageBuff.setFontSize('15px');
    stageBuff.setAlign('left');
    stageBuff.setWordWrapWidth(summaryGeometry.buff.width, true);
    stageBuff.setOrigin(0, 0.5);

    const infoDivider = this.add.rectangle(
      summaryGeometry.infoDivider.x,
      summaryGeometry.infoDivider.y,
      summaryGeometry.infoDivider.width,
      2,
      summaryTokens.dividerColor,
      0.2,
    );
    const nextGoalText = nextLockedStage
      ? `下一目标：${nextLockedStage.name} · ${formatUiNumber(nextLockedStage.unlockScore)} 分（${formatUnlockDuration(nextLockedStage.unlockScore)}）`
      : '全部形态已解锁，继续冲刺更高分数。';
    void nextGoalText;
    const nextGoalLabelText = nextLockedStage
      ? `\u4e0b\u4e00\u76ee\u6807\uff1a${nextLockedStage.name} \u00b7 ${formatUiNumber(nextLockedStage.unlockScore)} \u5206`
      : '\u5168\u90e8\u5f62\u6001\u5df2\u89e3\u9501\uff0c\u7ee7\u7eed\u51b2\u66f4\u9ad8\u5206';
    const nextGoal = this.add
      .text(summaryGeometry.nextGoal.x, summaryGeometry.nextGoal.y, nextGoalLabelText, {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '12px',
        color: UI_THEME.colors.textSecondary,
        align: 'center',
        wordWrap: { width: summaryGeometry.nextGoal.width, useAdvancedWrap: true },
      })
      .setOrigin(0.5);
    nextGoal.setFontSize('13px');

    const metricRail = this.add.rectangle(
      summaryGeometry.metricRail.x,
      summaryGeometry.metricRail.y,
      summaryGeometry.metricRail.width,
      2,
      summaryTokens.metricRailColor,
      0.16,
    );
    const unlockedMetricPosition = resolveEvolutionSummaryMetricPosition(0);
    const unlockedMetricGlow = this.add.circle(
      unlockedMetricPosition.x,
      unlockedMetricPosition.y,
      58,
      UI_THEME.colors.accentTeal,
      0.08,
    );
    const unlockedStat = createSummaryMetric(
      this,
      unlockedMetricPosition.x,
      unlockedMetricPosition.y,
      '已解锁',
      `${playerData.unlockedStages.length}/${stages.length}`,
      UI_THEME.colors.accentTeal,
    );
    const highScoreMetricPosition = resolveEvolutionSummaryMetricPosition(1);
    const highScoreMetricGlow = this.add.circle(
      highScoreMetricPosition.x,
      highScoreMetricPosition.y,
      58,
      UI_THEME.colors.accentGold,
      0.08,
    );
    const highScoreStat = createSummaryMetric(
      this,
      highScoreMetricPosition.x,
      highScoreMetricPosition.y,
      '最高分',
      formatUiNumber(playerData.highScore),
      UI_THEME.colors.accentGold,
    );

    summary.add([
      summaryPanel,
      summaryHalo,
      summaryScanlines,
      summaryDivider,
      summaryAccent,
      previewOrbitOuter,
      previewOrbitInner,
      previewShell,
      previewAuraOuter,
      previewAuraInner,
      previewPedestal,
      previewShadow,
      preview,
      previewStageChip.container,
      previewLabel,
      infoAura,
      infoPlate,
      infoGrid,
      infoEyebrow,
      infoSubEyebrow,
      stageWatermark,
      routeBadge.container,
      currentBadge.container,
      stageName,
      stageDescriptor,
      stageBuff,
      infoDivider,
      nextGoal,
      metricRail,
      unlockedMetricGlow,
      unlockedStat,
      highScoreMetricGlow,
      highScoreStat,
      summaryFrame,
    ]);

    this.tweens.add({
      targets: [previewAuraOuter, previewOrbitOuter],
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 2200,
      ease: 'Sine.InOut',
      yoyo: true,
      repeat: -1,
    });

    this.add
      .text(360, EVOLUTION_LAYOUT.section.titleY, '龙虾图鉴', {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '24px',
        color: UI_THEME.colors.textPrimary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(360, EVOLUTION_LAYOUT.section.captionY, '解锁后可立即切换出战，点击已解锁形态即可替换当前主角。', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '14px',
        color: UI_THEME.colors.textMuted,
      })
      .setOrigin(0.5);

    stages.forEach((stage, index) => {
      const position = resolveEvolutionCardPosition(index);

      new EvolutionCard(
        this,
        position.x,
        position.y,
        EVOLUTION_LAYOUT.grid.cardWidth,
        EVOLUTION_LAYOUT.grid.cardHeight,
        stage,
        playerData.unlockedStages.includes(stage.id),
        playerData.currentStage === stage.id,
        playerData.highScore,
        (stageId) => {
          const nextData = sanitizePlayerData({
            ...playerData,
            currentStage: stageId,
          });
          StorageManager.savePlayerData(nextData);
          GameState.getInstance().setCurrentStage(stageId);
          this.scene.restart();
        },
      );
    });

    const footer = this.add
      .container(EVOLUTION_LAYOUT.footer.x, EVOLUTION_LAYOUT.footer.y)
      .setDepth(UI_THEME.depths.surface + 1);
    const footerPanel = createPanelBackground(
      this,
      EVOLUTION_LAYOUT.footer.width,
      EVOLUTION_LAYOUT.footer.height,
      StorageManager.isDegraded() ? 'warning' : 'surface',
      UI_THEME.radii.xl,
    );
    const footerText = this.add
      .text(
        0,
        -28,
        StorageManager.isDegraded()
          ? '当前为内存模式，切换形态只在本次会话内生效。'
          : '已解锁的形态可以直接切换出战，继续冲分解锁更强的龙虾。',
        {
          fontFamily: UI_THEME.fonts.body,
          fontSize: '16px',
          color: StorageManager.isDegraded() ? '#ffe6b4' : UI_THEME.colors.textSecondary,
          align: 'center',
          wordWrap: { width: 420, useAdvancedWrap: true },
        },
      )
      .setOrigin(0.5);

    const backButton = createButton(this, {
      x: 0,
      y: 24,
      width: 332,
      height: 72,
      label: '返回主页',
      subLabel: '回到主界面开始下一局',
      variant: 'secondary',
      onClick: () => navigate('MenuScene'),
    });
    backButton.setPosition(0, 24);

    footer.add([footerPanel, footerText, backButton]);
  }
}
