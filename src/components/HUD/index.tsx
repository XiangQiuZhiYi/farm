// ============================================================
// HUD 组件：显示时钟、金币、时间加速控制
// ============================================================

import { useGameStore } from '../../store/gameStore';
import type { TimeScale } from '../../types/game';
import styles from './HUD.module.css';

const TIME_SCALES: TimeScale[] = [1, 1440, 2880, 4320];
const SEASON_LABELS = {
  spring: '🌸 春',
  summer: '☀️ 夏',
  autumn: '🍂 秋',
  winter: '❄️ 冬',
};
/** 各季节对应月份范围（春1-3，夏4-6，秋7-9，冬10-12） */
const SEASON_MONTHS = {
  spring: '1–3 月',
  summer: '4–6 月',
  autumn: '7–9 月',
  winter: '10–12 月',
};

function formatGameDate(totalMinutes: number, month: number) {
  const year = Math.floor(totalMinutes / 1440 / 12) + 1;
  return `第 ${year} 年 ${month} 月`;
}

export function HUD() {
  const clock = useGameStore((s) => s.clock);
  const economy = useGameStore((s) => s.economy);
  const saveProfile = useGameStore((s) => s.saveProfile);
  const setTimeScale = useGameStore((s) => s.setTimeScale);
  const togglePause = useGameStore((s) => s.togglePause);
  const showTimeScaleButtons = saveProfile.slotType === 'test' || saveProfile.slotType === 'sandbox';

  return (
    <div className={styles.hud}>
      {/* 日期季节 */}
      <div className={styles.timeBlock}>
        <span className={styles.season}>
          {SEASON_LABELS[clock.season]}
          <span className={styles.seasonMonths}>（{SEASON_MONTHS[clock.season]}）</span>
        </span>
        <span className={styles.date}>
          {formatGameDate(clock.totalMinutes, clock.month)}
        </span>
      </div>

      {/* 金币 */}
      <div className={styles.goldBlock}>
        💰 {economy.gold.toFixed(0)} 金币
      </div>

      {/* 时间控制 */}
      <div className={styles.timeControls}>
        <button onClick={togglePause} className={styles.pauseBtn}>
          {clock.running ? '⏸ 暂停' : '▶ 继续'}
        </button>
        {showTimeScaleButtons ? (
          TIME_SCALES.map((s) => (
            <button
              key={s}
              onClick={() => setTimeScale(s)}
              className={`${styles.scaleBtn} ${clock.timeScale === s ? styles.active : ''}`}
            >
              ×{s}
            </button>
          ))
        ) : (
          <span className={styles.realModeTag}>真实档：固定 1x</span>
        )}
      </div>
    </div>
  );
}
