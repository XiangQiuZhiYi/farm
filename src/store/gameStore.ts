// ============================================================
// 游戏主 Store（Zustand）
// 管理：时钟、地块、经济、解锁、选中状态
// ============================================================

import { create } from 'zustand';
import type {
  ClockState,
  EconomyState,
  Inventory,
  Seeds,
  SelectionState,
  TimeScale,
} from '../types/game';
import type { PlotState, RegionId, LandTypeId } from '../types/land';
import type { ActiveTaskState, TaskBoardState, TaskDefinition, TaskOffer } from '../types/task';
import { REGION_CONFIGS } from '../config/regions';
import { getLandTypeById } from '../config/lands';
import { getPlantById, ALL_PLANTS } from '../config/plants';
import { TASK_BOARD_RULES, TASK_BOARD_TASKS, getTaskById } from '../config/tasks';
import { calcYield, getGrowthTargetMinutes, isPlantableMonth } from '../systems/growthSystem';

// ─────────────────────────────────────────────────────────────
// Store 接口
// ─────────────────────────────────────────────────────────────

interface GameStore {
  // ── 时钟 ────────────────────────────────────────────────────
  clock: ClockState;
  setTimeScale: (scale: TimeScale) => void;
  togglePause: () => void;
  /** 每帧由游戏循环调用：推进 deltaMinutes 分钟 */
  tickMinutes: (deltaMinutes: number) => void;

  // ── 地块 ────────────────────────────────────────────────────
  plots: PlotState[];
  /** 购买扩展一块地（扣除购买费用） */
  expandPlot: (regionId: RegionId, landTypeId: LandTypeId) => boolean;
  /** 在指定地块播种 */
  plantSeed: (plotId: string, plantId: string) => boolean;
  /** 收获 */
  harvest: (plotId: string) => void;

  // ── 经济 ────────────────────────────────────────────────────
  economy: EconomyState;
  /** 购买植物种子（从商店购入放入背包） */
  buySeeds: (plantId: string, quantity: number) => boolean;
  /** 出售背包中的农产品 */
  sellHarvest: (plantId: string, quantity: number) => boolean;
  /** 接取当前任务板上的某个任务 */
  acceptTask: (taskId: string) => boolean;
  /** 一次性提交当前已接取任务 */
  submitActiveTask: () => boolean;

  // ── 背包（收获果实） ─────────────────────────────────────────
  inventory: Inventory;

  // ── 任务板 ─────────────────────────────────────────────────
  taskBoard: TaskBoardState;

  // ── 种子库（购买的种子，播种后消耗） ──────────────────────────
  seeds: Seeds;

  // ── 解锁 ────────────────────────────────────────────────────
  unlockedPlants: string[];
  unlockedRegions: string[];
  unlockedTasks: string[];
  completedTasks: string[];
  compendium: Record<string, boolean>;

  // ── 选中状态 ─────────────────────────────────────────────────
  selection: SelectionState;
  selectPlot: (plotId: string | null) => void;
  setPanelMode: (mode: SelectionState['panelMode']) => void;

  /** 内部方法：解锁检查（不暴露给 UI） */
  _checkUnlocks: () => void;
}

// ─────────────────────────────────────────────────────────────
// 工具函数：根据游戏总分钟推算月/日/季节
// ─────────────────────────────────────────────────────────────

const MINUTES_PER_DAY = 1440;
const DAYS_PER_MONTH = 30;
const MONTHS_PER_YEAR = 12;
const MINUTES_PER_YEAR = MINUTES_PER_DAY * DAYS_PER_MONTH * MONTHS_PER_YEAR;
const GAME_START_DAY = Math.floor((MINUTES_PER_DAY * DAYS_PER_MONTH * 3) / MINUTES_PER_DAY) + 1;

function minutesToCalendar(total: number) {
  const dayIndex = Math.floor(total / MINUTES_PER_DAY);
  const month = (Math.floor(dayIndex / DAYS_PER_MONTH) % 12) + 1;
  const day = (dayIndex % DAYS_PER_MONTH) + 1;
  const seasons = ['spring', 'spring', 'spring',
                   'summer', 'summer', 'summer',
                   'autumn', 'autumn', 'autumn',
                   'winter', 'winter', 'winter'] as const;
  const season = seasons[month - 1];
  return { month, day, season };
}

