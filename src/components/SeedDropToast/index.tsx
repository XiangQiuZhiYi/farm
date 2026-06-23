// ============================================================
// SeedDropToast 组件：收获时掉落稀有种子提示
// ============================================================

import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getPlantById } from '../../config/plants';
import styles from './SeedDropToast.module.css';

export function SeedDropToast() {
  const toast = useGameStore((s) => s.seedDropToast);
  const clearToast = useGameStore((s) => s.clearSeedDropToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      clearToast();
    }, 2000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  const plant = getPlantById(toast.plantId);
  if (!plant) return null;

  return (
    <div className={styles.toast}>
      <span className={styles.icon}>✨</span>
      <span>获得稀有种子：</span>
      <span className={styles.name}>{plant.name}</span>
    </div>
  );
}