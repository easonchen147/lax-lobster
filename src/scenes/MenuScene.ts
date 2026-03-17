import Phaser from 'phaser';

import lobsterEvolution from '@/config/LobsterEvolution.json';
import { StorageManager } from '@/data/StorageManager';
import { createBanner, createButton, createGlowOrb, createOceanBackdrop, createPanelBackground, createStatPill } from '@/ui/UiFactory';
import { createSceneNavigator, ensureSceneInputEnabled } from '@/ui/UiInteraction';
import { formatUiNumber, getStageTextureKey, UI_THEME } from '@/ui/UiTheme';
import { formatUnlockDuration } from '@/utils/Progression';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    ensureSceneInputEnabled(this);
    const navigate = createSceneNavigator(this);
    const playerData = StorageManager.loadPlayerData();
    const stages = lobsterEvolution.stages as Array<{ id: number; name: string; color: number; unlockScore: number }>;
    const selectedStage = stages.find((stage) => stage.id === playerData.currentStage) ?? stages[0];
    const nextGoal = stages.find((stage) => !playerData.unlockedStages.includes(stage.id));
    const previewTexture = this.textures.exists(getStageTextureKey(selectedStage.id))
      ? getStageTextureKey(selectedStage.id)
      : 'lobster-body';

    this.cameras.main.setBackgroundColor(UI_THEME.colors.oceanTop);
    createOceanBackdrop(this, { bubbleCount: 12, variant: 'menu' });
    createGlowOrb(this, 360, 372, 210, selectedStage.color, 0.08);

    this.add
      .text(360, 120, '龙虾海底跑酷', {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '58px',
        color: UI_THEME.colors.textPrimary,
        fontStyle: 'bold',
        stroke: '#06223c',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setShadow(0, 4, 'rgba(0,0,0,0.4)', 8, false, true);

    this.add
      .text(360, 172, '一局三秒上手，冲分解锁更强龙虾形态。', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '24px',
        color: UI_THEME.colors.textSecondary,
      })
      .setOrigin(0.5);

    const hero = this.add.container(360, 418).setDepth(UI_THEME.depths.surface + 1);
    const heroCard = createPanelBackground(this, 620, 330, 'surface', UI_THEME.radii.xl);
    const heroGlow = this.add.circle(-176, -16, 96, selectedStage.color, 0.18);
    const heroImage = this.add.image(-176, -12, previewTexture).setScale(4.5);
    if (previewTexture === 'lobster-body') {
      heroImage.setTint(selectedStage.color);
    }

    const stageLabel = createBanner(this, {
      x: 0,
      y: -106,
      width: 174,
      height: 42,
      text: `当前出战形态 · ${selectedStage.id + 1}/${stages.length}`,
      tone: 'hero',
      fontSize: '16px',
      depth: UI_THEME.depths.surface + 2,
    });
    stageLabel.container.setPosition(118, -108);

    const stageName = this.add
      .text(114, -42, selectedStage.name, {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '38px',
        color: UI_THEME.colors.textPrimary,
        fontStyle: 'bold',
        stroke: '#07233d',
        strokeThickness: 4,
        wordWrap: { width: 300, useAdvancedWrap: true },
      })
      .setOrigin(0.5)
      .setShadow(0, 3, 'rgba(0,0,0,0.35)', 5, false, true);

    const goalText = this.add
      .text(
        112,
        38,
        nextGoal
          ? `下一目标：${nextGoal.name} · ${formatUiNumber(nextGoal.unlockScore)} 分（${formatUnlockDuration(nextGoal.unlockScore)}）`
          : '已解锁全部形态，继续刷新最高分。',
        {
          fontFamily: UI_THEME.fonts.body,
          fontSize: '22px',
          color: UI_THEME.colors.textSecondary,
          align: 'center',
          wordWrap: { width: 310, useAdvancedWrap: true },
        },
      )
      .setOrigin(0.5);

    const helperText = this.add
      .text(112, 106, '当前按生存时长累计分数，约每 1 秒增长 1 分。', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '18px',
        color: UI_THEME.colors.textMuted,
        align: 'center',
        wordWrap: { width: 320, useAdvancedWrap: true },
      })
      .setOrigin(0.5);

    hero.add([heroCard, heroGlow, heroImage, stageLabel.container, stageName, goalText, helperText]);

    createStatPill(this, {
      x: 154,
      y: 664,
      width: 180,
      height: 108,
      label: '最高分',
      value: formatUiNumber(playerData.highScore),
      accent: UI_THEME.colors.accentTeal,
    });

    createStatPill(this, {
      x: 360,
      y: 664,
      width: 180,
      height: 108,
      label: '金币',
      value: formatUiNumber(playerData.coins),
      accent: UI_THEME.colors.accentGold,
    });

    createStatPill(this, {
      x: 566,
      y: 664,
      width: 180,
      height: 108,
      label: '已解锁',
      value: `${playerData.unlockedStages.length}/${stages.length}`,
      accent: UI_THEME.colors.accentCoral,
    });

    createBanner(this, {
      x: 360,
      y: 796,
      width: 460,
      height: 54,
      text: playerData.lastRunScore > 0 ? `上次得分：${formatUiNumber(playerData.lastRunScore)}，继续刷新它。` : '准备好开始第一局冲分了吗？',
      tone: 'surface',
      fontSize: '19px',
      depth: UI_THEME.depths.surface + 1,
    });

    if (StorageManager.isDegraded()) {
      createBanner(this, {
        x: 360,
        y: 858,
        width: 560,
        height: 58,
        text: '当前为内存模式，刷新页面后本次进度可能丢失。',
        tone: 'warning',
        fontSize: '20px',
        depth: UI_THEME.depths.surface + 1,
      });
    }

    const actionPanel = this.add.container(360, 998).setDepth(UI_THEME.depths.surface + 1);
    const actionPanelBg = createPanelBackground(this, 428, 272, 'surface', UI_THEME.radii.xl);
    const actionTitle = this.add
      .text(0, -96, '选择行动', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '18px',
        color: UI_THEME.colors.textMuted,
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const playButton = createButton(this, {
      x: 0,
      y: -34,
      width: 332,
      height: 86,
      label: '开始游戏',
      subLabel: '立刻进入海底赛道冲分',
      variant: 'primary',
      pulse: true,
      onClick: () => navigate('GameScene'),
    });

    const evolutionButton = createButton(this, {
      x: 0,
      y: 72,
      width: 332,
      height: 82,
      label: '进化中心',
      subLabel: '切换已解锁形态，规划成长路线',
      variant: 'secondary',
      onClick: () => navigate('EvolutionScene'),
    });

    actionPanel.add([actionPanelBg, actionTitle, playButton, evolutionButton]);

    createBanner(this, {
      x: 360,
      y: 1224,
      width: 450,
      height: 64,
      text: '操作提示：按住下潜，松开上浮。',
      tone: 'surface',
      fontSize: '22px',
      depth: UI_THEME.depths.surface + 1,
    });
  }
}
