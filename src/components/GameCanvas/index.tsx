// ============================================================
// GameCanvas 组件：挂载 Canvas + 启动游戏循环 + 处理点击
// 只渲染传入区域（regionId）的地块
// ============================================================

import { useEffect, useRef } from 'react';
import { renderGame, TILE_SIZE, TILE_GAP, COLS } from '../../canvas/renderer';
import { startGameLoop, stopGameLoop } from '../../systems/gameLoop';
import { useGameStore } from '../../store/gameStore';

interface GameCanvasProps {
  /** 当前展示的区域 id */
  regionId: string;
}

export function GameCanvas({ regionId }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const allPlots   = useGameStore((s) => s.plots);
  const selection  = useGameStore((s) => s.selection);
  const selectPlot = useGameStore((s) => s.selectPlot);
  const togglePlotSelection = useGameStore((s) => s.togglePlotSelection);
  const clearSelection = useGameStore((s) => s.clearSelection);

  // 只渲染当前区域的地块
  const plots = allPlots.filter((p) => p.regionId === regionId);

  // 启动游戏主循环（只需一次，区域切换不影响）
  useEffect(() => {
    startGameLoop();
    return () => stopGameLoop();
  }, []);

  // 每次 store 变化或区域切换都重绘
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderGame(canvas, plots, selection.selectedPlotId, selection.selectedPlotIds ?? []);
  });

  // 点击地块：Shift+点击多选，普通点击单选
  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx     = (e.clientX - rect.left) * scaleX;
    const my     = (e.clientY - rect.top)  * scaleY;

    for (let idx = 0; idx < plots.length; idx++) {
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const x = col * (TILE_SIZE + TILE_GAP);
      const y = row * (TILE_SIZE + TILE_GAP);
      if (mx >= x && mx <= x + TILE_SIZE && my >= y && my <= y + TILE_SIZE) {
        if (e.shiftKey) {
          // Shift+点击：切换多选
          togglePlotSelection(plots[idx].id);
        } else {
          // 普通点击：单选
          selectPlot(plots[idx].id);
        }
        return;
      }
    }
    // 点击空白处清除所有选中
    clearSelection();
  }

  // Canvas 尺寸：刚好容纳所有地块（无额外边距）
  const rows   = Math.ceil(plots.length / COLS);
  const width  = COLS  * (TILE_SIZE + TILE_GAP) - (TILE_GAP > 0 ? TILE_GAP : 0);
  const height = rows  * (TILE_SIZE + TILE_GAP) - (TILE_GAP > 0 ? TILE_GAP : 0);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
    />
  );
}
