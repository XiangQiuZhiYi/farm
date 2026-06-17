// ============================================================
// 区域静态配置
// ============================================================

import type { RegionConfig } from '../../types/land';

export const REGION_CONFIGS: RegionConfig[] = [
  {
    id: 'region_paddy',
    name: '水稻土区',
    prerequisitePlotCount: 0,
    prerequisiteRegionId: null, // 初始开放
    initialPlotCount: 6,
    maxPlotCount: 24,
    minExpandPrice: 100,
    maxExpandPrice: 1200,
  },
  {
    id: 'region_brown_tidal',
    name: '褐土/潮土组',
    prerequisitePlotCount: 15, // 水稻土区需扩展到 15 块
    prerequisiteRegionId: 'region_paddy',
    initialPlotCount: 2,
    maxPlotCount: 24,
    minExpandPrice: 1200,
    maxExpandPrice: 4500,
  },
  {
    id: 'region_black',
    name: '黑土区',
    prerequisitePlotCount: 15, // 褐土/潮土组需扩展到 15 块
    prerequisiteRegionId: 'region_brown_tidal',
    initialPlotCount: 2,
    maxPlotCount: 24,
    minExpandPrice: 4500,
    maxExpandPrice: 10000,
  },
];

/** 根据 id 快速查找区域配置 */
export const getRegionById = (id: string) =>
  REGION_CONFIGS.find((c) => c.id === id) ?? null;
