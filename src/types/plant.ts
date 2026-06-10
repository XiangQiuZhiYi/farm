// ============================================================
// 植物相关类型定义
// ============================================================

import type { LandTypeId, RegionId, WaterState } from './land';

/** 植物成长阶段，对应 Sprite Sheet 横向 4 帧 */
export type GrowthStage = 'seed' | 'sprout' | 'grow' | 'mature';

/** 收获类型 */
export type HarvestType = 'annual' | 'perennial';

/** Sprite Sheet 帧配置 */
export interface SpriteFrameConfig {
  sheet: string;
  frameWidth: number;
  frameHeight: number;
  stageFrameIndex: Record<GrowthStage, number>;
}

/** 适配土地类型的收益修正 */
export interface SoilMatchConfig {
  best: LandTypeId[];
  compatible: LandTypeId[];
}

/** 适宜播种月份（1-12） */
export interface SeasonConfig {
  bestMonths: number[];
  okMonths: number[];
}

/** 植物静态配置 */
export interface PlantConfig {
  id: string;
  name: string;
  regionId: RegionId;
  unlockCumulativeGold: number;
  purchasePrice: number;
  sellPricePerUnit: number;
  expectedBestYield: number;
  /** 首次成熟所需累计成长分钟（只在 plantableMonths 内累计） */
  growthMinutes: number;

  // ── 季节生长控制 ─────────────────────────────────────────────
  /** 植物可以生长（累积成长时间）的月份；不在此列表内则挂起 */
  plantableMonths?: number[];
  /**
   * 越季是否枯萎：
   * - true：若处于 seed/sprout 阶段且当前月份不在 plantableMonths 内，直接枯萎
   * - false：仅挂起，等季节回来继续（多年生/跨季作物）
   */
  wiltOutOfSeason?: boolean;

  // ── 收获类型 ─────────────────────────────────────────────────
  harvestType?: HarvestType;
  /**
   * 多年生：首次收获后，再次收获所需累计成长分钟
   * （仅 harvestType === 'perennial' 时有效）
   */
  reharvestMinutes?: number;
  /**
    * 多年生：植物最大生命年数（游戏年，1年=12个月=17280分钟）
   * 超过后自动枯死，需重新购买种植
   */
  maxLifespanYears?: number;

  // ── 产量影响 ─────────────────────────────────────────────────
  stageBoundaries: Record<GrowthStage, number>;
  soilMatch: SoilMatchConfig;
  /** 仅用于产量修正的季节配置（区别于 plantableMonths 的生长控制） */
  season: SeasonConfig;
  preferredWaterState: WaterState;
  sprite: SpriteFrameConfig;
  difficultyFactor: number;
}
