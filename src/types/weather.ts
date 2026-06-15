// ============================================================
// 天气系统类型定义
// ============================================================

/** 天气类型 */
export type WeatherId =
  | 'sunny'     // 晴阳天
  | 'breezy'    // 和风天
  | 'cloudy'    // 阴天
  | 'rainy'     // 绵绵雨
  | 'thunder'   // 雷阵雨
  | 'frost';    // 早霜

/** 天气配置 */
export interface WeatherDefinition {
  id: WeatherId;
  name: string;
  icon: string;
  durationMin: number;
  durationMax: number;
  weight: number;
  growthMultiplier: number;
  sellPriceMultiplier: number;
  /** 收获时额外效果 */
  bonusType: 'none' | 'extraYield' | 'seedReturn';
  bonusChance: number;
  /** UI 描述 */
  description: string;
}

/** 天气运行时状态 */
export interface WeatherState {
  /** 当前天气 id */
  current: WeatherId | null;
  /** 剩余持续月数 */
  remainingMonths: number;
  /** 上次 roll 天气的绝对月份序号 */
  lastRollMonth: number | null;
}
