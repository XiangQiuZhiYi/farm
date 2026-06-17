// ============================================================
// 植物静态配置 — 水稻土区（10 种）
// 水田：水稻、莲藕、茭白、荸荠
// 旱地：大豆、空心菜、水芹、油菜、蚕豆、小麦
// ============================================================

const placeholderSprite = (name) => ({
    sheet: `plants/${name}/spritesheet.png`,
    frameWidth: 16,
    frameHeight: 16,
    stageFrameIndex: { seed: 0, sprout: 1, grow: 2, mature: 3 },
});

export const PADDY_REGION_PLANTS = [
  {
    id: 'cotton',
    name: '棉花',
    regionId: 'region_black',
    unlockCost: 22500,
    purchasePrice: 500,
    sellPricePerUnit: 290,
    harvestYield: 2,
    growthMinutes: 540,            // 9h
    harvestType: 'perennial',
    reharvestMinutes: 210,         // 3.5h
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
    unlockCost: 18000,
    purchasePrice: 400,
    sellPricePerUnit: 1100,
    harvestYield: 1,
    growthMinutes: 540,            // 9h
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
    unlockCost: 15000,
    purchasePrice: 350,
    sellPricePerUnit: 60,
    harvestYield: 5,
    growthMinutes: 420,            // 7h
    harvestType: 'perennial',
    reharvestMinutes: 120,         // 2h
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
    unlockCost: 37500,
    purchasePrice: 800,
    sellPricePerUnit: 315,
    harvestYield: 5,
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
    unlockCost: 15000,
    purchasePrice: 300,
    sellPricePerUnit: 600,
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
    unlockCost: 12000,
    purchasePrice: 250,
    sellPricePerUnit: 170,
    harvestYield: 4,
    growthMinutes: 480,            // 8h
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
    unlockCost: 12000,
    purchasePrice: 200,
    sellPricePerUnit: 105,
    harvestYield: 5,
    growthMinutes: 360,            // 6h
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
    unlockCost: 15000,
    purchasePrice: 220,
    sellPricePerUnit: 120,
    harvestYield: 2,
    growthMinutes: 240,            // 4h
    harvestType: 'perennial',
    reharvestMinutes: 120,          // 2h
    maxHarvests: 4,
    stageBoundaries: { seed: 0, sprout: 0.15, grow: 0.5, mature: 0.85 },
    allowedLandTypeId: 'black_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('pea'),
    difficultyFactor: 1.5,
  },
  {
    id: 'kiwi',
    name: '猕猴桃',
    regionId: 'region_black',
    unlockCost: 99999999,
    isRare: true,
    purchasePrice: 0,
    sellPricePerUnit: 620,
    harvestYield: 2,
    growthMinutes: 480,            // 8h
    stageBoundaries: { seed: 0, sprout: 0.1, grow: 0.4, mature: 0.85 },
    allowedLandTypeId: 'black_soil',
    preferredWaterState: 'moist',
    sprite: placeholderSprite('kiwi'),
    difficultyFactor: 1.5,
  },
];

const fn = () => {

    PADDY_REGION_PLANTS.sort((a, b) => a.unlockCost-b.unlockCost ).forEach((item) => {
        const text = {
            id: item.id,
            name: item.name,
            yieldRate:
                ((item.sellPricePerUnit *
                    item.harvestYield *
                    (item.maxHarvests ?? 1) -
                    item.purchasePrice) /
                    (((item.reharvestMinutes ?? 1) - 1) *
                        (item.maxHarvests ?? 1) +
                        item.growthMinutes)) *
                60,
        };
        console.log(
            item.name +
                ": " +
                text.yieldRate.toFixed(2) +
                " 金/小时" +
                "，总收益：" +
                (item.sellPricePerUnit *
                    item.harvestYield *
                    (item.maxHarvests ?? 1) -
                    item.purchasePrice) +
                "，总耗时：" +
                (((item.reharvestMinutes ?? 1) - 1) * (item.maxHarvests ?? 1) +
                    item.growthMinutes) +
                " 分钟",
        );
    });
};
fn();
