import { LAND_TYPE_CONFIGS } from '../lands';
import { getRegionById } from '../regions';
import type { LandTypeId } from '../../types/land';

export type LandCompendiumEntry = {
  id: LandTypeId;
  name: string;
  regionName: string;
  regionId: string;
  summary: string;
  highlights: string[];
  details: Array<{ label: string; value: string }>;
  pixels: string[];
};

const LAND_ARTS: Record<LandTypeId, string[]> = {
  paddy_field: [
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWGGWWWWWWW',
    'WWWWWWGMMGWWWWWW',
    'WWWWWGMMMMMGWWWW',
    'RRRRRRMMMMMMRRRR',
    'RRRMMMMRRRMMMMRR',
    'RRRMMMMRRRMMMMRR',
    'RRRMMMMRRRMMMMRR',
    'RRRRRRRRRRRRRRRR',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
    'WWWWWWWWWWWWWWWW',
  ],
  dry_land: [
    'LLLLLLLLLLLLLLLL',
    'LLLCCLLLLCCLLLLL',
    'LLRRRRLLLLRRRRLL',
    'LLLCCLLLLCCLLLLL',
    'LLLLLLLLLLLLLLLL',
    'LLLLRRRRLLLLRRLL',
    'LCCLLLLLCCLLLLLL',
    'LLLLLLLLLLLLLLLL',
    'LLLLRRLLLLRRLLLL',
    'LLLCCLLLLCCLLLLL',
    'LLRRRRLLLLRRRRLL',
    'LLLLLLLLLLLLLLLL',
    'LLLLLLLCCLLLLLLL',
    'LLLLRRRRLLLLRRLL',
    'LLLLLLLLLLLLLLLL',
    'LLLLLLLLLLLLLLLL',
  ],
  brown_soil: [
    'BBBBBBBBBBBBBBBB',
    'BBHHBBBBBBHHBBBB',
    'BBBBRRRRBBBBRRRR',
    'BBHBBBBBBBBBBBBB',
    'BBBBBBBBBHHBBBBB',
    'BBRRRRBBBBRRRRBB',
    'BBBBBBHBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
    'BBBHHBBBBBHHBBBB',
    'BBRRRRBBBBRRRRBB',
    'BBBBBBBBBBBBBBBB',
    'BBHBBBBBBBBBBBBB',
    'BBBBRRRRBBBBRRRR',
    'BBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBB',
  ],
  tidal_soil: [
    'MMMMMMMMMMMMMMMM',
    'MMWWMMMMWWMMMMMM',
    'MMMMMMMMMMMMMMMM',
    'MMGGMMMMGGMMMMMM',
    'MMMMMMMMMMMMMMMM',
    'MMWWMMMMWWMMMMMM',
    'MMMMMMMMMMMMMMMM',
    'MMMMGGMMMMGGMMMM',
    'MMMMMMMMMMMMMMMM',
    'MMWWMMMMWWMMMMMM',
    'MMMMMMMMMMMMMMMM',
    'MMGGMMMMGGMMMMMM',
    'MMMMMMMMMMMMMMMM',
    'MMMMMMMMMMMMMMMM',
    'MMMMMMMMMMMMMMMM',
    'MMMMMMMMMMMMMMMM',
  ],
  black_soil: [
    'DDDDDDDDDDDDDDDD',
    'DDHHDDDDDDHHDDDD',
    'DDDDDDDDDDDDDDDD',
    'DDDDGGDDDDGGDDDD',
    'DDDDDDHHHHDDDDDD',
    'DDDDDDDDDDDDDDDD',
    'DDRRRRDDDDRRRRDD',
    'DDDDDDDDDDDDDDDD',
    'DDHHDDDDDDHHDDDD',
    'DDDDGGDDDDGGDDDD',
    'DDDDDDHHHHDDDDDD',
    'DDDDDDDDDDDDDDDD',
    'DDRRRRDDDDRRRRDD',
    'DDDDDDDDDDDDDDDD',
    'DDDDDDDDDDDDDDDD',
    'DDDDDDDDDDDDDDDD',
  ],
};

const summarize = (landId: LandTypeId): string => {
  switch (landId) {
    case 'paddy_field':
      return '长期积水的水田底图，适合水生和需浅水维持的作物。';
    case 'dry_land':
      return '排水快、表层偏干的旱地底图，适合轮作和快周转作物。';
    case 'brown_soil':
      return '褐色疏松土层，兼顾保水与排水，是典型旱作地块。';
    case 'tidal_soil':
      return '湿润细腻的潮土底图，适合对墒情敏感的作物。';
    case 'black_soil':
      return '黑色高肥力底图，适合高产、长期投入型作物。';
    default:
      return '';
  }
};

const highlightsFor = (landId: LandTypeId): string[] => {
  switch (landId) {
    case 'paddy_field':
      return ['高含水', '水生作物友好', '田埂分明'];
    case 'dry_land':
      return ['排水快', '适合旱作', '快轮作'];
    case 'brown_soil':
      return ['疏松', '保水适中', '旱作基础盘'];
    case 'tidal_soil':
      return ['细腻湿润', '墒情要求高', '适合经济作物'];
    case 'black_soil':
      return ['肥力高', '稳产性强', '适合高价值投入'];
    default:
      return [];
  }
};

export const LAND_COMPENDIUM_ENTRIES: LandCompendiumEntry[] = LAND_TYPE_CONFIGS.map((land) => {
  const region = getRegionById(land.regionId);
  return {
    id: land.id,
    name: land.name,
    regionName: region?.name ?? land.regionId,
    regionId: land.regionId,
    summary: summarize(land.id),
    highlights: highlightsFor(land.id),
    details: [
      { label: '区域', value: region?.name ?? land.regionId },
      { label: '地块肥力', value: `${land.baseFertility}` },
      { label: '土地系数', value: `${land.landFactor}` },
      { label: '默认水分', value: land.defaultWaterState },
      { label: '扩张价格', value: `${land.expandPrice} 金/格` },
      { label: '土地类型', value: land.name },
    ],
    pixels: LAND_ARTS[land.id],
  };
});

export const getLandCompendiumEntry = (id: LandTypeId) =>
  LAND_COMPENDIUM_ENTRIES.find((entry) => entry.id === id) ?? null;
