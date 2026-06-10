import './App.css';
import { useState } from 'react';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { PlotPanel } from './components/PlotPanel';
import { Shop } from './components/Shop';
import { Compendium } from './components/Compendium';
import { useGameStore } from './store/gameStore';
import { REGION_CONFIGS } from './config/regions';
import { LAND_TYPE_CONFIGS } from './config/lands';

/**
 * 扩建地块弹框：按区域展示当前地块数/上限/扩建价格
 */
function ExpandModal({ onClose }: { onClose: () => void }) {
  const economy = useGameStore((s) => s.economy);
  const plots = useGameStore((s) => s.plots);
  const unlockedRegions = useGameStore((s) => s.unlockedRegions);
  const expandPlot = useGameStore((s) => s.expandPlot);

  return (
    <div className="modalBackdrop" role="presentation" onClick={onClose}>
      <div className="modalBox" role="dialog" aria-label="扩建地块" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>扩建地块</h2>
          <button type="button" className="modalClose" onClick={onClose}>×</button>
        </div>
        <ul className="expandList">
          {REGION_CONFIGS.map((region) => {
            const locked = !unlockedRegions.includes(region.id);
            const current = plots.filter((p) => p.regionId === region.id).length;
            const full = current >= region.maxPlotCount;
            // 获取该区域下所有土地类型
            const landTypes = LAND_TYPE_CONFIGS.filter((l) => l.regionId === region.id);

            return (
              <li key={region.id} className={`expandItem ${locked ? 'expandLocked' : ''}`}>
                <div className="expandRegionHeader">
                  <span className="expandName">{region.name}</span>
                  <span className="expandCount">{current} / {region.maxPlotCount} 格</span>
                  {locked && (
                    <span className="expandStatus">未解锁（需累计收入 {region.unlockGold} 金）</span>
                  )}
                  {!locked && full && (
                    <span className="expandStatus">已达上限</span>
                  )}
                </div>
                {/* 每种土地类型单独一行，可选择购买 */}
                {!locked && !full && (
                  <ul className="expandLandList">
                    {landTypes.map((land) => (
                      <li key={land.id} className="expandLandItem">
                        <span className="expandLandName">{land.name}</span>
                        <span className="expandLandPrice">{land.expandPrice} 金/格</span>
                        <button
                          type="button"
                          className="expandBtn"
                          disabled={economy.gold < land.expandPrice}
                          onClick={() => expandPlot(region.id, land.id)}
                        >
                          扩建 +1
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <p className="expandGold">当前金币：{economy.gold.toFixed(0)} 金</p>
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState<'game' | 'compendium'>('game');
  const [shopOpen, setShopOpen] = useState(false);
  const [expandOpen, setExpandOpen] = useState(false);
  // 当前展示的农田区域
  const [activeRegion, setActiveRegion] = useState('region_paddy');

  const unlockedRegions = useGameStore((s) => s.unlockedRegions);
  const plots = useGameStore((s) => s.plots);

  // 区域标签配置
  const REGION_TABS = [
    { id: 'region_paddy',       label: '水稻土区',      icon: '🌾' },
    { id: 'region_brown_tidal', label: '褐土 / 潮土区', icon: '🌿' },
    { id: 'region_black',       label: '黑土区',        icon: '🌱' },
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brandTitle">XIAOBAO</span>
          <span className="brandSub">FIELD AGENT</span>
        </div>
        <nav className="sideNav" aria-label="页面切换">
          <button
            type="button"
            className={screen === 'game' ? 'navBtn active' : 'navBtn'}
            onClick={() => setScreen('game')}
          >
            <span className="navIcon">□</span>
            农场
          </button>
          <button
            type="button"
            className={screen === 'compendium' ? 'navBtn active' : 'navBtn'}
            onClick={() => setScreen('compendium')}
          >
            <span className="navIcon">☆</span>
            图鉴
          </button>
        </nav>
        <div className="sidebarFooter">
          <span>系统</span>
          <strong>运行中</strong>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{screen === 'game' ? 'FARM CONTROL' : 'ACHIEVEMENTS'}</p>
            <h1>{screen === 'game' ? '农场控制台' : '植物图鉴'}</h1>
          </div>
          <div className="topStatus">
            <span>MODE</span>
            <strong>{screen === 'game' ? 'FIELD' : 'ARCHIVE'}</strong>
          </div>
        </header>

        {screen === 'game' ? (
          <>
            <HUD />
            {/* 操作工具栏 */}
            <div className="gameToolbar">
              <button
                type="button"
                className="toolbarBtn"
                onClick={() => setExpandOpen(true)}
              >
                🌾 扩建地块
              </button>
              <button
                type="button"
                className="toolbarBtn toolbarBtnPrimary"
                onClick={() => setShopOpen(true)}
              >
                🛒 购买种子
              </button>
            </div>

            {/* 区域 Tab 切换 */}
            <div className="regionTabs" role="tablist" aria-label="选择农田区域">
              {REGION_TABS.map((tab) => {
                const locked   = !unlockedRegions.includes(tab.id);
                const plotCount = plots.filter((p) => p.regionId === tab.id).length;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeRegion === tab.id}
                    className={[
                      'regionTab',
                      activeRegion === tab.id ? 'regionTabActive' : '',
                      locked ? 'regionTabLocked' : '',
                    ].join(' ')}
                    disabled={locked}
                    onClick={() => setActiveRegion(tab.id)}
                  >
                    <span className="regionTabIcon">{tab.icon}</span>
                    <span className="regionTabLabel">{tab.label}</span>
                    {locked
                      ? <span className="regionTabBadge regionTabBadgeLocked">未解锁</span>
                      : <span className="regionTabBadge">{plotCount} 格</span>}
                  </button>
                );
              })}
            </div>

            <main className="main">
              {/* 只渲染当前激活区域的地块 */}
              <GameCanvas regionId={activeRegion} />
            </main>
            {/* 点击地块后弹出的操作面板（覆盖层） */}
            <PlotPanel />

            {/* 购买种子弹框 */}
            {shopOpen && (
              <div className="modalBackdrop" role="presentation" onClick={() => setShopOpen(false)}>
                <div className="modalBox" role="dialog" aria-label="购买种子" onClick={(e) => e.stopPropagation()}>
                  <div className="modalHeader">
                    <h2>种子商店</h2>
                    <button type="button" className="modalClose" onClick={() => setShopOpen(false)}>×</button>
                  </div>
                  <Shop />
                </div>
              </div>
            )}

            {/* 扩建地块弹框 */}
            {expandOpen && (
              <ExpandModal onClose={() => setExpandOpen(false)} />
            )}
          </>
        ) : (
          <main className="compendiumMain">
            <Compendium />
          </main>
        )}
      </section>
    </div>
  );
}

export default App;
