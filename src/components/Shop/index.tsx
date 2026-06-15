// ============================================================
// Shop 组件：仅负责购买种子
// ============================================================

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { FERTILIZER_CONFIGS, getFertilizerById } from '../../config/fertilizers';
import { getPlantById } from '../../config/plants';
import styles from './Shop.module.css';

type Tab = 'seeds' | 'misc';
type ShopItemKind = 'seed' | 'fertilizer';

type ActivePurchaseItem = {
  kind: ShopItemKind;
  itemId: string;
};

function normalizeQuantity(input: string) {
  const digitsOnly = input.replace(/\D/g, '');
  const parsed = Number.parseInt(digitsOnly, 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return parsed;
}

function bestSoilLabel(allowedLandTypeId: string) {
  const map: Record<string, string> = {
    paddy_field: '水田',
    dry_land: '旱地',
    brown_soil: '褐土',
    tidal_soil: '潮土',
    black_soil: '黑土',
  };
  return map[allowedLandTypeId] ?? '其他';
}

export function Shop() {
  const [tab, setTab] = useState<Tab>('seeds');
  const [purchaseQuantity, setPurchaseQuantity] = useState('1');
  const [activeItem, setActiveItem] = useState<ActivePurchaseItem | null>(null);
  const [seedFilter, setSeedFilter] = useState('全部');
  const economy = useGameStore((s) => s.economy);
  const seeds = useGameStore((s) => s.seeds);
  const miscInventory = useGameStore((s) => s.miscInventory);
  const unlockedPlants = useGameStore((s) => s.unlockedPlants);
  const buySeeds = useGameStore((s) => s.buySeeds);
  const buyFertilizer = useGameStore((s) => s.buyFertilizer);

  const unlockedConfigs = unlockedPlants
    .map(getPlantById)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const seedFilterOptions = ['全部', ...new Set(unlockedConfigs.map((plant) => bestSoilLabel(plant.allowedLandTypeId)))];
  const filteredSeeds = seedFilter === '全部'
    ? unlockedConfigs
    : unlockedConfigs.filter((plant) => bestSoilLabel(plant.allowedLandTypeId) === seedFilter);

  const quantity = normalizeQuantity(purchaseQuantity);
  const activePlant = activeItem?.kind === 'seed' ? getPlantById(activeItem.itemId) : null;
  const activeFertilizer = activeItem?.kind === 'fertilizer' ? getFertilizerById(activeItem.itemId) : null;
  const activeUnitPrice = activeItem
    ? activeItem.kind === 'seed'
      ? activePlant?.purchasePrice ?? 0
      : activeFertilizer?.purchasePrice ?? 0
    : 0;
  const previewCost = activeUnitPrice * quantity;

  const openPurchaseModal = (kind: ShopItemKind, itemId: string) => {
    setPurchaseQuantity('1');
    setActiveItem({ kind, itemId });
  };

  const confirmPurchase = () => {
    if (!activeItem) return;

    if (activeItem.kind === 'seed') {
      const ok = buySeeds(activeItem.itemId, quantity);
      if (ok) setActiveItem(null);
      return;
    }

    const ok = buyFertilizer(activeItem.itemId as Parameters<typeof buyFertilizer>[0], quantity);
    if (ok) setActiveItem(null);
  };

  return (
    <div className={styles.shop}>
      <div className={styles.tabs}>
        <button
          type="button"
          className={tab === 'seeds' ? styles.activeTab : ''}
          onClick={() => setTab('seeds')}
        >
          种子
        </button>
        <button
          type="button"
          className={tab === 'misc' ? styles.activeTab : ''}
          onClick={() => setTab('misc')}
        >
          杂物
        </button>
      </div>

      <div className={styles.content}>
        {tab === 'seeds' ? (
          <>
            <div className={styles.filters}>
              {seedFilterOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={seedFilter === option ? styles.activeFilter : styles.filterBtn}
                  onClick={() => setSeedFilter(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            {filteredSeeds.length > 0 ? (
              <div className={styles.tagGrid}>
                {filteredSeeds.map((plant) => (
                  <button
                    key={plant.id}
                    type="button"
                    className={styles.tagCard}
                    onClick={() => openPurchaseModal('seed', plant.id)}
                  >
                    <span className={styles.name}>
                      {plant.name} {plant.harvestType === 'perennial' ? '（多年生）' : '（一次性）'}
                    </span>
                    <span className={styles.price}>采购 {plant.purchasePrice} 金/份</span>
                    {(seeds[plant.id] ?? 0) > 0 ? (
                      <span className={styles.seedBadge}>库存 ×{seeds[plant.id]}</span>
                    ) : null}
                  </button>
                ))}
              </div>
            ) : (
              <p className={styles.empty}>当前筛选下暂无可购买种子</p>
            )}
          </>
        ) : (
          <div className={styles.tagGrid}>
            {FERTILIZER_CONFIGS.map((fertilizer) => (
              <button
                key={fertilizer.id}
                type="button"
                className={styles.tagCard}
                onClick={() => openPurchaseModal('fertilizer', fertilizer.id)}
              >
                <span className={styles.name}>{fertilizer.name}</span>
                <span className={styles.price}>采购 {fertilizer.purchasePrice} 金/份</span>
                <span className={styles.preview}>
                  {fertilizer.effectType === 'growth'
                    ? `下次成熟速度 ×${fertilizer.multiplier}`
                    : `下次收获产量 ×${fertilizer.multiplier}`}
                </span>
                {(miscInventory[fertilizer.id] ?? 0) > 0 ? (
                  <span className={styles.seedBadge}>库存 ×{miscInventory[fertilizer.id]}</span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {activeItem ? (
        <div className={styles.purchaseBackdrop} role="presentation" onClick={() => setActiveItem(null)}>
          <div className={styles.purchaseModal} role="dialog" aria-modal="true" aria-label="购买" onClick={(event) => event.stopPropagation()}>
            <div className={styles.purchaseHeader}>
              <h3>
                {activeItem.kind === 'seed'
                  ? activePlant?.name ?? activeItem.itemId
                  : activeFertilizer?.name ?? activeItem.itemId}
              </h3>
              <button type="button" className={styles.closeBtn} onClick={() => setActiveItem(null)}>×</button>
            </div>
            <div className={styles.purchaseBody}>
              <p className={styles.price}>单价 {activeUnitPrice} 金</p>
              {activeItem.kind === 'fertilizer' && activeFertilizer ? (
                <p className={styles.preview}>
                  {activeFertilizer.effectType === 'growth'
                    ? `作用：下次成熟速度 ×${activeFertilizer.multiplier}`
                    : `作用：下次收获产量 ×${activeFertilizer.multiplier}`}
                </p>
              ) : null}
              <p className={styles.preview}>本次购买需花费 {previewCost} 金</p>
              <div className={styles.actions}>
                <button type="button" onClick={() => setPurchaseQuantity(String(Math.max(1, quantity - 1)))}>-</button>
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={purchaseQuantity}
                  onChange={(event) => setPurchaseQuantity(String(normalizeQuantity(event.target.value)))}
                />
                <button type="button" onClick={() => setPurchaseQuantity(String(quantity + 1))}>+</button>
              </div>
              <div className={styles.purchaseFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setActiveItem(null)}>关闭</button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  disabled={economy.gold < previewCost}
                  onClick={confirmPurchase}
                >
                  确认购买
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
