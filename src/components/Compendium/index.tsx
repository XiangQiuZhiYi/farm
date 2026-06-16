import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LAND_COMPENDIUM_ENTRIES, type LandCompendiumEntry } from '../../config/compendium/lands';
import {
  PLANT_COMPENDIUM_ENTRIES,
  PLANT_PIXEL_PALETTE,
  type PlantCompendiumEntry,
} from '../../config/compendium/plants';
import {
  TASK_COMPENDIUM_ENTRIES,
  type TaskCompendiumEntry,
} from '../../config/compendium/tasks';
import { REGION_CONFIGS } from '../../config/regions';
import { ALL_PLANTS } from '../../config/plants';
import type { LandTypeId } from '../../types/land';
import styles from './Compendium.module.css';

const LAND_PIXEL_PALETTE: Record<string, string | null> = {
  '.': null,
  W: '#5fa8ff',  // 普通水面
  A: '#90cbf0',  // 水面反光（浅蓝）
  F: '#2d6090',  // 水深阴影（深蓝）
  S: '#412816',  // 深色土色边界
  R: '#7f5539',  // 田埂泥土
  B: '#9c6b43',
  C: '#b77b4f',  // 浅棕（田埂高光）
  L: '#c9a96a',
  M: '#7b8f6a',
  G: '#4f8f4b',
  H: '#1f2b1e',
  D: '#1d140f',
};

function PixelCanvas({
  pixels,
  scale,
  palette = LAND_PIXEL_PALETTE,
  grid = false,
  className,
  title,
}: {
  pixels: string[];
  scale: number;
  palette?: Record<string, string | null>;
  grid?: boolean;
  className?: string;
  title?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = pixels[0]?.length ?? 0;
    const height = pixels.length;
    canvas.width = width * scale;
    canvas.height = height * scale;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pixels.forEach((row, y) => {
      [...row].forEach((cell, x) => {
        const color = palette[cell];
        if (!color) return;
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      });
    });

    if (grid) {
      ctx.strokeStyle = 'rgba(246, 174, 76, 0.13)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= width; i += 1) {
        const offset = i * scale + 0.5;
        ctx.beginPath();
        ctx.moveTo(offset, 0);
        ctx.lineTo(offset, canvas.height);
        ctx.stroke();
      }
      for (let i = 0; i <= height; i += 1) {
        const offset = i * scale + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, offset);
        ctx.lineTo(canvas.width, offset);
        ctx.stroke();
      }
    }
  }, [pixels, scale, palette, grid]);

  return <canvas ref={ref} className={className} aria-label={title} />;
}

const PLANT_STAGE_LABELS: Record<string, string> = {
  seed: '种子',
  sprout: '幼苗',
  grow: '生长',
  mature: '成熟',
};

function LandAchievementCard({
  entry,
  unlocked,
  progressCurrent,
  progressTotal,
  onOpen,
}: {
  entry: LandCompendiumEntry;
  unlocked: boolean;
  /** 当前前置区域已收获种数 */
  progressCurrent: number;
  /** 解锁所需前置区域图鉴数 */
  progressTotal: number;
  onOpen: (id: LandTypeId) => void;
}) {
  const progress = unlocked ? 100 : progressTotal <= 0 ? 100 : Math.min((progressCurrent / progressTotal) * 100, 100);
  const progressLabel = unlocked
    ? `${progressTotal} / ${progressTotal}`
    : progressTotal <= 0
      ? '初始解锁'
      : `${progressCurrent} / ${progressTotal}`;
  const target = entry.details.find((item) => item.label === '扩张价格')?.value ?? '';

  return (
    <button
      type="button"
      className={`${styles.card} ${unlocked ? styles.unlocked : styles.discovered}`}
      onClick={() => onOpen(entry.id)}
    >
      <PixelCanvas
        pixels={entry.pixels}
        scale={4}
        palette={LAND_PIXEL_PALETTE}
        className={styles.cardIcon}
        title={`${entry.name} 土地像素画`}
      />
      <div className={styles.cardMain}>
        <div className={styles.cardHead}>
          <div>
            <h3>{entry.name}</h3>
            <p>{entry.regionName}</p>
          </div>
          <div className={styles.cardBadges}>
            <span className={unlocked ? styles.statusUnlocked : styles.statusDiscovered}>
              {unlocked ? '已解锁' : '已发现'}
            </span>
            {/* <span>目标 {target}</span> */}
          </div>
        </div>
        <p className={styles.cardText}>{entry.summary}</p>
        <div className={styles.progressRow}>
          <div className={styles.progressTrack}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <span>{progressLabel}</span>
        </div>
      </div>
    </button>
  );
}

