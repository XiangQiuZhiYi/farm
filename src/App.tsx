import './App.css';
import { useEffect, useRef, useState } from 'react';
import { HUD } from './components/HUD';
import { GameCanvas } from './components/GameCanvas';
import { PlotPanel } from './components/PlotPanel';
import { Shop } from './components/Shop';
import { Warehouse } from './components/Warehouse';
import { Compendium } from './components/Compendium';
import { getTaskById } from './config/tasks';
import { getPlantById } from './config/plants';
import { createDefaultPersistedState, createSandboxPersistedState, useGameStore } from './store/gameStore';
import type { SaveSlotSummary, SaveSlotType } from './types/save';
import {
  createSaveSlot,
  deleteSaveSlot,
  isElectronRuntime,
  listSaveSlots,
  loadSaveSlot,
  renameSaveSlot,
  setActiveSaveSlot,
  updateSaveSlot,
} from './services/saveClient';
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

function formatTimestamp(ts: number | null) {
  if (!ts) return '未保存';
  return new Date(ts).toLocaleString();
}

function makeSlotId(type: SaveSlotType) {
  return `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 返回今天 00:00:00 的本地 UTC 时间戳（毫秒），用作建档基准 */
function todayStartMs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

async function persistSlotFromStore(slot: SaveSlotSummary) {
  const store = useGameStore.getState();
  const now = Date.now();

  await updateSaveSlot({
    id: slot.id,
    name: slot.name,
    type: slot.type,
    createdAt: slot.createdAt,
    lastSavedAt: now,
    gameState: store.getPersistedState(),
  });

  useGameStore.getState().setSaveProfile({
    slotId: slot.id,
    slotName: slot.name,
    slotType: slot.type,
    createdAt: slot.createdAt,
    lastSavedAt: now,
  });
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

function SaveManagerModal(props: {
  open: boolean;
  loading: boolean;
  slots: SaveSlotSummary[];
  activeSlotId: string | null;
  onClose: () => void;
  onCreate: (type: SaveSlotType) => void;
  onSwitch: (slotId: string) => void;
  onDelete: (slotId: string) => void;
  onRename: (slotId: string, name: string) => void;
}) {
  const { open, loading, slots, activeSlotId, onClose, onCreate, onSwitch, onDelete, onRename } = props;
  // 每个档位的重命名输入状态： slotId -> { editing, value }
  const [renameState, setRenameState] = useState<Record<string, { editing: boolean; value: string }>>({});

  if (!open) return null;

  function startRename(slot: SaveSlotSummary) {
    setRenameState((prev) => ({
      ...prev,
      [slot.id]: { editing: true, value: slot.name },
    }));
  }

  function commitRename(slotId: string) {
    const entry = renameState[slotId];
    if (!entry) return;
    const trimmed = entry.value.trim();
    if (trimmed) {
      onRename(slotId, trimmed);
    }
    setRenameState((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }

  function cancelRename(slotId: string) {
    setRenameState((prev) => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
  }

  return (
    <div className="modalBackdrop" role="presentation" onClick={onClose}>
      <div className="modalBox saveModal" role="dialog" aria-label="存档管理" onClick={(event) => event.stopPropagation()}>
        <div className="modalHeader">
          <h2>存档管理</h2>
          <button type="button" className="modalClose" onClick={onClose}>×</button>
        </div>

        <div className="saveModalBody">
          {/* 新建存档区域 */}
          <div>
            <p className="saveSectionLabel">新建档位</p>
            <div className="saveCreateGroup">
              <button type="button" className="saveCreateCard" onClick={() => onCreate('real')}>
                <span className="saveCreateCardTitle">
                  <span style={{ color: '#8ce0a1' }}>●</span> 真实档
                </span>
                <span className="saveCreateCardDesc">时间 1:1 流逝，无法加速。适合正式体验。</span>
              </button>
              <button type="button" className="saveCreateCard" onClick={() => onCreate('test')}>
                <span className="saveCreateCardTitle">
                  <span style={{ color: '#f1b96d' }}>●</span> 测试档
                </span>
                <span className="saveCreateCardDesc">可自由调节时间倍率，适合快速测试。</span>
              </button>
              <button type="button" className="saveCreateCard saveCreateCardSandbox" onClick={() => onCreate('sandbox')}>
                <span className="saveCreateCardTitle">
                  <span style={{ color: '#c878ff' }}>●</span> 全解锁档
                </span>
                <span className="saveCreateCardDesc">10万金币、全部植物和地块已解锁、支持加速。适合自由探索。</span>
              </button>
            </div>
          </div>

          {/* 已有存档列表 */}
          <div>
            <p className="saveSectionLabel">已有档位</p>
            {loading ? (
              <p className="saveLoading">读取存档中...</p>
            ) : slots.length === 0 ? (
              <p className="saveEmpty">暂无存档，请先创建一个档位。</p>
            ) : (
              <ul className="saveList">
                {slots.map((slot) => {
                  const rs = renameState[slot.id];
                  const isActive = slot.id === activeSlotId;
                  return (
                    <li key={slot.id} className={isActive ? 'saveItem saveItemActive' : 'saveItem'}>
                      {/* 档位类型指示 */}
                      <div className="saveItemBadge">
                        <span className={`saveTypeDot ${slot.type}`} />
                        <span className="saveTypeLabel">{slot.type === 'real' ? '真实' : slot.type === 'sandbox' ? '全解锁' : '测试'}</span>
                      </div>

                      {/* 档位信息 */}
                      <div className="saveItemInfo">
                        <div className="saveItemNameRow">
                          {rs?.editing ? (
                            <input
                              className="saveRenameInput"
                              autoFocus
                              value={rs.value}
                              maxLength={40}
                              onChange={(e) =>
                                setRenameState((prev) => ({
                                  ...prev,
                                  [slot.id]: { ...prev[slot.id], value: e.target.value },
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename(slot.id);
                                if (e.key === 'Escape') cancelRename(slot.id);
                              }}
                            />
                          ) : (
                            <>
                              <p className="saveName">{slot.name}</p>
                              {isActive && <span className="saveActiveBadge">当前</span>}
                            </>
                          )}
                        </div>
                        <p className="saveMeta">
                          建档 {formatTimestamp(slot.createdAt)} &nbsp;·&nbsp; 保存 {formatTimestamp(slot.lastSavedAt)}
                        </p>
                      </div>

                      {/* 操作按钮 */}
                      <div className="saveButtons">
                        {rs?.editing ? (
                          <>
                            <button type="button" className="toolbarBtn toolbarBtnPrimary" onClick={() => commitRename(slot.id)}>确定</button>
                            <button type="button" className="toolbarBtn" onClick={() => cancelRename(slot.id)}>取消</button>
                          </>
                        ) : (
                          <>
                            <button type="button" className="toolbarBtn" onClick={() => onSwitch(slot.id)} disabled={isActive}>
                              {isActive ? '游戏中' : '切换'}
                            </button>
                            <button type="button" className="toolbarBtn" onClick={() => startRename(slot)}>重命名</button>
                            <button type="button" className="toolbarBtn" onClick={() => onDelete(slot.id)} disabled={isActive}>删除</button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 多选计数提示条：悬浮在农场画布上方，选 1 块时就显示 */
function MultiSelectHint() {
  const selection = useGameStore((s) => s.selection);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const openBatchPanel = useGameStore((s) => s.openBatchPanel);
  const count = (selection.selectedPlotIds ?? []).length;
  if (count === 0) return null;
  return (
    <div className="multiSelectHint">
      <span>已选 {count} 块地，继续 Shift+点击可多选</span>
      <div className="multiSelectActions">
        <button type="button" className="multiSelectOperate" onClick={openBatchPanel}>✔ 批量操作</button>
        <button type="button" className="multiSelectClear" onClick={clearSelection}>✕ 取消</button>
      </div>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState<'game' | 'compendium'>('game');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [shopOpen, setShopOpen] = useState(false);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [expandOpen, setExpandOpen] = useState(false);
  const [taskBoardOpen, setTaskBoardOpen] = useState(false);
  // 当前展示的农田区域
  const [activeRegion, setActiveRegion] = useState('region_paddy');

  const unlockedRegions = useGameStore((s) => s.unlockedRegions);
  const plots = useGameStore((s) => s.plots);
  const harvestAll = useGameStore((s) => s.harvestAll);
  const saveProfile = useGameStore((s) => s.saveProfile);
  const setSaveProfile = useGameStore((s) => s.setSaveProfile);
  const hydrateFromSnapshot = useGameStore((s) => s.hydrateFromSnapshot);
  const applyOfflineMinutes = useGameStore((s) => s.applyOfflineMinutes);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(true);
  const electronRuntime = isElectronRuntime();
  const pendingSaveRef = useRef<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSlots, setSaveSlots] = useState<SaveSlotSummary[]>([]);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);
  const saveBusyRef = useRef(false);

  // 区域标签配置
  const REGION_TABS = [
    { id: 'region_paddy',       label: '水稻土区',      icon: '🌾' },
    { id: 'region_brown_tidal', label: '褐土 / 潮土区', icon: '🌿' },
    { id: 'region_black',       label: '黑土区',        icon: '🌱' },
  ];

  async function refreshSaveIndex() {
    const index = await listSaveSlots();
    setSaveSlots(index.slots);
    setActiveSlotId(index.activeSlotId);
  }

  async function loadSlotIntoRuntime(slotId: string) {
    const slot = await loadSaveSlot(slotId);

    // 先恢复快照，再注入档位信息，确保切档时不残留旧状态。
    hydrateFromSnapshot(slot.gameState);
    setSaveProfile({
      slotId: slot.id,
      slotName: slot.name,
      slotType: slot.type,
      createdAt: slot.createdAt,
      lastSavedAt: slot.lastSavedAt,
    });

    // 读档时根据真实离线时长补算；真实档固定 1x，测试档沿用档内倍率。
    const now = Date.now();
    const offlineMinutes = Math.max(0, Math.floor((now - slot.lastSavedAt) / 60000));
    const multiplier = slot.type === 'real' ? 1 : slot.gameState.clock.timeScale;
    const appliedOfflineMinutes = offlineMinutes * multiplier;

    if (appliedOfflineMinutes > 0) {
      applyOfflineMinutes(appliedOfflineMinutes);
    }

    await updateSaveSlot({
      id: slot.id,
      name: slot.name,
      type: slot.type,
      createdAt: slot.createdAt,
      lastSavedAt: now,
      gameState: useGameStore.getState().getPersistedState(),
    });

    setSaveProfile({
      slotId: slot.id,
      slotName: slot.name,
      slotType: slot.type,
      createdAt: slot.createdAt,
      lastSavedAt: now,
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function initializeSaves() {
      if (!electronRuntime) {
        setSaveError('当前为 Web 运行环境，存档管理仅在 Electron 本地版可用。');
        setSaveLoading(false);
        return;
      }

      try {
        const index = await listSaveSlots();
        if (cancelled) return;

        setSaveSlots(index.slots);
        setActiveSlotId(index.activeSlotId);

        if (!index.activeSlotId) {
          setSaveModalOpen(true);
          return;
        }

        await loadSlotIntoRuntime(index.activeSlotId);
        if (cancelled) return;

        await refreshSaveIndex();
      } catch (error) {
        if (cancelled) return;
        setSaveError(error instanceof Error ? error.message : '存档初始化失败');
      } finally {
        if (!cancelled) {
          setSaveLoading(false);
        }
      }
    }

    initializeSaves();

    return () => {
      cancelled = true;
    };
  }, [applyOfflineMinutes, hydrateFromSnapshot, setSaveProfile]);

  useEffect(() => {
    if (!electronRuntime || !activeSlotId || saveLoading) return;

    const timer = window.setInterval(async () => {
      if (saveBusyRef.current) return;
      const slot = saveSlots.find((item) => item.id === activeSlotId);
      if (!slot) return;

      try {
        saveBusyRef.current = true;
        await persistSlotFromStore(slot);
        await refreshSaveIndex();
      } finally {
        saveBusyRef.current = false;
      }
    }, 8000);

    return () => {
      window.clearInterval(timer);
    };
  }, [activeSlotId, saveLoading, saveSlots]);

  useEffect(() => {
    if (!electronRuntime) return;

    const onBeforeUnload = () => {
      const current = saveSlots.find((item) => item.id === activeSlotId);
      if (!current) return;
      persistSlotFromStore(current).catch(() => {
        // 页面关闭时不阻塞 unload；失败会在下次启动时通过离线补算兜底。
      });
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [activeSlotId, saveSlots]);

  // 关键动作后触发 debounce 存档：监听金币和累计收益变化（涵盖 harvest/sell/buy/task）。
  // 2 秒无新变化后写盘，减少频繁 IO 同时保证关键数据及时持久化。
  useEffect(() => {
    if (!electronRuntime || !activeSlotId || saveLoading) return;

    const unsubscribe = useGameStore.subscribe((state, prevState) => {
      const changed =
        state.economy.gold !== prevState.economy.gold ||
        state.economy.cumulativeEarned !== prevState.economy.cumulativeEarned;
      if (!changed) return;

      if (pendingSaveRef.current) window.clearTimeout(pendingSaveRef.current);
      pendingSaveRef.current = window.setTimeout(() => {
        pendingSaveRef.current = null;
        const slot = saveSlots.find((item) => item.id === activeSlotId);
        if (!slot || saveBusyRef.current) return;
        persistSlotFromStore(slot).catch(() => {});
      }, 2000);
    });

    return () => {
      unsubscribe();
      if (pendingSaveRef.current) {
        window.clearTimeout(pendingSaveRef.current);
        pendingSaveRef.current = null;
      }
    };
  }, [activeSlotId, electronRuntime, saveLoading, saveSlots]);

  async function handleCreateSlot(type: SaveSlotType) {
    try {
      setSaveError(null);
      const now = Date.now();
      // sandbox 档使用全解锁初始层态；其他档使用默认层态
      const baseState = type === 'sandbox' ? createSandboxPersistedState() : createDefaultPersistedState();
      if (type === 'real') {
        baseState.clock.timeScale = 1;
      }

      // 建档时以当日 00:00 作为基准时间戳，便于后续离线时长计算对齐自然日边界。
      const createdAt = todayStartMs();
      const slot = {
        id: makeSlotId(type),
        name: `${type === 'real' ? '真实档' : '测试档'}-${new Date(createdAt).toLocaleDateString()}`,
        type,
        createdAt,
        lastSavedAt: now,
        gameState: baseState,
      };

      await createSaveSlot(slot);
      await setActiveSaveSlot(slot.id);
      await loadSlotIntoRuntime(slot.id);
      await refreshSaveIndex();
      setSaveModalOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '创建存档失败');
    }
  }

  async function handleSwitchSlot(slotId: string) {
    try {
      setSaveError(null);
      const current = saveSlots.find((item) => item.id === activeSlotId);
      if (current) {
        await persistSlotFromStore(current);
      }

      await setActiveSaveSlot(slotId);
      await loadSlotIntoRuntime(slotId);
      await refreshSaveIndex();
      setSaveModalOpen(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '切换存档失败');
    }
  }

  async function handleDeleteSlot(slotId: string) {
    if (!window.confirm('确定删除该存档吗？该操作不可恢复。')) return;
    try {
      setSaveError(null);
      await deleteSaveSlot(slotId);
      await refreshSaveIndex();
      if (slotId === activeSlotId) {
        setSaveModalOpen(true);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '删除存档失败');
    }
  }

  async function handleRenameSlot(slotId: string, name: string) {
    try {
      setSaveError(null);
      await renameSaveSlot(slotId, name);
      await refreshSaveIndex();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '重命名失败');
    }
  }

  return (
    <div className={sidebarCollapsed ? 'shell shellCollapsed' : 'shell'}>
      <aside className={sidebarCollapsed ? 'sidebar sidebarCollapsed' : 'sidebar'}>
        <div className="brand">
          <div className="brandRow">
            <div className="brandText">
              <span className="brandTitle">WILDERNESS</span>
              {!sidebarCollapsed ? <span className="brandSub">FARM</span> : null}
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
            <span>{screen === 'game' ? 'FIELD' : 'ARCHIVE'}</span>
            <strong>{saveProfile.slotName || '未选择档位'}</strong>
            <span>{saveProfile.slotType === 'real' ? '真实档' : '测试档'}</span>
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
                🛒 商店
              </button>
              <button
                type="button"
                className="toolbarBtn"
                onClick={() => setWarehouseOpen(true)}
              >
                📦 仓库
              </button>
              <button
                type="button"
                className="toolbarBtn"
                onClick={() => setTaskBoardOpen(true)}
              >
                📋 任务板
              </button>
              <button
                type="button"
                className="toolbarBtn"
                onClick={() => setSaveModalOpen(true)}
                disabled={saveLoading || !electronRuntime}
              >
                💾 存档
              </button>
            </div>

            {saveError ? <p className="saveErrorBanner">存档错误：{saveError}</p> : null}

            {/* 区域 Tab 切换 */}
            <div className="regionTabs" role="tablist" aria-label="选择农田区域">
              {REGION_TABS.map((tab) => {
                const locked   = !unlockedRegions.includes(tab.id);
                const plotCount = plots.filter((p) => p.regionId === tab.id).length;
                const readyCount = plots.filter((p) => p.regionId === tab.id && p.isReadyToHarvest).length;
                return (
                  <div key={tab.id} className="regionTabGroup">
                    <button
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
                    {!locked && (
                      <button
                        type="button"
                        className={`regionTabHarvestBtn${readyCount > 0 ? ' regionTabHarvestBtnReady' : ''}`}
                        disabled={readyCount === 0}
                        onClick={() => harvestAll(tab.id)}
                        title={readyCount > 0 ? `收获 ${readyCount} 块地` : '暂无可收获'}
                      >
                        🌾 一键收获{readyCount > 0 ? ` (${readyCount})` : ''}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <main className="main">
              {/* 多选计数提示：选 1+ 块时显示，≥2 块时面板弹出 */}
              <MultiSelectHint />
              {/* 只渲染当前激活区域的地块 */}
              <GameCanvas regionId={activeRegion} />
            </main>
            {/* 点击地块后弹出的操作面板（覆盖层） */}
            <PlotPanel />

            {/* 购买种子弹框 */}
            {shopOpen && (
              <div className="modalBackdrop" role="presentation" onClick={() => setShopOpen(false)}>
                <div className="modalBox" role="dialog" aria-label="商店" onClick={(e) => e.stopPropagation()}>
                  <div className="modalHeader">
                    <h2>商店</h2>
                    <button type="button" className="modalClose" onClick={() => setShopOpen(false)}>×</button>
                  </div>
                  <Shop />
                </div>
              </div>
            )}

            {warehouseOpen && (
              <div className="modalBackdrop" role="presentation" onClick={() => setWarehouseOpen(false)}>
                <div className="modalBox warehouseModal" role="dialog" aria-label="仓库" onClick={(e) => e.stopPropagation()}>
                  <div className="modalHeader">
                    <h2>仓库</h2>
                    <button type="button" className="modalClose" onClick={() => setWarehouseOpen(false)}>×</button>
                  </div>
                  <Warehouse />
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

            <SaveManagerModal
              open={saveModalOpen}
              loading={saveLoading}
              slots={saveSlots}
              activeSlotId={activeSlotId}
              onClose={() => setSaveModalOpen(false)}
              onCreate={handleCreateSlot}
              onSwitch={handleSwitchSlot}
              onDelete={handleDeleteSlot}
              onRename={handleRenameSlot}
            />
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
