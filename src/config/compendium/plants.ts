// ============================================================
// 植物图鉴配置 — 30 种植物 × 4 生长阶段像素画
// ============================================================

import { ALL_PLANTS } from '../plants';
import type { PlantConfig } from '../../types/plant';
import PLANT_ARTS from './plants-pain';

export type PlantStage = 'seed' | 'sprout' | 'grow' | 'mature';

export interface PlantCompendiumEntry {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  /** 解锁所需金币（0 = 初始解锁，99999999 = 珍稀植物） */
  unlockCost: number;
  /** 最适宜土地的中文标签，用于卡片徽标显示 */
  bestSoilLabel: string;
  summary: string;
  highlights: string[];
  details: Array<{ label: string; value: string }>;
  stages: Record<PlantStage, string[]>;
}

/** 植物专用像素调色板 */
export const PLANT_PIXEL_PALETTE: Record<string, string | null> = {
  '.': null,
  G: '#2f7030', // 深绿 - 主茎/叶
  L: '#72c840', // 浅绿 - 叶片高光
  Y: '#e8c040', // 金黄 - 谷穗/成熟
  T: '#8c5e28', // 茎棕 - 茎干
  S: '#c8a040', // 种子棕 - 种子/荚果
  P: '#e060b0', // 粉红 - 花朵
  W: '#f2ede8', // 白/奶油 - 棉花/白花
  O: '#e87828', // 橙色
  V: '#7048c8', // 紫色 - 花
  R: '#c83028', // 红色 - 浆果/辣椒
  B: '#3888d8', // 蓝色 - 亚麻花
  F: '#f8d820', // 亮金 - 向日葵花盘
  N: '#1a5024', // 极深绿 - 浓密叶丛
  H: '#c87030', // 琥珀棕 - 根/球茎
  D: '#5c3818', // 深棕 - 种子/根茎
  C: '#50b0a8', // 青绿 - 水生植物
  K: '#302018', // 近黑 - 黑豆荚
  E: '#f0a0c8', // 浅粉 - 荷花瓣高光
  A: '#d08040', // 琥珀 - 大蒜/洋葱球茎
};





// ============================================================
// 文字描述辅助
// ============================================================

