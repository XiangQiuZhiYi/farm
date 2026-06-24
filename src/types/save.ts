import type { ClockState, Compendium, EconomyState, Inventory, MiscInventory, Seeds, SelectionState, StatsState } from './game';
import type { PlotState } from './land';
import type { TaskBoardState } from './task';
import type { AchievementState } from './achievement';
import type { WeatherState } from './weather';

export type SaveSlotType = 'real' | 'test' | 'sandbox';

export interface PersistedGameState {
  clock: ClockState;
  plots: PlotState[];
  economy: EconomyState;
  inventory: Inventory;
  taskBoard: TaskBoardState;
  seeds: Seeds;
  miscInventory: MiscInventory;
  unlockedPlants: string[];
  unlockedRegions: string[];
  unlockedTasks: string[];
  completedTasks: string[];
  compendium: Compendium;
  selection: SelectionState;
  achievements: AchievementState;
  weather: WeatherState;
  stats: StatsState;
}

export interface SaveSlotSummary {
  id: string;
  name: string;
  type: SaveSlotType;
  createdAt: number;
  lastSavedAt: number;
}

export interface SaveIndexPayload {
  activeSlotId: string | null;
  slots: SaveSlotSummary[];
}

export interface SaveSlotData extends SaveSlotSummary {
  schemaVersion: number;
  gameState: PersistedGameState;
}

export interface SaveProfile {
  slotId: string | null;
  slotName: string;
  slotType: SaveSlotType;
  createdAt: number | null;
  lastSavedAt: number | null;
}

export interface SaveApi {
  isElectron: boolean;
  listSlots: () => Promise<SaveIndexPayload>;
  createSlot: (slot: Omit<SaveSlotData, 'schemaVersion'>) => Promise<SaveIndexPayload>;
  loadSlot: (slotId: string) => Promise<SaveSlotData>;
  updateSlot: (slot: Omit<SaveSlotData, 'schemaVersion'>) => Promise<SaveIndexPayload>;
  setActiveSlot: (slotId: string) => Promise<SaveIndexPayload>;
  deleteSlot: (slotId: string) => Promise<SaveIndexPayload>;
  renameSlot: (slotId: string, name: string) => Promise<SaveIndexPayload>;
}
