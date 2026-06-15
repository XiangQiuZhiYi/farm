// ============================================================
// WeatherBar 组件：显示当前天气和效果
// ============================================================

import { useGameStore } from '../../store/gameStore';
import { WEATHER_CONFIGS } from '../../config/weather';
import styles from './WeatherBar.module.css';

export function WeatherBar() {
  const weather = useGameStore((s) => s.weather);

  if (!weather.current) return null;

  const cfg = WEATHER_CONFIGS.find((w) => w.id === weather.current);
  if (!cfg) return null;

  return (
    <div className={styles.weatherBar}>
      <span className={styles.icon}>{cfg.icon}</span>
      <span className={styles.name}>{cfg.name}</span>
      <span className={styles.remaining}>剩余 {weather.remainingMonths} 月</span>

      {cfg.sellPriceMultiplier < 1.0 && (
        <span className={`${styles.priceHint} ${styles.priceDown}`}>
          收购价 ×{cfg.sellPriceMultiplier.toFixed(2)}
        </span>
      )}
      {cfg.sellPriceMultiplier > 1.0 && (
        <span className={`${styles.priceHint} ${styles.priceUp}`}>
          收购价 ×{cfg.sellPriceMultiplier.toFixed(2)}
        </span>
      )}
      {cfg.bonusType === 'extraYield' && (
        <span className={styles.bonusHint}>
          收获额外果实概率 {(cfg.bonusChance * 100).toFixed(0)}%
        </span>
      )}
      {cfg.bonusType === 'seedReturn' && (
        <span className={styles.bonusHint}>
          返还种子概率 {(cfg.bonusChance * 100).toFixed(0)}%
        </span>
      )}
      {cfg.growthMultiplier < 1.0 && (
        <span className={`${styles.priceHint} ${styles.priceDown}`}>
          生长 ×{cfg.growthMultiplier.toFixed(2)}
        </span>
      )}
      {cfg.growthMultiplier > 1.0 && (
        <span className={`${styles.priceHint} ${styles.priceUp}`}>
          生长 ×{cfg.growthMultiplier.toFixed(2)}
        </span>
      )}
    </div>
  );
}
