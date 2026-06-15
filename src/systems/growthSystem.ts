// ============================================================
// 成长系统：计算阶段 & 产量
// ============================================================

import type { PlotState } from '../types/land';
import type { PlantConfig } from '../types/plant';
import type { GrowthStage } from '../types/plant';
import { getFertilizerById } from '../config/fertilizers';

function getEffectiveHarvestType(plant: PlantConfig) {
  return plant.harvestType ?? 'annual';
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
 */
export function calcGrowthStage(
  elapsedMinutes: number,
  plant: PlantConfig,
  targetMinutes: number = plant.growthMinutes,
): GrowthStage {
  const progress = Math.min(elapsedMinutes / targetMinutes, 1);
  const { stageBoundaries } = plant;

  if (progress >= stageBoundaries.mature) return 'mature';
  if (progress >= stageBoundaries.grow) return 'grow';
  if (progress >= stageBoundaries.sprout) return 'sprout';
  return 'seed';
}

/**
 * 计算收获产量
 * 新设计：固定产量，不受土地/季节影响，简洁直接。
 */
export function calcYield(
  plot: PlotState,
  plant: PlantConfig,
): number {
  const fertilizer = plot.appliedFertilizerId ? getFertilizerById(plot.appliedFertilizerId) : null;
  // 仅生长肥存在，增产肥已移除；此处预留接口以备未来扩展
  if (fertilizer?.effectType === 'growth') {
    return plant.harvestYield;
  }
  return plant.harvestYield;
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
