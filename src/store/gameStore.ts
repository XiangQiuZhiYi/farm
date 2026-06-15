// ============================================================
// 游戏主 Store（Zustand）
// 管理：时钟、地块、经济、解锁、选中状态
// ============================================================

import { create } from 'zustand';
import type {
  ClockState,
  EconomyState,
  Inventory,
  MiscInventory,
  Seeds,
  SelectionState,
  TimeScale,
} from '../types/game';
// Season type removed
import type { PlotState, RegionId, LandTypeId } from '../types/land';
import type { ActiveTaskState, TaskBoardState, TaskDefinition, TaskOffer } from '../types/task';
import type { FertilizerId } from '../types/fertilizer';
import type { PersistedGameState, SaveProfile } from '../types/save';
import { REGION_CONFIGS } from '../config/regions';
import { getLandTypeById } from '../config/lands';
import { FERTILIZER_CONFIGS, getFertilizerById } from '../config/fertilizers';
import { getPlantById, ALL_PLANTS } from '../config/plants';
import { TASK_BOARD_RULES, TASK_BOARD_TASKS, getTaskById } from '../config/tasks';
import { calcYield, getGrowthTargetMinutes } from '../systems/growthSystem';

// ─────────────────────────────────────────────────────────────
// Store 接口
// ─────────────────────────────────────────────────────────────

interface GameStore {
  // ── 时钟 ────────────────────────────────────────────────────
  clock: ClockState;
  /** 当前存档信息：用于 real/test 行为切换 */
  saveProfile: SaveProfile;
  setSaveProfile: (profile: SaveProfile) => void;
  setTimeScale: (scale: TimeScale) => void;
  togglePause: () => void;
  /** 每帧由游戏循环调用：推进 deltaMinutes 分钟 */
  tickMinutes: (deltaMinutes: number) => void;
  /** 离线推进：不受暂停状态影响，按分钟补算 */
  applyOfflineMinutes: (deltaMinutes: number) => void;
  /** 导出当前完整游戏快照用于存档 */
  getPersistedState: () => PersistedGameState;
  /** 将存档快照完整恢复到运行时 */
  hydrateFromSnapshot: (snapshot: PersistedGameState) => void;

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
  /** 购买肥料（从商店购入放入杂物库存） */
  buyFertilizer: (fertilizerId: FertilizerId, quantity: number) => boolean;
  /** 出售种子库存 */
  sellSeeds: (plantId: string, quantity: number) => boolean;
  /** 出售肥料库存 */
  sellFertilizer: (fertilizerId: FertilizerId, quantity: number) => boolean;
  /** 出售背包中的农产品 */
  sellHarvest: (plantId: string, quantity: number) => boolean;
  /** 接取当前任务板上的某个任务 */
  acceptTask: (taskId: string) => boolean;
  /** 一次性提交当前已接取任务 */
  submitActiveTask: () => boolean;
  /** 对当前种植作物施肥 */
  applyFertilizer: (plotId: string, fertilizerId: FertilizerId) => boolean;

  // ── 背包（收获果实） ─────────────────────────────────────────
  inventory: Inventory;

  // ── 任务板 ─────────────────────────────────────────────────
  taskBoard: TaskBoardState;

  // ── 种子库（购买的种子，播种后消耗） ──────────────────────────
  seeds: Seeds;

  // ── 杂物库（当前用于肥料） ───────────────────────────────────
  miscInventory: MiscInventory;

  // ── 解锁 ────────────────────────────────────────────────────
  unlockedPlants: string[];
  unlockedRegions: string[];
  unlockedTasks: string[];
  completedTasks: string[];
  compendium: Record<string, boolean>;