function createBlankPlotState(base: Pick<PlotState, 'id' | 'regionId' | 'landTypeId' | 'waterState'>): PlotState {
  return {
    ...base,
    plantedPlantId: null,
    plantedAt: null,
    growthMinutesAccumulated: 0,
    lastGrowthTickAt: null,
    harvestCount: 0,
    isReadyToHarvest: false,
    isWilted: false,
  };
}

function getEligibleTaskIds(unlockedPlants: string[]) {
  const unlockedPlantSet = new Set(unlockedPlants);

  // 任务板筛选时，未开放所需作物的任务不会出现在候选池里。
  return TASK_BOARD_TASKS
    .filter((task) => task.requirements.every((requirement) => unlockedPlantSet.has(requirement.plantId)))
    .map((task) => task.id);
}

function getTaskCollectionStatus(
  task: TaskDefinition,
  unlockedPlants: string[],
  discoveredTasks: string[],
  completedTasks: string[],
) {
  const unlockedPlantSet = new Set(unlockedPlants);
  const requirementsUnlocked = task.requirements.every((requirement) => unlockedPlantSet.has(requirement.plantId));

  if (!requirementsUnlocked) return 'locked' as const;
  if (completedTasks.includes(task.id)) return 'completed' as const;
  if (discoveredTasks.includes(task.id)) return 'discovered' as const;
  return 'undiscovered' as const;
}

function getEligibleTasksForBoard(
  unlockedPlants: string[],
  discoveredTasks: string[],
  completedTasks: string[],
  activeTaskId: string | null,
) {
  const eligibleTaskIds = new Set(getEligibleTaskIds(unlockedPlants));

  // 显式保证任务板的抽取来源只来自“未发现 + 已发现”的任务池。
  return TASK_BOARD_TASKS
    .filter((task) => eligibleTaskIds.has(task.id))
    .filter((task) => {
      const status = getTaskCollectionStatus(task, unlockedPlants, discoveredTasks, completedTasks);
      return status === 'undiscovered' || status === 'discovered';
    })
    .filter((task) => task.id !== activeTaskId);
}

function getAbsoluteDay(totalMinutes: number) {
  return Math.floor(totalMinutes / MINUTES_PER_DAY) + 1;
}

function isTaskExpired(expiresOnDay: number | null, currentDay: number) {
  return expiresOnDay !== null && currentDay > expiresOnDay;
}

function buildTaskOffer(task: TaskDefinition, offeredDay: number): TaskOffer {
  return {
    taskId: task.id,
    offeredDay,
    // 限时从出现在任务板的当天开始计入，因此到期日基于 offeredDay 推导。
    expiresOnDay: task.timeLimitDays ? offeredDay + task.timeLimitDays - 1 : null,
  };
}

function hashTaskSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function seededNoise(taskId: string, currentDay: number) {
  const seed = hashTaskSeed(`${taskId}:${currentDay}`);
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function difficultyTrendWeight(difficulty: TaskDefinition['difficulty'], refreshIndex: number) {
  const progress = Math.min(refreshIndex / 10, 1.25);
  switch (difficulty) {
    case 'easy':
      return Math.max(1.85 - progress * 0.95, 0.72);
    case 'medium':
      return 0.95 + progress * 0.28;
    case 'hard':
      return 0.3 + progress * 0.5;
    case 'hell':
      return 0.1 + progress * 0.42;
    default:
      return 1;
  }
}

function shouldRefreshTaskBoard(day: number) {
  if (TASK_BOARD_RULES.skipFirstDay && day <= GAME_START_DAY) return false;
  return (day - GAME_START_DAY) % TASK_BOARD_RULES.offerIntervalDays === 0;
}

function createInitialTaskBoardState(unlockedPlants: string[]) {
  const initialOffers = selectTaskOffers({
    day: GAME_START_DAY,
    unlockedPlants,
    discoveredTasks: [],
    completedTasks: [],
    activeTask: null,
  });

  return {
    taskBoard: {
      currentOffers: initialOffers,
      activeTask: null,
      lastRefreshDay: initialOffers.length > 0 ? GAME_START_DAY : null,
    },
    unlockedTasks: initialOffers.map((offer) => offer.taskId),
  };
}

function selectTaskOffers(params: {
  day: number;
  unlockedPlants: string[];
  discoveredTasks: string[];
  completedTasks: string[];
  activeTask: ActiveTaskState | null;
}) {
  const refreshIndex = Math.max(1, Math.floor((params.day - GAME_START_DAY) / TASK_BOARD_RULES.offerIntervalDays));

  const eligibleTasks = getEligibleTasksForBoard(
    params.unlockedPlants,
    params.discoveredTasks,
    params.completedTasks,
    params.activeTask?.taskId ?? null,
  );

  const candidates = eligibleTasks
    .map((task) => {
      const trendWeight = difficultyTrendWeight(task.difficulty, refreshIndex);
      const randomWeight = 0.72 + seededNoise(task.id, params.day) * 0.9;
      return {
        task,
        score: trendWeight * randomWeight,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, TASK_BOARD_RULES.offerChoices)
    .map(({ task }) => buildTaskOffer(task, params.day));

  // 再次兜底，防止后续改动绕过前置过滤步骤，把未满足解锁条件的任务塞回任务板。
  const eligibleTaskIdSet = new Set(eligibleTasks.map((task) => task.id));
  return candidates.filter((offer) => eligibleTaskIdSet.has(offer.taskId));
}

function processTaskBoardForDay(state: Pick<GameStore, 'taskBoard' | 'unlockedPlants' | 'completedTasks' | 'unlockedTasks'>, day: number) {
  let nextTaskBoard = state.taskBoard;
  let nextUnlockedTasks = state.unlockedTasks;

  // 每天切换时先清理已过期的限时任务，已失败任务会重新回到候选池。
  const filteredOffers = nextTaskBoard.currentOffers.filter((offer) => !isTaskExpired(offer.expiresOnDay, day));
  const activeTaskExpired = nextTaskBoard.activeTask && isTaskExpired(nextTaskBoard.activeTask.expiresOnDay, day);

  if (filteredOffers.length !== nextTaskBoard.currentOffers.length || activeTaskExpired) {
    nextTaskBoard = {
      ...nextTaskBoard,
      currentOffers: filteredOffers,
      activeTask: activeTaskExpired ? null : nextTaskBoard.activeTask,
    };
  }

  if (shouldRefreshTaskBoard(day)) {
    const nextOffers = selectTaskOffers({
      day,
      unlockedPlants: state.unlockedPlants,
      discoveredTasks: nextUnlockedTasks,
      completedTasks: state.completedTasks,
      activeTask: nextTaskBoard.activeTask,
    });
    const offeredTaskIds = nextOffers.map((offer) => offer.taskId);

    nextTaskBoard = {
      ...nextTaskBoard,
      currentOffers: nextOffers,
      lastRefreshDay: day,
    };
    nextUnlockedTasks = [...new Set([...nextUnlockedTasks, ...offeredTaskIds])];
  }

  return {
    taskBoard: nextTaskBoard,
    unlockedTasks: nextUnlockedTasks,
  };
}

function advancePlotLifecycle(
  plot: PlotState,
  plantId: string,
  plant: NonNullable<ReturnType<typeof getPlantById>>,
  newTotal: number,
  currentMonth: number,
): PlotState {
  if (plot.plantedPlantId !== plantId || plot.plantedAt === null) return plot;
  if (plot.isWilted) {
    return { ...plot, lastGrowthTickAt: newTotal, isReadyToHarvest: false };
  }

  const wiltOutOfSeason = plant.wiltOutOfSeason ?? true;
  const lifespanMinutes = plant.maxLifespanYears
    ? plant.maxLifespanYears * MINUTES_PER_YEAR
    : null;
  if (lifespanMinutes !== null && newTotal - plot.plantedAt >= lifespanMinutes) {
    return {
      ...plot,
      isReadyToHarvest: false,
      isWilted: true,
      lastGrowthTickAt: newTotal,
    };
  }

  const inSeason = isPlantableMonth(plant, currentMonth);
  const targetMinutes = getGrowthTargetMinutes(plot, plant);

  if (!inSeason) {
    if (wiltOutOfSeason && plot.growthMinutesAccumulated < targetMinutes) {
      return {
        ...plot,
        isReadyToHarvest: false,
        isWilted: true,
        lastGrowthTickAt: newTotal,
      };
    }

    return {
      ...plot,
      lastGrowthTickAt: newTotal,
    };
  }

  const lastGrowthTickAt = plot.lastGrowthTickAt ?? plot.plantedAt;
  const delta = Math.max(0, newTotal - lastGrowthTickAt);
  const growthMinutesAccumulated = Math.min(plot.growthMinutesAccumulated + delta, targetMinutes);

  return {
    ...plot,
    growthMinutesAccumulated,
    lastGrowthTickAt: newTotal,
    isReadyToHarvest: growthMinutesAccumulated >= targetMinutes,
  };
}

// ─────────────────────────────────────────────────────────────
// 初始化地块：水稻土区 6 块默认开放
// ─────────────────────────────────────────────────────────────

function buildInitialPlots(): PlotState[] {
  const plots: PlotState[] = [];
  for (let i = 0; i < 6; i++) {
    plots.push(createBlankPlotState({
      id: `paddy_${i}`,
      regionId: 'region_paddy',
      landTypeId: 'paddy_field',
      waterState: 'flooded',
    }));
  }
  return plots;
}

// ─────────────────────────────────────────────────────────────
// Store 实现
// ─────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  // ── 时钟初始值（夏季第一个月 = 第4月，第1440*30*3 分钟处）─────
  clock: {
    totalMinutes: MINUTES_PER_DAY * DAYS_PER_MONTH * 3, // 跳过春季 3 个月
    month: 4,
    day: 1,
    season: 'summer',
    timeScale: 1,
    running: true,
  },

  setTimeScale: (scale) =>
    set((s) => ({ clock: { ...s.clock, timeScale: scale } })),

  togglePause: () =>
    set((s) => ({ clock: { ...s.clock, running: !s.clock.running } })),

  tickMinutes: (deltaMinutes) => {
    const { clock, plots, taskBoard, unlockedPlants, unlockedTasks, completedTasks } = get();
    if (!clock.running) return;

    const previousDay = getAbsoluteDay(clock.totalMinutes);
    const newTotal = clock.totalMinutes + deltaMinutes;
    const cal = minutesToCalendar(newTotal);
    const nextDay = getAbsoluteDay(newTotal);

    // 更新地块成熟状态
    const updatedPlots = plots.map((plot) => {
      if (!plot.plantedPlantId || plot.plantedAt === null) return plot;
      const plant = getPlantById(plot.plantedPlantId);
      if (!plant) return plot;
      return advancePlotLifecycle(plot, plot.plantedPlantId, plant, newTotal, cal.month);
    });

    let nextTaskState = { taskBoard, unlockedTasks };
    if (nextDay > previousDay) {
      for (let day = previousDay + 1; day <= nextDay; day += 1) {
        nextTaskState = processTaskBoardForDay(
          {
            taskBoard: nextTaskState.taskBoard,
            unlockedPlants,
            completedTasks,
            unlockedTasks: nextTaskState.unlockedTasks,
          },
          day,
        );
      }
    }

    set({
      clock: { ...clock, totalMinutes: newTotal, ...cal },
      plots: updatedPlots,
      taskBoard: nextTaskState.taskBoard,
      unlockedTasks: nextTaskState.unlockedTasks,
    });
  },

  // ── 地块 ─────────────────────────────────────────────────────
  plots: buildInitialPlots(),

  expandPlot: (regionId, landTypeId) => {
    const { plots, economy, unlockedRegions } = get();
    if (!unlockedRegions.includes(regionId)) return false;

    const regionCfg = REGION_CONFIGS.find((r) => r.id === regionId);
    if (!regionCfg) return false;

    const existing = plots.filter((p) => p.regionId === regionId).length;
    if (existing >= regionCfg.maxPlotCount) return false;

    const landCfg = getLandTypeById(landTypeId);
    if (!landCfg) return false;
    // 确保所选土地类型属于该区域
    if (landCfg.regionId !== regionId) return false;
    if (economy.gold < landCfg.expandPrice) return false;

    const newPlot: PlotState = {
      id: `${regionId}_${existing}`,
      regionId,
      landTypeId,
      waterState: landCfg.defaultWaterState,
      plantedPlantId: null,
      plantedAt: null,
      growthMinutesAccumulated: 0,
      lastGrowthTickAt: null,
      harvestCount: 0,
      isReadyToHarvest: false,
      isWilted: false,
    };

    set((s) => ({
      plots: [...s.plots, newPlot],
      economy: {
        ...s.economy,
        gold: s.economy.gold - landCfg.expandPrice,
      },
    }));
    return true;
  },

  plantSeed: (plotId, plantId) => {
    // 从种子库消耗种子，而非从果实背包
    const { plots, seeds, clock, unlockedPlants } = get();
    if (!unlockedPlants.includes(plantId)) return false;
    const plant = getPlantById(plantId);
    if (!plant) return false;
    if (!isPlantableMonth(plant, clock.month)) return false;
    const qty = seeds[plantId] ?? 0;
    if (qty <= 0) return false;

    const plotIdx = plots.findIndex((p) => p.id === plotId);
    if (plotIdx < 0) return false;
    if (plots[plotIdx].plantedPlantId !== null && !plots[plotIdx].isWilted) return false;

    const updated = [...plots];
    updated[plotIdx] = {
      ...updated[plotIdx],
      plantedPlantId: plantId,
      plantedAt: clock.totalMinutes,
      growthMinutesAccumulated: 0,
      lastGrowthTickAt: clock.totalMinutes,
      harvestCount: 0,
      isReadyToHarvest: false,
      isWilted: false,
    };

    set((s) => ({
      plots: updated,
      // 种子库减一
      seeds: {
        ...s.seeds,
        [plantId]: qty - 1,
      },
    }));
    return true;
  },

  harvest: (plotId) => {
    const { plots, clock } = get();
    const plotIdx = plots.findIndex((p) => p.id === plotId);
    if (plotIdx < 0) return;

    const plot = plots[plotIdx];
    if (!plot.plantedPlantId || plot.plantedAt === null) return;
    if (!plot.isReadyToHarvest) return;

    const plant = getPlantById(plot.plantedPlantId);
    if (!plant) return;

    const landCfg = getLandTypeById(plot.landTypeId);
    const yieldAmt = calcYield(plot, plant, landCfg, clock.month);

    // 更新背包，年生作物收完即清场，多年生作物保留植株继续再生
    const updated = [...plots];
    const isPerennial = (plant.harvestType ?? 'annual') === 'perennial';
    updated[plotIdx] = isPerennial
      ? {
          ...plot,
          growthMinutesAccumulated: 0,
          lastGrowthTickAt: clock.totalMinutes,
          harvestCount: plot.harvestCount + 1,
          isReadyToHarvest: false,
        }
      : {
          ...plot,
          plantedPlantId: null,
          plantedAt: null,
          growthMinutesAccumulated: 0,
          lastGrowthTickAt: null,
          harvestCount: 0,
          isReadyToHarvest: false,
          isWilted: false,
        };

    set((s) => ({
      plots: updated,
      inventory: {
        ...s.inventory,
        [plant.id]: (s.inventory[plant.id] ?? 0) + yieldAmt,
      },
      compendium: { ...s.compendium, [plant.id]: true },
    }));
  },

  // ── 经济 ─────────────────────────────────────────────────────
  economy: { gold: 100, cumulativeEarned: 0 },

  acceptTask: (taskId) => {
    const { taskBoard, clock } = get();
    if (taskBoard.activeTask) return false;

    const offer = taskBoard.currentOffers.find((item) => item.taskId === taskId);
    if (!offer) return false;

    const acceptedDay = getAbsoluteDay(clock.totalMinutes);

    set((state) => ({
      taskBoard: {
        ...state.taskBoard,
        currentOffers: state.taskBoard.currentOffers.filter((item) => item.taskId !== taskId),
        activeTask: {
          ...offer,
          acceptedDay,
        },
      },
    }));

    return true;
  },

  submitActiveTask: () => {
    const { taskBoard, inventory } = get();
    if (!taskBoard.activeTask) return false;

    const task = getTaskById(taskBoard.activeTask.taskId);
    if (!task) return false;

    const canSubmit = task.requirements.every((requirement) => (inventory[requirement.plantId] ?? 0) >= requirement.quantity);
    if (!canSubmit) return false;

    set((state) => {
      const nextInventory = { ...state.inventory };
      task.requirements.forEach((requirement) => {
        nextInventory[requirement.plantId] = (nextInventory[requirement.plantId] ?? 0) - requirement.quantity;
      });

      return {
        inventory: nextInventory,
        economy: {
          gold: state.economy.gold + task.rewardGold,
          // 任务奖励同样计入累计收入，用于植物和区域解锁。
          cumulativeEarned: state.economy.cumulativeEarned + task.rewardGold,
        },
        completedTasks: [...state.completedTasks, task.id],
        taskBoard: {
          ...state.taskBoard,
          activeTask: null,
        },
      };
    });

    get()._checkUnlocks();
    return true;
  },

  buySeeds: (plantId, quantity) => {
    const { economy, unlockedPlants } = get();
    if (!unlockedPlants.includes(plantId)) return false;
    const plant = getPlantById(plantId);
    if (!plant) return false;
    const total = plant.purchasePrice * quantity;
    if (economy.gold < total) return false;

    // 种子放入种子库，不进入果实背包
    set((s) => ({
      economy: { ...s.economy, gold: s.economy.gold - total },
      seeds: {
        ...s.seeds,
        [plantId]: (s.seeds[plantId] ?? 0) + quantity,
      },
    }));
    return true;
  },

  sellHarvest: (plantId, quantity) => {
    // 只允许出售果实背包中的内容，种子不可出售
    const { inventory } = get();
    const qty = inventory[plantId] ?? 0;
    if (qty < quantity) return false;
    const plant = getPlantById(plantId);
    if (!plant) return false;
    const income = plant.sellPricePerUnit * quantity;

    set((s) => ({
      inventory: {
        ...s.inventory,
        [plantId]: qty - quantity,
      },
      economy: {
        gold: s.economy.gold + income,
        // 累计收入只增不减，用于解锁判断
        cumulativeEarned: s.economy.cumulativeEarned + income,
      },
    }));

    // 解锁检查：累计收入达到门槛的植物自动解锁
    get()._checkUnlocks();
    return true;
  },

  // ── 果实背包（收获后存入） ────────────────────────────────────
  inventory: {},

  // ── 任务板 ───────────────────────────────────────────────────
  taskBoard: createInitialTaskBoardState(['rice']).taskBoard,

  // ── 种子库（购买后播种前持有） ───────────────────────────────
  seeds: {},

  // ── 解锁状态 ─────────────────────────────────────────────────
  unlockedPlants: ['rice'],          // 初始解锁水稻
  unlockedRegions: ['region_paddy'], // 初始开放水稻土区
  unlockedTasks: createInitialTaskBoardState(['rice']).unlockedTasks,
  completedTasks: [],
  compendium: {},

  /** 内部：检查并解锁满足条件的植物和区域（sellHarvest 后调用） */
  _checkUnlocks: () => {
    const { economy, unlockedPlants, unlockedRegions, compendium } = get();

    // 植物解锁：累计收入 >= unlockCumulativeGold
    const newPlants = ALL_PLANTS
      .filter((p) =>
        !unlockedPlants.includes(p.id) &&
        economy.cumulativeEarned >= p.unlockCumulativeGold,
      )
      .map((p) => p.id);

    // 区域解锁：累计收入 + 前置图鉴数
    const compendiumCount = (regionId: string) =>
      ALL_PLANTS.filter((p) => p.regionId === regionId && compendium[p.id]).length;

    const newRegions = REGION_CONFIGS.filter((r) => {
      if (unlockedRegions.includes(r.id)) return false;
      if (economy.cumulativeEarned < r.unlockGold) return false;
      if (r.prerequisiteRegionId === null) return true;
      return compendiumCount(r.prerequisiteRegionId) >= r.unlockCompendiumCount;
    }).map((r) => r.id);

    if (newPlants.length > 0 || newRegions.length > 0) {
      set((s) => ({
        unlockedPlants: [...s.unlockedPlants, ...newPlants],
        unlockedRegions: [...s.unlockedRegions, ...newRegions],
      }));
    }
  },

  // ── 选中状态 ─────────────────────────────────────────────────
  selection: { selectedPlotId: null, panelMode: 'none' },

  selectPlot: (plotId) =>
    set((s) => ({
      selection: {
        ...s.selection,
        selectedPlotId: plotId,
        panelMode: plotId ? 'action' : 'none',
      },
    })),

  setPanelMode: (mode) =>
    set((s) => ({ selection: { ...s.selection, panelMode: mode } })),
}));
