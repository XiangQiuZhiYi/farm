// ============================================================
// Shop 组件：购买种子 + 出售背包农产品
// ============================================================

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getPlantById } from '../../config/plants';
import styles from './Shop.module.css';

type Tab = 'buy' | 'sell';

export function Shop() {
  const [tab, setTab] = useState<Tab>('buy');
  const economy = useGameStore((s) => s.economy);
  const inventory = useGameStore((s) => s.inventory);
  const seeds = useGameStore((s) => s.seeds);
  const unlockedPlants = useGameStore((s) => s.unlockedPlants);
  const buySeeds = useGameStore((s) => s.buySeeds);
  const sellHarvest = useGameStore((s) => s.sellHarvest);

  const unlockedConfigs = unlockedPlants
    .map(getPlantById)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <div className={styles.shop}>
      <div className={styles.tabs}>
        <button
          className={tab === 'buy' ? styles.activeTab : ''}
          onClick={() => setTab('buy')}
        >
          🛒 购买种子
        </button>
        <button
          className={tab === 'sell' ? styles.activeTab : ''}
          onClick={() => setTab('sell')}
        >
          💰 出售农产品
        </button>
      </div>

      <div className={styles.content}>
        {tab === 'buy' ? (
          <ul className={styles.list}>
            {unlockedConfigs.map((p) => p && (
              <li key={p.id} className={styles.item}>
                <span className={styles.name}>
                  {p.name} {p.harvestType === 'perennial' ? '（多年生）' : '（一次性）'}
                  {/* 显示当前种子库存量 */}
                  {(seeds[p.id] ?? 0) > 0 && (
                    <span className={styles.seedBadge}>库存 ×{seeds[p.id]}</span>
                  )}
                </span>
                <span className={styles.price}>
                  采购 {p.purchasePrice} 金/份
                  {p.harvestType === 'perennial' && p.reharvestMinutes
                    ? ` · 再采 ${Math.round(p.reharvestMinutes / 1440)} 个月 · 越季暂停`
                    : ' · 越季枯萎'}
                </span>
                <button
                  onClick={() => buySeeds(p.id, 1)}
                  disabled={economy.gold < p.purchasePrice}
                >
                  购买 ×1
                </button>
                <button
                  onClick={() => buySeeds(p.id, 5)}
                  disabled={economy.gold < p.purchasePrice * 5}
                >
                  购买 ×5
                </button>
              </li>
            ))}
          </ul>
        ) : (
          // 出售页只显示果实背包（inventory），不包含种子
          <ul className={styles.list}>
            {Object.entries(inventory)
              .filter(([, qty]) => qty > 0)
              .map(([plantId, qty]) => {
                const p = getPlantById(plantId);
                if (!p) return null;
                return (
                  <li key={plantId} className={styles.item}>
                    <span className={styles.name}>
                      {p.name} ×{qty}（收获果实）
                    </span>
                    <span className={styles.price}>售价 {p.sellPricePerUnit} 金/份</span>
                    <button onClick={() => sellHarvest(plantId, 1)}>出售 ×1</button>
                    <button onClick={() => sellHarvest(plantId, qty)}>全部出售</button>
                  </li>
                );
              })}
            {Object.values(inventory).every((q) => q === 0) && (
              <li className={styles.empty}>暂无收获果实</li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