function summarize(plantId: string): string {
  const map: Record<string, string> = {
    rice: '水田中成片的金色谷穗，是水稻土区最重要的主粮作物。',
    lotus_root: '宽大圆叶浮于水面，粉色莲花亭亭玉立，藕节清香可口。',
    water_bamboo: '水边丛生的茭白，洁白嫩茎是夏秋时节的美味蔬菜。',
    water_chestnut: '生长于水田的荸荠，地下球茎甘甜清脆，营养丰富。',
    soybean: '豆荚累累，大豆是重要的蛋白质与油脂来源。',
    water_spinach: '箭叶丰茂，茎中空心，空心菜生长迅速耐水湿。',
    water_celery: '挺立于水边的水芹，嫩茎清香，多次收获的旱地速生菜。',
    rapeseed: '油菜花期灿烂，满株黄花四瓣，是重要的食用油料。',
    broad_bean: '豆荚肥厚，蚕豆是春季旱地的重要蛋白质来源。',
    wheat: '麦芒挺立，金色麦穗随风摇曳，旱地良田的经典作物。',
    potato: '地上开白花，地下结硕果，马铃薯是高产多汁的淀粉宝库。',
    corn: '高大茁壮，玉米棒金黄饱满，是重要的粮食与饲料来源。',
    cucumber: '藤蔓伸展，黄瓜鲜嫩翠绿，可多次采摘的夏季蔬菜。',
    cowpea: '细长豆荚挂满枝头，菜豆可多次采收，营养丰富。',
    carrot: '地下红橙色根茎探出头，胡萝卜清脆甘甜，富含营养。',
    cabbage: '叶片层层包裹，结成紧实圆润的甘蓝，是常见蔬菜。',
    garlic: '地上管叶笔直，地下白色蒜头分瓣整齐，辛香浓郁。',
    sunflower: '葵盘硕大，金黄花瓣包围棕色花盘，总朝向阳光生长。',
    sorghum: '顶部红褐色大穗垂沉，茎秆粗壮，是北方旱地的粮食作物。',
    peanut: '花生把果实藏在土里，黄花点缀低矮茎叶间，油脂丰富。',
    cotton: '棉铃裂开，白色绒絮蓬松饱满，是重要的天然纤维作物。',
    sesame: '直立茎上荚果排列密集，是珍贵的油料与调味作物。',
    sweet_potato: '蔓藤铺展，红薯甘甜多淀粉，是黑土区的高产挂机作物。',
    apple: '苹果树结出饱满果实，12小时一个周期，是终极挂机目标。',
    watermelon: '圆滚滚的西瓜高价出售，是黑土区的珍贵水果。',
    millet: '金色谷穗垂沉，谷子是黑土区重要的粮食作物，三粒高产。',
    oat: '燕麦穗轻盈弯垂，是黑土区的优质饲料粮食，三粒高产。',
    pea: '豌豆荚饱满鲜绿，可多次采摘，是黑土区重要的豆类。',
    green_radish: '【珍稀植物】脆嫩多汁的青皮萝卜，肉质根翠绿如玉，口感清甜。',
    gorgon: '【珍稀植物】水面上巨大的莲座型浮叶，中心孕育着鸟嘴状的珍贵鸡头米。',
    kiwi: '【珍稀植物】黑土藤蔓上结出的棕色毛果，切开是翠绿果肉，酸甜可口。',
    saffron: '【珍稀植物】细叶丛中绽放的紫色花朵，红色柱头是极为珍贵的香料。',
    wolfberry: '【珍稀植物】褐土丛生的灌木，枝头挂满鲜红的枸杞子，药食同源。',
  };
  return map[plantId] ?? `${plantId} 的详细描述尚未收录。`;
}

function highlightsFor(plantId: string): string[] {
  const map: Record<string, string[]> = {
    rice: ['主粮作物', '水田专属', '高利润', '核心经济作物'],
    lotus_root: ['水生植物', '莲花观赏', '藕节食用', '水田专属'],
    water_bamboo: ['水田蔬菜', '多次收获', '3次收割', '湿地特产'],
    water_chestnut: ['水田球茎', '双产出', '清脆甘甜', '水田专属'],
    soybean: ['初始作物', '旱地速生', '多次收获', '蛋白质来源'],
    water_spinach: ['初始作物', '旱地速生', '5次收获', '空心茎节'],
    water_celery: ['旱地蔬菜', '多次收获', '5次收割', '清香风味'],
    rapeseed: ['油料作物', '旱地单收', '高单价', '春季美景'],
    broad_bean: ['旱地豆类', '双产出', '蛋白质高', '春季作物'],
    wheat: ['主粮作物', '双产出', '旱地良田', '高产稳定'],
    potato: ['高产根茎', '三产出', '潮土专属', '淀粉丰富'],
    corn: ['粮食饲料', '双产出', '潮土专属', '高大茁壮'],
    cucumber: ['夏季蔬菜', '5次收获', '潮土专属', '鲜嫩翠绿'],
    cowpea: ['豆类蔬菜', '4次收获', '潮土专属', '营养丰富'],
    carrot: ['根茎蔬菜', '双产出', '潮土专属', '清甜可口'],
    cabbage: ['耐寒蔬菜', '双产出', '潮土专属', '营养丰富'],
    garlic: ['辛香调味', '高单价', '潮土专属', '药食两用'],
    sunflower: ['向日特性', '高单价', '褐土专属', '油料食用'],
    sorghum: ['双产出', '褐土专属', '大穗顶生', '耐旱高收'],
    peanut: ['双产出', '地下结果', '褐土专属', '油脂丰富'],
    cotton: ['天然纤维', '4次收获', '黑土专属', '重要工业'],
    sesame: ['珍贵油料', '高单价', '黑土专属', '调味珍品'],
    sweet_potato: ['4次收获', '双产出', '黑土专属', '挂机首选'],
    apple: ['终极挂机', '4次收获', '三产出', '黑土专属'],
    watermelon: ['超高单价', '黑土专属', '甜蜜大果', '一次性收'],
    millet: ['三产出', '黑土入门', '杂粮作物', '黑土专属'],
    oat: ['三产出', '饲料作物', '黑土专属', '营养谷物'],
    pea: ['4次收获', '黑土专属', '豆类精品', '清甜豌豆'],
    green_radish: ['珍稀植物', '潮土专属', '清脆甘甜', '快速生长'],
    gorgon: ['珍稀植物', '水田专属', '高价值', '莲座浮叶'],
    kiwi: ['珍稀植物', '黑土专属', '藤蔓果树', '酸甜多汁'],
    saffron: ['珍稀植物', '旱地专属', '极高价', '紫色花蕊'],
    wolfberry: ['珍稀植物', '潮土专属', '药食同源', '多次采收'],
  };
  return map[plantId] ?? ['待发现'];
}

