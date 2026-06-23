// ============================================================
// 任务板静态配置
// 说明：本文件先固定 40 条任务内容与奖励计算规则，具体限时持续天数后续功能再接入。
// ============================================================

import { ALL_PLANTS, getPlantById } from './plants';
import type { TaskBoardRules, TaskDefinition, TaskDifficulty, TaskRequirement } from '../types/task';

/** 任务板固定刷新规则 */
export const TASK_BOARD_RULES: TaskBoardRules = {
  skipFirstMonth: false,
  offerIntervalMonths: 1,
  offerChoices: 2,
  submissionMode: 'all-at-once',
  completedTasksRemoved: true,
  failedTimedTasksReturnToPool: true,
};

/** 已登记任务上限：达到此数量后不再刷新新任务 */
export const MAX_ACTIVE_TASKS = 6;

/** 各难度的基础奖励倍数 */
export const TASK_DIFFICULTY_MULTIPLIERS: Record<TaskDifficulty, number> = {
  easy: 1.2,
  medium: 1.2,
  hard: 1.6,
  hell: 2.4,
};

/** 限时任务在原本奖励倍数上的附加倍率 */
export const TIMED_TASK_BONUS_MULTIPLIER = 1.3;

type TaskSeed = {
  id: string;
  title: string;
  difficulty: TaskDifficulty;
  isTimed: boolean;
  timeLimitMonths?: number;
  requirements: TaskRequirement[];
};

function createTask(seed: TaskSeed): TaskDefinition {
  // 奖励直接绑定现有售价配置，避免任务表与植物价格表出现两套来源。
  const baseSaleValue = seed.requirements.reduce((total, requirement) => {
    const plant = getPlantById(requirement.plantId);
    if (!plant) {
      throw new Error(`Unknown plant id in task config: ${requirement.plantId}`);
    }
    return total + plant.sellPricePerUnit * requirement.quantity;
  }, 0);

  const difficultyMultiplier = TASK_DIFFICULTY_MULTIPLIERS[seed.difficulty];
  const timedBonusMultiplier = seed.isTimed ? TIMED_TASK_BONUS_MULTIPLIER : 1;
  const rewardMultiplier = Number((difficultyMultiplier * timedBonusMultiplier).toFixed(2));

  return {
    ...seed,
    timeLimitMonths: seed.isTimed ? seed.timeLimitMonths ?? defaultTimeLimitMonths(seed.difficulty) : null,
    baseSaleValue,
    difficultyMultiplier,
    timedBonusMultiplier,
    rewardMultiplier,
    rewardGold: Math.round(baseSaleValue * rewardMultiplier),
  };
}

function defaultTimeLimitMonths(difficulty: TaskDifficulty) {
  switch (difficulty) {
    case 'easy':
      return 2;
    case 'medium':
      return 3;
    case 'hard':
      return 4;
    case 'hell':
      return 5;
    default:
      return 3;
  }
}

