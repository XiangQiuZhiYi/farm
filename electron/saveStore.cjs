const fs = require('node:fs/promises');
const path = require('node:path');
const { app } = require('electron');

const SAVE_SCHEMA_VERSION = 1;

function getSaveDir() {
  return path.join(app.getPath('userData'), 'saves');
}

function getIndexPath() {
  return path.join(getSaveDir(), 'index.json');
}

function getSlotPath(slotId) {
  return path.join(getSaveDir(), `${slotId}.json`);
}

function sanitizeSlotId(slotId) {
  return String(slotId).replace(/[^a-zA-Z0-9_-]/g, '');
}

async function ensureSaveDir() {
  await fs.mkdir(getSaveDir(), { recursive: true });
}

async function readJson(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return fallback;
  }
}

async function writeJsonAtomic(filePath, data) {
  const content = JSON.stringify(data, null, 2);
  const tempPath = `${filePath}.tmp`;
  await fs.writeFile(tempPath, content, 'utf8');
  await fs.rename(tempPath, filePath);
}

async function readIndex() {
  await ensureSaveDir();
  const fallback = { activeSlotId: null, slots: [] };
  const index = await readJson(getIndexPath(), fallback);
  if (!Array.isArray(index.slots)) {
    return fallback;
  }
  return index;
}

async function writeIndex(index) {
  await ensureSaveDir();
  await writeJsonAtomic(getIndexPath(), index);
}

async function listSlots() {
  const index = await readIndex();
  return index;
}

async function createSlot(slot) {
  const index = await readIndex();
  const slotId = sanitizeSlotId(slot.id);
  if (!slotId) throw new Error('invalid slot id');
  if (index.slots.some((item) => item.id === slotId)) {
    throw new Error('slot already exists');
  }

  const nextSlot = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    id: slotId,
    name: slot.name,
    type: slot.type,
    createdAt: slot.createdAt,
    lastSavedAt: slot.lastSavedAt,
    gameState: slot.gameState,
  };

  await ensureSaveDir();
  await writeJsonAtomic(getSlotPath(slotId), nextSlot);

  index.slots.push({
    id: slotId,
    name: slot.name,
    type: slot.type,
    createdAt: slot.createdAt,
    lastSavedAt: slot.lastSavedAt,
  });

  if (!index.activeSlotId) {
    index.activeSlotId = slotId;
  }

  await writeIndex(index);
  return index;
}

async function loadSlot(slotId) {
  const cleanId = sanitizeSlotId(slotId);
  if (!cleanId) throw new Error('invalid slot id');
  const slot = await readJson(getSlotPath(cleanId), null);
  if (!slot) throw new Error('slot not found');
  return slot;
}

async function saveSlot(slot) {
  const index = await readIndex();
  const slotId = sanitizeSlotId(slot.id);
  if (!slotId) throw new Error('invalid slot id');

  const slotIndex = index.slots.findIndex((item) => item.id === slotId);
  if (slotIndex < 0) throw new Error('slot not found');

  const nextSlot = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    id: slotId,
    name: slot.name,
    type: slot.type,
    createdAt: slot.createdAt,
    lastSavedAt: slot.lastSavedAt,
    gameState: slot.gameState,
  };

  await writeJsonAtomic(getSlotPath(slotId), nextSlot);

  index.slots[slotIndex] = {
    id: slotId,
    name: slot.name,
    type: slot.type,
    createdAt: slot.createdAt,
    lastSavedAt: slot.lastSavedAt,
  };

  await writeIndex(index);
  return index;
}

async function setActiveSlot(slotId) {
  const index = await readIndex();
  const cleanId = sanitizeSlotId(slotId);
  if (!index.slots.some((item) => item.id === cleanId)) {
    throw new Error('slot not found');
  }
  index.activeSlotId = cleanId;
  await writeIndex(index);
  return index;
}

async function deleteSlot(slotId) {
  const index = await readIndex();
  const cleanId = sanitizeSlotId(slotId);
  const nextSlots = index.slots.filter((item) => item.id !== cleanId);

  if (nextSlots.length === index.slots.length) {
    throw new Error('slot not found');
  }

  index.slots = nextSlots;
  if (index.activeSlotId === cleanId) {
    index.activeSlotId = nextSlots[0]?.id ?? null;
  }

  await fs.rm(getSlotPath(cleanId), { force: true });
  await writeIndex(index);
  return index;
}

async function renameSlot(slotId, name) {
  const index = await readIndex();
  const cleanId = sanitizeSlotId(slotId);
  const slotIndex = index.slots.findIndex((item) => item.id === cleanId);
  if (slotIndex < 0) throw new Error('slot not found');

  const slot = await loadSlot(cleanId);
  const nextName = String(name).trim();
  if (!nextName) throw new Error('invalid slot name');

  slot.name = nextName;
  slot.lastSavedAt = Date.now();
  await writeJsonAtomic(getSlotPath(cleanId), slot);

  index.slots[slotIndex] = {
    ...index.slots[slotIndex],
    name: nextName,
    lastSavedAt: slot.lastSavedAt,
  };
  await writeIndex(index);
  return index;
}

module.exports = {
  listSlots,
  createSlot,
  loadSlot,
  saveSlot,
  setActiveSlot,
  deleteSlot,
  renameSlot,
};
