// ============================================================
// AchievementModal 组件：成就系统弹窗
// ============================================================

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ACHIEVEMENT_CONFIGS, getAchievementById } from '../../config/achievements';
import styles from './AchievementModal.module.css';

type TabType = 'progress' | 'completed' | 'upcoming';

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
  legendary: '传说',
};

const BUFF_LABEL_MAP: Record<string, string> = {
  growthSpeed: '生长速度',
  sellPrice: '作物售价',
  fertilizerPower: '肥料效果',
  extraYield: '额外收获',
};

function rewardLabel(reward: { type: string; value: number; plantId?: string; buffType?: string }) {
  if (reward.type === 'gold') return `${reward.value} 金`;
  if (reward.type === 'seeds') return `种子 ×${reward.value}`;
  if (reward.type === 'harvest') return `果实 ×${reward.value}`;
  if (reward.type === 'buff') {
    const buffName = BUFF_LABEL_MAP[reward.buffType ?? ''] ?? '永久增益';
    return `${buffName} +${reward.value}%（永久）`;
  }
  return '';
}

function isBuffReward(reward: { type: string }) {
  return reward.type === 'buff';
}

export function AchievementModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('progress');
  const achievements = useGameStore((s) => s.achievements);

  const completedSet = new Set(achievements.completed);

  // 分类成就
  const completed = ACHIEVEMENT_CONFIGS.filter((a) => completedSet.has(a.id));
  const inProgress = ACHIEVEMENT_CONFIGS.filter((a) => !completedSet.has(a.id) && a.id !== 'ach_complete_game');
  const upcoming = ACHIEVEMENT_CONFIGS.filter((a) => !completedSet.has(a.id) && a.id === 'ach_complete_game');

  const tabs: { key: TabType; label: string; items: typeof ACHIEVEMENT_CONFIGS }[] = [
    { key: 'progress', label: '进行中', items: inProgress },
    { key: 'completed', label: '已完成', items: completed },
    { key: 'upcoming', label: '未解锁', items: upcoming },
  ];

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div className={styles.panel} role="dialog" aria-label="成就" onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>成就 ({achievements.completed.length}/{ACHIEVEMENT_CONFIGS.length})</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className={styles.count}>{tab.items.length}</span>
            </button>
          ))}
        </div>

        <div className={styles.achievementList}>
          {activeTab === 'progress' && inProgress.length > 0 && (
            inProgress.map((ach) => {
              const progress = achievements.progress[ach.tracker as keyof typeof achievements.progress] ?? 0;
              const pct = Math.min(100, (Number(progress) / ach.target) * 100);
              return (
                <div key={ach.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <h3>{ach.name}</h3>
                    <span className={`${styles.badge} ${styles[ach.difficulty]}`}>
                      {DIFFICULTY_LABELS[ach.difficulty]}
                    </span>
                  </div>
                  <p className={styles.description}>{ach.description}</p>
                  <div className={styles.progressRow}>
                    <div className={styles.progressTrack}>
                      <span className={styles.progressFill} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={styles.progressLabel}>{progress}/{ach.target}</span>
                  </div>
                  <span className={`${styles.rewardLabel} ${isBuffReward(ach.reward) ? styles.buff : ''}`}>
                    奖励：{rewardLabel(ach.reward)}
                  </span>
                </div>
              );
            })
          )}

          {activeTab === 'completed' && completed.length > 0 && (
            completed.map((ach) => {
              const achFull = getAchievementById(ach.id) || ach;
              return (
                <div key={ach.id} className={`${styles.card} ${styles.completed} ${achFull.difficulty === 'legendary' ? styles.legendary : ''}`}>
                  <div className={styles.cardHeader}>
                    <h4>{achFull.name}</h4>
                    <span className={`${styles.badge} ${styles.completed}`}>✓ 已完成</span>
                  </div>
                  <p className={styles.description}>{achFull.description}</p>
                  <span className={`${styles.rewardLabel} ${isBuffReward(achFull.reward) ? styles.buff : ''}`}>
                    已获得：{rewardLabel(achFull.reward)}
                  </span>
                </div>
              );
            })
          )}

          {activeTab === 'upcoming' && (
            upcoming.length > 0 ? (
              upcoming.map((ach) => (
                <div key={ach.id} className={styles.card} style={{ opacity: 0.5 }}>
                  <div className={styles.cardHeader}>
                    <h4>???</h4>
                    <span className={`${styles.badge} ${styles[ach.difficulty]}`}>
                      {DIFFICULTY_LABELS[ach.difficulty]}
                    </span>
                  </div>
                  <p className={styles.description}>完成所有其他成就后解锁</p>
                </div>
              ))
            ) : (
              <p className={styles.empty}>当前没有未解锁的隐藏成就。</p>
            )
          )}

          {activeTab === 'progress' && inProgress.length === 0 && (
            <p className={styles.empty}>所有成就已完成！🎉</p>
          )}

          {activeTab === 'completed' && completed.length === 0 && (
            <p className={styles.empty}>还没有完成的成就，继续加油！</p>
          )}
        </div>
      </div>
    </div>
  );
}
