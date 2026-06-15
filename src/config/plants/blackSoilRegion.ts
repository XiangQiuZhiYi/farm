// ============================================================
// 植物静态配置 — 黑土区（8 种）
// 黑土：棉花、芝麻、红薯、苹果、西瓜、谷子、燕麦、豌豆
// ============================================================

import type { PlantConfig } from '../../types/plant';

const placeholderSprite = (name: string) => ({
  sheet: `plants/${name}/spritesheet.png`,
  frameWidth: 16,
  frameHeight: 16,
  stageFrameIndex: { seed: 0, sprout: 1, grow: 2, mature: 3 },
});

export const BLACK_SOIL_REGION_PLANTS: PlantConfig[] = [
  {
    id: 'cotton',
    name: '棉花',
    regionId: 'region_black',
    unlockCumulativeGold: 15000,
    purchasePrice: 500,
    sellPricePerUnit: 400,
    harvestYield: 1,
    growthMinutes: 480,            // 8h
    harvestType: 'perennial',
    reharvestMinutes: 240,         // 4h
    maxHarvests: 4,
    stageBoundaries: { seed: 0, sprout: 0.1, grow: 0.4, mature: 0.8 },
    allowedLandTypeId: 'black_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('cotton'),
    difficultyFactor: 1.5,
  },
  {
    id: 'sesame',
    name: '芝麻',
    regionId: 'region_black',
    unlockCumulativeGold: 12000,
    purchasePrice: 400,
    sellPricePerUnit: 900,
    harvestYield: 1,
    growthMinutes: 360,            // 6h
    stageBoundaries: { seed: 0, sprout: 0.12, grow: 0.45, mature: 0.85 },
    allowedLandTypeId: 'black_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('sesame'),
    difficultyFactor: 1.5,
  },
  {
    id: 'sweet_potato',
    name: '红薯',
    regionId: 'region_black',
    unlockCumulativeGold: 10000,
    purchasePrice: 350,
    sellPricePerUnit: 180,
    harvestYield: 2,
    growthMinutes: 360,            // 6h
    harvestType: 'perennial',
    reharvestMinutes: 180,         // 3h
    maxHarvests: 4,
    stageBoundaries: { seed: 0, sprout: 0.1, grow: 0.4, mature: 0.8 },
    allowedLandTypeId: 'black_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('sweet_potato'),
    difficultyFactor: 1.5,
  },
  {
    id: 'apple',
    name: '苹果',
    regionId: 'region_black',
    unlockCumulativeGold: 25000,
    purchasePrice: 800,
    sellPricePerUnit: 200,
    harvestYield: 3,
    growthMinutes: 720,            // 12h
    harvestType: 'perennial',
    reharvestMinutes: 720,         // 12h
    maxHarvests: 4,
    stageBoundaries: { seed: 0, sprout: 0.1, grow: 0.4, mature: 0.8 },
    allowedLandTypeId: 'black_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('apple'),
    difficultyFactor: 2.0,
  },
  {
    id: 'watermelon',
    name: '西瓜',
    regionId: 'region_black',
    unlockCumulativeGold: 10000,
    purchasePrice: 300,
    sellPricePerUnit: 700,
    harvestYield: 1,
    growthMinutes: 300,            // 5h
    stageBoundaries: { seed: 0, sprout: 0.1, grow: 0.4, mature: 0.8 },
    allowedLandTypeId: 'black_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('watermelon'),
    difficultyFactor: 1.5,
  },
  {
    id: 'millet',
    name: '谷子',
    regionId: 'region_black',
    unlockCumulativeGold: 8000,
    purchasePrice: 250,
    sellPricePerUnit: 140,
    harvestYield: 3,
    growthMinutes: 300,            // 5h
    stageBoundaries: { seed: 0, sprout: 0.1, grow: 0.4, mature: 0.8 },
    allowedLandTypeId: 'black_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('millet'),
    difficultyFactor: 1.5,
  },
  {
    id: 'oat',
    name: '燕麦',
    regionId: 'region_black',
    unlockCumulativeGold: 8000,
    purchasePrice: 200,
    sellPricePerUnit: 120,
    harvestYield: 3,
    growthMinutes: 300,            // 5h
    stageBoundaries: { seed: 0, sprout: 0.1, grow: 0.4, mature: 0.8 },
    allowedLandTypeId: 'black_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('oat'),
    difficultyFactor: 1.5,
  },
  {
    id: 'pea',
    name: '豌豆',
    regionId: 'region_black',
    unlockCumulativeGold: 10000,
    purchasePrice: 220,
    sellPricePerUnit: 120,
    harvestYield: 1,
    growthMinutes: 240,            // 4h
    harvestType: 'perennial',
    reharvestMinutes: 90,          // 1.5h
    maxHarvests: 4,
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.5, mature: 0.85 },
    allowedLandTypeId: 'black_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('pea'),
    difficultyFactor: 1.5,
  },
];
