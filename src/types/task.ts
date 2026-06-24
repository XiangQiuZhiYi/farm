// ============================================================
// 任务板相关类型定义
// ============================================================

/** 任务难度枚举 */
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'hell';

/** 单个任务要求提交的农作物条目 */
export interface TaskRequirement {
  /** 植物 id */
  plantId: string;
  /** 需要一次性提交的数量 */
  quantity: number;
}

/** 任务板基础规则配置 */
export interface TaskBoardRules {
  /** 第一个游戏天不刷新任务 */
  skipFirstDay: boolean;
  /** 除第一个游戏天外，每隔多少天刷新一次 */
  offerIntervalDays: number;
  /** 每次刷新给玩家几个候选任务 */
  offerChoices: number;
  /** 任务必须一次性提交完成 */
  submissionMode: 'all-at-once';
  /** 已完成任务永久移出候选池 */
  completedTasksRemoved: boolean;
  /** 限时任务失败后重新回到候选池 */
  failedTimedTasksReturnToPool: boolean;
}

/** 任务板中的完整任务定义 */
export interface TaskDefinition {
  /** 唯一任务 id */
  id: string;
  /** 任务名称 */
  title: string;
  /** 难度 */
  difficulty: TaskDifficulty;
  /** 是否为限时任务 */
  isTimed: boolean;
  /** 限时任务的时限天数；不限时为 null */
  timeLimitDays: number | null;
  /** 任务需要的农作物清单 */
  requirements: TaskRequirement[];
  /** 按当前提交清单直接售卖可获得的基础金额 */
  baseSaleValue: number;
  /** 难度奖励倍数 */
  difficultyMultiplier: number;
  /** 限时附加倍数，不限时固定为 1 */
  timedBonusMultiplier: number;
  /** 最终奖励倍数 */
  rewardMultiplier: number;
  /** 最终金币奖励 */
  rewardGold: number;
}

/** 当前任务板上展示中的任务 */
export interface TaskOffer {
  /** 任务 id */
  taskId: string;
  /** 出现在任务板上的绝对天数序号 */
  offeredDay: number;
  /** 到期真实时间戳（ms）；不限时为 null */
  expiresAt: number | null;
}

/** 玩家已接取的任务状态 */
export interface ActiveTaskState extends TaskOffer {
  /** 接取任务的绝对天数序号 */
  acceptedDay: number;
}

/** 任务板运行时状态 */
export interface TaskBoardState {
  /** 当前任务板上可选的任务 */
  currentOffers: TaskOffer[];
  /** 当前已接取任务；首版仅支持同时接 1 个 -> 已移除上限 */
  activeTasks: ActiveTaskState[];
  /** 上次刷新任务板的绝对天数序号 */
  lastRefreshDay: number | null;
}