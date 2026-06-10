// ============================================================
// 植物配置统一导出入口
// ============================================================

import { PADDY_REGION_PLANTS } from './paddyRegion';
import { BROWN_TIDAL_REGION_PLANTS } from './brownTidalRegion';
import { BLACK_SOIL_REGION_PLANTS } from './blackSoilRegion';
import type { PlantConfig } from '../../types/plant';

/** 全部 30 种植物配置 */
export const ALL_PLANTS: PlantConfig[] = [
  ...PADDY_REGION_PLANTS,
  ...BROWN_TIDAL_REGION_PLANTS,
  ...BLACK_SOIL_REGION_PLANTS,
];

/** 根据 id 快速查找植物配置 */
export const getPlantById = (id: string): PlantConfig | null =>
  ALL_PLANTS.find((p) => p.id === id) ?? null;

export { PADDY_REGION_PLANTS, BROWN_TIDAL_REGION_PLANTS, BLACK_SOIL_REGION_PLANTS };
