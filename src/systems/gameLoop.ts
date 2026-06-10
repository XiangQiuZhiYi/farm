// ============================================================
// 游戏主循环（requestAnimationFrame 驱动）
// 负责按照 timeScale 推进游戏时钟，不直接渲染
// ============================================================

import { useGameStore } from '../store/gameStore';

/** 每帧推进的真实毫秒数对应的游戏分钟数系数（1 realSec = 1 gameSec） */
const REAL_MS_TO_GAME_MINUTES = 1 / 1000 / 60; // 1 ms = 1/60000 游戏分钟

let lastTimestamp: number | null = null;
let rafId: number | null = null;

function loop(ts: number) {
  if (lastTimestamp === null) {
    lastTimestamp = ts;
  }

  const deltaMs = ts - lastTimestamp;
  lastTimestamp = ts;

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
    lastTimestamp = null;
  }
}
