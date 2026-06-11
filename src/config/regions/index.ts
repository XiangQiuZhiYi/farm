// ============================================================
// 区域静态配置
// ============================================================

import type { RegionConfig } from '../../types/land';

export const REGION_CONFIGS: RegionConfig[] = [
  {
    id: 'region_paddy',
    name: '水稻土区',
    unlockGold: 0,
    unlockCompendiumCount: 0,
    prerequisiteRegionId: null, // 初始开放
    initialPlotCount: 6,
    maxPlotCount: 18,
  },
  {
    id: 'region_brown_tidal',
    name: '褐土/潮土组',
    unlockGold: 1600,
    unlockCompendiumCount: 10,
    prerequisiteRegionId: 'region_paddy', // 需要水稻土区 10 种图鉴
    initialPlotCount: 2,
    maxPlotCount: 18,
  },
  {
    id: 'region_black',
    name: '黑土区',
    unlockGold: 4200,
    unlockCompendiumCount: 10,
    prerequisiteRegionId: 'region_brown_tidal', // 需要褐土/潮土组 10 种图鉴
    initialPlotCount: 2,
    maxPlotCount: 18,
  },
];

/** 根据 id 快速查找区域配置 */
export const getRegionById = (id: string) =>
  REGION_CONFIGS.find((c) => c.id === id) ?? null;
