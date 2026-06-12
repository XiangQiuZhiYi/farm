// ============================================================
// 任务板静态配置
// 说明：本文件先固定 40 条任务内容与奖励计算规则，具体限时持续天数后续功能再接入。
// ============================================================

import { ALL_PLANTS, getPlantById } from './plants';
import type { TaskBoardRules, TaskDefinition, TaskDifficulty, TaskRequirement } from '../types/task';

/** 任务板固定刷新规则 */
export const TASK_BOARD_RULES: TaskBoardRules = {
  skipFirstMonth: false,
  offerIntervalMonths: 5,
  offerChoices: 2,
  submissionMode: 'all-at-once',
  completedTasksRemoved: true,
  failedTimedTasksReturnToPool: true,
};

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
  {
    id: 'task_easy_01',
    title: '谷仓补货',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'rice', quantity: 72 }],
  },
  {
    id: 'task_easy_02',
    title: '冬粮征集',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'wheat', quantity: 60 }],
  },
  {
    id: 'task_easy_03',
    title: '集市鲜玉米',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'corn', quantity: 54 }],
  },
  {
    id: 'task_easy_04',
    title: '豆坊备货',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'soybean', quantity: 48 }],
  },
  {
    id: 'task_easy_05',
    title: '地窖土豆单',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'potato', quantity: 42 }],
  },
  {
    id: 'task_easy_06',
    title: '油坊花生单',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'peanut', quantity: 36 }],
  },
  {
    id: 'task_easy_07',
    title: '甜食铺进货',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'sweet_potato', quantity: 36 }],
  },
  {
    id: 'task_easy_08',
    title: '荷塘鲜藕',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'lotus_root', quantity: 30 }],
  },
  {
    id: 'task_easy_09',
    title: '晨市空心菜',
    difficulty: 'easy',
    isTimed: true,
    timeLimitMonths: 2,
    requirements: [{ plantId: 'water_spinach', quantity: 48 }],
  },
  {
    id: 'task_easy_10',
    title: '水乡茭白单',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'water_chestnut', quantity: 24 }],
  },
  {
    id: 'task_easy_11',
    title: '菜铺白菜单',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'cabbage', quantity: 42 }],
  },
  {
    id: 'task_easy_12',
    title: '脆萝卜急单',
    difficulty: 'easy',
    isTimed: true,
    timeLimitMonths: 2,
    requirements: [{ plantId: 'radish', quantity: 42 }],
  },
  {
    id: 'task_easy_13',
    title: '蒜铺备货',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'garlic', quantity: 36 }],
  },
  {
    id: 'task_easy_14',
    title: '洋葱小订单',
    difficulty: 'easy',
    isTimed: false,
    requirements: [{ plantId: 'onion', quantity: 36 }],
  },
  {
    id: 'task_medium_01',
    title: '纺坊原料单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'cotton', quantity: 24 },
      { plantId: 'sesame', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_02',
    title: '榨油作坊单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'sunflower', quantity: 24 },
      { plantId: 'rapeseed', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_03',
    title: '辛香铺催货',
    difficulty: 'medium',
    isTimed: true,
    timeLimitMonths: 3,
    requirements: [
      { plantId: 'tobacco', quantity: 18 },
      { plantId: 'pepper', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_04',
    title: '地窖三件套',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'cabbage', quantity: 30 },
      { plantId: 'radish', quantity: 30 },
      { plantId: 'onion', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_05',
    title: '水田宴席备货',
    difficulty: 'medium',
    isTimed: true,
    timeLimitMonths: 3,
    requirements: [
      { plantId: 'rice', quantity: 48 },
      { plantId: 'lotus_root', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_06',
    title: '旱田轮作单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'corn', quantity: 36 },
      { plantId: 'soybean', quantity: 36 },
      { plantId: 'peanut', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_07',
    title: '北地糖麻单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'flax', quantity: 24 },
      { plantId: 'sugar_beet', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_08',
    title: '杂粮铺备货',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'buckwheat', quantity: 30 },
      { plantId: 'highland_barley', quantity: 24 },
    ],
  },
  {
    id: 'task_medium_09',
    title: '夏仓快收单',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'sorghum', quantity: 30 },
      { plantId: 'mung_bean', quantity: 30 },
    ],
  },
  {
    id: 'task_medium_10',
    title: '黑土地补给',
    difficulty: 'medium',
    isTimed: false,
    requirements: [
      { plantId: 'velvet_bean', quantity: 24 },
      { plantId: 'flax', quantity: 18 },
      { plantId: 'hemp', quantity: 12 },
    ],
  },
  {
    id: 'task_medium_11',
    title: '滋补礼盒催单',
    difficulty: 'medium',
    isTimed: true,
    timeLimitMonths: 3,
    requirements: [
      { plantId: 'wolfberry', quantity: 18 },
      { plantId: 'ginseng', quantity: 12 },
    ],
  },
  {
    id: 'task_hard_01',
    title: '湿地丰收季',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'rice', quantity: 48 },
      { plantId: 'water_spinach', quantity: 36 },
      { plantId: 'lotus_root', quantity: 24 },
    ],
  },
  {
    id: 'task_hard_02',
    title: '三粮大车',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'wheat', quantity: 48 },
      { plantId: 'corn', quantity: 48 },
      { plantId: 'soybean', quantity: 36 },
    ],
  },
  {
    id: 'task_hard_03',
    title: '油坊出口单',
    difficulty: 'hard',
    isTimed: true,
    timeLimitMonths: 4,
    requirements: [
      { plantId: 'cotton', quantity: 30 },
      { plantId: 'sesame', quantity: 24 },
      { plantId: 'sunflower', quantity: 24 },
      { plantId: 'rapeseed', quantity: 24 },
    ],
  },
  {
    id: 'task_hard_04',
    title: '辛香杂货箱',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'tobacco', quantity: 24 },
      { plantId: 'garlic', quantity: 30 },
      { plantId: 'onion', quantity: 30 },
      { plantId: 'pepper', quantity: 24 },
    ],
  },
  {
    id: 'task_hard_05',
    title: '块根集货单',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'potato', quantity: 36 },
      { plantId: 'sweet_potato', quantity: 30 },
      { plantId: 'peanut', quantity: 30 },
      { plantId: 'cabbage', quantity: 30 },
    ],
  },
  {
    id: 'task_hard_06',
    title: '高寒杂粮车',
    difficulty: 'hard',
    isTimed: true,
    timeLimitMonths: 4,
    requirements: [
      { plantId: 'flax', quantity: 24 },
      { plantId: 'buckwheat', quantity: 30 },
      { plantId: 'highland_barley', quantity: 24 },
      { plantId: 'sorghum', quantity: 24 },
    ],
  },
  {
    id: 'task_hard_07',
    title: '黑土豆甜配',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'sugar_beet', quantity: 24 },
      { plantId: 'velvet_bean', quantity: 24 },
      { plantId: 'mung_bean', quantity: 30 },
    ],
  },
  {
    id: 'task_hard_08',
    title: '药田纤维单',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'hemp', quantity: 18 },
      { plantId: 'wolfberry', quantity: 24 },
      { plantId: 'ginseng', quantity: 12 },
    ],
  },
  {
    id: 'task_hard_09',
    title: '水乡盛宴急件',
    difficulty: 'hard',
    isTimed: true,
    timeLimitMonths: 4,
    requirements: [
      { plantId: 'water_chestnut', quantity: 24 },
      { plantId: 'lotus_root', quantity: 24 },
      { plantId: 'rice', quantity: 60 },
      { plantId: 'water_spinach', quantity: 36 },
    ],
  },
  {
    id: 'task_hard_10',
    title: '辣市整车单',
    difficulty: 'hard',
    isTimed: false,
    requirements: [
      { plantId: 'pepper', quantity: 30 },
      { plantId: 'cotton', quantity: 24 },
      { plantId: 'cabbage', quantity: 30 },
      { plantId: 'radish', quantity: 30 },
    ],
  },
  {
    id: 'task_hell_01',
    title: '主粮储备令',
    difficulty: 'hell',
    isTimed: false,
    requirements: [
      { plantId: 'rice', quantity: 72 },
      { plantId: 'wheat', quantity: 60 },
      { plantId: 'corn', quantity: 60 },
      { plantId: 'soybean', quantity: 48 },
      { plantId: 'potato', quantity: 48 },
    ],
  },
  {
    id: 'task_hell_02',
    title: '经济作物冲榜单',
    difficulty: 'hell',
    isTimed: true,
    timeLimitMonths: 5,
    requirements: [
      { plantId: 'cotton', quantity: 36 },
      { plantId: 'sesame', quantity: 36 },
      { plantId: 'sunflower', quantity: 36 },
      { plantId: 'tobacco', quantity: 30 },
      { plantId: 'pepper', quantity: 36 },
    ],
  },
  {
    id: 'task_hell_03',
    title: '寒地商队大单',
    difficulty: 'hell',
    isTimed: false,
    requirements: [
      { plantId: 'flax', quantity: 30 },
      { plantId: 'sugar_beet', quantity: 30 },
      { plantId: 'buckwheat', quantity: 36 },
      { plantId: 'highland_barley', quantity: 30 },
      { plantId: 'sorghum', quantity: 36 },
    ],
  },
  {
    id: 'task_hell_04',
    title: '山野滋补总单',
    difficulty: 'hell',
    isTimed: false,
    requirements: [
      { plantId: 'ginseng', quantity: 18 },
      { plantId: 'wolfberry', quantity: 30 },
      { plantId: 'hemp', quantity: 24 },
      { plantId: 'velvet_bean', quantity: 30 },
      { plantId: 'mung_bean', quantity: 36 },
    ],
  },
  {
    id: 'task_hell_05',
    title: '运河宴席总采购',
    difficulty: 'hell',
    isTimed: false,
    requirements: [
      { plantId: 'lotus_root', quantity: 30 },
      { plantId: 'water_chestnut', quantity: 30 },
      { plantId: 'garlic', quantity: 36 },
      { plantId: 'onion', quantity: 36 },
      { plantId: 'rapeseed', quantity: 36 },
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

  // 这层校验保证任务难度分布不被后续维护误改。
  if (difficultyCount.easy !== 14 || difficultyCount.medium !== 11 || difficultyCount.hard !== 10 || difficultyCount.hell !== 5) {
    throw new Error(
      `Invalid task difficulty distribution: ${JSON.stringify(difficultyCount)}`,
    );
  }

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
