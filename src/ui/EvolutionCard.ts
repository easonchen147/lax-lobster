import Phaser from 'phaser';

import type { LobsterStage } from '@/systems/EvolutionManager';
import { resolveEvolutionCardGeometry, resolveEvolutionCardTitleFontSize } from '@/ui/EvolutionLayout';
import { resolveEvolutionCardVisualTokens } from '@/ui/EvolutionVisualTokens';
import { createPanelBackground } from '@/ui/UiFactory';
import { createContainerHitArea } from '@/ui/UiInteraction';
import { formatUiNumber, getRemainingUnlockScore, getStageTextureKey, UI_THEME } from '@/ui/UiTheme';
import { formatUnlockDuration } from '@/utils/Progression';

export class EvolutionCard extends Phaser.GameObjects.Container {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    stage: LobsterStage,
    unlocked: boolean,
    selected: boolean,
    bestScore: number,
    onSelect: (stageId: number) => void,
  ) {
    const tone = selected ? 'hero' : unlocked ? 'surface' : 'muted';
    const geometry = resolveEvolutionCardGeometry(width, height);
    const remainingScore = getRemainingUnlockScore(stage.unlockScore, bestScore);
    const unlockProgress = stage.unlockScore <= 0 ? 1 : Phaser.Math.Clamp(bestScore / stage.unlockScore, 0, 1);
    const textureKey = scene.textures.exists(getStageTextureKey(stage.id)) ? getStageTextureKey(stage.id) : 'lobster-body';
    const visualTokens = resolveEvolutionCardVisualTokens({
      stageColor: stage.color,
      unlocked,
      selected,
    });
    const statusLabel = selected ? '出战中' : unlocked ? '已解锁' : '未解锁';
    const footerLabel = selected ? '当前使用' : unlocked ? '点击切换' : `解锁 ${Math.round(unlockProgress * 100)}%`;
    const primaryInfo = unlocked
      ? `速度 +${Math.round(stage.speedBonus * 100)}% · 护盾 ${stage.shieldCount} · 复活 ${stage.freeRevives}`
      : `目标 ${formatUiNumber(stage.unlockScore)} 分 · ${formatUnlockDuration(stage.unlockScore)}`;
    const secondaryInfo = unlocked
      ? `已达成 ${formatUiNumber(stage.unlockScore)} 分`
      : `还差 ${formatUiNumber(remainingScore)} 分`;
    const background = createPanelBackground(scene, width, height, tone, 26);
    const scanlines = scene.add.graphics();
    scanlines.fillStyle(0xffffff, selected ? 0.04 : 0.028);
    for (let yLine = -height / 2 + 18; yLine <= height / 2 - 14; yLine += 10) {
      scanlines.fillRect(-width / 2 + 16, yLine, width - 32, 1);
    }

    const frame = scene.add.graphics();
    frame.lineStyle(2, visualTokens.frameColor, selected ? 0.92 : unlocked ? 0.72 : 0.44);
    frame.strokeRoundedRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, 22);
    frame.lineStyle(2, visualTokens.frameDetailColor, selected ? 0.78 : unlocked ? 0.42 : 0.24);
    const frameLeft = -width / 2 + 14;
    const frameRight = width / 2 - 14;
    const frameTop = -height / 2 + 14;
    const frameBottom = height / 2 - 14;
    const cornerLength = 20;
    frame.lineBetween(frameLeft, frameTop + cornerLength, frameLeft, frameTop);
    frame.lineBetween(frameLeft, frameTop, frameLeft + cornerLength, frameTop);
    frame.lineBetween(frameRight - cornerLength, frameTop, frameRight, frameTop);
    frame.lineBetween(frameRight, frameTop, frameRight, frameTop + cornerLength);
    frame.lineBetween(frameLeft, frameBottom - cornerLength, frameLeft, frameBottom);
    frame.lineBetween(frameLeft, frameBottom, frameLeft + cornerLength, frameBottom);
    frame.lineBetween(frameRight - cornerLength, frameBottom, frameRight, frameBottom);
    frame.lineBetween(frameRight, frameBottom - cornerLength, frameRight, frameBottom);

    const selectedRail = scene.add
      .rectangle(
        -width / 2 + 9,
        0,
        10,
        height - 18,
        visualTokens.selectedRailColor,
        selected ? 0.98 : unlocked ? 0.34 : 0.16,
      )
      .setOrigin(0.5);
    const innerDivider = scene.add.rectangle(-width / 2 + 108, 0, 2, height - 26, UI_THEME.colors.borderSoft, 0.18);
    const contentGlow = scene.add.circle(
      geometry.content.x + 18,
      -6,
      74,
      visualTokens.contentGlowColor,
      selected ? 0.12 : unlocked ? 0.09 : 0.05,
    );

    const artPanel = scene.add.graphics();
    artPanel.fillStyle(unlocked ? 0x0b2a44 : 0x12253a, 0.98);
    artPanel.fillRoundedRect(
      geometry.art.left,
      geometry.art.top,
      geometry.art.width,
      geometry.art.height,
      24,
    );
    artPanel.lineStyle(2, visualTokens.frameColor, 0.88);
    artPanel.strokeRoundedRect(
      geometry.art.left,
      geometry.art.top,
      geometry.art.width,
      geometry.art.height,
      24,
    );
    artPanel.lineStyle(1, visualTokens.artInnerStrokeColor, selected ? 0.52 : unlocked ? 0.28 : 0.14);
    artPanel.strokeRoundedRect(
      geometry.art.left + 6,
      geometry.art.top + 6,
      geometry.art.width - 12,
      geometry.art.height - 12,
      18,
    );

    const avatarOrbitOuter = scene.add
      .circle(geometry.art.x, -2, 33)
      .setStrokeStyle(2, visualTokens.orbitColor, selected ? 0.78 : unlocked ? 0.4 : 0.18)
      .setFillStyle(0x000000, 0);
    const avatarOrbitInner = scene.add
      .circle(geometry.art.x, -2, 24)
      .setStrokeStyle(1, UI_THEME.colors.border, unlocked ? 0.22 : 0.12)
      .setFillStyle(0x000000, 0);
    const avatarGlow = scene.add.circle(
      geometry.art.x,
      0,
      29,
      visualTokens.avatarGlowColor,
      selected ? 0.18 : unlocked ? 0.14 : 0.08,
    );
    const avatar = scene.add.image(geometry.art.x, 0, textureKey).setScale(1.62).setAlpha(unlocked ? 1 : 0.34);
    if (textureKey === 'lobster-body') {
      avatar.setTint(stage.color);
    }
    const avatarBase = scene.add.ellipse(geometry.art.x, 36, 54, 14, 0x04111b, 0.38);
    const stageChipBg = scene.add.graphics();
    stageChipBg.fillStyle(visualTokens.stageChipFillColor, 0.96);
    stageChipBg.fillRoundedRect(geometry.art.x - 26, geometry.art.top + 10, 52, 18, 9);
    stageChipBg.lineStyle(1, visualTokens.stageChipStrokeColor, 0.82);
    stageChipBg.strokeRoundedRect(geometry.art.x - 26, geometry.art.top + 10, 52, 18, 9);
    const stageChipText = scene.add
      .text(geometry.art.x, geometry.art.top + 19, `S-${stage.id + 1}`, {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '10px',
        color: selected ? UI_THEME.colors.textStrong : UI_THEME.colors.textPrimary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const cardWatermark = scene.add
      .text(geometry.content.right - 4, geometry.title.y - 2, `${stage.id + 1}`.padStart(2, '0'), {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '44px',
        color: UI_THEME.colors.textPrimary,
      })
      .setOrigin(1, 0.5)
      .setAlpha(selected ? 0.12 : unlocked ? 0.08 : 0.05);

    const eyebrowText = scene.add
      .text(geometry.stageLabel.left, geometry.stageLabel.top, `阶段 ${stage.id + 1} · 进化档案`, {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '12px',
        color: selected ? '#ffe8b6' : unlocked ? '#9ddffb' : UI_THEME.colors.textMuted,
        fontStyle: 'bold',
      })
      .setOrigin(0, 0);

    const stageNameText = scene.add
      .text(geometry.title.left, geometry.title.top - 2, stage.name, {
        fontFamily: UI_THEME.fonts.display,
        fontSize: resolveEvolutionCardTitleFontSize(stage.name, selected),
        color: unlocked ? UI_THEME.colors.textPrimary : UI_THEME.colors.textSecondary,
        fontStyle: 'bold',
        wordWrap: { width: geometry.title.width, useAdvancedWrap: true },
      })
      .setOrigin(0, 0)
      .setLineSpacing(0);
    const titleRule = scene.add.rectangle(
      geometry.content.left + geometry.content.width / 2,
      geometry.primaryInfo.top - 8,
      geometry.content.width,
      2,
      visualTokens.titleRuleColor,
      selected ? 0.42 : 0.22,
    );

    const primaryInfoText = scene.add
      .text(geometry.primaryInfo.left, geometry.primaryInfo.top, primaryInfo, {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '11px',
        color: unlocked ? UI_THEME.colors.textSecondary : UI_THEME.colors.textMuted,
        wordWrap: { width: geometry.primaryInfo.width, useAdvancedWrap: true },
      })
      .setOrigin(0, 0)
      .setLineSpacing(2);

    const secondaryInfoText = scene.add
      .text(geometry.secondaryInfo.left, geometry.secondaryInfo.y, secondaryInfo, {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '11px',
        color: unlocked ? UI_THEME.colors.textMuted : '#dcebf8',
      })
      .setOrigin(0, 0.5);

    const statusChipBg = scene.add.graphics();
    const statusFill = selected ? UI_THEME.colors.accentGold : unlocked ? 0x154865 : UI_THEME.colors.surfaceMuted;
    const statusStroke = selected ? 0xffe7a6 : unlocked ? UI_THEME.colors.success : UI_THEME.colors.borderSoft;
    statusChipBg.fillStyle(statusFill, 0.98);
    statusChipBg.fillRoundedRect(
      geometry.statusChip.left,
      geometry.statusChip.top,
      geometry.statusChip.width,
      geometry.statusChip.height,
      12,
    );
    statusChipBg.lineStyle(2, statusStroke, 0.95);
    statusChipBg.strokeRoundedRect(
      geometry.statusChip.left,
      geometry.statusChip.top,
      geometry.statusChip.width,
      geometry.statusChip.height,
      12,
    );

    const statusText = scene.add
      .text(geometry.statusChip.x, geometry.statusChip.y, statusLabel, {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '11px',
        color: selected ? UI_THEME.colors.textStrong : UI_THEME.colors.textPrimary,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const footerText = scene.add
      .text(geometry.footerLabel.right, geometry.footerLabel.y, footerLabel, {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '11px',
        color: unlocked ? '#ffc857' : UI_THEME.colors.textMuted,
        fontStyle: unlocked ? 'bold' : 'normal',
        align: 'right',
      })
      .setOrigin(1, 0.5);

    const progressTrack = scene.add.graphics();
    progressTrack.fillStyle(0x0a2136, 0.92);
    progressTrack.fillRoundedRect(geometry.progress.left, geometry.progress.top, geometry.progress.width, 8, 4);
    progressTrack.lineStyle(1, unlocked ? UI_THEME.colors.borderSoft : 0x56728d, 0.7);
    progressTrack.strokeRoundedRect(geometry.progress.left, geometry.progress.top, geometry.progress.width, 8, 4);
    progressTrack.fillStyle(visualTokens.progressColor, unlocked ? 0.95 : 0.68);
    progressTrack.fillRoundedRect(
      geometry.progress.left + 1,
      geometry.progress.top + 1,
      Math.max(8, (geometry.progress.width - 2) * unlockProgress),
      6,
      3,
    );

    super(scene, x, y, [
      background,
      scanlines,
      frame,
      selectedRail,
      innerDivider,
      contentGlow,
      artPanel,
      avatarOrbitOuter,
      avatarOrbitInner,
      avatarGlow,
      avatarBase,
      avatar,
      stageChipBg,
      stageChipText,
      cardWatermark,
      eyebrowText,
      stageNameText,
      titleRule,
      primaryInfoText,
      secondaryInfoText,
      statusChipBg,
      statusText,
      footerText,
      progressTrack,
    ]);
    scene.add.existing(this);
    this.setAlpha(unlocked ? 1 : 0.94);

    if (!unlocked) {
      return;
    }

    let pressed = false;
    let locked = false;

    this.setSize(width, height)
      .setInteractive(createContainerHitArea(width, height), Phaser.Geom.Rectangle.Contains)
      .on('pointerover', () => {
        if (!selected && !pressed) {
          this.setScale(1.015);
        }
      })
      .on('pointerout', () => {
        pressed = false;
        this.setScale(1);
      })
      .on('pointerdown', () => {
        if (locked) {
          return;
        }
        pressed = true;
        this.setScale(0.988);
      })
      .on('pointerup', () => {
        if (!pressed || locked) {
          return;
        }

        locked = true;
        pressed = false;
        this.disableInteractive();
        this.setScale(1);
        onSelect(stage.id);
      })
      .on('pointerupoutside', () => {
        pressed = false;
        this.setScale(1);
      });
  }
}
