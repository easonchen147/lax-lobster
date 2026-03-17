import { describe, expect, it } from 'vitest';

import {
  EVOLUTION_LAYOUT,
  resolveEvolutionCardGeometry,
  resolveEvolutionCardTitleFontSize,
  resolveEvolutionPageMetrics,
  resolveEvolutionSummaryGeometry,
} from '@/ui/EvolutionLayout';

describe('EvolutionLayout', () => {
  it('keeps summary, section header, grid and footer separated', () => {
    const metrics = resolveEvolutionPageMetrics(8);

    expect(metrics.summaryBottom).toBeLessThanOrEqual(metrics.sectionTop - 18);
    expect(metrics.sectionBottom).toBeLessThanOrEqual(metrics.gridTop - 18);
    expect(metrics.footerTop).toBeGreaterThanOrEqual(metrics.gridBottom + 24);
  });

  it('uses a comfortable grid density for two-column cards', () => {
    expect(EVOLUTION_LAYOUT.grid.columnGap).toBeGreaterThanOrEqual(16);
    expect(EVOLUTION_LAYOUT.grid.rowGap).toBeGreaterThanOrEqual(18);
    expect(EVOLUTION_LAYOUT.grid.cardHeight).toBeGreaterThanOrEqual(136);
  });

  it('keeps the summary preview, info plate and stat row separated', () => {
    const summary = resolveEvolutionSummaryGeometry();

    expect(summary.preview.right).toBeLessThanOrEqual(summary.info.left - 20);
    expect(summary.eyebrow.top).toBeGreaterThanOrEqual(summary.info.top + 14);
    expect(summary.subEyebrow.top).toBeGreaterThanOrEqual(summary.eyebrow.bottom + 4);
    expect(summary.routeBadge.bottom).toBeLessThanOrEqual(summary.title.top - 4);
    expect(summary.currentBadge.bottom).toBeLessThanOrEqual(summary.title.top - 4);
    expect(summary.title.top).toBeGreaterThanOrEqual(summary.subEyebrow.bottom + 8);
    expect(summary.title.right).toBeLessThanOrEqual(summary.watermark.left - 16);
    expect(summary.descriptor.top).toBeGreaterThanOrEqual(summary.title.bottom + 6);
    expect(summary.buff.top).toBeGreaterThanOrEqual(summary.descriptor.bottom + 8);
    expect(summary.buff.bottom).toBeLessThanOrEqual(summary.infoDivider.top - 8);
    expect(summary.info.bottom).toBeLessThanOrEqual(summary.metrics[0].top - 14);
    expect(summary.infoDivider.bottom).toBeLessThanOrEqual(summary.nextGoal.top - 8);
    expect(summary.nextGoal.bottom).toBeLessThanOrEqual(summary.metrics[0].top - 10);
    expect(summary.metrics[0].right).toBeLessThanOrEqual(summary.metrics[1].left - 12);
    expect(summary.metrics[0].left).toBeGreaterThanOrEqual(summary.summary.left + 20);
    expect(summary.metrics[1].right).toBeLessThanOrEqual(summary.summary.right - 20);
    expect(summary.metrics[0].bottom).toBeLessThanOrEqual(summary.summary.bottom - 12);
  });

  it('keeps evolution card art, content, status and progress in separate regions', () => {
    const card = resolveEvolutionCardGeometry(
      EVOLUTION_LAYOUT.grid.cardWidth,
      EVOLUTION_LAYOUT.grid.cardHeight,
    );

    expect(card.art.right).toBeLessThanOrEqual(card.content.left - 14);
    expect(card.stageLabel.bottom).toBeLessThanOrEqual(card.primaryInfo.top - 8);
    expect(card.statusChip.left).toBeGreaterThanOrEqual(card.content.right - 92);
    expect(card.title.width).toBeGreaterThanOrEqual(150);
    expect(card.secondaryInfo.right).toBeLessThanOrEqual(card.footerLabel.left - 12);
    expect(card.footerLabel.right).toBeLessThanOrEqual(EVOLUTION_LAYOUT.grid.cardWidth / 2 - 12);
    expect(card.primaryInfo.bottom).toBeLessThanOrEqual(card.progress.top - 12);
    expect(card.progress.left).toBeGreaterThanOrEqual(card.content.left);
    expect(card.progress.right).toBeLessThanOrEqual(card.content.right);
  });

  it('shrinks the card title font for long stage names', () => {
    const shortName = resolveEvolutionCardTitleFontSize('普通龙虾', false);
    const longName = resolveEvolutionCardTitleFontSize('混沌太古龙神龙虾', false);

    expect(Number.parseInt(longName, 10)).toBeLessThan(Number.parseInt(shortName, 10));
  });
});
