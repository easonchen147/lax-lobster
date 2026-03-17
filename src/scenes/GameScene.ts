import Phaser from 'phaser';

import { GameState } from '@/data/GameState';
import { sanitizePlayerData } from '@/data/PlayerData';
import { StorageManager } from '@/data/StorageManager';
import { Lobster } from '@/entities/Lobster';
import { AudioManager } from '@/systems/AudioManager';
import { CollisionManager } from '@/systems/CollisionManager';
import { DifficultyManager } from '@/systems/DifficultyManager';
import { EvolutionManager, LobsterStage } from '@/systems/EvolutionManager';
import { InputController } from '@/systems/InputController';
import { ParticleManager } from '@/systems/ParticleManager';
import { ScrollManager } from '@/systems/ScrollManager';
import { createBanner, createOceanBackdrop, type BannerWidget } from '@/ui/UiFactory';
import { HUD } from '@/ui/HUD';
import { RevivePanel } from '@/ui/RevivePanel';
import { UI_THEME } from '@/ui/UiTheme';
import { ensureSceneInputEnabled } from '@/ui/UiInteraction';
import { decorateGameBackdrop } from '@/visuals/DeepSeaVisuals';
import { resolveScoreFromElapsedMs } from '@/utils/Progression';
import { EFFECTS, GAME } from '@/utils/Constants';

export class GameScene extends Phaser.Scene {
  lobster!: Lobster;
  private readonly gameState = GameState.getInstance();
  private readonly difficultyManager = new DifficultyManager();
  private readonly evolutionManager = new EvolutionManager();
  private inputController!: InputController;
  private scrollManager!: ScrollManager;
  private collisionManager!: CollisionManager;
  private particleManager!: ParticleManager;
  private audioManager!: AudioManager;
  private hud!: HUD;
  private revivePanel!: RevivePanel;
  private selectedStage!: LobsterStage;
  private distanceTravelled = 0;
  private runElapsedMs = 0;
  private slowCurrentUntil = 0;
  private runEnded = false;
  private infoBanner?: BannerWidget;
  private guideBanner?: BannerWidget;
  private damageFlash?: Phaser.GameObjects.Rectangle;
  private playerData = StorageManager.loadPlayerData();

  constructor() {
    super('GameScene');
  }

  create(): void {
    ensureSceneInputEnabled(this);
    this.runEnded = false;
    this.distanceTravelled = 0;
    this.slowCurrentUntil = 0;
    this.runElapsedMs = 0;

    this.playerData = StorageManager.loadPlayerData();
    this.cameras.main.setBackgroundColor(UI_THEME.colors.oceanTop);
    this.createBackdrop();

    this.gameState.resetAll();
    this.gameState.setUnlockedStages(this.playerData.unlockedStages);
    this.gameState.setSelectedStage(this.playerData.currentStage);
    this.gameState.setStorageDegraded(StorageManager.isDegraded());

    this.selectedStage = this.evolutionManager.getStage(this.playerData.currentStage);
    this.lobster = new Lobster(this, 140, GAME.HEIGHT * 0.5, this.selectedStage);
    this.gameState.setActiveStage(this.selectedStage.id);
    this.gameState.setShieldCount(this.lobster.getShieldCount());
    this.gameState.setFreeRevives(this.lobster.getFreeRevives());

    this.inputController = new InputController(this);
    this.scrollManager = new ScrollManager(this);
    this.collisionManager = new CollisionManager();
    this.particleManager = new ParticleManager(this);
    this.audioManager = new AudioManager();
    this.hud = new HUD(this, this.gameState);
    this.revivePanel = new RevivePanel(this);

    this.infoBanner = createBanner(this, {
      x: 360,
      y: 206,
      width: 360,
      height: 60,
      text: '',
      tone: 'surface',
      fontSize: '22px',
      depth: UI_THEME.depths.toast,
    });
    this.infoBanner.container.setVisible(false).setAlpha(0);

    this.guideBanner = createBanner(this, {
      x: 360,
      y: 1098,
      width: 420,
      height: 68,
      text: '按住下潜，松开上浮',
      tone: 'hero',
      fontSize: '24px',
      depth: UI_THEME.depths.toast,
    });
    this.guideBanner.container.setVisible(false).setAlpha(0);

    this.damageFlash = this.add
      .rectangle(360, 640, 720, 1280, UI_THEME.colors.danger, 0)
      .setDepth(UI_THEME.depths.hud - 2)
      .setScrollFactor(0);

    this.showGuide();
    this.showInfo(`当前形态：${this.selectedStage.name}`);

    this.events.once('shutdown', () => {
      this.inputController.destroy();
      this.scrollManager.destroy();
      this.lobster.destroy();
      this.hud.destroy();
      this.revivePanel.destroy();
      this.infoBanner?.container.destroy(true);
      this.guideBanner?.container.destroy(true);
      this.damageFlash?.destroy();
    });
  }