  // ── 选中状态 ─────────────────────────────────────────────────
  selection: SelectionState;
  selectPlot: (plotId: string | null) => void;
  /** 切换地块多选状态，已在集合中则移除，否则添加 */
  togglePlotSelection: (plotId: string) => void;
  /** 手动打开批量面板 */
  openBatchPanel: () => void;
  /** 清空多选 */
  clearSelection: () => void;
  setPanelMode: (mode: SelectionState['panelMode']) => void;
  /** 对多选地块批量种植 */
  batchPlantSeed: (plotIds: string[], plantId: string) => void;
  /** 对多选地块批量施肥 */
  batchApplyFertilizer: (plotIds: string[], fertilizerId: FertilizerId) => void;

  /** 收获指定区域内所有可收获的地块 */
  harvestAll: (regionId: string) => void;

  /** 内部方法：解锁检查（不暴露给 UI） */
  _checkUnlocks: () => void;
}

// ─────────────────────────────────────────────────────────────
// 工具函数：根据游戏总分钟推算月份
// ─────────────────────────────────────────────────────────────

const MINUTES_PER_MONTH = 1440;
const GAME_START_ABSOLUTE_MONTH = 1;

function minutesToCalendar(total: number) {
  const absoluteMonthIndex = Math.floor(total / MINUTES_PER_MONTH);
  const month = (absoluteMonthIndex % 12) + 1;
  return { month };
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
    appliedFertilizerId: null,
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
  activeTaskIds: string[],
) {
  const eligibleTaskIds = new Set(getEligibleTaskIds(unlockedPlants));

  // 显式保证任务板的抽取来源只来自"未发现 + 已发现"的任务池。
  return TASK_BOARD_TASKS
    .filter((task) => eligibleTaskIds.has(task.id))
    .filter((task) => {
      const status = getTaskCollectionStatus(task, unlockedPlants, discoveredTasks, completedTasks);
      return status === 'undiscovered' || status === 'discovered';
    })
    .filter((task) => !activeTaskIds.includes(task.id));
}

function getAbsoluteMonthIndex(totalMinutes: number) {
  return Math.floor(totalMinutes / MINUTES_PER_MONTH) + 1;
}

function isTaskExpired(expiresOnMonth: number | null, currentMonthIndex: number) {
  return expiresOnMonth !== null && currentMonthIndex > expiresOnMonth;
}

function buildTaskOffer(task: TaskDefinition, offeredMonth: number): TaskOffer {
  return {
    taskId: task.id,
    offeredMonth,
    // 限时从出现在任务板的当月开始计入，因此到期月基于 offeredMonth 推导。
    expiresOnMonth: task.timeLimitMonths ? offeredMonth + task.timeLimitMonths - 1 : null,
  };
}

