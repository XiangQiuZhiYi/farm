// ============================================================
// GameCanvas 组件：挂载 Canvas + 启动游戏循环 + 处理点击/拖动
// 只渲染传入区域（regionId）的地块
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { renderGame, TILE_SIZE, TILE_GAP, COLS } from '../../canvas/renderer';
import { startGameLoop, stopGameLoop } from '../../systems/gameLoop';
import { useGameStore } from '../../store/gameStore';
import type { RegionId } from '../../types/land';

interface GameCanvasProps {
  /** 当前展示的区域 id */
  regionId: RegionId;
}

interface DragState {
  startIndex: number;
  currentIndex: number;
  moved: boolean;
}

function getPlotIndexAtPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
  plotCount: number,
) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (clientX - rect.left) * scaleX;
  const my = (clientY - rect.top) * scaleY;

  for (let idx = 0; idx < plotCount; idx += 1) {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = col * (TILE_SIZE + TILE_GAP);
    const y = row * (TILE_SIZE + TILE_GAP);
    if (mx >= x && mx <= x + TILE_SIZE && my >= y && my <= y + TILE_SIZE) {
      return idx;
    }
  }

  return -1;
}

export function GameCanvas({ regionId }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const allPlots = useGameStore((s) => s.plots);
  const selection = useGameStore((s) => s.selection);
  const selectPlot = useGameStore((s) => s.selectPlot);
  const togglePlotSelection = useGameStore((s) => s.togglePlotSelection);
  const selectPlotGroup = useGameStore((s) => s.selectPlotGroup);
  const clearSelection = useGameStore((s) => s.clearSelection);
  const reorderPlotsInRegion = useGameStore((s) => s.reorderPlotsInRegion);

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

  function resetDragState() {
    dragStateRef.current = null;
    setIsDragging(false);
  }

  function handlePointerSelection(plotIndex: number, e: React.MouseEvent<HTMLCanvasElement>) {
    const targetPlot = plots[plotIndex];
    if (!targetPlot) return;

    const isMatchSelection = e.shiftKey && (e.ctrlKey || e.metaKey);
    if (isMatchSelection) {
      const matchedIds = plots
        .filter((plot) =>
          plot.landTypeId === targetPlot.landTypeId
          && (plot.plantedPlantId ?? null) === (targetPlot.plantedPlantId ?? null))
        .map((plot) => plot.id);
      selectPlotGroup(matchedIds);
      return;
    }

    if (e.shiftKey) {
      // Shift+点击：切换多选
      togglePlotSelection(targetPlot.id);
      return;
    }

    // 普通点击：单选
    selectPlot(targetPlot.id);
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (e.button !== 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const plotIndex = getPlotIndexAtPoint(canvas, e.clientX, e.clientY, plots.length);
    if (plotIndex < 0) return;

    dragStateRef.current = {
      startIndex: plotIndex,
      currentIndex: plotIndex,
      moved: false,
    };
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const dragState = dragStateRef.current;
    if (!canvas || !dragState) return;

    const plotIndex = getPlotIndexAtPoint(canvas, e.clientX, e.clientY, plots.length);
    if (plotIndex < 0 || plotIndex === dragState.currentIndex) return;

    dragState.currentIndex = plotIndex;
    if (plotIndex !== dragState.startIndex) {
      dragState.moved = true;
      setIsDragging(true);
    }
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const dragState = dragStateRef.current;
    if (!canvas || !dragState) return;

    const plotIndex = getPlotIndexAtPoint(canvas, e.clientX, e.clientY, plots.length);

    if (dragState.moved && plotIndex >= 0 && plotIndex !== dragState.startIndex) {
      reorderPlotsInRegion(regionId, dragState.startIndex, plotIndex);
      resetDragState();
      return;
    }

    if (plotIndex >= 0) {
      handlePointerSelection(plotIndex, e);
    } else if (!dragState.moved) {
      clearSelection();
    }

    resetDragState();
  }

  function handleMouseLeave() {
    if (!dragStateRef.current) return;
    resetDragState();
  }

  // Canvas 尺寸：刚好容纳所有地块（无额外边距）
  const rows = Math.ceil(plots.length / COLS);
  const width = COLS * (TILE_SIZE + TILE_GAP) - (TILE_GAP > 0 ? TILE_GAP : 0);
  const height = rows * (TILE_SIZE + TILE_GAP) - (TILE_GAP > 0 ? TILE_GAP : 0);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      title="拖动可调整地块顺序；Shift+点击可多选；Ctrl+Shift+点击可选中同属性地块"
    />
  );
}
