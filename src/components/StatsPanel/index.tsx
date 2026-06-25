// ============================================================
// StatsPanel 组件：统计面板，展示种植/收获/售卖数据
// 作为与农场/图鉴同级的独立页面，进入时获取数据快照
// ============================================================

import { useMemo, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ALL_PLANTS } from '../../config/plants';
import { ACHIEVEMENT_CONFIGS } from '../../config/achievements';
import { TASK_BOARD_TASKS } from '../../config/tasks';
import { useECharts } from '../../hooks/useECharts';
import type { EChartsOption } from 'echarts';
import styles from './StatsPanel.module.css';

const COLORS = [
  '#4ade80', '#facc15', '#f87171', '#60a5fa', '#c084fc',
  '#fb923c', '#38bdf8', '#a3e635', '#e879f9', '#2dd4bf',
  '#f472b6', '#818cf8', '#fbbf24', '#34d399', '#fb7185',
];

type TabType = 'overview' | 'plants' | 'income';

function formatPlayTime(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)} 分钟`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(1)} 小时`;
  return `${(hours / 24).toFixed(1)} 天`;
}

interface StatsSnapshot {
  totalHarvests: number;
  totalSells: number;
  totalRevenue: number;
  gold: number;
  maxGold: number;
  totalPlayTimeMinutes: number;
  unlockedPlantsCount: number;
  compendiumComplete: number;
  plotsCount: number;
  unlockedRegionsCount: number;
  achievementsCompleted: number;
  tasksCompleted: number;
  plantPieData: { name: string; value: number }[];
  plantBarData: { name: string; revenue: number }[];
  incomeData: { date: string; gold: number }[];
  snapshotTime: number;
}

