// ============================================================
// Canvas 渲染器：分层绘制土地像素画 + 植物像素画
// 每块地无间隙紧密排列，像素画 96×96（16字符 × 6px）
// ============================================================

import { getFertilizerById } from '../config/fertilizers';
import { getPlantById } from '../config/plants';
import { calcPlotGrowthStage } from '../systems/growthSystem';
import { getLandCompendiumEntry } from '../config/compendium/lands';
import { getPlantCompendiumEntry, PLANT_PIXEL_PALETTE } from '../config/compendium/plants';
import type { PlotState } from '../types/land';

/** 土地像素画调色板 */
const LAND_PIXEL_PALETTE: Record<string, string | null> = {
  '.': null,
  W: '#5fa8ff',
  R: '#7f5539',
  B: '#9c6b43',
  C: '#b77b4f',
  L: '#c9a96a',
  M: '#7b8f6a',
  G: '#4f8f4b',
  H: '#1f2b1e',
  D: '#1d140f',
};

// ── 布局常量（GameCanvas 与 renderer 共享） ─────────────────
/** 每块地像素大小：16字符 × 6px = 96px */
export const TILE_SIZE  = 96;
/** 地块间距为0：无缝拼接 */
export const TILE_GAP   = 0;
/** 每行最多地块数 */
export const COLS       = 6;
/** 画布外边距 */
export const PADDING    = 0;
/** 像素画每字符对应像素数 */
const PIXEL_SIZE = 6; // 96 / 16

function drawPlotStatusBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
) {
  ctx.fillStyle = 'rgba(2, 10, 10, 0.78)';
  ctx.fillRect(x + 4, y + 4, 42, 16);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 4.5, y + 4.5, 41, 15);
  ctx.fillStyle = color;
  ctx.font = '10px serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x + 8, y + 12);
}

/**
 * 将像素字符串数组按调色板绘制到 Canvas
 */
function drawPixelArt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  pixels: string[],
  palette: Record<string, string | null>,
) {
  pixels.forEach((row, py) => {
    for (let px = 0; px < row.length; px++) {
      const color = palette[row[px]];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + px * PIXEL_SIZE, y + py * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    }
  });
}

/**
 * 全量重绘 Canvas
 * @param canvas       目标 canvas 元素
 * @param plots        当前区域的地块列表
 * @param selectedId   选中地块 id（可为 null）
 */
export function renderGame(
  canvas: HTMLCanvasElement,
  plots: PlotState[],
  selectedId: string | null,
  multiSelectedIds?: string[],
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 背景：纯色深棕（被地块完全覆盖时不可见，仅用于兜底）
  ctx.fillStyle = '#2a1a0a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  plots.forEach((plot, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = col * TILE_SIZE;
    const y = row * TILE_SIZE;

    // ── 1. 土地像素画 ────────────────────────────────────────
    const landEntry = getLandCompendiumEntry(plot.landTypeId);
    if (landEntry) {
      drawPixelArt(ctx, x, y, landEntry.pixels, LAND_PIXEL_PALETTE);
    } else {
      ctx.fillStyle = '#5a7040';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
    }

    // 地块间分隔线（1px 暗色描边，让相邻格区分更清晰）
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.30)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);

    // ── 2. 植物像素画 ────────────────────────────────────────
    if (plot.plantedPlantId && plot.plantedAt !== null) {
      const plant = getPlantById(plot.plantedPlantId);
      const plantEntry = plant ? getPlantCompendiumEntry(plant.id) : null;

      if (plant && plantEntry) {
        let stage: keyof typeof plantEntry.stages = calcPlotGrowthStage(plot, plant);
        if (plot.isReadyToHarvest) stage = 'mature';
        const plantPixels = plantEntry.stages[stage];
        const fertilizer = plot.appliedFertilizerId ? getFertilizerById(plot.appliedFertilizerId) : null;

        // 耕土暗叠层：统一压暗土地纹理，提升植物像素的可读性
        ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
        ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

        if (plot.isWilted) {
          // 枯萎：半透明绘制植物，再叠加红色死亡效果
          ctx.save();
          ctx.globalAlpha = 0.45;
          drawPixelArt(ctx, x, y, plantPixels, PLANT_PIXEL_PALETTE);
          ctx.restore();
          ctx.fillStyle = 'rgba(40, 0, 0, 0.38)';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        } else {
          drawPixelArt(ctx, x, y, plantPixels, PLANT_PIXEL_PALETTE);
        }

        // 可收获：双层金色发光边框
        if (plot.isReadyToHarvest && !plot.isWilted) {
          ctx.strokeStyle = 'rgba(255, 224, 102, 0.40)';
          ctx.lineWidth = 5;
          ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
          ctx.strokeStyle = '#ffe066';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
        }

        drawPlotStatusBadge(
          ctx,
          x,
          y,
          fertilizer?.shortLabel ?? '无肥',
          fertilizer ? '#8ce0a1' : '#8ca198',
        );
      }
    }

    // ── 3. 选中高亮 ──────────────────────────────────────────
    if (selectedId === plot.id) {
      // 单选：黄色
      ctx.strokeStyle = 'rgba(255, 224, 102, 0.35)';
      ctx.lineWidth = 6;
      ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.strokeStyle = '#ffe066';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
    } else if (multiSelectedIds?.includes(plot.id)) {
      // 多选：蓝色
      ctx.strokeStyle = 'rgba(100, 180, 255, 0.35)';
      ctx.lineWidth = 6;
      ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.strokeStyle = '#64b4ff';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
    }
  });
}

