// ============================================================
// 游戏全局运行时状态类型定义
// ============================================================

/** 时间加速倍率（开发调试用） */
export type TimeScale = 1 | 10 | 60 | 1000;

/** 季节枚举 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** 游戏时钟状态 */
export interface ClockState {
  /** 游戏总运行分钟数（累计，不重置） */
  totalMinutes: number;
  /** 当前游戏月份（1-12） */
  month: number;
  /** 当前游戏日（1-30） */
  day: number;
  /** 当前季节 */
  season: Season;
  /** 时间加速倍率 */
  timeScale: TimeScale;
  /** 是否正在运行（暂停时为 false） */
  running: boolean;
}

/** 玩家背包：植物 id → 持有数量（收获果实） */
export type Inventory = Record<string, number>;

/** 种子库：植物 id → 持有种子数量（购买后等待播种） */
export type Seeds = Record<string, number>;

/** 图鉴：植物 id → 是否已收获过（解锁图鉴） */
export type Compendium = Record<string, boolean>;

/** 解锁状态 */
export interface UnlockState {
  /** 已解锁植物 id 集合 */
  unlockedPlants: Set<string>;
  /** 已解锁区域 id 集合 */
  unlockedRegions: Set<string>;
  /** 玩家图鉴（累计收获过的植物） */
  compendium: Compendium;
}

/** 经济状态 */
export interface EconomyState {
  /** 当前持有金币 */
  gold: number;
  /** 历史累计赚取金额（用于植物解锁判断，只增不减） */
  cumulativeEarned: number;
}

/** 当前选中的操作面板目标 */
export interface SelectionState {
  /** 选中的地块 id，null 表示未选中 */
  selectedPlotId: string | null;
  /** 选中的面板模式 */
  panelMode: 'none' | 'plant' | 'action';
}
