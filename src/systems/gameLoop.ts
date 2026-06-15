// ============================================================
// 游戏主循环（requestAnimationFrame 驱动）
// 负责将按照 timeScale 推进游戏时钟，不直接渲染
//
// 修复：使用 Date.now() 计算 delta，确保锁屏/切后台期间的时间
//       在恢复后能被正确补算，不受 rAF 暂停影响。
// ============================================================

import { useGameStore } from '../store/gameStore';

/**
 * 每帧推进的真实毫秒数对应的游戏分钟数系数。
 * 1 倍速下，现实 1 天 = 1 游戏月。
 * 计算：1440 分钟 / 86400000 ms = 1/60000 游戏分钟/ms
 */
const REAL_MS_TO_GAME_MINUTES = 1 / 60000;

/** 单次 delta 上限（24 小时）：防止异常时间跳跃 */
const MAX_DELTA_MS = 86_400_000; // 24 小时

let lastRealTime: number | null = null;
let rafId: number | null = null;

function loop() {
  const now = Date.now();
  if (lastRealTime === null) {
    lastRealTime = now;
  }

  let deltaMs = now - lastRealTime;
  lastRealTime = now;

  // 限制单帧最大推进量，避免锁屏数小时导致作物瞬间成熟
  if (deltaMs > MAX_DELTA_MS) {
    deltaMs = MAX_DELTA_MS;
  }

  const { clock, tickMinutes } = useGameStore.getState();

  if (clock.running) {
    // 将真实经过毫秒换算为游戏分钟，乘以加速倍率
    const deltaGameMinutes = deltaMs * REAL_MS_TO_GAME_MINUTES * clock.timeScale;
    tickMinutes(deltaGameMinutes);
  }

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
