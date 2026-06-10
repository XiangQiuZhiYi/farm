import './App.css';
import { useState } from 'react';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { PlotPanel } from './components/PlotPanel';
import { Shop } from './components/Shop';
import { Compendium } from './components/Compendium';
import { getTaskById } from './config/tasks';
import { getPlantById } from './config/plants';
import { useGameStore } from './store/gameStore';
import { REGION_CONFIGS } from './config/regions';
import { LAND_TYPE_CONFIGS } from './config/lands';

const MINUTES_PER_MONTH = 1440;

function getAbsoluteMonthIndex(totalMinutes: number) {
  return Math.floor(totalMinutes / MINUTES_PER_MONTH) + 1;
}

function formatGameYearMonthByAbsoluteMonth(absoluteMonth: number) {
  const year = Math.floor((absoluteMonth - 1) / 12) + 1;
  const month = ((absoluteMonth - 1) % 12) + 1;
  return `第 ${year} 年 ${month} 月`;
}

function formatRemainingMonths(expiresOnMonth: number | null, currentMonthIndex: number) {
  if (expiresOnMonth === null) return '不限时';
  return `剩余 ${Math.max(0, expiresOnMonth - currentMonthIndex + 1)} 个月`;
}

function TaskBoardModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'active' | 'offers'>('active');
  const clock = useGameStore((s) => s.clock);
  const inventory = useGameStore((s) => s.inventory);
  const taskBoard = useGameStore((s) => s.taskBoard);
  const acceptTask = useGameStore((s) => s.acceptTask);
  const submitActiveTask = useGameStore((s) => s.submitActiveTask);
  const currentAbsoluteMonth = getAbsoluteMonthIndex(clock.totalMinutes);

  const activeTaskDefinition = taskBoard.activeTask ? getTaskById(taskBoard.activeTask.taskId) : null;

  return (
    <div className="modalBackdrop" role="presentation" onClick={onClose}>
      <div className="modalBox taskBoardModal" role="dialog" aria-label="任务板" onClick={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <h2>任务板</h2>
          <button type="button" className="modalClose" onClick={onClose}>×</button>
        </div>

        <div className="taskBoardTabs" role="tablist" aria-label="任务板分页">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'active'}
            className={activeTab === 'active' ? 'taskBoardTab taskBoardTabActive' : 'taskBoardTab'}
            onClick={() => setActiveTab('active')}
          >
            已登记任务
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'offers'}
            className={activeTab === 'offers' ? 'taskBoardTab taskBoardTabActive' : 'taskBoardTab'}
            onClick={() => setActiveTab('offers')}
          >
            当前可选任务
          </button>
        </div>

        <div className="taskBoardBody">
          {activeTab === 'offers' ? (
          <section className="taskSection">
            <div className="taskSectionHead">
              <h3>当前可选任务</h3>
              <span>{taskBoard.currentOffers.length} / 2</span>
            </div>
            {taskBoard.currentOffers.length > 0 ? (
              <div className="taskOfferList">
                {taskBoard.currentOffers.map((offer) => {
                  const task = getTaskById(offer.taskId);
                  if (!task) return null;

                  return (
                    <article key={offer.taskId} className="taskOfferCard">
                      <div className="taskOfferHead">
                        <div>
                          <h4>{task.title}</h4>
                          <p>{task.isTimed ? `${task.timeLimitMonths} 个月限时` : '不限时任务'} / 奖励 {task.rewardGold} 金</p>
                        </div>
                        <span className={`taskDifficultyBadge taskDifficulty-${task.difficulty}`}>
                          {task.difficulty}
                        </span>
                      </div>
                      <ul className="taskRequirementList">
                        {task.requirements.map((requirement) => (
                          <li key={`${offer.taskId}-${requirement.plantId}`}>
                              <span>{getPlantById(requirement.plantId)?.name ?? requirement.plantId}</span>
                            <strong>× {requirement.quantity}</strong>
                          </li>
                        ))}
                      </ul>
                      <div className="taskOfferFooter">
                        <span>{formatRemainingMonths(offer.expiresOnMonth, currentAbsoluteMonth)}</span>
                        <button
                          type="button"
                          className="toolbarBtn toolbarBtnPrimary"
                          disabled={taskBoard.activeTask !== null}
                          onClick={() => acceptTask(offer.taskId)}
                        >
                          接取任务
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <p className="taskBoardEmpty">当前任务板没有可出现的任务。</p>
            )}
          </section>
          ) : (
          <section className="taskSection">
            <div className="taskSectionHead">
              <h3>已登记任务</h3>
              <span>{taskBoard.activeTask ? '进行中' : '空闲'}</span>
            </div>
            {taskBoard.activeTask && activeTaskDefinition ? (
              <article className="taskOfferCard taskOfferCardActive">
                <div className="taskOfferHead">
                  <div>
                    <h4>{activeTaskDefinition.title}</h4>
                    <p>
                      已接于 {formatGameYearMonthByAbsoluteMonth(taskBoard.activeTask.acceptedMonth)}
                      {' / '}
                      {formatRemainingMonths(taskBoard.activeTask.expiresOnMonth, currentAbsoluteMonth)}
                    </p>
                  </div>
                  <span className="taskStatusBadge">已登记</span>
                </div>
                <ul className="taskRequirementList">
                  {activeTaskDefinition.requirements.map((requirement) => {
                    const owned = inventory[requirement.plantId] ?? 0;
                    const enough = owned >= requirement.quantity;

                    return (
                      <li key={`${taskBoard.activeTask?.taskId}-${requirement.plantId}`}>
                        <span>{getPlantById(requirement.plantId)?.name ?? requirement.plantId}</span>
                        <strong className={enough ? 'taskEnough' : 'taskLack'}>
                          {owned} / {requirement.quantity}
                        </strong>
                      </li>
                    );
                  })}
                </ul>
                <div className="taskOfferFooter">
                  <span>完成奖励 {activeTaskDefinition.rewardGold} 金</span>
                  <button
                    type="button"
                    className="toolbarBtn toolbarBtnPrimary"
                    disabled={!activeTaskDefinition.requirements.every((requirement) => (inventory[requirement.plantId] ?? 0) >= requirement.quantity)}
                    onClick={() => submitActiveTask()}
                  >
                    一次性交付
                  </button>
                </div>
              </article>
            ) : (
              <p className="taskBoardEmpty">当前还没有登记任务，先从上面的候选任务中接取一条。</p>
            )}
          </section>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [expandOpen, setExpandOpen] = useState(false);
  const [taskBoardOpen, setTaskBoardOpen] = useState(false);
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
    <div className={sidebarCollapsed ? 'shell shellCollapsed' : 'shell'}>
      <aside className={sidebarCollapsed ? 'sidebar sidebarCollapsed' : 'sidebar'}>
        <div className="brand">
          <div className="brandRow">
            <div className="brandText">
              <span className="brandTitle">XIAOBAO</span>
              {!sidebarCollapsed ? <span className="brandSub">FIELD AGENT</span> : null}
            </div>
            <button
              type="button"
              className="sidebarToggle"
              aria-label={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}
              onClick={() => setSidebarCollapsed((value) => !value)}
            >
              {sidebarCollapsed ? '»' : '«'}
            </button>
          </div>
        </div>
        <nav className="sideNav" aria-label="页面切换">
          <button
            type="button"
            className={screen === 'game' ? 'navBtn active' : 'navBtn'}
            onClick={() => setScreen('game')}
          >
            <span className="navIcon">□</span>
            {!sidebarCollapsed ? '农场' : null}
          </button>
          <button
            type="button"
            className={screen === 'compendium' ? 'navBtn active' : 'navBtn'}
            onClick={() => setScreen('compendium')}
          >
            <span className="navIcon">☆</span>
            {!sidebarCollapsed ? '图鉴' : null}
          </button>
        </nav>
        <div className={sidebarCollapsed ? 'sidebarFooter sidebarFooterCollapsed' : 'sidebarFooter'}>
          <span>系统</span>
          <strong>运行中</strong>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{screen === 'game' ? 'FARM CONTROL' : 'ACHIEVEMENTS'}</p>
            <h1>{screen === 'game' ? '农场控制台' : '图鉴总览'}</h1>
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
              <button
                type="button"
                className="toolbarBtn"
                onClick={() => setTaskBoardOpen(true)}
              >
                📋 任务板
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

            {taskBoardOpen && (
              <TaskBoardModal onClose={() => setTaskBoardOpen(false)} />
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