// ============================================================
// 构建图鉴条目
// ============================================================

const REGION_NAME_MAP: Record<string, string> = {
  region_paddy: '水稻土区',
  region_brown_tidal: '褐土/潮土区',
  region_black: '黑土区',
};

/** 土地类型 id → 中文名称 */
const LAND_NAME_MAP: Record<string, string> = {
  paddy_field: '水田',
  dry_land:    '旱地',
  brown_soil:  '褐土',
  tidal_soil:  '潮土',
  black_soil:  '黑土',
};

/** 可收割次数说明文本 */
function harvestCountLabel(plant: PlantConfig): string {
  const isPerennial = plant.harvestType === 'perennial';
  if (!isPerennial || !plant.maxHarvests) return '1 次（一次性）';
  if (plant.maxHarvests && plant.reharvestMinutes) {
    return `${plant.maxHarvests} 次（多收获，每次再生 ${Math.round(plant.reharvestMinutes)} 分钟）`;
  }
  return '多次（多年生）';
}

function buildEntry(plant: PlantConfig): PlantCompendiumEntry {
  const regionName = REGION_NAME_MAP[plant.regionId] ?? plant.regionId;
  const stageArt = PLANT_ARTS[plant.id];
  const allowedLandName = LAND_NAME_MAP[plant.allowedLandTypeId] ?? plant.allowedLandTypeId;

  return {
    id: plant.id,
    name: plant.name,
    regionId: plant.regionId,
    regionName,
    unlockCost: plant.unlockCost,
    bestSoilLabel: allowedLandName,
    summary: summarize(plant.id),
    highlights: highlightsFor(plant.id),
    details: [
      { label: '区域', value: regionName },
      { label: '购种价格', value: `${plant.purchasePrice} 金/粒` },
      { label: '售卖单价', value: `${plant.sellPricePerUnit} 金/单位` },
      { label: '每次产量', value: `${plant.harvestYield} 单位` },
      { label: '生长周期', value: `${plant.growthMinutes} 分钟` },
      { label: '种植土地', value: allowedLandName },
      { label: '可收割次数', value: harvestCountLabel(plant) },
      ...(plant.harvestType === 'perennial' && plant.reharvestMinutes
        ? [{ label: '再生周期', value: `${plant.reharvestMinutes} 分钟` }]
        : []),
    ],
    stages: stageArt ?? {
      seed: Array(16).fill('................................'),
      sprout: Array(16).fill('................................'),
      grow: Array(16).fill('................................'),
      mature: Array(16).fill('................................'),
    },
  };
}

export const PLANT_COMPENDIUM_ENTRIES: PlantCompendiumEntry[] = ALL_PLANTS.map(buildEntry);

export const getPlantCompendiumEntry = (id: string): PlantCompendiumEntry | null =>
  PLANT_COMPENDIUM_ENTRIES.find((entry) => entry.id === id) ?? null;
