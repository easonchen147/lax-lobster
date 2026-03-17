import { GAME } from '@/utils/Constants';

type LayoutBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export const EVOLUTION_LAYOUT = {
  titleY: 72,
  subtitleY: 114,
  summary: {
    x: 360,
    y: 282,
    width: 660,
    height: 304,
    preview: {
      x: -224,
      y: -20,
      width: 204,
      height: 210,
    },
    info: {
      x: 106,
      y: -36,
      width: 406,
      height: 200,
    },
    stats: {
      y: 110,
      metricWidth: 190,
      metricHeight: 60,
      gap: 16,
    },
  },
  section: {
    titleY: 466,
    captionY: 490,
  },
  grid: {
    columns: 2,
    cardWidth: 304,
    cardHeight: 140,
    columnGap: 20,
    rowGap: 18,
    startY: 592,
  },
  footer: {
    x: 360,
    y: 1220,
    width: 520,
    height: 120,
  },
} as const;

const createBounds = (x: number, y: number, width: number, height: number): LayoutBounds => ({
  x,
  y,
  width,
  height,
  left: x - width / 2,
  right: x + width / 2,
  top: y - height / 2,
  bottom: y + height / 2,
});

export const resolveEvolutionSummaryMetricPosition = (index: number): { x: number; y: number } => {
  const rowWidth =
    EVOLUTION_LAYOUT.summary.stats.metricWidth * 2 + EVOLUTION_LAYOUT.summary.stats.gap;
  const firstMetricX =
    EVOLUTION_LAYOUT.summary.info.x -
    rowWidth / 2 +
    EVOLUTION_LAYOUT.summary.stats.metricWidth / 2;

  return {
    x:
      firstMetricX +
      index * (EVOLUTION_LAYOUT.summary.stats.metricWidth + EVOLUTION_LAYOUT.summary.stats.gap),
    y: EVOLUTION_LAYOUT.summary.stats.y,
  };
};

export const resolveEvolutionSummaryGeometry = () => {
  const summary = createBounds(0, 0, EVOLUTION_LAYOUT.summary.width, EVOLUTION_LAYOUT.summary.height);
  const preview = createBounds(
    EVOLUTION_LAYOUT.summary.preview.x,
    EVOLUTION_LAYOUT.summary.preview.y,
    EVOLUTION_LAYOUT.summary.preview.width,
    EVOLUTION_LAYOUT.summary.preview.height,
  );
  const info = createBounds(
    EVOLUTION_LAYOUT.summary.info.x,
    EVOLUTION_LAYOUT.summary.info.y,
    EVOLUTION_LAYOUT.summary.info.width,
    EVOLUTION_LAYOUT.summary.info.height,
  );
  const textColumnLeft = info.left + 24;
  const currentBadgeWidth = 96;
  const routeBadgeWidth = 124;
  const currentBadgeCenterX = info.right - 20 - currentBadgeWidth / 2;
  const routeBadgeCenterX =
    currentBadgeCenterX - currentBadgeWidth / 2 - 8 - routeBadgeWidth / 2;

  return {
    summary,
    preview,
    info,
    eyebrow: createBounds(textColumnLeft + 72, info.top + 21, 144, 14),
    subEyebrow: createBounds(textColumnLeft + 78, info.top + 38, 156, 12),
    routeBadge: createBounds(routeBadgeCenterX, info.top + 22, routeBadgeWidth, 28),
    currentBadge: createBounds(currentBadgeCenterX, info.top + 22, currentBadgeWidth, 28),
    title: createBounds(textColumnLeft + 119, info.top + 74, 238, 40),
    descriptor: createBounds(textColumnLeft + 126, info.top + 118, 252, 28),
    buff: createBounds(textColumnLeft + 132, info.top + 154, 264, 18),
    watermark: createBounds(info.right - 65, info.top + 88, 74, 84),
    infoDivider: createBounds(info.x, info.y + 74, info.width - 82, 2),
    nextGoal: createBounds(info.x, info.y + 94, info.width - 48, 20),
    metricRail: createBounds(info.x, EVOLUTION_LAYOUT.summary.stats.y - 44, 320, 2),
    metrics: [0, 1].map((index) => {
      const position = resolveEvolutionSummaryMetricPosition(index);

      return createBounds(
        position.x,
        position.y,
        EVOLUTION_LAYOUT.summary.stats.metricWidth,
        EVOLUTION_LAYOUT.summary.stats.metricHeight,
      );
    }),
  };
};

