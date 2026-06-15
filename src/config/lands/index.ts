// ============================================================
// 土地类型静态配置
// ============================================================

import type { LandTypeConfig } from '../../types/land';

export const LAND_TYPE_CONFIGS: LandTypeConfig[] = [
  {
    id: 'paddy_field',
    name: '水田',
    defaultWaterState: 'flooded',
    regionId: 'region_paddy',
    expandPrice: 300,
    bgColor: '#4a7c5e',
  },
  {
    id: 'dry_land',
    name: '旱地',
    defaultWaterState: 'dry',
    regionId: 'region_paddy',
    expandPrice: 300,
    bgColor: '#8b6914',
  },
  {
    id: 'brown_soil',
    name: '褐土',
    defaultWaterState: 'moist',
    regionId: 'region_brown_tidal',
    expandPrice: 1200,
    bgColor: '#7a5c3a',
  },
  {
    id: 'tidal_soil',
    name: '潮土',
    defaultWaterState: 'moist',
    regionId: 'region_brown_tidal',
    expandPrice: 1200,
    bgColor: '#9a7a4a',
  },
  {
    id: 'black_soil',
    name: '黑土',
    defaultWaterState: 'moist',
    regionId: 'region_black',
    expandPrice: 4000,
    bgColor: '#2a2a1a',
  },
];

/** 根据 id 快速查找土地类型配置 */
export const getLandTypeById = (id: string) =>
  LAND_TYPE_CONFIGS.find((c) => c.id === id) ?? null;