function PlantCard({
  entry,
  unlocked,
  onOpen,
}: {
  entry: PlantCompendiumEntry;
  unlocked: boolean;
  onOpen: (id: string) => void;
}) {
  const stages = (['seed', 'sprout', 'grow', 'mature'] as const);
  const unlockCost = entry.unlockCost;
  const isRare = unlockCost >= 99999999;
  const progressLabel = unlockCost <= 0
    ? '初始解锁'
    : isRare
      ? '珍稀植物'
      : `解锁费用 ${unlockCost} 金`;

  return (
    <button
      type="button"
      className={`${styles.plantCard} ${unlocked ? '' : styles.plantCardLocked}`}
      onClick={() => {
        if (unlocked) {
          onOpen(entry.id);
        }
      }}
    >
      <div className={styles.plantStageRow}>
        {stages.map((stage) => (
          <div key={stage} className={styles.plantStageCell}>
            <PixelCanvas
              pixels={entry.stages[stage]}
              scale={3}
              palette={PLANT_PIXEL_PALETTE}
              className={styles.plantStageCanvas}
              title={`${entry.name} ${PLANT_STAGE_LABELS[stage]}`}
            />
            {!unlocked ? <div className={styles.pixelMask}>未解锁</div> : null}
            <span>{PLANT_STAGE_LABELS[stage]}</span>
          </div>
        ))}
      </div>
      <div className={styles.plantCardInfo}>
        <div className={styles.plantCardHead}>
          <h3>{entry.name}</h3>
          <div className={styles.plantCardBadges}>
            <span className={unlocked ? styles.statusUnlocked : styles.statusLocked}>
              {unlocked ? '已解锁' : '未解锁'}
            </span>
            {unlocked ? <span className={styles.plantRegionTag}>{entry.bestSoilLabel}</span> : null}
          </div>
        </div>
        {unlocked ? <p className={styles.cardText}>{entry.summary}</p> : null}
        {!unlocked && (
          <div className={styles.plantProgressBlock}>
            <div className={styles.plantProgressHead}>
              <span>解锁条件</span>
              <span>{progressLabel}</span>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}

function TaskCard({
  entry,
  status,
  onOpen,
}: {
  entry: TaskCompendiumEntry;
  status: 'locked' | 'undiscovered' | 'discovered' | 'completed';
  onOpen: (id: string) => void;
}) {
  const canOpen = status === 'discovered' || status === 'completed';

  return (
    <button
      type="button"
      className={`${styles.taskCard} ${canOpen ? '' : styles.taskCardLocked}`}
      onClick={() => {
        if (canOpen) {
          onOpen(entry.id);
        }
      }}
    >
      <div className={styles.taskCardHead}>
        <div>
          <h3>{entry.title}</h3>
          {canOpen ? <p>{entry.summary}</p> : null}
        </div>
        <div className={styles.taskCardBadges}>
          <span
            className={
              status === 'completed'
                ? styles.statusCompleted
                : status === 'discovered'
                  ? styles.statusUnlocked
                  : status === 'undiscovered'
                    ? styles.statusDiscovered
                  : styles.statusLocked
            }
          >
            {status === 'completed'
              ? '已完成'
              : status === 'discovered'
                ? '已发现'
                : status === 'undiscovered'
                  ? '未发现'
                  : '未解锁'}
          </span>
          {canOpen ? <span>{entry.isTimed ? '限时' : '常驻'}</span> : null}
        </div>
      </div>

      {canOpen ? (
        <>
          <div className={styles.tags}>
            {entry.highlights.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className={styles.taskPreviewRow}>
            {entry.details.slice(0, 2).map((row) => (
              <div key={row.label} className={styles.taskPreviewItem}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </button>
  );
}

export function Compendium() {
  const unlockedRegions = useGameStore((s) => s.unlockedRegions);
  const unlockedPlants = useGameStore((s) => s.unlockedPlants);
  const plots = useGameStore((s) => s.plots);
  const compendium = useGameStore((s) => s.compendium);
  const unlockedTasks = useGameStore((s) => s.unlockedTasks);
  const completedTasks = useGameStore((s) => s.completedTasks);
  const [activeTab, setActiveTab] = useState<'land' | 'plant' | 'task'>('land');
  const [modalId, setModalId] = useState<LandTypeId | null>(null);
  const [plantModalId, setPlantModalId] = useState<string | null>(null);
  const [taskModalId, setTaskModalId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('全部');
  const [plantFilter, setPlantFilter] = useState('全部');
  const [taskFilter, setTaskFilter] = useState('全部');

  const modalEntry = useMemo(
    () => LAND_COMPENDIUM_ENTRIES.find((entry) => entry.id === modalId) ?? null,
    [modalId],
  );
  const plantModalEntry = useMemo(
    () => PLANT_COMPENDIUM_ENTRIES.find((entry) => entry.id === plantModalId) ?? null,
    [plantModalId],
  );
  const taskModalEntry = useMemo(
    () => TASK_COMPENDIUM_ENTRIES.find((entry) => entry.id === taskModalId) ?? null,
    [taskModalId],
  );
  const plantModalUnlocked = plantModalEntry ? unlockedPlants.includes(plantModalEntry.id) : false;
  const getTaskStatus = (entry: TaskCompendiumEntry) => {
    const requirementsUnlocked = entry.unlockPlantIds.every((plantId) => unlockedPlants.includes(plantId));
    if (!requirementsUnlocked) return 'locked' as const;
    if (completedTasks.includes(entry.id)) return 'completed' as const;
    if (unlockedTasks.includes(entry.id)) return 'discovered' as const;
    return 'undiscovered' as const;
  };
  const taskModalStatus = useMemo(() => {
    if (!taskModalEntry) return 'locked' as const;
    return getTaskStatus(taskModalEntry);
  }, [completedTasks, taskModalEntry, unlockedPlants, unlockedTasks]);

  const landRegionNames = useMemo(
    () => [...new Set(LAND_COMPENDIUM_ENTRIES.map((e) => e.regionName))],
    [],
  );
  const filterOptions = useMemo(
    () => ['全部', '已解锁', '已发现', ...landRegionNames],
    [landRegionNames],
  );
  const filteredEntries = useMemo(() => {
    if (activeFilter === '全部') return LAND_COMPENDIUM_ENTRIES;
    if (activeFilter === '已解锁') return LAND_COMPENDIUM_ENTRIES.filter((e) => unlockedRegions.includes(e.regionId));
    if (activeFilter === '已发现') return LAND_COMPENDIUM_ENTRIES.filter((e) => !unlockedRegions.includes(e.regionId));
    return LAND_COMPENDIUM_ENTRIES.filter((e) => e.regionName === activeFilter);
  }, [activeFilter, unlockedRegions]);
  const recentlyUnlocked = useMemo(
    () => LAND_COMPENDIUM_ENTRIES.filter((e) => unlockedRegions.includes(e.regionId)).slice(0, 6),
    [unlockedRegions],
  );

  const plantRegionNames = useMemo(
    () => [...new Set(PLANT_COMPENDIUM_ENTRIES.map((e) => e.regionName))],
    [],
  );
  const plantFilterOptions = useMemo(
    // 增加 已解锁 / 未解锁 筛选选项，方便玩家快速定位
    () => ['全部', '已解锁', '未解锁', ...plantRegionNames],
    [plantRegionNames],
  );
  const filteredPlants = useMemo(() => {
    if (plantFilter === '已解锁') return PLANT_COMPENDIUM_ENTRIES.filter((e) => unlockedPlants.includes(e.id));
    if (plantFilter === '未解锁') return PLANT_COMPENDIUM_ENTRIES.filter((e) => !unlockedPlants.includes(e.id));
    if (plantFilter !== '全部') return PLANT_COMPENDIUM_ENTRIES.filter((e) => e.regionName === plantFilter);
    return PLANT_COMPENDIUM_ENTRIES;
  }, [plantFilter, unlockedPlants]);

  const taskFilterOptions = useMemo(
    () => ['全部', '未解锁', '未发现', '已发现', '已完成', '简单', '中等', '困难', '地狱'],
    [],
  );
  const filteredTasks = useMemo(() => {
    if (taskFilter === '未解锁') {
      return TASK_COMPENDIUM_ENTRIES.filter((entry) => getTaskStatus(entry) === 'locked');
    }
    if (taskFilter === '未发现') {
      return TASK_COMPENDIUM_ENTRIES.filter((entry) => getTaskStatus(entry) === 'undiscovered');
    }
    if (taskFilter === '已发现') {
      return TASK_COMPENDIUM_ENTRIES.filter((entry) => getTaskStatus(entry) === 'discovered');
    }
    if (taskFilter === '已完成') {
      return TASK_COMPENDIUM_ENTRIES.filter((entry) => getTaskStatus(entry) === 'completed');
    }
    if (taskFilter !== '全部') {
      const difficultyMap: Record<string, string> = {
        简单: 'easy',
        中等: 'medium',
        困难: 'hard',
        地狱: 'hell',
      };

      return TASK_COMPENDIUM_ENTRIES.filter((entry) => entry.difficulty === difficultyMap[taskFilter]);
    }

    return TASK_COMPENDIUM_ENTRIES;
  }, [completedTasks, taskFilter, unlockedPlants, unlockedTasks]);

  const anyModal = modalEntry || (plantModalEntry && plantModalUnlocked) || (taskModalEntry && (taskModalStatus === 'discovered' || taskModalStatus === 'completed'));

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalId(null);
        setPlantModalId(null);
        setTaskModalId(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = anyModal ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [anyModal]);

  return (
    <section className={styles.page}>
      {/* 主 Tab 切换 */}
      <div className={styles.mainTabs}>
        <button
          type="button"
          className={`${styles.mainTab} ${activeTab === 'land' ? styles.mainTabActive : ''}`}
          onClick={() => setActiveTab('land')}
        >
          土地图鉴
        </button>
        <button
          type="button"
          className={`${styles.mainTab} ${activeTab === 'plant' ? styles.mainTabActive : ''}`}
          onClick={() => setActiveTab('plant')}
        >
          植物图鉴
        </button>
        <button
          type="button"
          className={`${styles.mainTab} ${activeTab === 'task' ? styles.mainTabActive : ''}`}
          onClick={() => setActiveTab('task')}
        >
          任务图鉴
        </button>
      </div>

      {/* ── 土地图鉴 ── */}
      {activeTab === 'land' && (
        <>
          <div className={styles.filters} role="tablist" aria-label="筛选土地图鉴">
            {filterOptions.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={activeFilter === option}
                className={`${styles.filterBtn} ${activeFilter === option ? styles.filterActive : ''}`}
                onClick={() => setActiveFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>

          {recentlyUnlocked.length > 0 && (
            <section className={styles.recentSection}>
              <h2 className={styles.recentTitle}>最近解锁</h2>
              <div className={styles.recentScroll}>
                {recentlyUnlocked.map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className={styles.recentChip}
                    onClick={() => setModalId(entry.id)}
                  >
                    <PixelCanvas
                      pixels={entry.pixels}
                      scale={2}
                      palette={LAND_PIXEL_PALETTE}
                      className={styles.recentIcon}
                      title={entry.name}
                    />
                    {entry.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className={styles.grid} aria-label="土地图鉴列表">
            {filteredEntries.map((entry) => (
              <LandAchievementCard
                key={entry.id}
                entry={entry}
                unlocked={unlockedRegions.includes(entry.regionId)}
                progressCurrent={(() => {
                  // 计算该土地对应区域的解锁条件：前置区域地块数量
                  const regionCfg = REGION_CONFIGS.find((r) => r.id === entry.regionId);
                  const prereqId = regionCfg?.prerequisiteRegionId;
                  if (!prereqId) return 0; // 初始开放区域，无需前置
                  // 统计前置区域的地块数量
                  return plots.filter((p) => p.regionId === prereqId).length;
                })()}
                progressTotal={(() => {
                  const regionCfg = REGION_CONFIGS.find((r) => r.id === entry.regionId);
                  if (!regionCfg?.prerequisiteRegionId) return 0;
                  return regionCfg.prerequisitePlotCount;
                })()}
                onOpen={setModalId}
              />
            ))}
          </section>
        </>
      )}

      {/* ── 植物图鉴 ── */}
      {activeTab === 'plant' && (
        <>
          <div className={styles.filters} role="tablist" aria-label="筛选植物图鉴">
            {plantFilterOptions.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={plantFilter === option}
                className={`${styles.filterBtn} ${plantFilter === option ? styles.filterActive : ''}`}
                onClick={() => setPlantFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <section className={styles.plantGrid} aria-label="植物图鉴列表">
            {filteredPlants.map((entry) => (
              <PlantCard
                key={entry.id}
                entry={entry}
                unlocked={unlockedPlants.includes(entry.id)}
                onOpen={setPlantModalId}
              />
            ))}
          </section>
        </>
      )}

      {activeTab === 'task' && (
        <>
          <div className={styles.filters} role="tablist" aria-label="筛选任务图鉴">
            {taskFilterOptions.map((option) => (
              <button
                key={option}
                type="button"
                role="tab"
                aria-selected={taskFilter === option}
                className={`${styles.filterBtn} ${taskFilter === option ? styles.filterActive : ''}`}
                onClick={() => setTaskFilter(option)}
              >
                {option}
              </button>
            ))}
          </div>

          <section className={styles.taskGrid} aria-label="任务图鉴列表">
            {filteredTasks.map((entry) => {
              const status = getTaskStatus(entry);

              return (
                <TaskCard
                  key={entry.id}
                  entry={entry}
                  status={status}
                  onOpen={setTaskModalId}
                />
              );
            })}
          </section>
        </>
      )}

      {/* ── 土地弹框 ── */}
      {modalEntry ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setModalId(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={`${modalEntry.name} 土地图鉴详情`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="关闭弹框"
              onClick={() => setModalId(null)}
            >
              X
            </button>
            <div className={styles.modalHead}>
              <div>
                <span>LAND ACHIEVEMENT</span>
                <h2>{modalEntry.name}</h2>
                <p>{modalEntry.summary}</p>
              </div>
              <strong className={unlockedRegions.includes(modalEntry.regionId) ? styles.statusUnlocked : ''}>
                {unlockedRegions.includes(modalEntry.regionId) ? '已解锁' : '已发现'}
              </strong>
            </div>
            <div className={styles.modalBody}>
              <PixelCanvas
                pixels={modalEntry.pixels}
                scale={16}
                palette={LAND_PIXEL_PALETTE}
                grid
                className={styles.modalCanvas}
                title={`${modalEntry.name} 土地像素画大图`}
              />
              <div className={styles.modalInfo}>
                <div className={styles.tags}>
                  {modalEntry.highlights.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
                <dl>
                  {modalEntry.details.map((row) => (
                    <div key={row.label}>
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── 植物弹框 ── */}
      {plantModalEntry && plantModalUnlocked ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setPlantModalId(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={`${plantModalEntry.name} 植物图鉴详情`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="关闭弹框"
              onClick={() => setPlantModalId(null)}
            >
              X
            </button>
            <div className={styles.modalHead}>
              <div>
                <span>PLANT COMPENDIUM</span>
                <h2>{plantModalEntry.name}</h2>
                <p>{plantModalEntry.summary}</p>
              </div>
              <div className={styles.plantModalBadges}>
                <span className={styles.plantRegionTag}>{plantModalEntry.bestSoilLabel}</span>
                {/* 详情弹框中展示解锁状态 */}
                <span className={unlockedPlants.includes(plantModalEntry.id) ? styles.statusUnlocked : styles.statusLocked}>
                  {unlockedPlants.includes(plantModalEntry.id) ? '已解锁' : '未解锁'}
                </span>
                {!unlockedPlants.includes(plantModalEntry.id) && plantModalEntry.unlockCost > 0 && plantModalEntry.unlockCost < 99999999 && (
                  <span className={styles.unlockCondition}>
                    解锁费用 {plantModalEntry.unlockCost} 金
                  </span>
                )}
                {!unlockedPlants.includes(plantModalEntry.id) && plantModalEntry.unlockCost >= 99999999 && (
                  <span className={styles.unlockCondition}>
                    珍稀植物（无法手动解锁）
                  </span>
                )}
              </div>
            </div>
            <div className={styles.plantModalStages}>
              {(['seed', 'sprout', 'grow', 'mature'] as const).map((stage) => (
                <div key={stage} className={styles.plantModalStageItem}>
                  <PixelCanvas
                    pixels={plantModalEntry.stages[stage]}
                    scale={8}
                    palette={PLANT_PIXEL_PALETTE}
                    grid
                    className={styles.plantModalCanvas}
                    title={`${plantModalEntry.name} ${PLANT_STAGE_LABELS[stage]}`}
                  />
                  <span>{PLANT_STAGE_LABELS[stage]}</span>
                </div>
              ))}
            </div>
            <div className={styles.modalInfo}>
              <div className={styles.tags}>
                {plantModalEntry.highlights.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <dl>
                {plantModalEntry.details.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      ) : null}

      {taskModalEntry && (taskModalStatus === 'discovered' || taskModalStatus === 'completed') ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={() => setTaskModalId(null)}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-label={`${taskModalEntry.title} 任务图鉴详情`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="关闭弹框"
              onClick={() => setTaskModalId(null)}
            >
              X
            </button>
            <div className={styles.modalHead}>
              <div>
                <span>TASK COMPENDIUM</span>
                <h2>{taskModalEntry.title}</h2>
                <p>{taskModalEntry.summary}</p>
              </div>
              <div className={styles.plantModalBadges}>
                <span className={taskModalStatus === 'completed' ? styles.statusCompleted : styles.statusUnlocked}>
                  {taskModalStatus === 'completed' ? '已完成' : '已发现'}
                </span>
                <span className={styles.unlockCondition}>
                  {taskModalEntry.isTimed ? '限时任务' : '不限时任务'}
                </span>
              </div>
            </div>
            <div className={styles.taskModalBody}>
              <div className={styles.tags}>
                {taskModalEntry.highlights.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <dl className={styles.taskDetailList}>
                {taskModalEntry.details.map((row) => (
                  <div key={row.label}>
                    <dt>{row.label}</dt>
                    <dd>{row.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
