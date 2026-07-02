// ============================================================
// 游戏主循环（requestAnimationFrame 驱动）
// 负责按真实时间推进游戏时钟，不直接渲染
//
// 修复：使用 Date.now() 计算 delta，确保锁屏/切后台期间的时间
//       在恢复后能被正确补算，不受 rAF 暂停影响。
// ============================================================

import { useGameStore } from '../store/gameStore';

/**
 * 每帧推进的真实毫秒数对应的游戏分钟数系数。
 * 1 倍速下，现实 1 天 = 1 游戏天 = 1440 游戏分钟。
 * 计算：1440 分钟 / 86400000 ms = 1/60000 游戏分钟/ms
 */
const REAL_MS_TO_GAME_MINUTES = 1 / 60000;

let lastRealTime: number | null = null;
let rafId: number | null = null;

function loop() {
  const now = Date.now();
  if (lastRealTime === null) {
    lastRealTime = now;
  }

  let deltaMs = now - lastRealTime;
  if (deltaMs < 0) {
    deltaMs = 0;
  }
  lastRealTime = now;

  const { clock, tickMinutes } = useGameStore.getState();

  if (clock.running) {
    // 游戏时钟始终按真实时间 1:1 推进，timeScale 仅影响植物生长速度
    const deltaGameMinutes = deltaMs * REAL_MS_TO_GAME_MINUTES;
    tickMinutes(deltaGameMinutes);
  }

  // 天气按真实时间推进，不受游戏倍速/暂停影响
  useGameStore.getState()._tickWeather(now);

  // 限时任务按真实时间过期，不受游戏倍速/暂停影响
  useGameStore.getState()._tickTaskExpiry();

  rafId = requestAnimationFrame(loop);
}

/** 启动游戏主循环 */
export function startGameLoop() {
  if (rafId !== null) return; // 防止重复启动
  rafId = requestAnimationFrame(loop);
}

/** 停止游戏主循环（页面卸载时调用） */
export function stopGameLoop() {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
    lastRealTime = null;
  }
}

/** 锁屏/切后台恢复后重置主循环时间锚点，避免下一帧重复补算。 */
export function resetLoopTimeAnchor(atMs: number = Date.now()) {
  lastRealTime = atMs;
}
