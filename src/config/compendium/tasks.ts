import { getPlantById } from '../plants';
import { TASK_BOARD_TASKS } from '../tasks';

export interface TaskCompendiumEntry {
  id: string;
  title: string;
  difficulty: string;
  isTimed: boolean;
  timeLimitMonths: number | null;
  summary: string;
  highlights: string[];
  details: Array<{ label: string; value: string }>;
  unlockPlantIds: string[];
}

const TASK_DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
  hell: '地狱',
};

function buildRequirementsLabel(taskId: string) {
  const task = TASK_BOARD_TASKS.find((item) => item.id === taskId);
  if (!task) return '—';

  return task.requirements
    .map((requirement) => {
      const plant = getPlantById(requirement.plantId);
      return `${plant?.name ?? requirement.plantId} × ${requirement.quantity}`;
    })
    .join('、');
}

export const TASK_COMPENDIUM_ENTRIES: TaskCompendiumEntry[] = TASK_BOARD_TASKS.map((task) => {
  const totalQuantity = task.requirements.reduce((sum, requirement) => sum + requirement.quantity, 0);
  const unlockPlantIds = [...new Set(task.requirements.map((requirement) => requirement.plantId))];

  return {
    id: task.id,
    title: task.title,
    difficulty: task.difficulty,
    isTimed: task.isTimed,
    timeLimitMonths: task.timeLimitMonths,
    summary: `${TASK_DIFFICULTY_LABELS[task.difficulty]}任务，需要 ${task.requirements.length} 种作物，共 ${totalQuantity} 单位。`,
    highlights: [
      TASK_DIFFICULTY_LABELS[task.difficulty],
      task.isTimed ? '限时任务' : '常驻任务',
      task.isTimed && task.timeLimitMonths ? `${task.timeLimitMonths} 个月时限` : '无时限',
      `${Math.round(task.rewardMultiplier * 100)}% 奖励倍率`,
    ].filter(Boolean) as string[],
    details: [
      { label: '难度', value: TASK_DIFFICULTY_LABELS[task.difficulty] },
      { label: '任务类型', value: task.isTimed ? '限时' : '不限时' },
      { label: '任务时限', value: task.isTimed && task.timeLimitMonths ? `${task.timeLimitMonths} 个月` : '无' },
      { label: '需求清单', value: buildRequirementsLabel(task.id) },
      { label: '基础售价', value: `${task.baseSaleValue} 金` },
      { label: '奖励倍数', value: `${task.rewardMultiplier.toFixed(2)} 倍` },
      { label: '任务奖励', value: `${task.rewardGold} 金` },
      { label: '提交方式', value: '一次性交付' },
      {
        label: '解锁条件',
        value: unlockPlantIds
          .map((plantId) => getPlantById(plantId)?.name ?? plantId)
          .join('、'),
      },
    ],
    unlockPlantIds,
  };
});

export const getTaskCompendiumEntry = (id: string): TaskCompendiumEntry | null =>
  TASK_COMPENDIUM_ENTRIES.find((entry) => entry.id === id) ?? null;