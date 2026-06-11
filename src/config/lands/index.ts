// ============================================================
// 土地类型静态配置
// ============================================================

import type { LandTypeConfig } from '../../types/land';

export const LAND_TYPE_CONFIGS: LandTypeConfig[] = [
  {
    id: 'paddy_field',
    name: '水田',
    landFactor: 1.0,
    baseFertility: 1,
    defaultWaterState: 'flooded',
    regionId: 'region_paddy',
    expandPrice: 117,   // 原 90 × 1.3
    bgColor: '#4a7c5e',
  },
  {
    id: 'dry_land',
    name: '旱地',
    landFactor: 1.0,
    baseFertility: 1,
    defaultWaterState: 'dry',
    regionId: 'region_paddy',
    expandPrice: 117,   // 原 90 × 1.3
    bgColor: '#8b6914',
  },
  {
    id: 'brown_soil',
    name: '褐土',
    landFactor: 1.15,
    baseFertility: 2,
    defaultWaterState: 'moist',
    regionId: 'region_brown_tidal',
    expandPrice: 234,   // 原 180 × 1.3
    bgColor: '#7a5c3a',
  },
  {
    id: 'tidal_soil',
    name: '潮土',
    landFactor: 1.15,
    baseFertility: 2,
    defaultWaterState: 'moist',
    regionId: 'region_brown_tidal',
    expandPrice: 234,   // 原 180 × 1.3
    bgColor: '#9a7a4a',
  },
  {
    id: 'black_soil',
    name: '黑土',
    landFactor: 1.5,
    baseFertility: 3,
    defaultWaterState: 'moist',
    regionId: 'region_black',
    expandPrice: 416,   // 原 320 × 1.3
    bgColor: '#2a2a1a',
  },
];

/** 根据 id 快速查找土地类型配置 */
export const getLandTypeById = (id: string) =>
  LAND_TYPE_CONFIGS.find((c) => c.id === id) ?? null;
