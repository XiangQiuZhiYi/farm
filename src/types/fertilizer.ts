// ============================================================
// 肥料相关类型定义
// ============================================================

/** 肥料效果类型（仅保留生长加速类） */
export type FertilizerEffectType = 'growth';

/** 肥料唯一标识 */
export type FertilizerId =
  | 'growth_hormone_basic'
  | 'growth_hormone'
  | 'advanced_growth_hormone';

/** 肥料静态配置 */
export interface FertilizerConfig {
  id: FertilizerId;
  name: string;
  /** 商店购买价格 */
  purchasePrice: number;
  /** 生长类 / 增产类 */
  effectType: FertilizerEffectType;
  /** 对下一次成熟或下一次收获的倍率修正 */
  multiplier: number;
  /** 地块和面板上的简短状态文案 */
  plotStatusLabel: string;
  /** Canvas 上的短标识 */
  shortLabel: string;
}