function takeSnapshot(): StatsSnapshot {
  const s = useGameStore.getState();
  const stats = s.stats;
  const economy = s.economy;
  const compendium = s.compendium;
  const plots = s.plots;
  const unlockedRegions = s.unlockedRegions;
  const unlockedPlants = s.unlockedPlants;

  const totalHarvests = Object.values(stats.perPlantHarvests).reduce((a, b) => a + b, 0);
  const totalSells = Object.values(stats.perPlantSells).reduce((a, b) => a + b, 0);
  const totalRevenue = Object.values(stats.perPlantSellRevenue).reduce((a, b) => a + b, 0);
  const compendiumComplete = Object.values(compendium).filter(Boolean).length;

  const plantPieData = Object.entries(stats.perPlantHarvests)
    .filter(([, count]) => count > 0)
    .map(([plantId, count]) => ({
      name: ALL_PLANTS.find((p) => p.id === plantId)?.name ?? plantId,
      value: count,
    }))
    .sort((a, b) => b.value - a.value);

  const plantBarData = Object.entries(stats.perPlantSellRevenue)
    .filter(([, revenue]) => revenue > 0)
    .map(([plantId, revenue]) => ({
      name: ALL_PLANTS.find((p) => p.id === plantId)?.name ?? plantId,
      revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const incomeData = stats.dailyGoldHistory.map((d) => ({
    date: d.date.slice(5),
    gold: d.gold,
  }));

  return {
    totalHarvests,
    totalSells,
    totalRevenue,
    gold: economy.gold,
    maxGold: stats.maxGold ?? economy.gold,
    totalPlayTimeMinutes: stats.totalPlayTimeMinutes,
    unlockedPlantsCount: unlockedPlants.length,
    compendiumComplete,
    plotsCount: plots.length,
    unlockedRegionsCount: unlockedRegions.length,
    achievementsCompleted: s.achievements.completed.length,
    tasksCompleted: s.completedTasks.length,
    plantPieData,
    plantBarData,
    incomeData,
    snapshotTime: Date.now(),
  };
}

export function StatsPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  // 进入页面时获取一次数据快照，不随 store 实时更新
  const [snapshot] = useState<StatsSnapshot>(() => takeSnapshot());

  return (
    <StatsPanelContent snapshot={snapshot} activeTab={activeTab} setActiveTab={setActiveTab} />
  );
}

function StatsPanelContent({
  snapshot: snap,
  activeTab,
  setActiveTab,
}: {
  snapshot: StatsSnapshot;
  activeTab: TabType;
  setActiveTab: (t: TabType) => void;
}) {
  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: '📊 概览' },
    { key: 'plants', label: '🌱 植物分布' },
    { key: 'income', label: '📈 收入趋势' },
  ];

  const snapshotDate = new Date(snap.snapshotTime);
  const snapshotStr = `${snapshotDate.getMonth() + 1}月${snapshotDate.getDate()}日 ${snapshotDate.getHours().toString().padStart(2, '0')}:${snapshotDate.getMinutes().toString().padStart(2, '0')}`;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h2>📊 统计面板</h2>
        <span className={styles.snapshotBadge}>快照时间：{snapshotStr}</span>
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
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {activeTab === 'overview' && (
          <div className={styles.overviewGrid}>
            <div className={styles.card}>
              <span className={styles.cardIcon}>🪓</span>
              <span className={styles.cardValue}>{snap.totalHarvests}</span>
              <span className={styles.cardLabel}>累计收获次数</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>💰</span>
              <span className={styles.cardValue}>{snap.totalSells}</span>
              <span className={styles.cardLabel}>累计出售次数</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>🏦</span>
              <span className={styles.cardValue}>{snap.totalRevenue.toFixed(0)}</span>
              <span className={styles.cardLabel}>累计收入</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>💎</span>
              <span className={styles.cardValue}>{snap.gold.toFixed(0)}</span>
              <span className={styles.cardLabel}>当前金币</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>⏱️</span>
              <span className={styles.cardValue}>{formatPlayTime(snap.totalPlayTimeMinutes)}</span>
              <span className={styles.cardLabel}>游玩时长</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>🌿</span>
              <span className={styles.cardValue}>{snap.unlockedPlantsCount}</span>
              <span className={styles.cardLabel}>已解锁植物</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>📖</span>
              <span className={styles.cardValue}>{snap.compendiumComplete}/{ALL_PLANTS.length}</span>
              <span className={styles.cardLabel}>图鉴完成</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>🏔️</span>
              <span className={styles.cardValue}>{snap.plotsCount}</span>
              <span className={styles.cardLabel}>地块数量</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>🗺️</span>
              <span className={styles.cardValue}>{snap.unlockedRegionsCount}</span>
              <span className={styles.cardLabel}>已解锁区域</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>🏆</span>
              <span className={styles.cardValue}>{snap.maxGold.toFixed(0)}</span>
              <span className={styles.cardLabel}>最高金币</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>🎖️</span>
              <span className={styles.cardValue}>{snap.achievementsCompleted}/{ACHIEVEMENT_CONFIGS.length}</span>
              <span className={styles.cardLabel}>成就完成</span>
            </div>
            <div className={styles.card}>
              <span className={styles.cardIcon}>✅</span>
              <span className={styles.cardValue}>{snap.tasksCompleted}/{TASK_BOARD_TASKS.length}</span>
              <span className={styles.cardLabel}>任务完成</span>
            </div>
          </div>
        )}

        {activeTab === 'plants' && (
          <div className={styles.chartsSection}>
            {snap.plantPieData.length > 0 ? (
              <>
                <h3>收获次数分布</h3>
                <PlantPieChart data={snap.plantPieData} />

                {snap.plantBarData.length > 0 && (
                  <>
                    <h3>出售收入 Top 10</h3>
                    <PlantBarChart data={snap.plantBarData} />
                  </>
                )}
              </>
            ) : (
              <p className={styles.empty}>暂无收获数据，快去种地吧！</p>
            )}
          </div>
        )}

        {activeTab === 'income' && (
          <div className={styles.chartsSection}>
            {snap.incomeData.length > 0 ? (
              <>
                <h3>近 30 天每日金币余额</h3>
                <IncomeChart data={snap.incomeData} />
              </>
            ) : (
              <p className={styles.empty}>暂无收入数据，过一天后再来看看吧！</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PlantPieChart({ data }: { data: StatsSnapshot['plantPieData'] }) {
  const option: EChartsOption = useMemo(() => ({
    color: COLORS,
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { type: 'scroll', bottom: 0 },
    series: [
      {
        type: 'pie',
        radius: ['35%', '70%'],
        center: ['50%', '45%'],
        data,
        label: { formatter: '{b} {d}%' },
      },
    ],
  }), [data]);
  const ref = useECharts<HTMLDivElement>(option, [option]);
  return <div ref={ref} style={{ width: '100%', height: 260 }} />;
}

function PlantBarChart({ data }: { data: StatsSnapshot['plantBarData'] }) {
  const option: EChartsOption = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v) => `${v} 金币` },
    grid: { left: 80, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', inverse: true, data: data.map((d) => d.name) },
    series: [
      {
        type: 'bar',
        data: data.map((d) => d.revenue),
        itemStyle: { color: '#fb923c', borderRadius: [0, 4, 4, 0] },
        barMaxWidth: 20,
        label: { show: true, position: 'right', formatter: '{c}' },
      },
    ],
  }), [data]);
  const ref = useECharts<HTMLDivElement>(option, [option]);
  return <div ref={ref} style={{ width: '100%', height: 260 }} />;
}

function IncomeChart({ data }: { data: StatsSnapshot['incomeData'] }) {
  const option: EChartsOption = useMemo(() => ({
    tooltip: { trigger: 'axis', valueFormatter: (v) => `${v} 金币` },
    grid: { left: 50, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: data.map((d) => d.date), boundaryGap: false },
    yAxis: { type: 'value' },
    series: [
      {
        type: 'line',
        data: data.map((d) => d.gold),
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#4ade80', width: 2 },
        itemStyle: { color: '#4ade80' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [
            { offset: 0, color: 'rgba(74,222,128,0.3)' },
            { offset: 1, color: 'rgba(74,222,128,0.02)' },
          ] },
        },
      },
    ],
  }), [data]);
  const ref = useECharts<HTMLDivElement>(option, [option]);
  return <div ref={ref} style={{ width: '100%', height: 280 }} />;
}