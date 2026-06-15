import { useState } from 'react';
import { FERTILIZER_CONFIGS, getFertilizerById } from '../../config/fertilizers';
import { getPlantById } from '../../config/plants';
import { useGameStore } from '../../store/gameStore';
import styles from './Warehouse.module.css';

type Tab = 'seeds' | 'harvest' | 'misc';
type WarehouseItemKind = 'seed' | 'harvest' | 'fertilizer';

type ActiveSaleItem = {
  kind: WarehouseItemKind;
  plantId: string;
  quantity: number;
};

function normalizeQuantity(input: string, max: number) {
  const digitsOnly = input.replace(/\D/g, '');
  const parsed = Number.parseInt(digitsOnly, 10);
  if (Number.isNaN(parsed) || parsed < 1) return 1;
  return Math.min(parsed, max);
}

function adjustQuantity(input: string, max: number, delta: number) {
  return String(Math.min(max, Math.max(1, normalizeQuantity(input, max) + delta)));
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

export function Warehouse() {
  const [tab, setTab] = useState<Tab>('seeds');
  const [sellQuantities, setSellQuantities] = useState<Record<string, string>>({});
  const [activeSaleItem, setActiveSaleItem] = useState<ActiveSaleItem | null>(null);
  const [seedFilter, setSeedFilter] = useState('全部');
  const seeds = useGameStore((state) => state.seeds);
  const inventory = useGameStore((state) => state.inventory);
  const miscInventory = useGameStore((state) => state.miscInventory);
  const sellSeeds = useGameStore((state) => state.sellSeeds);
  const sellFertilizer = useGameStore((state) => state.sellFertilizer);
  const sellHarvest = useGameStore((state) => state.sellHarvest);

  const seedEntries = Object.entries(seeds).filter(([, quantity]) => quantity > 0);
  const harvestEntries = Object.entries(inventory).filter(([, quantity]) => quantity > 0);
  const miscEntries = FERTILIZER_CONFIGS
    .map((fertilizer) => [fertilizer.id, miscInventory[fertilizer.id] ?? 0] as const)
    .filter(([, quantity]) => quantity > 0);

  const seedFilterOptions = ['全部', ...new Set(seedEntries
    .map(([plantId]) => getPlantById(plantId))
    .filter((plant): plant is NonNullable<typeof plant> => plant !== null)
    .map((plant) => bestSoilLabel(plant.allowedLandTypeId)))];
  const filteredSeedEntries = seedFilter === '全部'
    ? seedEntries
    : seedEntries.filter(([plantId]) => {
      const plant = getPlantById(plantId);
      return plant ? bestSoilLabel(plant.allowedLandTypeId) === seedFilter : false;
    });

  const updateQuantity = (key: string, nextValue: string) => {
    const max = activeSaleItem?.quantity ?? Number.MAX_SAFE_INTEGER;
    setSellQuantities((state) => ({
      ...state,
      [key]: String(normalizeQuantity(nextValue, max)),
    }));
  };

  const fillMaxQuantity = (key: string, max: number) => {
    setSellQuantities((state) => ({
      ...state,
      [key]: String(max),
    }));
  };

  const stepQuantity = (key: string, max: number, delta: number) => {
    setSellQuantities((state) => ({
      ...state,
      [key]: adjustQuantity(state[key] ?? '1', max, delta),
    }));
  };

  const handleSellSeeds = (plantId: string, max: number) => {
    const key = `seed:${plantId}`;
    const quantity = normalizeQuantity(sellQuantities[key] ?? '1', max);
    if (!sellSeeds(plantId, quantity)) return;

    const remaining = max - quantity;
    setSellQuantities((state) => ({
      ...state,
      [key]: String(Math.max(1, remaining)),
    }));
    setActiveSaleItem(null);
  };

  const handleSellHarvest = (plantId: string, max: number) => {
    const key = `harvest:${plantId}`;
    const quantity = normalizeQuantity(sellQuantities[key] ?? '1', max);
    if (!sellHarvest(plantId, quantity)) return;

    const remaining = max - quantity;
    setSellQuantities((state) => ({
      ...state,
      [key]: String(Math.max(1, remaining)),
    }));
    setActiveSaleItem(null);
  };

  const handleSellFertilizer = (fertilizerId: string, max: number) => {
    const key = `fertilizer:${fertilizerId}`;
    const quantity = normalizeQuantity(sellQuantities[key] ?? '1', max);
    if (!sellFertilizer(fertilizerId as Parameters<typeof sellFertilizer>[0], quantity)) return;

    const remaining = max - quantity;
    setSellQuantities((state) => ({
      ...state,
      [key]: String(Math.max(1, remaining)),
    }));
    setActiveSaleItem(null);
  };

  const openSaleModal = (kind: WarehouseItemKind, plantId: string, quantity: number) => {
    const key = `${kind}:${plantId}`;
    setSellQuantities((state) => ({
      ...state,
      [key]: state[key] ?? '1',
    }));
    setActiveSaleItem({ kind, plantId, quantity });
  };

  const activeKey = activeSaleItem ? `${activeSaleItem.kind}:${activeSaleItem.plantId}` : null;
  const activePlant = activeSaleItem ? getPlantById(activeSaleItem.plantId) : null;
  const activeFertilizer = activeSaleItem?.kind === 'fertilizer'
    ? getFertilizerById(activeSaleItem.plantId)
    : null;
  const activeQuantity = activeSaleItem && activeKey
    ? normalizeQuantity(sellQuantities[activeKey] ?? '1', activeSaleItem.quantity)
    : 1;
  const activeUnitPrice = activeSaleItem
    ? activeSaleItem.kind === 'seed' && activePlant
      ? Math.ceil(activePlant.purchasePrice / 10)
      : activeSaleItem.kind === 'harvest' && activePlant
        ? activePlant.sellPricePerUnit
        : activeFertilizer
          ? Math.ceil(activeFertilizer.purchasePrice / 10)
          : 0
    : 0;
  const activePreviewIncome = activeQuantity * activeUnitPrice;

  return (
    <div className={styles.warehouse}>
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
          className={tab === 'harvest' ? styles.activeTab : ''}
          onClick={() => setTab('harvest')}
        >
          农作物
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
          filteredSeedEntries.length > 0 ? (
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
              <div className={styles.tagGrid}>
              {filteredSeedEntries.map(([plantId, quantity]) => {
                const plant = getPlantById(plantId);
                if (!plant) return null;

                const sellPrice = Math.ceil(plant.purchasePrice / 10);

                return (
                  <button
                    key={`seed:${plantId}`}
                    type="button"
                    className={styles.tagCard}
                    onClick={() => openSaleModal('seed', plantId, quantity)}
                  >
                    <span className={styles.name}>{plant.name} 种子</span>
                    <span className={styles.meta}>库存 {quantity}</span>
                    <span className={styles.preview}>回收 {sellPrice} 金/粒</span>
                  </button>
                );
              })}
              </div>
            </>
          ) : (
            <p className={styles.empty}>暂无种子库存</p>
          )
        ) : tab === 'harvest' ? harvestEntries.length > 0 ? (
          <div className={styles.tagGrid}>
            {harvestEntries.map(([plantId, quantity]) => {
              const plant = getPlantById(plantId);
              if (!plant) return null;

              return (
                <button
                  key={`harvest:${plantId}`}
                  type="button"
                  className={styles.tagCard}
                  onClick={() => openSaleModal('harvest', plantId, quantity)}
                >
                  <span className={styles.name}>{plant.name}</span>
                  <span className={styles.meta}>库存 {quantity}</span>
                  <span className={styles.preview}>售价 {plant.sellPricePerUnit} 金/份</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>暂无农作物库存</p>
        ) : miscEntries.length > 0 ? (
          <div className={styles.tagGrid}>
            {miscEntries.map(([fertilizerId, quantity]) => {
              const fertilizer = getFertilizerById(fertilizerId);
              if (!fertilizer) return null;

              return (
                <button
                  key={`fertilizer:${fertilizerId}`}
                  type="button"
                  className={styles.tagCard}
                  onClick={() => openSaleModal('fertilizer', fertilizerId, quantity)}
                >
                  <span className={styles.name}>{fertilizer.name}</span>
                  <span className={styles.meta}>库存 {quantity}</span>
                  <span className={styles.preview}>回收 {Math.ceil(fertilizer.purchasePrice / 10)} 金/份</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>暂无杂物库存</p>
        )}
      </div>

      {activeSaleItem && (activePlant || activeFertilizer) && activeKey ? (
        <div className={styles.saleBackdrop} role="presentation" onClick={() => setActiveSaleItem(null)}>
          <div className={styles.saleModal} role="dialog" aria-modal="true" aria-label="售卖" onClick={(event) => event.stopPropagation()}>
            <div className={styles.saleHeader}>
              <h3>
                {activeSaleItem.kind === 'seed' && activePlant
                  ? `${activePlant.name} 种子`
                  : activeSaleItem.kind === 'harvest' && activePlant
                    ? activePlant.name
                    : activeFertilizer?.name}
              </h3>
              <button type="button" className={styles.closeBtn} onClick={() => setActiveSaleItem(null)}>×</button>
            </div>
            <div className={styles.saleBody}>
              <p className={styles.meta}>库存 {activeSaleItem.quantity} / 单价 {activeUnitPrice} 金</p>
              <p className={styles.preview}>本次售卖可得 {activePreviewIncome} 金</p>
              <div className={styles.actions}>
                <button type="button" onClick={() => stepQuantity(activeKey, activeSaleItem.quantity, -1)}>-</button>
                <input
                  type="number"
                  min={1}
                  max={activeSaleItem.quantity}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={sellQuantities[activeKey] ?? '1'}
                  onChange={(event) => updateQuantity(activeKey, event.target.value)}
                />
                <button type="button" onClick={() => stepQuantity(activeKey, activeSaleItem.quantity, 1)}>+</button>
                <button type="button" onClick={() => fillMaxQuantity(activeKey, activeSaleItem.quantity)}>全部</button>
              </div>
              <div className={styles.saleFooter}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setActiveSaleItem(null)}>关闭</button>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => activeSaleItem.kind === 'seed'
                    ? handleSellSeeds(activeSaleItem.plantId, activeSaleItem.quantity)
                    : activeSaleItem.kind === 'harvest'
                      ? handleSellHarvest(activeSaleItem.plantId, activeSaleItem.quantity)
                      : handleSellFertilizer(activeSaleItem.plantId, activeSaleItem.quantity)}
                >
                  确认售卖
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}