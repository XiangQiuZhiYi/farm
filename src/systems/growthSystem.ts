// ============================================================
// 成长系统：计算阶段 & 产量
// ============================================================

import type { PlotState } from '../types/land';
import type { PlantConfig } from '../types/plant';
import type { LandTypeConfig } from '../types/land';
import type { GrowthStage } from '../types/plant';
import { getFertilizerById } from '../config/fertilizers';

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
 * 计算收获产量
 *
 * 核心变更：
 * - 基础产量锚定到 plant.expectedBestYield（而非硬编码 2），使高产量作物真正能达到配置值。
 * - baseFertility 参与结算：肥沃土地（黑土 fertility=3）给 +1 额外分并放宽上限，
 *   旱地/水田（fertility=1）不加分，褐土/潮土（fertility=2）不加分但处于中间梯队。
 * - landFactor 暂作注释记录，等未来引入连续产量系数时接入。
 *
 * 公式：
 *   score = (expectedBestYield - 1)
 *         + soilBonus    [best=+1, compatible=-1, 不适配=-3]
 *         + fertilityBonus [floor((baseFertility-1)/2) → 0/0/1]
 *         + seasonBonus  [bestMonths=+1, okMonths=0, 其他=-1]
 *         + harvestBonus [isReadyToHarvest=+1]
 *         + random       [-1, +1]
 *
 *   cap = expectedBestYield + fertilityBonus（肥沃土地允许超额产出）
 *   baseYield = clamp(score, 0, cap)
 */
export function calcYield(
  plot: PlotState,
  plant: PlantConfig,
  landCfg: LandTypeConfig | null,
  currentMonth: number,
): number {
  // 以设计产量减一为起点，避免平庸条件下也能轻松达到满产
  let score = plant.expectedBestYield - 1;

  // baseFertility 加成：fertility 1→+0，2→+0，3→+1
  const fertilityBonus = landCfg ? Math.floor((landCfg.baseFertility - 1) / 2) : 0;

  if (landCfg) {
    // 土地适配：最适宜 +1，兼容轻减，不适配重罚
    if (plant.soilMatch.best.includes(plot.landTypeId)) score += 1;
    else if (plant.soilMatch.compatible.includes(plot.landTypeId)) score -= 1;
    else score -= 3;

    // 土地基础肥力加成
    score += fertilityBonus;
  }

  // 季节加成
  if (plant.season.bestMonths.includes(currentMonth)) score += 1;
  else if (!plant.season.okMonths.includes(currentMonth)) score -= 1;

  // 成熟时机加成
  if (plot.isReadyToHarvest) score += 1;

  // 随机扰动 [-1, +1]
  score += Math.round(Math.random() * 2 - 1);

  // 上限由设计产量决定；肥沃土地允许小幅超额产出
  const cap = plant.expectedBestYield + fertilityBonus;
  const baseYield = Math.max(0, Math.min(cap, score));

  const fertilizer = plot.appliedFertilizerId ? getFertilizerById(plot.appliedFertilizerId) : null;
  if (fertilizer?.effectType === 'yield') {
    return Math.max(0, Math.round(baseYield * fertilizer.multiplier));
  }

  return baseYield;
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
