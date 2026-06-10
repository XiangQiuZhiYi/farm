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
import { REGION_CONFIGS } from '../config/regions';
import { getLandTypeById } from '../config/lands';
import { getPlantById, ALL_PLANTS } from '../config/plants';
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
  /** 浇水 */
  waterPlot: (plotId: string) => void;
  /** 收获 */
  harvest: (plotId: string) => void;

  // ── 经济 ────────────────────────────────────────────────────
  economy: EconomyState;
  /** 购买植物种子（从商店购入放入背包） */
  buySeeds: (plantId: string, quantity: number) => boolean;
  /** 出售背包中的农产品 */
  sellHarvest: (plantId: string, quantity: number) => boolean;

  // ── 背包（收获果实） ─────────────────────────────────────────
  inventory: Inventory;

  // ── 种子库（购买的种子，播种后消耗） ──────────────────────────
  seeds: Seeds;

  // ── 解锁 ────────────────────────────────────────────────────
  unlockedPlants: string[];
  unlockedRegions: string[];
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
    waterCount: 0,
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
    const { clock, plots } = get();
    if (!clock.running) return;

    const newTotal = clock.totalMinutes + deltaMinutes;
    const cal = minutesToCalendar(newTotal);

    // 更新地块成熟状态
    const updatedPlots = plots.map((plot) => {
      if (!plot.plantedPlantId || plot.plantedAt === null) return plot;
      const plant = getPlantById(plot.plantedPlantId);
      if (!plant) return plot;
      return advancePlotLifecycle(plot, plot.plantedPlantId, plant, newTotal, cal.month);
    });

    set({
      clock: { ...clock, totalMinutes: newTotal, ...cal },
      plots: updatedPlots,
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
      waterCount: 0,
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
      waterCount: 0,
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

  waterPlot: (plotId) => {
    const { plots } = get();
    const plotIdx = plots.findIndex((p) => p.id === plotId);
    if (plotIdx < 0 || !plots[plotIdx].plantedPlantId || plots[plotIdx].isWilted) return;

    const updated = [...plots];
    const plot = updated[plotIdx];
    // 每次浇水 waterCount +1，上限 3（代表足量灌溉）
    updated[plotIdx] = {
      ...plot,
      waterCount: Math.min(plot.waterCount + 1, 3),
      waterState: 'moist',
    };
    set({ plots: updated });
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
          waterCount: 0,
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
          waterCount: 0,
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

  // ── 种子库（购买后播种前持有） ───────────────────────────────
  seeds: {},

  // ── 解锁状态 ─────────────────────────────────────────────────
  unlockedPlants: ['rice'],          // 初始解锁水稻
  unlockedRegions: ['region_paddy'], // 初始开放水稻土区
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
