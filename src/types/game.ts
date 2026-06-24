// ============================================================
// 游戏全局运行时状态类型定义
// ============================================================

/** 生长加速倍率（测试/沙盒档可调，影响植物生长速度，不影响时间流逝） */
export type TimeScale = 1 | 1440 | 2880 | 4320;

/** 游戏时钟状态 */
export interface ClockState {
  /** 游戏总运行分钟数（累计，不重置，1:1 真实时间） */
  totalMinutes: number;
  /** 当前游戏天数（1-12，循环） */
  day: number;
  /** 生长加速倍率（仅影响植物生长，不影响时间流逝） */
  timeScale: TimeScale;
  /** 是否正在运行（暂停时为 false） */
  running: boolean;
}

/** 玩家背包：植物 id → 持有数量（收获果实） */
export type Inventory = Record<string, number>;

/** 种子库：植物 id → 持有种子数量（购买后等待播种） */
export type Seeds = Record<string, number>;

/** 杂物库存：道具 id → 持有数量（目前用于肥料） */
export type MiscInventory = Record<string, number>;

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
  /** 当前单选的地块 id，null 表示未选中 */
  selectedPlotId: string | null;
  /** 批量多选的地块 id 集合 */
  selectedPlotIds: string[];
  /** 是否已手动打开批量操作面板 */
  batchPanelOpen: boolean;
  /** 选中的面板模式 */
  panelMode: 'none' | 'plant' | 'action';
}

/** 统计面板数据 */
export interface StatsState {
  /** 每种植物累计收获次数 */
  perPlantHarvests: Record<string, number>;
  /** 每种植物累计出售数量 */
  perPlantSells: Record<string, number>;
  /** 每种植物累计出售收入 */
  perPlantSellRevenue: Record<string, number>;
  /** 每日金币快照（date 为 YYYY-MM-DD 格式，最多保留 30 条） */
  dailyGoldHistory: { date: string; gold: number }[];
  /** 上次金币快照的日期（YYYY-MM-DD），用于判断是否需要新快照 */
  lastSnapshotDate: string | null;
  /** 累计游玩真实分钟数 */
  totalPlayTimeMinutes: number;
}