  update(time: number, delta: number): void {
    this.hud.update(time);
    if (this.runEnded || this.revivePanel.isVisible()) {
      return;
    }

    this.runElapsedMs += delta;
    const slowMultiplier = time < this.slowCurrentUntil ? EFFECTS.SLOW_CURRENT_MULTIPLIER : 1;
    const difficulty = this.difficultyManager.getDifficulty(this.gameState.getScore(), slowMultiplier);

    this.lobster.update(delta, this.inputController.isPressed(), GAME.HEIGHT);
    this.scrollManager.update(delta, {
      score: this.gameState.getScore(),
      difficulty,
      slowCurrentActive: time < this.slowCurrentUntil,
      elapsedMs: this.runElapsedMs,
      lobster: this.lobster,
    });

    this.distanceTravelled += difficulty.scrollSpeed * (delta / 16.6667);
    const nextScore = resolveScoreFromElapsedMs(this.runElapsedMs);
    if (nextScore !== this.gameState.getScore()) {
      this.gameState.setScore(nextScore);
      this.handleEvolutionProgress(nextScore);
    }

    this.collisionManager.process(
      this.lobster,
      this.scrollManager.getActiveObstacles(),
      this.scrollManager.getActivePredators(),
      this.scrollManager.getActivePowerUps(),
      {
        onObstacleHit: () => this.handleDamage(),
        onPredatorHit: () => this.handleDamage(),
        onPowerUpHit: (powerUp) => {
          if (powerUp.kind === 'shieldBubble') {
            const applied = this.lobster.addShield();
            if (!applied) {
              this.showInfo('护盾已满');
              return;
            }
            this.gameState.setShieldCount(this.lobster.getShieldCount());
            this.particleManager.play('effect_powerup', powerUp.x, powerUp.y);
            this.audioManager.play('sfx_powerup');
            this.scrollManager.releasePowerUp(powerUp);
            this.showInfo('护盾 +1');
            return;
          }

          this.slowCurrentUntil = Math.max(this.slowCurrentUntil, time + 3500);
          this.particleManager.play('effect_powerup', powerUp.x, powerUp.y);
          this.audioManager.play('sfx_powerup');
          this.scrollManager.releasePowerUp(powerUp);
          this.showInfo('海流减速生效');
        },
      },
    );
  }

  private handleDamage(): void {
    if (this.lobster.isInvincible()) {
      return;
    }

    if (this.lobster.consumeShield()) {
      this.gameState.setShieldCount(this.lobster.getShieldCount());
      this.audioManager.play('sfx_shield_break');
      this.particleManager.play('effect_shield_break', this.lobster.x, this.lobster.y);
      this.triggerDangerFeedback('shield');
      this.showInfo('护盾抵挡了本次伤害');
      return;
    }

    this.audioManager.play('sfx_death');
    this.particleManager.play('effect_death', this.lobster.x, this.lobster.y);
    this.triggerDangerFeedback('fatal');
    this.tryReviveOrFinish();
  }

  private tryReviveOrFinish(): void {
    if (this.lobster.getFreeRevives() <= 0) {
      this.finishRun();
      return;
    }

    this.revivePanel.show(
      this.lobster.getFreeRevives(),
      () => {
        if (!this.lobster.consumeFreeRevive()) {
          this.finishRun();
          return;
        }

        this.lobster.revive(140, Phaser.Math.Clamp(this.lobster.y, 180, GAME.HEIGHT - 180));
        this.gameState.setFreeRevives(this.lobster.getFreeRevives());
        this.audioManager.play('sfx_revive');
        this.particleManager.play('effect_powerup', this.lobster.x, this.lobster.y);
        this.showInfo('免费复活成功');
      },
      () => this.finishRun(),
    );
  }

