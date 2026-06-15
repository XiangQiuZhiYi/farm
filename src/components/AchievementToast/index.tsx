// ============================================================
// AchievementToast 组件：完成成就时悬浮 1 秒的提示
// ============================================================

import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getAchievementById } from '../../config/achievements';
import styles from './AchievementToast.module.css';

function rewardLabel(reward: { type: string; value: number; buffType?: string }) {
  if (reward.type === 'gold') return `+${reward.value} 金`;
  if (reward.type === 'seeds') return `种子 ×${reward.value}`;
  if (reward.type === 'harvest') return `果实 ×${reward.value}`;
  if (reward.type === 'buff') return `永久增益 +${reward.value}%`;
  return '';
}

export function AchievementToast() {
  const toast = useGameStore((s) => s.achievements.toast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      useGameStore.setState((s) => ({
        achievements: { ...s.achievements, toast: null },
      }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  const ach = getAchievementById(toast.achievementId);
  if (!ach) return null;

  const isLegendary = ach.difficulty === 'legendary';

  return (
    <div className={`${styles.toast} ${isLegendary ? styles.legendary : ''}`}>
      <span className={styles.icon}>{isLegendary ? '👑' : '🏆'}</span>
      <span className={styles.title}>成就解锁</span>
      <span className={styles.name}>{ach.name}</span>
      <span className={styles.reward}>奖励：{rewardLabel(ach.reward)}</span>
    </div>
  );
}