export const resolveEvolutionCardGeometry = (width: number, height: number) => {
  const artLeft = -width / 2 + 18;
  const artWidth = 78;
  const artHeight = height - 30;
  const contentLeft = -width / 2 + 110;
  const contentRight = width / 2 - 20;
  const contentWidth = contentRight - contentLeft;
  const statusChipWidth = 72;
  const statusChipHeight = 24;
  const statusChipX = width / 2 - 48;

  return {
    art: createBounds(artLeft + artWidth / 2, 0, artWidth, artHeight),
    content: createBounds(contentLeft + contentWidth / 2, 0, contentWidth, height - 28),
    stageLabel: createBounds(contentLeft + 32, -height / 2 + 22, 64, 16),
    title: createBounds(contentLeft + contentWidth / 2, -height / 2 + 56, contentWidth, 24),
    primaryInfo: createBounds(contentLeft + contentWidth / 2, -height / 2 + 88, contentWidth - 4, 34),
    statusChip: createBounds(statusChipX, -height / 2 + 22, statusChipWidth, statusChipHeight),
    secondaryInfo: createBounds(contentLeft + 54, height / 2 - 38, 108, 16),
    footerLabel: createBounds(width / 2 - 36, height / 2 - 38, 48, 16),
    progress: createBounds(contentLeft + contentWidth / 2, height / 2 - 14, contentWidth, 8),
  };
};

export const resolveEvolutionCardTitleFontSize = (stageName: string, selected: boolean): string => {
  const length = Array.from(stageName).length;

  if (length >= 9) {
    return selected ? '16px' : '15px';
  }

  if (length >= 7) {
    return selected ? '18px' : '17px';
  }

  return selected ? '20px' : '19px';
};

export const resolveEvolutionCardPosition = (index: number): { x: number; y: number } => {
  const row = Math.floor(index / EVOLUTION_LAYOUT.grid.columns);
  const column = index % EVOLUTION_LAYOUT.grid.columns;
  const firstColumnX =
    360 - (EVOLUTION_LAYOUT.grid.cardWidth / 2 + EVOLUTION_LAYOUT.grid.columnGap / 2);

  return {
    x: firstColumnX + column * (EVOLUTION_LAYOUT.grid.cardWidth + EVOLUTION_LAYOUT.grid.columnGap),
    y: EVOLUTION_LAYOUT.grid.startY + row * (EVOLUTION_LAYOUT.grid.cardHeight + EVOLUTION_LAYOUT.grid.rowGap),
  };
};

export const resolveEvolutionPageMetrics = (cardCount: number) => {
  const rows = Math.max(1, Math.ceil(cardCount / EVOLUTION_LAYOUT.grid.columns));
  const gridTop = EVOLUTION_LAYOUT.grid.startY - EVOLUTION_LAYOUT.grid.cardHeight / 2;
  const gridBottom =
    EVOLUTION_LAYOUT.grid.startY +
    (rows - 1) * (EVOLUTION_LAYOUT.grid.cardHeight + EVOLUTION_LAYOUT.grid.rowGap) +
    EVOLUTION_LAYOUT.grid.cardHeight / 2;

  return {
    rows,
    summaryTop: EVOLUTION_LAYOUT.summary.y - EVOLUTION_LAYOUT.summary.height / 2,
    summaryBottom: EVOLUTION_LAYOUT.summary.y + EVOLUTION_LAYOUT.summary.height / 2,
    sectionTop: EVOLUTION_LAYOUT.section.titleY - 12,
    sectionBottom: EVOLUTION_LAYOUT.section.captionY + 12,
    gridTop,
    gridBottom,
    footerTop: EVOLUTION_LAYOUT.footer.y - EVOLUTION_LAYOUT.footer.height / 2,
    footerBottom: Math.min(GAME.HEIGHT, EVOLUTION_LAYOUT.footer.y + EVOLUTION_LAYOUT.footer.height / 2),
  };
};