  private handleEvolutionProgress(score: number): void {
    const newlyUnlocked = this.evolutionManager.getNewlyUnlockedStageIds(score, this.playerData.unlockedStages);
    if (newlyUnlocked.length > 0) {
      this.playerData.unlockedStages = [...this.playerData.unlockedStages, ...newlyUnlocked].sort((left, right) => left - right);
      StorageManager.savePlayerData(this.playerData);
      this.gameState.setUnlockedStages(this.playerData.unlockedStages);
      this.gameState.setStorageDegraded(StorageManager.isDegraded());
    }

    const activeStage = this.evolutionManager.resolveActiveStage(score, this.playerData.currentStage);
    if (activeStage.id !== this.gameState.getActiveStage()) {
      this.lobster.applyStage(activeStage, 'upgrade');
      this.lobster.setInvincible(1500);
      this.gameState.setActiveStage(activeStage.id);
      this.gameState.setShieldCount(this.lobster.getShieldCount());
      this.gameState.setFreeRevives(this.lobster.getFreeRevives());
      this.audioManager.play('sfx_evolve');
      this.particleManager.play('effect_evolve', this.lobster.x, this.lobster.y);
      this.showInfo(`进化成功：${activeStage.name}`);
    }
  }

  private finishRun(): void {
    if (this.runEnded) {
      return;
    }

    this.runEnded = true;

    const score = this.gameState.getScore();
    const coinsGained = score;
    const previousHighScore = this.playerData.highScore;
    const highScore = Math.max(previousHighScore, score);
    const newRecord = score > previousHighScore;

    this.playerData = sanitizePlayerData({
      ...this.playerData,
      highScore,
      coins: this.playerData.coins + coinsGained,
      totalGamesPlayed: this.playerData.totalGamesPlayed + 1,
      lastRunScore: score,
    });
    StorageManager.savePlayerData(this.playerData);
    this.gameState.setStorageDegraded(StorageManager.isDegraded());

    const activeStageName = this.evolutionManager.getStage(this.gameState.getActiveStage()).name;
    this.scene.start('GameOverScene', {
      score,
      highScore,
      coinsGained,
      currentStageName: activeStageName,
      newRecord,
    });
  }

  private triggerDangerFeedback(level: 'shield' | 'fatal'): void {
    if (!this.damageFlash) {
      return;
    }

    this.cameras.main.shake(level === 'fatal' ? 180 : 110, level === 'fatal' ? 0.006 : 0.0025);
    this.tweens.killTweensOf(this.damageFlash);
    this.damageFlash.setAlpha(level === 'fatal' ? 0.24 : 0.16);
    this.tweens.add({
      targets: this.damageFlash,
      alpha: 0,
      duration: level === 'fatal' ? 260 : 180,
      ease: 'Quad.Out',
    });
  }

  private showInfo(message: string): void {
    if (!this.infoBanner) {
      return;
    }

    this.infoBanner.label.setText(message);
    this.infoBanner.container.setVisible(true).setAlpha(1).setY(206);
    this.tweens.killTweensOf(this.infoBanner.container);
    this.tweens.add({
      targets: this.infoBanner.container,
      alpha: 0,
      y: 178,
      duration: 1400,
      ease: 'Quad.Out',
      onComplete: () => this.infoBanner?.container.setVisible(false).setY(206),
    });
  }

  private showGuide(): void {
    if (!this.guideBanner) {
      return;
    }

    this.guideBanner.container.setVisible(true).setAlpha(0).setY(1118);
    this.tweens.add({
      targets: this.guideBanner.container,
      alpha: 1,
      y: 1098,
      duration: 220,
      ease: 'Quad.Out',
      onComplete: () => {
        this.time.delayedCall(2200, () => {
          if (!this.guideBanner?.container.active) {
            return;
          }

          this.tweens.add({
            targets: this.guideBanner.container,
            alpha: 0,
            y: 1064,
            duration: 260,
            ease: 'Quad.In',
            onComplete: () => this.guideBanner?.container.setVisible(false).setY(1098),
          });
        });
      },
    });
  }

  private createBackdrop(): void {
    createOceanBackdrop(this, { bubbleCount: 12, variant: 'game' });
    decorateGameBackdrop(this);
    this.add.rectangle(360, 238, 720, 206, 0xffffff, 0.018).setDepth(UI_THEME.depths.decor + 1);
    this.add.rectangle(360, 924, 720, 420, 0x07243a, 0.1).setDepth(UI_THEME.depths.decor + 1);
    this.add.circle(626, 1108, 120, 0x0f7cb6, 0.08).setDepth(UI_THEME.depths.decor + 1);
  }
}




