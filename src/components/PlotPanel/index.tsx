// ============================================================
// PlotPanel 组件：点击地块后弹出的操作覆盖层
// 显示地块/植物状态 + 种植 / 浇水 / 收获 按钮
// ============================================================

import { useGameStore } from '../../store/gameStore';
import { getPlantById } from '../../config/plants';
import { calcPlotGrowthStage, getGrowthTargetMinutes, isPlantableMonth } from '../../systems/growthSystem';
import styles from './PlotPanel.module.css';

export function PlotPanel() {
  const plots = useGameStore((s) => s.plots);
  const selection = useGameStore((s) => s.selection);
  const clock = useGameStore((s) => s.clock);
  const seeds = useGameStore((s) => s.seeds);
  const unlockedPlants = useGameStore((s) => s.unlockedPlants);
  const harvest = useGameStore((s) => s.harvest);
  const plantSeed = useGameStore((s) => s.plantSeed);
  const selectPlot = useGameStore((s) => s.selectPlot);

  const plot = plots.find((p) => p.id === selection.selectedPlotId);
  // 无选中地块时不渲染
  if (!plot) return null;

  const plant = plot.plantedPlantId ? getPlantById(plot.plantedPlantId) : null;
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
                        disabled={!isPlantableMonth(p, clock.month)}
                      >
                        {p.name} ×{seeds[p.id] ?? 0}
                        {!isPlantableMonth(p, clock.month) ? ' (非播种期)' : ''}
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              // 正常状态：收获
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
            )}
          </div>
        ) : (
          // 空地 → 选择种植
          <div className={styles.plantSection}>
            <p className={styles.emptyHint}>空地 — 选择种植</p>
            <div className={styles.plantList}>
              {plantableList.length === 0 ? (
                <span className={styles.empty}>背包无种子，请点击「购买种子」</span>
              ) : (
                plantableList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={styles.plantBtn}
                    onClick={() => plantSeed(plot.id, p.id)}
                    disabled={!isPlantableMonth(p, clock.month)}
                  >
                    {p.name} ×{seeds[p.id] ?? 0}
                    {!isPlantableMonth(p, clock.month) ? ' (非播种期)' : ''}
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