const TASK_SEEDS: TaskSeed[] = [
  // ── EASY（14 条）────────────────────────────────────────────
  {
    id: 'task_easy_01',
    title: '晨市空心菜',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'water_spinach', quantity: 12 }],
  },
  {
    id: 'task_easy_02',
    title: '豆坊备货',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'soybean', quantity: 12 }],
  },
  {
    id: 'task_easy_03',
    title: '水芹鲜货',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'water_celery', quantity: 9 }],
  },
  {
    id: 'task_easy_04',
    title: '荷塘鲜藕',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'lotus_root', quantity: 6 }],
  },
  {
    id: 'task_easy_05',
    title: '谷仓补货',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'rice', quantity: 6 }],
  },
  {
    id: 'task_easy_06',
    title: '水乡茭白单',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'water_bamboo', quantity: 8 }],
  },
  {
    id: 'task_easy_07',
    title: '荸荠集市',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'water_chestnut', quantity: 10 }],
  },
  {
    id: 'task_easy_08',
    title: '油坊油菜单',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'rapeseed', quantity: 6 }],
  },
  {
    id: 'task_easy_09',
    title: '豆铺蚕豆',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'broad_bean', quantity: 6 }],
  },
  {
    id: 'task_easy_10',
    title: '冬粮小麦',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'wheat', quantity: 6 }],
  },
  {
    id: 'task_easy_11',
    title: '菜铺甘蓝',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'cabbage', quantity: 8 }],
  },
  {
    id: 'task_easy_12',
    title: '脆萝卜急单',
    difficulty: 'easy',
    isTimed: true,
    timeLimitMonths: 2,
    requirements: [{ plantId: 'carrot', quantity: 9 }],
  },
  {
    id: 'task_easy_13',
    title: '蒜铺备货',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'garlic', quantity: 5 }],
  },
  {
    id: 'task_easy_14',
    title: '集市鲜玉米',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'corn', quantity: 6 }],
  },
  {
    id: 'task_easy_15',
    title: '萝卜脆爽单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [{ plantId: 'green_radish', quantity: 6 }],
  },

  // ── MEDIUM（11 条）──────────────────────────────────────────
  {
    id: 'task_medium_01',
    title: '地窖土豆单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [{ plantId: 'potato', quantity: 36 }],
  },
  {
    id: 'task_medium_02',
    title: '榨油作坊单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'sunflower', quantity: 18 },
      { plantId: 'rapeseed', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_03',
    title: '水田宴席备货',
    difficulty: 'medium',
    isTimed: true,
    timeLimitMonths: 3,
    requirements: [
      { plantId: 'rice', quantity: 24 },
      { plantId: 'lotus_root', quantity: 18 },
    ],
  },
  {
    id: 'task_medium_04',
    title: '旱田轮作单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'soybean', quantity: 30 },
      { plantId: 'wheat', quantity: 24 },
      { plantId: 'broad_bean', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_05',
    title: '甘蓝胡萝卜礼盒',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'cabbage', quantity: 24 },
      { plantId: 'carrot', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_06',
    title: '花生高粱单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'peanut', quantity: 18 },
      { plantId: 'sorghum', quantity: 18 },
    ],
  },
  {
    id: 'task_medium_07',
    title: '黄瓜菜豆快货',
    difficulty: 'medium',
    isTimed: true,
    timeLimitMonths: 3,
    requirements: [
      { plantId: 'cucumber', quantity: 24 },
      { plantId: 'cowpea', quantity: 20 },
    ],
  },
  {
    id: 'task_medium_08',
    title: '大蒜炒货铺',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'garlic', quantity: 24 },
      { plantId: 'broad_bean', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_09',
    title: '黑土杂粮单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'millet', quantity: 18 },
      { plantId: 'oat', quantity: 18 },
    ],
  },
  {
    id: 'task_medium_10',
    title: '红薯西瓜特供',
    difficulty: 'medium',
    isTimed: true,
    timeLimitMonths: 3,
    requirements: [
      { plantId: 'sweet_potato', quantity: 16 },
      { plantId: 'watermelon', quantity: 8 },
    ],
  },
  {
    id: 'task_medium_11',
    title: '豌豆棉花单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'pea', quantity: 20 },
      { plantId: 'cotton', quantity: 10 },
    ],
  },
  {
    id: 'task_medium_12',
    title: '香料与根茎',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'saffron', quantity: 6 },
      { plantId: 'green_radish', quantity: 12 },
    ],
  },

  // ── HARD（10 条）────────────────────────────────────────────
  {
    id: 'task_hard_01',
    title: '湿地丰收季',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'rice', quantity: 30 },
      { plantId: 'lotus_root', quantity: 18 },
      { plantId: 'water_bamboo', quantity: 24 },
    ],
  },
  {
    id: 'task_hard_02',
    title: '三粮大车',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'wheat', quantity: 30 },
      { plantId: 'corn', quantity: 24 },
      { plantId: 'soybean', quantity: 30 },
    ],
  },
  {
    id: 'task_hard_03',
    title: '油坊出口单',
    difficulty: 'hard',
    isTimed: true,
    timeLimitMonths: 4,
    requirements: [
      { plantId: 'sunflower', quantity: 18 },
      { plantId: 'peanut', quantity: 18 },
      { plantId: 'rapeseed', quantity: 18 },
    ],
  },
  {
    id: 'task_hard_04',
    title: '辛香杂货',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'garlic', quantity: 24 },
      { plantId: 'cabbage', quantity: 24 },
      { plantId: 'carrot', quantity: 24 },
    ],
  },
  {
    id: 'task_hard_05',
    title: '块根集货',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'potato', quantity: 24 },
      { plantId: 'sweet_potato', quantity: 18 },
      { plantId: 'peanut', quantity: 18 },
    ],
  },
  {
    id: 'task_hard_06',
    title: '黑土出货大单',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'cotton', quantity: 18 },
      { plantId: 'sesame', quantity: 12 },
      { plantId: 'millet', quantity: 21 },
    ],
  },
  {
    id: 'task_hard_07',
    title: '高价果蔬箱',
    difficulty: 'hard',
    isTimed: true,
    timeLimitMonths: 4,
    requirements: [
      { plantId: 'watermelon', quantity: 10 },
      { plantId: 'cucumber', quantity: 20 },
      { plantId: 'cowpea', quantity: 20 },
    ],
  },
  {
    id: 'task_hard_08',
    title: '水乡盛宴急件',
    difficulty: 'hard',
    isTimed: true,
    timeLimitMonths: 4,
    requirements: [
      { plantId: 'rice', quantity: 36 },
      { plantId: 'water_chestnut', quantity: 30 },
      { plantId: 'lotus_root', quantity: 18 },
    ],
  },
  {
    id: 'task_hard_09',
    title: '芝麻棉花大单',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'sesame', quantity: 14 },
      { plantId: 'cotton', quantity: 18 },
      { plantId: 'oat', quantity: 21 },
    ],
  },
  {
    id: 'task_hard_10',
    title: '挂机四季粮',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'millet', quantity: 21 },
      { plantId: 'oat', quantity: 21 },
      { plantId: 'pea', quantity: 20 },
      { plantId: 'sweet_potato', quantity: 14 },
    ],
  },
  {
    id: 'task_hard_11',
    title: '水珍与药果',
    difficulty: 'hell',
    isTimed: false,
    requirements: [
      { plantId: 'gorgon', quantity: 8 },
      { plantId: 'wolfberry', quantity: 12 },
    ],
  },

  // ── HELL（5 条）─────────────────────────────────────────────
  {
    id: 'task_hell_01',
    title: '主粮储备令',
    difficulty: 'hell',
    isTimed: false,
    requirements: [
      { plantId: 'rice', quantity: 48 },
      { plantId: 'wheat', quantity: 36 },
      { plantId: 'corn', quantity: 36 },
      { plantId: 'soybean', quantity: 36 },
    ],
  },
  {
    id: 'task_hell_02',
    title: '经济作物冲榜单',
    difficulty: 'hell',
    isTimed: true,
    timeLimitMonths: 5,
    requirements: [
      { plantId: 'sunflower', quantity: 24 },
      { plantId: 'sesame', quantity: 16 },
      { plantId: 'cotton', quantity: 20 },
      { plantId: 'garlic', quantity: 24 },
    ],
  },
  {
    id: 'task_hell_03',
    title: '水田全收总单',
    difficulty: 'hell',
    isTimed: false,
    requirements: [
      { plantId: 'rice', quantity: 48 },
      { plantId: 'lotus_root', quantity: 24 },
      { plantId: 'water_bamboo', quantity: 30 },
      { plantId: 'water_chestnut', quantity: 36 },
    ],
  },
  {
    id: 'task_hell_04',
    title: '黑土极品大礼包',
    difficulty: 'hell',
    isTimed: false,
    requirements: [
      { plantId: 'apple', quantity: 9 },
      { plantId: 'watermelon', quantity: 9 },
      { plantId: 'sweet_potato', quantity: 24 },
      { plantId: 'sesame', quantity: 14 },
    ],
  },
  {
    id: 'task_hell_05',
    title: '丰收百货总采购',
    difficulty: 'hell',
    isTimed: false,
    requirements: [
      { plantId: 'potato', quantity: 30 },
      { plantId: 'carrot', quantity: 30 },
      { plantId: 'cabbage', quantity: 30 },
      { plantId: 'peanut', quantity: 24 },
      { plantId: 'sorghum', quantity: 18 },
    ],
  },
  {
    id: 'task_hell_06',
    title: '黑土极珍荟萃',
    difficulty: 'hell',
    isTimed: false,
    requirements: [
      { plantId: 'kiwi', quantity: 16 },
      { plantId: 'sesame', quantity: 14 },
      { plantId: 'apple', quantity: 8 },
    ],
  },
];
function validateTaskCoverage(tasks: TaskDefinition[]) {
  const difficultyCount: Record<TaskDifficulty, number> = {
    easy: 0,
    medium: 0,
    hard: 0,
    hell: 0,
  };

  const coveredPlantIds = new Set<string>();

  tasks.forEach((task) => {
    difficultyCount[task.difficulty] += 1;
    task.requirements.forEach((requirement) => {
      coveredPlantIds.add(requirement.plantId);
    });
  });

  // // 这层校验保证任务难度分布不被后续维护误改。
  // if (difficultyCount.easy !== 14 || difficultyCount.medium !== 12 || difficultyCount.hard !== 10 || difficultyCount.hell !== 7) {
  //   throw new Error(
  //     `Invalid task difficulty distribution: ${JSON.stringify(difficultyCount)}`,
  //   );
  // }

  // 这层校验保证现有作物不会在任务系统里出现漏配。
  const uncoveredPlants = ALL_PLANTS.filter((plant) => !coveredPlantIds.has(plant.id));
  if (uncoveredPlants.length > 0) {
    throw new Error(
      `Task config is missing plants: ${uncoveredPlants.map((plant) => plant.id).join(', ')}`,
    );
  }
}

export const TASK_BOARD_TASKS: TaskDefinition[] = TASK_SEEDS.map(createTask);

validateTaskCoverage(TASK_BOARD_TASKS);

export const getTaskById = (id: string): TaskDefinition | null =>
  TASK_BOARD_TASKS.find((task) => task.id === id) ?? null;
