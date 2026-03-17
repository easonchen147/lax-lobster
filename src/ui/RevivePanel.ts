import Phaser from 'phaser';

import { createButton, createPanelBackground } from '@/ui/UiFactory';
import { UI_THEME } from '@/ui/UiTheme';
import { TIMINGS } from '@/utils/Constants';

export class RevivePanel {
  private readonly container: Phaser.GameObjects.Container;
  private readonly panel: Phaser.GameObjects.Container;
  private readonly counterText: Phaser.GameObjects.Text;
  private readonly remainText: Phaser.GameObjects.Text;
  private readonly progressFill: Phaser.GameObjects.Rectangle;
  private readonly reviveButton: Phaser.GameObjects.Container;
  private readonly giveUpButton: Phaser.GameObjects.Container;

  private timer?: Phaser.Time.TimerEvent;
  private giveUpRevealCall?: Phaser.Time.TimerEvent;
  private onRevive?: () => void;
  private onGiveUp?: () => void;
  private deadline = 0;
  private giveUpAvailableAt = 0;

  constructor(private readonly scene: Phaser.Scene) {
    const overlay = scene.add.rectangle(360, 640, 720, 1280, 0x03111d, 0.7);

    this.panel = scene.add.container(360, 660);
    const panelCard = createPanelBackground(scene, 568, 438, 'surface', UI_THEME.radii.xl);
    const title = scene.add
      .text(0, -146, '龙虾遇险', {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '46px',
        color: UI_THEME.colors.textPrimary,
        fontStyle: 'bold',
        stroke: '#07233d',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setShadow(0, 4, 'rgba(0,0,0,0.35)', 8, false, true);
    const subtitle = scene.add
      .text(0, -94, '抓住这次免费机会，立刻返回赛道。', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '22px',
        color: UI_THEME.colors.textSecondary,
      })
      .setOrigin(0.5);
    this.counterText = scene.add
      .text(0, -28, '5', {
        fontFamily: UI_THEME.fonts.display,
        fontSize: '86px',
        color: '#ffc857',
        fontStyle: 'bold',
        stroke: '#08233d',
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    this.remainText = scene.add
      .text(0, 42, '剩余免费复活：1', {
        fontFamily: UI_THEME.fonts.body,
        fontSize: '20px',
        color: UI_THEME.colors.textSecondary,
      })
      .setOrigin(0.5);

    const track = scene.add.rectangle(-208, 78, 416, 18, 0x12324e, 1).setOrigin(0, 0.5);
    this.progressFill = scene.add.rectangle(-208, 78, 416, 18, UI_THEME.colors.accentGold, 1).setOrigin(0, 0.5);

    this.reviveButton = createButton(scene, {
      x: 0,
      y: 162,
      width: 370,
      height: 82,
      label: '立即免费复活',
      subLabel: '继续冲刺，不浪费当前分数',
      variant: 'primary',
      pulse: true,
      onClick: () => this.handleRevive(),
    });
    this.giveUpButton = createButton(scene, {
      x: 0,
      y: 258,
      width: 370,
      height: 76,
      label: '结束本局',
      subLabel: '直接进入结算页面',
      variant: 'danger',
      onClick: () => this.handleGiveUp(),
    });
    this.giveUpButton.setAlpha(0.2);
    if (this.giveUpButton.input) {
      this.giveUpButton.input.enabled = false;
    }

    this.panel.add([panelCard, title, subtitle, this.counterText, this.remainText, track, this.progressFill, this.reviveButton, this.giveUpButton]);

    this.container = scene.add.container(0, 0, [overlay, this.panel]);
    this.container.setDepth(UI_THEME.depths.modal).setVisible(false).setAlpha(0);
  }

  show(freeRevives: number, onRevive: () => void, onGiveUp: () => void): void {
    if (freeRevives <= 0) {
      onGiveUp();
      return;
    }

    this.onRevive = onRevive;
    this.onGiveUp = onGiveUp;
    this.deadline = this.scene.time.now + TIMINGS.REVIVE_PANEL_TIMEOUT_MS;
    this.giveUpAvailableAt = this.scene.time.now + 1500;
    this.remainText.setText(`剩余免费复活：${freeRevives}`);
    this.counterText.setColor('#ffc857');
    this.counterText.setScale(1);
    this.giveUpButton.setAlpha(0.2);
    this.giveUpRevealCall?.remove(false);
    this.giveUpRevealCall = undefined;
    if (this.giveUpButton.input) {
      this.giveUpButton.input.enabled = false;
    }

    this.container.setVisible(true).setAlpha(1);
    this.panel.setScale(0.94);
    this.scene.tweens.killTweensOf(this.panel);
    this.scene.tweens.add({
      targets: this.panel,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: 'Back.Out',
    });
    this.scene.tweens.killTweensOf(this.counterText);
    this.scene.tweens.add({
      targets: this.counterText,
      scaleX: 1.06,
      scaleY: 1.06,
      duration: 460,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
    });

    this.giveUpRevealCall = this.scene.time.delayedCall(1500, () => {
      if (!this.giveUpButton.active || !this.container.visible) {
        return;
      }
      if (this.giveUpButton.input) {
        this.giveUpButton.input.enabled = true;
      }
      this.scene.tweens.add({
        targets: this.giveUpButton,
        alpha: 1,
        duration: 180,
        ease: 'Quad.Out',
      });
    });

    this.timer?.remove(false);
    this.timer = this.scene.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => this.updateCountdown(),
    });
    this.updateCountdown();
  }

  hide(): void {
    this.timer?.remove(false);
    this.timer = undefined;
    this.giveUpRevealCall?.remove(false);
    this.giveUpRevealCall = undefined;
    this.scene.tweens.killTweensOf(this.counterText);
    this.scene.tweens.killTweensOf(this.giveUpButton);
    this.counterText.setScale(1);
    this.giveUpButton.setAlpha(0.2);
    if (this.giveUpButton.input) {
      this.giveUpButton.input.enabled = false;
    }
    this.container.setVisible(false).setAlpha(0);
  }

  isVisible(): boolean {
    return this.container.visible;
  }

  destroy(): void {
    this.hide();
    this.container.destroy(true);
  }

  private updateCountdown(): void {
    const remainingMs = Math.max(0, this.deadline - this.scene.time.now);
    const seconds = Math.max(0, Math.ceil(remainingMs / 1000));
    this.counterText.setText(`${seconds}`);
    this.progressFill.displayWidth = 416 * (remainingMs / TIMINGS.REVIVE_PANEL_TIMEOUT_MS);

    if (remainingMs <= 1800) {
      this.counterText.setColor('#ffd9df');
    } else {
      this.counterText.setColor('#ffc857');
    }

    if (remainingMs <= 0) {
      this.handleGiveUp();
    }
  }

  private handleRevive(): void {
    if (!this.container.visible) {
      return;
    }

    this.hide();
    this.onRevive?.();
  }

  private handleGiveUp(): void {
    if (!this.container.visible || this.scene.time.now < this.giveUpAvailableAt) {
      return;
    }

    this.hide();
    this.onGiveUp?.();
  }
}