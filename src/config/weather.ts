// ============================================================
// 天气静态配置（按月为周期，1 天气月 = 1 真实天 = 1440 分钟）
// ============================================================

import type { WeatherDefinition } from '../types/weather';

/** 1 天气月对应的真实分钟数（1 天 = 1440 分钟） */
export const REAL_MINUTES_PER_WEATHER_MONTH = 1440;

export const WEATHER_CONFIGS: WeatherDefinition[] = [
  {
    id: 'sunny',
    name: '晴阳天',
    icon: '☀️',
    durationMin: 1,
    durationMax: 2,
    weight: 15,
    growthMultiplier: 1.0,
    sellPriceMultiplier: 1.0,
    bonusType: 'extraYield',
    bonusChance: 0.10,
    description: '日照足，偶尔会多结一颗。',
  },
  {
    id: 'breezy',
    name: '和风天',
    icon: '🍃',
    durationMin: 1,
    durationMax: 2,
    weight: 22,
    growthMultiplier: 1.10,
    sellPriceMultiplier: 1.0,
    bonusType: 'none',
    bonusChance: 0,
    description: '风调，植株代谢稍快。',
  },
  {
    id: 'cloudy',
    name: '阴天',
    icon: '☁️',
    durationMin: 1,
    durationMax: 3,
    weight: 35,
    growthMultiplier: 1.0,
    sellPriceMultiplier: 1.0,
    bonusType: 'none',
    bonusChance: 0,
    description: '云厚，日子平稳。',
  },
  {
    id: 'rainy',
    name: '绵绵雨',
    icon: '🌧️',
    durationMin: 1,
    durationMax: 2,
    weight: 14,
    growthMultiplier: 1.0,
    sellPriceMultiplier: 0.90,
    bonusType: 'none',
    bonusChance: 0,
    description: '雨天路滑，商贩压价，今天更适合存仓。',
  },
  {
    id: 'thunder',
    name: '雷阵雨',
    icon: '⛈️',
    durationMin: 1,
    durationMax: 2,
    weight: 10,
    growthMultiplier: 0.90,
    sellPriceMultiplier: 1.0,
    bonusType: 'none',
    bonusChance: 0,
    description: '雷声吓苗，长得慢点，但不会减产。',
  },
  {
    id: 'frost',
    name: '早霜',
    icon: '🌨️',
    durationMin: 1,
    durationMax: 2,
    weight: 4,
    growthMultiplier: 1.0,
    sellPriceMultiplier: 1.0,
    bonusType: 'seedReturn',
    bonusChance: 0.10,
    description: '寒霜敛藏，偶尔能把种子留下。',
  },
];

/** 按权重随机抽取天气 */
export function rollWeather(): WeatherDefinition {
  const totalWeight = WEATHER_CONFIGS.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const weather of WEATHER_CONFIGS) {
    random -= weather.weight;
    if (random <= 0) return weather;
  }

  // Fallback（理论上不会到达）
  return WEATHER_CONFIGS[WEATHER_CONFIGS.length - 1];
}

export const getWeatherById = (id: string) =>
  WEATHER_CONFIGS.find((w) => w.id === id) ?? null;
