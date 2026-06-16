// ============================================================
// 土地相关类型定义
// ============================================================

import type { FertilizerId } from './fertilizer';

/** 土地基础类型标识 */
export type LandTypeId =
  | 'paddy_field'   // 水田
  | 'dry_land'      // 旱地
  | 'brown_soil'    // 褐土
  | 'tidal_soil'    // 潮土
  | 'black_soil';   // 黑土

/** 土地含水状态：影响适水植物的产量修正 */
export type WaterState = 'flooded' | 'moist' | 'dry' | 'waterlogged';

/** 区域标识 */
export type RegionId = 'region_paddy' | 'region_brown_tidal' | 'region_black';

/** 土地类型静态配置 */
export interface LandTypeConfig {
  id: LandTypeId;
  name: string;
  /** 默认初始含水状态（仅用于展示，不参与逻辑计算） */
  defaultWaterState: WaterState;
  /** 支持的区域 */
  regionId: RegionId;
  /** 每格扩张购买价格（金币） */
  expandPrice: number;
  /** 背景色（Canvas 渲染占位，待替换为 Sprite Sheet） */
  bgColor: string;
}

/** 区域配置 */
export interface RegionConfig {
  id: RegionId;
  name: string;
  /** 解锁所需前一区域的地块数量（需达到此数量才允许解锁） */
  prerequisitePlotCount: number;
  /** 前置区域（null 表示初始开放） */
  prerequisiteRegionId: RegionId | null;
  /** 初始地块数量 */
  initialPlotCount: number;
  /** 地块数量上限 */
  maxPlotCount: number;
  /** 扩张地块的最低价格（初始扩张） */
  minExpandPrice: number;
  /** 扩张地块的最高价格（最后扩张） */
  maxExpandPrice: number;
}

/** 单块地的运行时状态 */
export interface PlotState {
  id: string;
  regionId: RegionId;
  landTypeId: LandTypeId;
  waterState: WaterState;
  /** 当前种植的植物 id，null 表示空地 */
  plantedPlantId: string | null;
  /** 播种时的游戏分钟戳 */
  plantedAt: number | null;
  /** 当前有效成长分钟数（只统计在季节内的成长时间） */
  growthMinutesAccumulated: number;
  /** 最近一次参与成长结算的游戏分钟戳 */
  lastGrowthTickAt: number | null;
  /** 当前植株已收获次数，多年生会递增 */
  harvestCount: number;
  /** 是否已成熟可收获 */
  isReadyToHarvest: boolean;
  /** 是否已枯萎，枯萎后需要重新播种 */
  isWilted: boolean;
  /** 当前作物挂载的肥料；同一时间只允许存在一个 */
  appliedFertilizerId: FertilizerId | null;
}
