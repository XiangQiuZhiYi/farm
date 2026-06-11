import type { SaveIndexPayload, SaveSlotData } from '../types/save';

function requireApi() {
  if (!window.saveAPI?.isElectron) {
    throw new Error('save API is only available in Electron runtime');
  }
  return window.saveAPI;
}

export function isElectronRuntime() {
  return Boolean(window.saveAPI?.isElectron);
}

export async function listSaveSlots(): Promise<SaveIndexPayload> {
  return requireApi().listSlots();
}

export async function createSaveSlot(slot: Omit<SaveSlotData, 'schemaVersion'>): Promise<SaveIndexPayload> {
  return requireApi().createSlot(slot);
}

export async function loadSaveSlot(slotId: string): Promise<SaveSlotData> {
  return requireApi().loadSlot(slotId);
}

export async function updateSaveSlot(slot: Omit<SaveSlotData, 'schemaVersion'>): Promise<SaveIndexPayload> {
  return requireApi().updateSlot(slot);
}

export async function setActiveSaveSlot(slotId: string): Promise<SaveIndexPayload> {
  return requireApi().setActiveSlot(slotId);
}

export async function deleteSaveSlot(slotId: string): Promise<SaveIndexPayload> {
  return requireApi().deleteSlot(slotId);
}

export async function renameSaveSlot(slotId: string, name: string): Promise<SaveIndexPayload> {
  return requireApi().renameSlot(slotId, name);
}
