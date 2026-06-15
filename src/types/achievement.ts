// ============================================================
// 成就系统类型定义
// ============================================================

/** 成就难度 */
export type AchievementDifficulty = 'easy' | 'medium' | 'hard' | 'legendary';

/** 奖励类型 */
export type AchievementRewardType = 'gold' | 'seeds' | 'harvest' | 'buff';

/** 永久增益类型 */
export type AchievementBuffType =
  | 'growthSpeed'     // 生长速度 +%
  | 'sellPrice'       // 售价 +%
  | 'fertilizerPower' // 肥料效果 +%
  | 'extraYield';     // 额外收获概率 +%

/** 成就奖励 */
export interface AchievementReward {
  type: AchievementRewardType;
  value: number;
  plantId?: string;
  buffType?: AchievementBuffType;
}

/** 成就定义 */
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: AchievementDifficulty;
  tracker: string;
  target: number;
  reward: AchievementReward;
}

/** 成就追踪器 */
export interface AchievementProgress {
  totalHarvest: number;
  totalSell: number;
  totalEarned: number;
  totalFertilizer: number;
  uniqueCropsHarvested: number;
  tasksCompleted: number;
  totalPlots: number;
  perennialHarvest: number;
  monthlyHarvest: number;
  regionsUnlocked: number;
  hellTasksCompleted: number;
  compendiumComplete: boolean;
}

/** 成就弹窗提示 */
export interface AchievementToast {
  achievementId: string;
  timestamp: number;
}

/** 玩家成就状态 */
export interface AchievementState {
  completed: string[];
  progress: AchievementProgress;
  /** 已激活的永久增益 */
  activeBuffs: Partial<Record<AchievementBuffType, number>>;
  /** 当前展示的成就弹窗（自动消失） */
  toast: AchievementToast | null;
}
