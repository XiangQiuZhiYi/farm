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
  W: '#5fa8ff',  // 普通水面
  A: '#90cbf0',  // 水面反光（浅蓝）
  F: '#2d6090',  // 水深阴影（深蓝）
  S: '#412816',  // 深色土色边界
  R: '#7f5539',  // 田埂泥土
  B: '#9c6b43',  // 中深棕色
  C: '#b77b4f',  // 浅棕（由埂高光）
  L: '#c9a96a',  // 沙质
  M: '#7b8f6a',  // 沉稳绿
  G: '#4f8f4b',  // 绿色
  H: '#1f2b1e',  // 深绿
  D: '#1d140f',  // 极深色
};

// ── 布局常量（GameCanvas 与 renderer 共享） ─────────────────
/** 每块地像素大小：32字符 × 4px = 128px */
export const TILE_SIZE  = 128;
/** 地块间距为0：无缝拼接 */
export const TILE_GAP   = 0;
/** 每行最多地块数 */
export const COLS       = 6;
/** 画布外边距 */
export const PADDING    = 0;
/** 像素画每字符对应像素数 */
const PIXEL_SIZE = 4; // 128 / 32

/** 各土地类型的 3D 正面墙颜色（土壤颜色加深版） */
const LAND_FRONT_COLORS: Record<string, string> = {
  paddy_field: '#152532',  // 深蓝泥
  dry_land:    '#3c2008',  // 深沙棕
  brown_soil:  '#2e1406',  // 深棕土
  tidal_soil:  '#1e2a1e',  // 深湿土
  black_soil:  '#080604',  // 极深黑土
};

/** 有植物时底部土壤浅叠层（仅底部根部区域，不影响植物主体） */
const LAND_OVERLAY_COLORS: Record<string, string> = {
  paddy_field: 'rgba(8, 22, 40, 0.30)',
  dry_land:    'rgba(0, 0, 0, 0.25)',
  brown_soil:  'rgba(0, 0, 0, 0.25)',
  tidal_soil:  'rgba(0, 0, 0, 0.25)',
  black_soil:  'rgba(0, 0, 0, 0.22)',
};

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

    // ── 1b. 3D 抬高土台效果 ──────────────────────────────────
    // GND 行 = 像素画第 27 行 × 4px = 108px，是植物与土壤的分界
    const GROUND_PX = 27 * PIXEL_SIZE;
    const frontFaceY = y + GROUND_PX;
    const frontFaceH = TILE_SIZE - GROUND_PX; // 20px 正面墙

    // 正面墙：用各土地类型的深色版本，出现地层材质感
    const frontColor = LAND_FRONT_COLORS[plot.landTypeId] ?? '#120c06';
    ctx.fillStyle = frontColor;
    ctx.fillRect(x, frontFaceY, TILE_SIZE, frontFaceH);

    // 正面墙强化：下半更暗，模拟自带阴影
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.fillRect(x, frontFaceY + Math.floor(frontFaceH / 2), TILE_SIZE, frontFaceH - Math.floor(frontFaceH / 2));

    // 正面墙顶缘受光高光（表面棱角）
    ctx.fillStyle = 'rgba(255, 245, 200, 0.32)';
    ctx.fillRect(x, frontFaceY, TILE_SIZE, 2);

    // 土壤表面分界线（GROUND_PX - 4 处的高光）——明确區分上方空气与下方土壤
    ctx.fillStyle = 'rgba(220, 200, 160, 0.18)';
    ctx.fillRect(x, y + GROUND_PX - 4, TILE_SIZE, 4);

    // 左侧微亮边（模拟环境光）
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.fillRect(x, y, 3, TILE_SIZE);
    // 右侧阴影边
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(x + TILE_SIZE - 3, y, 3, TILE_SIZE);
    // 顶部受光高光
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fillRect(x, y, TILE_SIZE, 2);

    // 地块间分隔线
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
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

        // 仅在靠近 GND 的底部 8px 加轻微暗叠，让根部自然融入土壤，不影响植物主体
        const overlayCover = LAND_OVERLAY_COLORS[plot.landTypeId] ?? 'rgba(0,0,0,0.25)';
        ctx.fillStyle = overlayCover;
        ctx.fillRect(x, y + GROUND_PX - 8, TILE_SIZE, 8);

        // 土壤表面边缘高光（生长区与土壤的分界更清晰）
        ctx.fillStyle = 'rgba(200, 180, 140, 0.20)';
        ctx.fillRect(x, y + GROUND_PX - 4, TILE_SIZE, 2);

        if (plot.isWilted) {
          ctx.save();
          ctx.globalAlpha = 0.45;
          drawPixelArt(ctx, x, y, plantPixels, PLANT_PIXEL_PALETTE);
          ctx.restore();
          ctx.fillStyle = 'rgba(40, 0, 0, 0.38)';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
        } else {
          // 根部投影橢圆，加大加深让植物更有入土感
          ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
          ctx.beginPath();
          ctx.ellipse(x + TILE_SIZE / 2, y + GROUND_PX - 4, 30, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          // 根部投影内圈（更暗的核心）
          ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
          ctx.beginPath();
          ctx.ellipse(x + TILE_SIZE / 2, y + GROUND_PX - 4, 16, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          // 植物本体（GND 以下的根部行自然叠压在正面墙暗色区，产生入土感）
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

