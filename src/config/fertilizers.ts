// ============================================================
// 肥料静态配置（仅保留生长加速类）
// ============================================================

import type { FertilizerConfig, FertilizerId } from '../types/fertilizer';

export const FERTILIZER_CONFIGS: FertilizerConfig[] = [
  {
    id: 'growth_hormone',
    name: '生长激素肥料',
    purchasePrice: 100,
    effectType: 'growth',
    multiplier: 1.2,
    plotStatusLabel: '生长肥',
    shortLabel: '生长',
  },
  {
    id: 'advanced_growth_hormone',
    name: '高级生长激素肥料',
    purchasePrice: 200,
    effectType: 'growth',
    multiplier: 1.5,
    plotStatusLabel: '高级生长肥',
    shortLabel: '高生',
  },
];

export const getFertilizerById = (id: FertilizerId | string) =>
  FERTILIZER_CONFIGS.find((fertilizer) => fertilizer.id === id) ?? null;