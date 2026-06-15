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

/** 植物静态配置 */
export interface PlantConfig {
  id: string;
  name: string;
  regionId: RegionId;
  unlockCumulativeGold: number;
  purchasePrice: number;
  sellPricePerUnit: number;
  /** 每次收获固定产量 */
  harvestYield: number;
  /** 首次成熟所需累计成长分钟 */
  growthMinutes: number;

  // ── 收获类型 ─────────────────────────────────────────────────
  harvestType?: HarvestType;
  /**
   * 多年生：首次收获后，再次收获所需累计成长分钟
   * （仅 harvestType === 'perennial' 时有效）
   */
  reharvestMinutes?: number;
  /**
   * 多年生：最大收获次数（达到后植株清除，需重新播种）
   * （仅 harvestType === 'perennial' 时有效）
   */
  maxHarvests?: number;

  // ── 土地限制 ─────────────────────────────────────────────────
  /** 唯一允许种植的土地类型（严格限定，不允许跨土地种植） */
  allowedLandTypeId: LandTypeId;

  // ── 生长展示 ─────────────────────────────────────────────────
  stageBoundaries: Record<GrowthStage, number>;
  preferredWaterState: WaterState;
  sprite: SpriteFrameConfig;
  difficultyFactor: number;
}
