// ============================================================
// 成长系统：计算阶段 & 产量
// ============================================================

import type { PlotState } from '../types/land';
import type { PlantConfig } from '../types/plant';
import type { LandTypeConfig } from '../types/land';
import type { GrowthStage } from '../types/plant';

function getEffectiveHarvestType(plant: PlantConfig) {
  return plant.harvestType ?? 'annual';
}

function getEffectivePlantableMonths(plant: PlantConfig): number[] {
  if (plant.plantableMonths && plant.plantableMonths.length > 0) return plant.plantableMonths;
  return [...new Set([...plant.season.bestMonths, ...plant.season.okMonths])];
}

/** 判断当前月份是否属于该植物的有效生长月 */
export function isPlantableMonth(plant: PlantConfig, currentMonth: number): boolean {
  return getEffectivePlantableMonths(plant).includes(currentMonth);
}

/** 计算当前生长周期的目标分钟数 */
export function getGrowthTargetMinutes(plot: PlotState, plant: PlantConfig): number {
  if (getEffectiveHarvestType(plant) === 'perennial' && plot.harvestCount > 0) {
    return plant.reharvestMinutes ?? plant.growthMinutes;
  }
  return plant.growthMinutes;
}

/**
 * 根据种植时长推算当前成长阶段
 * @param elapsedMinutes 已过去的游戏分钟数
 * @param plant          植物配置
 */
export function calcGrowthStage(
  elapsedMinutes: number,
  plant: PlantConfig,
  targetMinutes: number = plant.growthMinutes,
): GrowthStage {
  const progress = Math.min(elapsedMinutes / targetMinutes, 1);
  const { stageBoundaries } = plant;

  // 从 mature 向前判断（大多数时候已成长）
  if (progress >= stageBoundaries.mature) return 'mature';
  if (progress >= stageBoundaries.grow) return 'grow';
  if (progress >= stageBoundaries.sprout) return 'sprout';
  return 'seed';
}

/**
 * 计算收获产量（0-5）
 * 公式：base + soilBonus + seasonBonus + harvestBonus + random
 *   - base = 2（任意情况下的基础产出）
 *   - soilBonus: best=+1, compatible=-1（轻微减产）, 不适配=-4（重度减产）
 *   - seasonBonus: bestMonths=+1, okMonths=0, 其他=-2
 *   - harvestBonus: 时机恰好（mature 阶段收）+1，提前/延误 0
 *   - random: [-1, +1] 随机扰动
 */
export function calcYield(
  plot: PlotState,
  plant: PlantConfig,
  landCfg: LandTypeConfig | null,
  currentMonth: number,
): number {
  let score = 2;

  // soil bonus：适宜土地加分，兼容轻减，不适配重罚
  if (landCfg) {
    if (plant.soilMatch.best.includes(plot.landTypeId)) score += 1;
    else if (plant.soilMatch.compatible.includes(plot.landTypeId)) score -= 1;
    else score -= 4;
  }

  // season bonus
  if (plant.season.bestMonths.includes(currentMonth)) score += 1;
  else if (!plant.season.okMonths.includes(currentMonth)) score -= 2;

  // harvest timing bonus（isReadyToHarvest === true 说明刚好成熟）
  if (plot.isReadyToHarvest) score += 1;

  // random [-1, +1]
  score += Math.round(Math.random() * 2 - 1);

  // 限制在 [0, 5]
  return Math.max(0, Math.min(5, score));
}

/**
 * 计算当前地块的展示阶段：
 * - 年生作物：按当前成长进度显示
 * - 多年生作物：首次成熟前按成长阶段，之后保持 mature
 */
export function calcPlotGrowthStage(plot: PlotState, plant: PlantConfig): GrowthStage {
  if (getEffectiveHarvestType(plant) === 'perennial' && plot.harvestCount > 0) {
    return 'mature';
  }

  return calcGrowthStage(
    plot.growthMinutesAccumulated,
    plant,
    getGrowthTargetMinutes(plot, plant),
  );
}
