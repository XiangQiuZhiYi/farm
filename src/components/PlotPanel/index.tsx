// ============================================================
// PlotPanel 组件：点击地块后弹出的操作覆盖层
// 显示地块/植物状态 + 种植 / 浇水 / 收获 按钮
// ============================================================

import { useGameStore } from '../../store/gameStore';
import { FERTILIZER_CONFIGS, getFertilizerById } from '../../config/fertilizers';
import { getPlantById } from '../../config/plants';
import { calcPlotGrowthStage, getGrowthTargetMinutes } from '../../systems/growthSystem';
import styles from './PlotPanel.module.css';

// ── 批量操作面板 ────────────────────────────────────────────
function BatchPanel() {
  const plots = useGameStore((s) => s.plots);
  const selection = useGameStore((s) => s.selection);
  const seeds = useGameStore((s) => s.seeds);
  const miscInventory = useGameStore((s) => s.miscInventory);
  const unlockedPlants = useGameStore((s) => s.unlockedPlants);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const batchPlantSeed = useGameStore((s) => s.batchPlantSeed);
  const batchApplyFertilizer = useGameStore((s) => s.batchApplyFertilizer);

  const selectedIds = selection.selectedPlotIds ?? [];
  const selectedPlots = plots.filter((p) => selectedIds.includes(p.id));

  // 空地和枯萎地块可播种，有植物的非枯萎地块可施肥
  const plantableIds = selectedPlots
    .filter((p) => !p.plantedPlantId || p.isWilted)
    .map((p) => p.id);
  const fertilizableIds = selectedPlots
    .filter((p) => p.plantedPlantId && !p.isWilted && p.appliedFertilizerId === null)
    .map((p) => p.id);

  const plantableList = unlockedPlants
    .map(getPlantById)
    .filter((p): p is NonNullable<typeof p> => p !== null && (seeds[p.id] ?? 0) > 0);

  return (
    <div className={styles.overlay} role="presentation" onClick={clearSelection}>
      <div className={styles.panel} role="dialog" aria-label="批量操作" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={styles.closeBtn} aria-label="关闭" onClick={clearSelection}>×</button>

        <div className={styles.titleRow}>
          <div>
            <span className={styles.plotId}>批量操作</span>
            <span className={styles.landType}>已选 {selectedIds.length} 块地</span>
          </div>
        </div>

        <div className={styles.plantSection}>
          {plantableIds.length > 0 && (
            <div>
              <p className={styles.emptyHint}>
                批量种植（空地/枯萎：{plantableIds.length} 块）
              </p>
              <div className={styles.plantList}>
                {plantableList.length === 0 ? (
                  <span className={styles.empty}>背包无种子，请购买</span>
                ) : (
                  plantableList.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={styles.plantBtn}
                      onClick={() => {
                        batchPlantSeed(plantableIds, p.id);
                        clearSelection();
                      }}
                    >
                      {p.name} ×{seeds[p.id] ?? 0}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {fertilizableIds.length > 0 && (
            <div className={styles.fertilizerSection}>
              <p className={styles.fertilizerTitle}>批量施肥（可施：{fertilizableIds.length} 块）</p>
              <div className={styles.plantList}>
                {FERTILIZER_CONFIGS.map((item) => {
                  const qty = miscInventory[item.id] ?? 0;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={styles.plantBtn}
                      disabled={qty <= 0}
                      onClick={() => {
                        batchApplyFertilizer(fertilizableIds, item.id);
                        clearSelection();
                      }}
                    >
                      {item.name} ×{qty}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {plantableIds.length === 0 && fertilizableIds.length === 0 && (
            <p className={styles.empty}>选中的地块当前无可执行的批量操作。</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PlotPanel() {
  // ── 所有 hooks 必须在任何条件返回之前调用（Rules of Hooks）──
  const plots = useGameStore((s) => s.plots);
  const selection = useGameStore((s) => s.selection);
  const miscInventory = useGameStore((s) => s.miscInventory);
  const seeds = useGameStore((s) => s.seeds);
  const unlockedPlants = useGameStore((s) => s.unlockedPlants);
  const harvest = useGameStore((s) => s.harvest);
  const applyFertilizer = useGameStore((s) => s.applyFertilizer);
  const plantSeed = useGameStore((s) => s.plantSeed);
  const selectPlot = useGameStore((s) => s.selectPlot);

  // 批量面板由用户点击「操作」按鈕手动打开，不再自动弹出。
  // 旧存档兼容：batchPanelOpen 可能为 undefined
  if (selection.batchPanelOpen) {
    return <BatchPanel />;
  }

  const plot = plots.find((p) => p.id === selection.selectedPlotId);
  // 无选中地块时不渲染
  if (!plot) return null;

  const plant = plot.plantedPlantId ? getPlantById(plot.plantedPlantId) : null;
  const fertilizer = plot.appliedFertilizerId ? getFertilizerById(plot.appliedFertilizerId) : null;
  const targetMinutes = plant ? getGrowthTargetMinutes(plot, plant) : 0;
  const stage = plant && !plot.isWilted ? calcPlotGrowthStage(plot, plant) : null;
  const progress = plant && !plot.isWilted
    ? Math.min((plot.growthMinutesAccumulated / targetMinutes) * 100, 100)
    : 0;

  const STAGE_LABELS: Record<string, string> = {
    seed: '育苗', sprout: '发芽', grow: '生长', mature: '成熟',
  };

  const lifecycleText = plant
    ? plot.isWilted
      ? '⚠ 枯萎'
      : plot.isReadyToHarvest
        ? plant.harvestType === 'perennial' && plot.harvestCount > 0
          ? '✦ 可再次采收'
          : '✦ 可收获'
        : plant.harvestType === 'perennial' && plot.harvestCount > 0
          ? '↺ 再生中'
          : `◎ ${STAGE_LABELS[stage ?? 'seed'] ?? '生长中'}`
    : '';

  const fertilizerStatusLabel = fertilizer?.plotStatusLabel ?? '未施肥';

  // 种子库中有存货的已解锁植物列表
  const plantableList = unlockedPlants
    .map(getPlantById)
    .filter((p): p is NonNullable<typeof p> => p !== null && (seeds[p.id] ?? 0) > 0);

  return (
    // 点击面板外部区域关闭
    <div className={styles.overlay} role="presentation" onClick={() => selectPlot(null)}>
      <div
        className={styles.panel}
        role="dialog"
        aria-label="地块操作"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="关闭"
          onClick={() => selectPlot(null)}
        >
          ×
        </button>

        {/* 地块标题行 */}
        <div className={styles.titleRow}>
          <div>
            <span className={styles.plotId}>{plot.id}</span>
            <span className={styles.landType}>{plot.landTypeId.replace(/_/g, ' ')}</span>
          </div>
        </div>

        {plant ? (
          <div className={styles.plantSection}>
            {/* 植物状态行 */}
            <div className={styles.plantStatus}>
              <span className={styles.plantName}>{plant.name}</span>
              <span className={`${styles.lifecycle} ${plot.isWilted ? styles.wilted : plot.isReadyToHarvest ? styles.ready : ''}`}>
                {lifecycleText}
              </span>
            </div>

            {/* 成长进度条 */}
            {!plot.isWilted && (
              <div className={styles.progressRow}>
                <div className={styles.progressTrack}>
                  <span style={{ width: `${progress}%` }} />
                </div>
                <span className={styles.progressLabel}>{progress.toFixed(1)}%</span>
              </div>
            )}

            <div className={styles.meta}>
              <span>{plant.harvestType === 'perennial' ? '多年生' : '一年生'}</span>
              <span>{fertilizerStatusLabel}</span>
              {plant.harvestType === 'perennial' && plot.harvestCount > 0 && (
                <span>已收 {plot.harvestCount} 次</span>
              )}
            </div>

            {/* 操作按钮区 */}
            {plot.isWilted ? (
              // 枯萎 → 可重新种植
              <>
                <p className={styles.wiltHint}>植株已枯萎，可重新种植</p>
                <div className={styles.plantList}>
                  {plantableList.length === 0 ? (
                    <span className={styles.empty}>背包无种子，请购买</span>
                  ) : (
                    plantableList.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className={styles.plantBtn}
                        onClick={() => plantSeed(plot.id, p.id)}
                      >
                        {p.name} ×{seeds[p.id] ?? 0}
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              // 正常状态：收获
              <>
                <div className={styles.actions}>
                  {plot.isReadyToHarvest && (
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.harvestBtn}`}
                      onClick={() => harvest(plot.id)}
                    >
                      🌾 收获
                    </button>
                  )}
                </div>

                <div className={styles.fertilizerSection}>
                  <p className={styles.fertilizerTitle}>施肥</p>
                  <div className={styles.plantList}>
                    {FERTILIZER_CONFIGS.map((item) => {
                      const qty = miscInventory[item.id] ?? 0;
                      const disabled = qty <= 0 || plot.appliedFertilizerId !== null || (item.effectType === 'growth' && plot.isReadyToHarvest);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={styles.plantBtn}
                          disabled={disabled}
                          onClick={() => applyFertilizer(plot.id, item.id)}
                        >
                          {item.name} ×{qty}
                        </button>
                      );
                    })}
                  </div>
                  <p className={styles.fertilizerHint}>
                    {plot.appliedFertilizerId !== null
                      ? '当前作物已有肥料效果，需等本次效果结算后才能再次施肥。'
                      : '同一时间只能存在一种肥料效果。生长肥仅限未成熟作物施加。'}
                  </p>
                </div>
              </>
            )}
          </div>
        ) : (
          // 空地 → 选择种植
          <div className={styles.plantSection}>
            <p className={styles.emptyHint}>空地 — 选择种植</p>
            <div className={styles.plantList}>
              {plantableList.length === 0 ? (
                <span className={styles.empty}>背包无种子，请点击「商店」</span>
              ) : (
                plantableList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={styles.plantBtn}
                    onClick={() => plantSeed(plot.id, p.id)}
                  >
                    {p.name} ×{seeds[p.id] ?? 0}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
