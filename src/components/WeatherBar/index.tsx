// ============================================================
// WeatherBar 组件：显示当前天气和效果
// ============================================================

import { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { WEATHER_CONFIGS } from '../../config/weather';
import styles from './WeatherBar.module.css';

function formatRemainingTime(endMs: number): string {
  const remainMs = Math.max(0, endMs - Date.now());
  const totalMinutes = Math.floor(remainMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours > 0) {
    return `${hours} 小时 ${mins} 分钟`;
  }
  return `${mins} 分钟`;
}

export function WeatherBar() {
  const weather = useGameStore((s) => s.weather);
  // 每 30 秒刷新一次剩余时间显示
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!weather.current) return null;

  const cfg = WEATHER_CONFIGS.find((w) => w.id === weather.current);
  if (!cfg) return null;

  const endMs = weather.startedAt !== null
    ? weather.startedAt + weather.durationMinutes * 60_000
    : 0;

  return (
    <div className={styles.weatherBar}>
      <span className={styles.icon}>{cfg.icon}</span>
      <span className={styles.name}>{cfg.name}</span>
      {endMs > 0 && (
        <span className={styles.remaining}>
          剩余 {formatRemainingTime(endMs)}
        </span>
      )}

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
