// ============================================================
// 植物静态配置 — 褐土/潮土区（10 种）
// 潮土：马铃薯、玉米、黄瓜、菜豆、胡萝卜、甘蓝、大蒜
// 褐土：向日葵、高粱、花生
// ============================================================

import type { PlantConfig } from '../../types/plant';

const placeholderSprite = (name: string) => ({
  sheet: `plants/${name}/spritesheet.png`,
  frameWidth: 16,
  frameHeight: 16,
  stageFrameIndex: { seed: 0, sprout: 1, grow: 2, mature: 3 },
});

export const BROWN_TIDAL_REGION_PLANTS: PlantConfig[] = [
  // ── 潮土作物 ─────────────────────────────────────────────────
  {
    id: 'potato',
    name: '马铃薯',
    regionId: 'region_brown_tidal',
    unlockCumulativeGold: 3750,
    purchasePrice: 80,
    sellPricePerUnit: 50,
    harvestYield: 3,
    growthMinutes: 90,             // 1.5h
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.45, mature: 0.85 },
    allowedLandTypeId: 'tidal_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('potato'),
    difficultyFactor: 1.2,
  },
  {
    id: 'corn',
    name: '玉米',
    regionId: 'region_brown_tidal',
    unlockCumulativeGold: 4500,
    purchasePrice: 100,
    sellPricePerUnit: 90,
    harvestYield: 2,
    growthMinutes: 120,            // 2h
    stageBoundaries: { seed: 0, sprout: 0.12, grow: 0.42, mature: 0.82 },
    allowedLandTypeId: 'tidal_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('corn'),
    difficultyFactor: 1.2,
  },
  {
    id: 'cucumber',
    name: '黄瓜',
    regionId: 'region_brown_tidal',
    unlockCumulativeGold: 12000,
    purchasePrice: 120,
    sellPricePerUnit: 70,
    harvestYield: 1,
    growthMinutes: 120,            // 2h
    harvestType: 'perennial',
    reharvestMinutes: 45,
    maxHarvests: 5,
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.5, mature: 0.85 },
    allowedLandTypeId: 'tidal_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('cucumber'),
    difficultyFactor: 1.3,
  },
  {
    id: 'cowpea',
    name: '菜豆',
    regionId: 'region_brown_tidal',
    unlockCumulativeGold: 15000,
    purchasePrice: 150,
    sellPricePerUnit: 80,
    harvestYield: 1,
    growthMinutes: 150,            // 2.5h
    harvestType: 'perennial',
    reharvestMinutes: 60,
    maxHarvests: 4,
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.5, mature: 0.85 },
    allowedLandTypeId: 'tidal_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('cowpea'),
    difficultyFactor: 1.3,
  },
  {
    id: 'carrot',
    name: '胡萝卜',
    regionId: 'region_brown_tidal',
    unlockCumulativeGold: 2700,
    purchasePrice: 60,
    sellPricePerUnit: 55,
    harvestYield: 2,
    growthMinutes: 90,             // 1.5h
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.45, mature: 0.85 },
    allowedLandTypeId: 'tidal_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('carrot'),
    difficultyFactor: 1.15,
  },
  {
    id: 'cabbage',
    name: '甘蓝',
    regionId: 'region_brown_tidal',
    unlockCumulativeGold: 3000,
    purchasePrice: 70,
    sellPricePerUnit: 60,
    harvestYield: 2,
    growthMinutes: 90,             // 1.5h
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.5, mature: 0.85 },
    allowedLandTypeId: 'tidal_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('cabbage'),
    difficultyFactor: 1.15,
  },
  {
    id: 'garlic',
    name: '大蒜',
    regionId: 'region_brown_tidal',
    unlockCumulativeGold: 3750,
    purchasePrice: 90,
    sellPricePerUnit: 220,
    harvestYield: 1,
    growthMinutes: 150,            // 2.5h
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.5, mature: 0.85 },
    allowedLandTypeId: 'tidal_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('garlic'),
    difficultyFactor: 1.2,
  },

  // ── 褐土作物 ─────────────────────────────────────────────────
  {
    id: 'sunflower',
    name: '向日葵',
    regionId: 'region_brown_tidal',
    unlockCumulativeGold: 6000,
    purchasePrice: 110,
    sellPricePerUnit: 260,
    harvestYield: 1,
    growthMinutes: 180,            // 3h
    stageBoundaries: { seed: 0, sprout: 0.1, grow: 0.4, mature: 0.8 },
    allowedLandTypeId: 'brown_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('sunflower'),
    difficultyFactor: 1.2,
  },
  {
    id: 'sorghum',
    name: '高粱',
    regionId: 'region_brown_tidal',
    unlockCumulativeGold: 7500,
    purchasePrice: 130,
    sellPricePerUnit: 120,
    harvestYield: 2,
    growthMinutes: 180,            // 3h
    stageBoundaries: { seed: 0, sprout: 0.1, grow: 0.4, mature: 0.8 },
    allowedLandTypeId: 'brown_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('sorghum'),
    difficultyFactor: 1.2,
  },
  {
    id: 'peanut',
    name: '花生',
    regionId: 'region_brown_tidal',
    unlockCumulativeGold: 9000,
    purchasePrice: 180,
    sellPricePerUnit: 140,
    harvestYield: 2,
    growthMinutes: 240,            // 4h
    stageBoundaries: { seed: 0, sprout: 0.12, grow: 0.45, mature: 0.85 },
    allowedLandTypeId: 'brown_soil',
    preferredWaterState: 'dry',
    sprite: placeholderSprite('peanut'),
    difficultyFactor: 1.2,
  },
];
