// ============================================================
// StatsPanel 组件：统计面板，展示种植/收获/售卖数据
// ============================================================

import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { ALL_PLANTS } from '../../config/plants';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
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

export function StatsPanel({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const stats = useGameStore((s) => s.stats);
  const economy = useGameStore((s) => s.economy);
  const compendium = useGameStore((s) => s.compendium);
  const plots = useGameStore((s) => s.plots);
  const unlockedRegions = useGameStore((s) => s.unlockedRegions);
  const unlockedPlants = useGameStore((s) => s.unlockedPlants);

  const totalHarvests = Object.values(stats.perPlantHarvests).reduce((a, b) => a + b, 0);
  const totalSells = Object.values(stats.perPlantSells).reduce((a, b) => a + b, 0);
  const totalRevenue = Object.values(stats.perPlantSellRevenue).reduce((a, b) => a + b, 0);
  const compendiumComplete = Object.values(compendium).filter(Boolean).length;

  // 植物分布数据
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

  // 收入趋势
  const incomeData = stats.dailyGoldHistory.map((d) => ({
    date: d.date.slice(5), // MM-DD
    gold: d.gold,
  }));

  const tabs: { key: TabType; label: string }[] = [
    { key: 'overview', label: '📊 概览' },
    { key: 'plants', label: '🌱 植物分布' },
    { key: 'income', label: '📈 收入趋势' },
  ];

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div className={styles.panel} role="dialog" aria-label="统计面板" onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>📊 统计面板</h2>
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
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {activeTab === 'overview' && (
            <div className={styles.overviewGrid}>
              <div className={styles.card}>
                <span className={styles.cardIcon}>🪓</span>
                <span className={styles.cardValue}>{totalHarvests}</span>
                <span className={styles.cardLabel}>累计收获</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardIcon}>💰</span>
                <span className={styles.cardValue}>{totalSells}</span>
                <span className={styles.cardLabel}>累计出售</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardIcon}>🏦</span>
                <span className={styles.cardValue}>{totalRevenue.toFixed(0)}</span>
                <span className={styles.cardLabel}>累计收入</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardIcon}>💎</span>
                <span className={styles.cardValue}>{economy.gold.toFixed(0)}</span>
                <span className={styles.cardLabel}>当前金币</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardIcon}>⏱️</span>
                <span className={styles.cardValue}>{formatPlayTime(stats.totalPlayTimeMinutes)}</span>
                <span className={styles.cardLabel}>游玩时间</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardIcon}>🌿</span>
                <span className={styles.cardValue}>{unlockedPlants.length}</span>
                <span className={styles.cardLabel}>已解锁植物</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardIcon}>📖</span>
                <span className={styles.cardValue}>{compendiumComplete}/{ALL_PLANTS.length}</span>
                <span className={styles.cardLabel}>图鉴完成</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardIcon}>🏔️</span>
                <span className={styles.cardValue}>{plots.length}</span>
                <span className={styles.cardLabel}>地块数量</span>
              </div>
              <div className={styles.card}>
                <span className={styles.cardIcon}>🗺️</span>
                <span className={styles.cardValue}>{unlockedRegions.length}</span>
                <span className={styles.cardLabel}>已解锁区域</span>
              </div>
            </div>
          )}

          {activeTab === 'plants' && (
            <div className={styles.chartsSection}>
              {plantPieData.length > 0 ? (
                <>
                  <h3>收获次数分布</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={plantPieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {plantPieData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>

                  {plantBarData.length > 0 && (
                    <>
                      <h3>出售收入 Top 10</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={plantBarData} layout="vertical" margin={{ left: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="name" width={55} />
                          <Tooltip formatter={(value) => [`${value} 金币`, '']} />
                          <Bar dataKey="revenue" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
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
              {incomeData.length > 0 ? (
                <>
                  <h3>近 30 天每日金币余额</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={incomeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} 金币`, '']} />
                      <Line
                        type="monotone"
                        dataKey="gold"
                        stroke="#4ade80"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <p className={styles.empty}>暂无收入数据，过一天后再来看看吧！</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}