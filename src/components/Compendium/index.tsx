import { useEffect, useMemo, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { LAND_COMPENDIUM_ENTRIES, type LandCompendiumEntry } from '../../config/compendium/lands';
import {
  PLANT_COMPENDIUM_ENTRIES,
  PLANT_PIXEL_PALETTE,
  type PlantCompendiumEntry,
} from '../../config/compendium/plants';
import type { LandTypeId } from '../../types/land';
import styles from './Compendium.module.css';

const LAND_PIXEL_PALETTE: Record<string, string | null> = {
  '.': null,
  W: '#5fa8ff',
  R: '#7f5539',
  B: '#9c6b43',
  C: '#b77b4f',
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
  onOpen,
}: {
  entry: LandCompendiumEntry;
  unlocked: boolean;
  onOpen: (id: LandTypeId) => void;
}) {
  const progress = unlocked ? 100 : 42;
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
            <span>目标 {target}</span>
          </div>
        </div>
        <p className={styles.cardText}>{entry.summary}</p>
        <div className={styles.condition}>计入条件</div>
        <div className={styles.progressRow}>
          <div className={styles.progressTrack}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <span>{unlocked ? '100 / 100' : '42 / 100'}</span>
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
  return (
    <button
      type="button"
      className={`${styles.plantCard} ${unlocked ? '' : styles.plantCardLocked}`}
      onClick={() => onOpen(entry.id)}
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
            <span>{PLANT_STAGE_LABELS[stage]}</span>
          </div>
        ))}
      </div>
      <div className={styles.plantCardInfo}>
        <div className={styles.plantCardHead}>
          <h3>{entry.name}</h3>
          <div className={styles.plantCardBadges}>
            <span className={styles.plantRegionTag}>{entry.bestSoilLabel}</span>
            {/* 解锁状态徽章 */}
            <span className={unlocked ? styles.statusUnlocked : styles.statusLocked}>
              {unlocked ? '已解锁' : '未解锁'}
            </span>
          </div>
        </div>
        <p className={styles.cardText}>{entry.summary}</p>
        {/* 未解锁时显示解锁条件 */}
        {!unlocked && entry.unlockCumulativeGold > 0 && (
          <p className={styles.plantUnlockHint}>
            累计收入达 {entry.unlockCumulativeGold} 金 即可解锁
          </p>
        )}
      </div>
    </button>
  );
}

export function Compendium() {
  const unlockedRegions = useGameStore((s) => s.unlockedRegions);
  const unlockedPlants = useGameStore((s) => s.unlockedPlants);
  const [activeTab, setActiveTab] = useState<'land' | 'plant'>('land');
  const [modalId, setModalId] = useState<LandTypeId | null>(null);
  const [plantModalId, setPlantModalId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('全部');
  const [plantFilter, setPlantFilter] = useState('全部');

  const modalEntry = useMemo(
    () => LAND_COMPENDIUM_ENTRIES.find((entry) => entry.id === modalId) ?? null,
    [modalId],
  );
  const plantModalEntry = useMemo(
    () => PLANT_COMPENDIUM_ENTRIES.find((entry) => entry.id === plantModalId) ?? null,
    [plantModalId],
  );

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

  const anyModal = modalEntry || plantModalEntry;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setModalId(null);
        setPlantModalId(null);
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
      <div className={styles.scanline} />
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
      {plantModalEntry ? (
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
                {!unlockedPlants.includes(plantModalEntry.id) && plantModalEntry.unlockCumulativeGold > 0 && (
                  <span className={styles.unlockCondition}>
                    需累计收入 {plantModalEntry.unlockCumulativeGold} 金
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
    </section>
  );
}