function hashTaskSeed(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function seededNoise(taskId: string, currentMonthIndex: number) {
  const seed = hashTaskSeed(`${taskId}:${currentMonthIndex}`);
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

function shouldRefreshTaskBoard(absoluteMonth: number) {
  if (TASK_BOARD_RULES.skipFirstMonth && absoluteMonth <= GAME_START_ABSOLUTE_MONTH) return false;
  return (absoluteMonth - GAME_START_ABSOLUTE_MONTH) % TASK_BOARD_RULES.offerIntervalMonths === 0;
}

function createInitialTaskBoardState(unlockedPlants: string[]) {
  const initialOffers = selectTaskOffers({
    absoluteMonth: GAME_START_ABSOLUTE_MONTH,
    unlockedPlants,
    discoveredTasks: [],
    completedTasks: [],
    activeTasks: [],
  });

  return {
    taskBoard: {
      currentOffers: initialOffers,
      activeTasks: [],
      lastRefreshMonth: initialOffers.length > 0 ? GAME_START_ABSOLUTE_MONTH : null,
    },
    unlockedTasks: initialOffers.map((offer) => offer.taskId),
  };
}

function selectTaskOffers(params: {
  absoluteMonth: number;
  unlockedPlants: string[];
  discoveredTasks: string[];
  completedTasks: string[];
  activeTasks: ActiveTaskState[];
}) {
  const refreshIndex = Math.max(1, Math.floor((params.absoluteMonth - GAME_START_ABSOLUTE_MONTH) / TASK_BOARD_RULES.offerIntervalMonths));

  const eligibleTasks = getEligibleTasksForBoard(
    params.unlockedPlants,
    params.discoveredTasks,
    params.completedTasks,
    params.activeTasks.map((t) => t.taskId),
  );

  const candidates = eligibleTasks
    .map((task) => {
      const trendWeight = difficultyTrendWeight(task.difficulty, refreshIndex);
      const randomWeight = 0.72 + seededNoise(task.id, params.absoluteMonth) * 0.9;
      return {
        task,
        score: trendWeight * randomWeight,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, TASK_BOARD_RULES.offerChoices)
    .map(({ task }) => buildTaskOffer(task, params.absoluteMonth));

  // 再次兜底，防止后续改动绕过前置过滤步骤，把未满足解锁条件的任务塞回任务板。
  const eligibleTaskIdSet = new Set(eligibleTasks.map((task) => task.id));
  return candidates.filter((offer) => eligibleTaskIdSet.has(offer.taskId));
}

function processTaskBoardForMonth(state: Pick<GameStore, 'taskBoard' | 'unlockedPlants' | 'completedTasks' | 'unlockedTasks'>, absoluteMonth: number) {
  let nextTaskBoard = state.taskBoard;
  let nextUnlockedTasks = state.unlockedTasks;

  // 每月切换时先清理已过期的限时任务，已失败任务会重新回到候选池。
  const filteredOffers = nextTaskBoard.currentOffers.filter((offer) => !isTaskExpired(offer.expiresOnMonth, absoluteMonth));
  const expiredActiveTasks = nextTaskBoard.activeTasks.filter((task) => isTaskExpired(task.expiresOnMonth, absoluteMonth));
  const activeTasksAfterExpiry = nextTaskBoard.activeTasks.filter((task) => !isTaskExpired(task.expiresOnMonth, absoluteMonth));

  if (filteredOffers.length !== nextTaskBoard.currentOffers.length || expiredActiveTasks.length > 0) {
    nextTaskBoard = {
      ...nextTaskBoard,
      currentOffers: filteredOffers,
      activeTasks: activeTasksAfterExpiry,
    };
  }

  if (shouldRefreshTaskBoard(absoluteMonth)) {
    const nextOffers = selectTaskOffers({
      absoluteMonth,
      unlockedPlants: state.unlockedPlants,
      discoveredTasks: nextUnlockedTasks,
      completedTasks: state.completedTasks,
      activeTasks: nextTaskBoard.activeTasks,
    });
    const offeredTaskIds = nextOffers.map((offer) => offer.taskId);

    nextTaskBoard = {
      ...nextTaskBoard,
      currentOffers: nextOffers,
      lastRefreshMonth: absoluteMonth,
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
): PlotState {
  if (plot.plantedPlantId !== plantId || plot.plantedAt === null) return plot;
  if (plot.isWilted) {
    return { ...plot, lastGrowthTickAt: newTotal, isReadyToHarvest: false };
  }

  const targetMinutes = getGrowthTargetMinutes(plot, plant);
  const fertilizer = plot.appliedFertilizerId ? getFertilizerById(plot.appliedFertilizerId) : null;
  const growthMultiplier = fertilizer?.effectType === 'growth' ? fertilizer.multiplier : 1;

  const lastGrowthTickAt = plot.lastGrowthTickAt ?? plot.plantedAt;
  const delta = Math.max(0, newTotal - lastGrowthTickAt);
  const growthMinutesAccumulated = Math.min(plot.growthMinutesAccumulated + delta * growthMultiplier, targetMinutes);
  const reachedMature = growthMinutesAccumulated >= targetMinutes;

  return {
    ...plot,
    growthMinutesAccumulated,
    lastGrowthTickAt: newTotal,
    isReadyToHarvest: reachedMature,
    // 生长类肥料只作用到“下一次成熟”为止，成熟后立刻清空槽位。
    appliedFertilizerId: fertilizer?.effectType === 'growth' && reachedMature ? null : plot.appliedFertilizerId,
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
      landTypeId: 'dry_land',
      waterState: 'dry',
    }));
  }
  return plots;
}

// ─────────────────────────────────────────────────────────────
// Store 实现
// ─────────────────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  // ── 时钟初始值（夏季第一个月 = 第4月）──────────────────────
  clock: {
    totalMinutes: 0,
    month: 1,
    timeScale: 1,
    running: true,
  },

  // 默认按 test 档行为运行，等存档系统初始化后会覆盖。
  saveProfile: {
    slotId: null,
    slotName: '未命名档位',
    slotType: 'test',
    createdAt: null,
    lastSavedAt: null,
  },

  setSaveProfile: (profile) =>
    set((state) => {
      // real 档位禁止调速，切换到 real 时强制倍率回到 1。sandbox 全解锁不限速。
      const nextTimeScale = profile.slotType === 'real' ? 1 : state.clock.timeScale;
      return {
        saveProfile: profile,
        clock: {
          ...state.clock,
          timeScale: nextTimeScale,
        },
      };
    }),

  setTimeScale: (scale) =>
    set((s) => {
      // real 档位禁止改速：始终锁定 1 倍。sandbox 全解锁档不限速。
      if (s.saveProfile.slotType === 'real') {
        return { clock: { ...s.clock, timeScale: 1 } };
      }
      return { clock: { ...s.clock, timeScale: scale } };
    }),

  togglePause: () =>
    set((s) => ({ clock: { ...s.clock, running: !s.clock.running } })),

  tickMinutes: (deltaMinutes) => {
    const { clock, plots, taskBoard, unlockedPlants, unlockedTasks, completedTasks } = get();
    if (!clock.running) return;

    const previousAbsoluteMonth = getAbsoluteMonthIndex(clock.totalMinutes);
    const newTotal = clock.totalMinutes + deltaMinutes;
    const cal = minutesToCalendar(newTotal);
    const nextAbsoluteMonth = getAbsoluteMonthIndex(newTotal);

    // 更新地块成熟状态
    const updatedPlots = plots.map((plot) => {
      if (!plot.plantedPlantId || plot.plantedAt === null) return plot;
      const plant = getPlantById(plot.plantedPlantId);
      if (!plant) return plot;
      return advancePlotLifecycle(plot, plot.plantedPlantId, plant, newTotal);
    });

    let nextTaskState = { taskBoard, unlockedTasks };
    if (nextAbsoluteMonth > previousAbsoluteMonth) {
      for (let absoluteMonth = previousAbsoluteMonth + 1; absoluteMonth <= nextAbsoluteMonth; absoluteMonth += 1) {
        nextTaskState = processTaskBoardForMonth(
          {
            taskBoard: nextTaskState.taskBoard,
            unlockedPlants,
            completedTasks,
            unlockedTasks: nextTaskState.unlockedTasks,
          },
          absoluteMonth,
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

  applyOfflineMinutes: (deltaMinutes) => {
    if (deltaMinutes <= 0) return;
    const { clock, tickMinutes } = get();
    if (clock.running) {
      tickMinutes(deltaMinutes);
      return;
    }

    // 离线补算必须推进时间，即使玩家存档时处于暂停状态。
    set((state) => ({
      clock: { ...state.clock, running: true },
    }));
    tickMinutes(deltaMinutes);
    set((state) => ({
      clock: { ...state.clock, running: false },
    }));
  },

  getPersistedState: () => {
    const state = get();
    return {
      clock: state.clock,
      plots: state.plots,
      economy: state.economy,
      inventory: state.inventory,
      taskBoard: state.taskBoard,
      seeds: state.seeds,
      miscInventory: state.miscInventory,
      unlockedPlants: state.unlockedPlants,
      unlockedRegions: state.unlockedRegions,
      unlockedTasks: state.unlockedTasks,
      completedTasks: state.completedTasks,
      compendium: state.compendium,
      selection: state.selection,
    };
  },

  hydrateFromSnapshot: (snapshot) => {
    // 恢复完整存档时，需要一次性覆盖所有游戏态字段，避免跨档串数据。
    set({
      clock: snapshot.clock,
      plots: snapshot.plots,
      economy: snapshot.economy,
      inventory: snapshot.inventory,
      taskBoard: snapshot.taskBoard,
      seeds: snapshot.seeds,
      miscInventory: snapshot.miscInventory,
      unlockedPlants: snapshot.unlockedPlants,
      unlockedRegions: snapshot.unlockedRegions,
      unlockedTasks: snapshot.unlockedTasks,
      completedTasks: snapshot.completedTasks,
      compendium: snapshot.compendium,
    selection: snapshot.selection ?? { selectedPlotId: null, selectedPlotIds: [], batchPanelOpen: false, panelMode: 'none' },
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
      appliedFertilizerId: null,
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
    const qty = seeds[plantId] ?? 0;
    if (qty <= 0) return false;

    const plotIdx = plots.findIndex((p) => p.id === plotId);
    if (plotIdx < 0) return false;
    if (plots[plotIdx].plantedPlantId !== null && !plots[plotIdx].isWilted) return false;
    // 严格土地限制：只有指定土地类型才能种植
    if (plots[plotIdx].landTypeId !== plant.allowedLandTypeId) return false;

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
      appliedFertilizerId: null,
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

    const yieldAmt = calcYield(plot, plant);

    // 更新背包，年生作物收完即清场，多年生达到 maxHarvests 上限后也清场
    const updated = [...plots];
    const isPerennial = (plant.harvestType ?? 'annual') === 'perennial';
    const nextHarvestCount = plot.harvestCount + 1;
    const reachedMaxHarvests = isPerennial && plant.maxHarvests !== undefined && nextHarvestCount >= plant.maxHarvests;
    updated[plotIdx] = isPerennial && !reachedMaxHarvests
      ? {
          ...plot,
          growthMinutesAccumulated: 0,
          lastGrowthTickAt: clock.totalMinutes,
          harvestCount: nextHarvestCount,
          isReadyToHarvest: false,
          appliedFertilizerId: null,
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
          appliedFertilizerId: null,
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
  economy: { gold: 200, cumulativeEarned: 0 },

  buyFertilizer: (fertilizerId, quantity) => {
    const fertilizer = getFertilizerById(fertilizerId);
    if (!fertilizer) return false;

    const total = fertilizer.purchasePrice * quantity;
    const { economy } = get();
    if (economy.gold < total) return false;

    set((state) => ({
      economy: { ...state.economy, gold: state.economy.gold - total },
      miscInventory: {
        ...state.miscInventory,
        [fertilizerId]: (state.miscInventory[fertilizerId] ?? 0) + quantity,
      },
    }));

    return true;
  },

  acceptTask: (taskId) => {
    const { taskBoard, clock } = get();

    const offer = taskBoard.currentOffers.find((item) => item.taskId === taskId);
    if (!offer) return false;

    const acceptedMonth = getAbsoluteMonthIndex(clock.totalMinutes);

    set((state) => ({
      taskBoard: {
        ...state.taskBoard,
        currentOffers: state.taskBoard.currentOffers.filter((item) => item.taskId !== taskId),
        activeTasks: [
          ...state.taskBoard.activeTasks,
          {
            ...offer,
            acceptedMonth,
          },
        ],
      },
    }));

    return true;
  },

  submitActiveTask: (taskId) => {
    const { taskBoard, inventory } = get();
    const activeTask = taskBoard.activeTasks.find((t) => t.taskId === taskId);
    if (!activeTask) return false;

    const task = getTaskById(activeTask.taskId);
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
          activeTasks: state.taskBoard.activeTasks.filter((t) => t.taskId !== taskId),
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

  sellFertilizer: (fertilizerId, quantity) => {
    const fertilizer = getFertilizerById(fertilizerId);
    if (!fertilizer) return false;

    const qty = get().miscInventory[fertilizerId] ?? 0;
    if (qty < quantity) return false;

    const sellPricePerFertilizer = Math.ceil(fertilizer.purchasePrice / 10);
    const income = sellPricePerFertilizer * quantity;

    set((state) => ({
      miscInventory: {
        ...state.miscInventory,
        [fertilizerId]: qty - quantity,
      },
      economy: {
        gold: state.economy.gold + income,
        cumulativeEarned: state.economy.cumulativeEarned + income,
      },
    }));

    get()._checkUnlocks();
    return true;
  },

  sellSeeds: (plantId, quantity) => {
    const { seeds } = get();
    const qty = seeds[plantId] ?? 0;
    if (qty < quantity) return false;

    const plant = getPlantById(plantId);
    if (!plant) return false;

    // 种子回收价固定为采购价的十分之一，存在小数时直接向上取整。
    const sellPricePerSeed = Math.ceil(plant.purchasePrice / 10);
    const income = sellPricePerSeed * quantity;

    set((s) => ({
      seeds: {
        ...s.seeds,
        [plantId]: qty - quantity,
      },
      economy: {
        gold: s.economy.gold + income,
        cumulativeEarned: s.economy.cumulativeEarned + income,
      },
    }));

    // 种子出售同样属于赚取金币，需要驱动后续植物与区域解锁判断。
    get()._checkUnlocks();
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

  applyFertilizer: (plotId, fertilizerId) => {
    const fertilizer = getFertilizerById(fertilizerId);
    if (!fertilizer) return false;

    const { plots, miscInventory } = get();
    const plotIdx = plots.findIndex((plot) => plot.id === plotId);
    if (plotIdx < 0) return false;

    const plot = plots[plotIdx];
    if (!plot.plantedPlantId || plot.plantedAt === null || plot.isWilted) return false;
    if (plot.appliedFertilizerId !== null) return false;

    // 生长肥只允许施加在尚未成熟的作物上。
    if (plot.isReadyToHarvest) return false;

    const qty = miscInventory[fertilizerId] ?? 0;
    if (qty <= 0) return false;

    const nextPlots = [...plots];
    nextPlots[plotIdx] = {
      ...plot,
      appliedFertilizerId: fertilizerId,
    };

    set((state) => ({
      plots: nextPlots,
      miscInventory: {
        ...state.miscInventory,
        [fertilizerId]: qty - 1,
      },
    }));

    return true;
  },

  // ── 果实背包（收获后存入） ────────────────────────────────────
  inventory: {},

  // ── 任务板 ───────────────────────────────────────────────────
  taskBoard: createInitialTaskBoardState(['water_spinach', 'soybean']).taskBoard,

  // ── 种子库（购买后播种前持有） ───────────────────────────────
  seeds: {},

  // ── 杂物库（当前用于肥料） ─────────────────────────────────
  miscInventory: Object.fromEntries(FERTILIZER_CONFIGS.map((fertilizer) => [fertilizer.id, 0])),

  // ── 解锁状态 ─────────────────────────────────────────────────
  unlockedPlants: ['water_spinach', 'soybean'],  // 初始解锁空心菜和大豆
  unlockedRegions: ['region_paddy'],              // 初始开放水稻土区
  unlockedTasks: createInitialTaskBoardState(['water_spinach', 'soybean']).unlockedTasks,
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
  selection: { selectedPlotId: null, selectedPlotIds: [], batchPanelOpen: false, panelMode: 'none' },

  selectPlot: (plotId) =>
    set((s) => ({
      selection: {
        ...s.selection,
        selectedPlotId: plotId,
        selectedPlotIds: [],
        batchPanelOpen: false,
        panelMode: plotId ? 'action' : 'none',
      },
    })),

  togglePlotSelection: (plotId) =>
    set((s) => {
      const prev = s.selection.selectedPlotIds;
      const next = prev.includes(plotId)
        ? prev.filter((id) => id !== plotId)
        : [...prev, plotId];
      return {
        selection: {
          ...s.selection,
          selectedPlotId: null,
          selectedPlotIds: next,
          panelMode: next.length > 0 ? 'action' : 'none',
        },
      };
    }),

  openBatchPanel: () =>
    set((s) => ({
      selection: { ...s.selection, batchPanelOpen: true },
    })),

  clearSelection: () =>
    set((s) => ({
      selection: { ...s.selection, selectedPlotId: null, selectedPlotIds: [], batchPanelOpen: false, panelMode: 'none' },
    })),

  setPanelMode: (mode) =>
    set((s) => ({ selection: { ...s.selection, panelMode: mode } })),

  batchPlantSeed: (plotIds, plantId) => {
    // 逐个地块尝试播种，失败的地块不影响其他
    plotIds.forEach((id) => get().plantSeed(id, plantId));
  },

  batchApplyFertilizer: (plotIds, fertilizerId) => {
    plotIds.forEach((id) => get().applyFertilizer(id, fertilizerId));
  },

  harvestAll: (regionId) => {
    const { plots } = get();
    plots
      .filter((p) => p.regionId === regionId && p.isReadyToHarvest)
      .forEach((p) => get().harvest(p.id));
  },
}));

export function createDefaultPersistedState(): PersistedGameState {
  // 新档必须是全新状态，不能继承当前运行中的任何进度。
  const initialTaskState = createInitialTaskBoardState(['water_spinach', 'soybean']);

  return {
    clock: {
      totalMinutes: 0,
      month: 1,
      timeScale: 1,
      running: true,
    },
    plots: buildInitialPlots(),
    economy: { gold: 200, cumulativeEarned: 0 },
    inventory: {},
    taskBoard: initialTaskState.taskBoard,
    seeds: {},
    miscInventory: Object.fromEntries(FERTILIZER_CONFIGS.map((fertilizer) => [fertilizer.id, 0])),
    unlockedPlants: ['water_spinach', 'soybean'],
    unlockedRegions: ['region_paddy'],
    unlockedTasks: initialTaskState.unlockedTasks,
    completedTasks: [],
    compendium: {},
    selection: { selectedPlotId: null, selectedPlotIds: [], batchPanelOpen: false, panelMode: 'none' },
  };
}

/** 全解锁实验沙箱档初始层态：10万金币、全部植物/地块已解锁、图鉴全满。 */
export function createSandboxPersistedState(): PersistedGameState {
  const allPlantIds = ALL_PLANTS.map((p) => p.id);
  const allRegionIds = REGION_CONFIGS.map((r) => r.id);
  const allTaskIds = TASK_BOARD_TASKS.map((t) => t.id);
  const taskState = createInitialTaskBoardState(allPlantIds);
  // 图鉴全满：所有植物都标记为已收获
  const fullCompendium: Record<string, boolean> = Object.fromEntries(allPlantIds.map((id) => [id, true]));

  return {
    clock: {
      totalMinutes: 0,
      month: 1,
      timeScale: 1440,
      running: true,
    },
    plots: buildInitialPlots(),
    economy: { gold: 100000, cumulativeEarned: 999999 },
    inventory: {},
    taskBoard: taskState.taskBoard,
    seeds: {},
    miscInventory: Object.fromEntries(FERTILIZER_CONFIGS.map((fertilizer) => [fertilizer.id, 0])),
    unlockedPlants: allPlantIds,
    unlockedRegions: allRegionIds,
    unlockedTasks: [...new Set([...taskState.unlockedTasks, ...allTaskIds])],
    completedTasks: [],
    compendium: fullCompendium,
    selection: { selectedPlotId: null, selectedPlotIds: [], batchPanelOpen: false, panelMode: 'none' },
  };
}
