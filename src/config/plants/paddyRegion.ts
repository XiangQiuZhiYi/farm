// ============================================================
// 植物静态配置 — 水稻土区（10 种）
// 水田：水稻、莲藕、茭白、荸荠
// 旱地：大豆、空心菜、水芹、油菜、蚕豆、小麦
// ============================================================

import type { PlantConfig } from '../../types/plant';

const placeholderSprite = (name: string) => ({
  sheet: `plants/${name}/spritesheet.png`,
  frameWidth: 16,
  frameHeight: 16,
  stageFrameIndex: { seed: 0, sprout: 1, grow: 2, mature: 3 },
});

export const PADDY_REGION_PLANTS: PlantConfig[] = [
  // ── 水田作物 ─────────────────────────────────────────────────
  {
    id: 'rice',
    name: '水稻',
    regionId: 'region_paddy',
    unlockCumulativeGold: 675,
    purchasePrice: 200,
    sellPricePerUnit: 430,
    harvestYield: 1,
    growthMinutes: 360,            // 6h
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.45, mature: 0.85 },
    allowedLandTypeId: 'paddy_field',
    preferredWaterState: 'flooded',
    sprite: placeholderSprite('rice'),
    difficultyFactor: 1.0,
  },
  {
    id: 'lotus_root',
    name: '莲藕',
    regionId: 'region_paddy',
    unlockCumulativeGold: 675,
    purchasePrice: 150,
    sellPricePerUnit: 325,
    harvestYield: 1,
    growthMinutes: 300,            // 5h
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.45, mature: 0.85 },
    allowedLandTypeId: 'paddy_field',
    preferredWaterState: 'flooded',
    sprite: placeholderSprite('lotus_root'),
    difficultyFactor: 1.0,
  },
  {
    id: 'water_bamboo',
    name: '茭白',
    regionId: 'region_paddy',
    unlockCumulativeGold: 1125,
    purchasePrice: 120,
    sellPricePerUnit: 98,
    harvestYield: 1,
    growthMinutes: 180,            // 3h
    harvestType: 'perennial',
    reharvestMinutes: 60,          // 1h
    maxHarvests: 3,
    stageBoundaries: { seed: 0, sprout: 0.2, grow: 0.5, mature: 0.85 },
    allowedLandTypeId: 'paddy_field',
    preferredWaterState: 'flooded',
    sprite: placeholderSprite('water_bamboo'),
    difficultyFactor: 1.0,
  },
  {
    id: 'water_chestnut',
    name: '荸荠',
    regionId: 'region_paddy',
    unlockCumulativeGold: 450,
    purchasePrice: 100,
    sellPricePerUnit: 106,
    harvestYield: 2,
    growthMinutes: 240,            // 4h
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.45, mature: 0.85 },
    allowedLandTypeId: 'paddy_field',
    preferredWaterState: 'flooded',
    sprite: placeholderSprite('water_chestnut'),
    difficultyFactor: 1.0,
  },

  // ── 旱地作物 ─────────────────────────────────────────────────
  {
    id: 'soybean',
    name: '大豆',
    regionId: 'region_paddy',
    unlockCumulativeGold: 0,       // 初始解锁
    purchasePrice: 20,
    sellPricePerUnit: 15,
    harvestYield: 1,
    growthMinutes: 30,
    harvestType: 'perennial',
    reharvestMinutes: 10,
    maxHarvests: 3,
    stageBoundaries: { seed: 0, sprout: 0.2, grow: 0.5, mature: 0.85 },
    allowedLandTypeId: 'dry_land',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('soybean'),
    difficultyFactor: 1.0,
  },
  {
    id: 'water_spinach',
    name: '空心菜',
    regionId: 'region_paddy',
    unlockCumulativeGold: 0,       // 初始解锁
    purchasePrice: 10,
    sellPricePerUnit: 8,
    harvestYield: 1,
    growthMinutes: 25,
    harvestType: 'perennial',
    reharvestMinutes: 10,
    maxHarvests: 5,
    stageBoundaries: { seed: 0, sprout: 0.2, grow: 0.5, mature: 0.85 },
    allowedLandTypeId: 'dry_land',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('water_spinach'),
    difficultyFactor: 1.0,
  },
  {
    id: 'water_celery',
    name: '水芹',
    regionId: 'region_paddy',
    unlockCumulativeGold: 112,
    purchasePrice: 15,
    sellPricePerUnit: 10,
    harvestYield: 1,
    growthMinutes: 35,
    harvestType: 'perennial',
    reharvestMinutes: 10,
    maxHarvests: 5,
    stageBoundaries: { seed: 0, sprout: 0.2, grow: 0.5, mature: 0.85 },
    allowedLandTypeId: 'dry_land',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('water_celery'),
    difficultyFactor: 1.0,
  },
  {
    id: 'rapeseed',
    name: '油菜',
    regionId: 'region_paddy',
    unlockCumulativeGold: 1350,
    purchasePrice: 40,
    sellPricePerUnit: 90,
    harvestYield: 1,
    growthMinutes: 90,             // 1.5h
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.45, mature: 0.85 },
    allowedLandTypeId: 'dry_land',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('rapeseed'),
    difficultyFactor: 1.0,
  },
  {
    id: 'broad_bean',
    name: '蚕豆',
    regionId: 'region_paddy',
    unlockCumulativeGold: 2250,
    purchasePrice: 50,
    sellPricePerUnit: 51,
    harvestYield: 2,
    growthMinutes: 90,             // 1.5h
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.45, mature: 0.85 },
    allowedLandTypeId: 'dry_land',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('broad_bean'),
    difficultyFactor: 1.0,
  },
  {
    id: 'wheat',
    name: '小麦',
    regionId: 'region_paddy',
    unlockCumulativeGold: 3375,
    purchasePrice: 60,
    sellPricePerUnit: 65,
    harvestYield: 2,
    growthMinutes: 120,            // 2h
    stageBoundaries: { seed: 0, sprout: 0.12, grow: 0.42, mature: 0.82 },
    allowedLandTypeId: 'dry_land',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('wheat'),
    difficultyFactor: 1.0,
  },
];
