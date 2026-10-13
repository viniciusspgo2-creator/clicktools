/* ============================================================
   Motor de arte em canvas — desenha a arte na "folha" que
   envolve o corpo da caneca em projeção cilíndrica.

   Layout do canvas (flipY=true):
     linhas [0 .. printH)            → área de impressão (v: 1 → vBase)
     linhas [printH .. printH+S)     → cor-base exterior (alça, borda, pé)
     linhas [printH+S .. H)          → cor-base interior
   ============================================================ */

import * as THREE from 'three';
import {
  CANVAS_W_PREVIEW, STRIP_PX, MUG, PRINT_ARC_CM, PRINT_HEIGHT_CM, CIRC_CM, GAP_ANGLE, ARC_FRACTION,
} from './config';
import type { ArtState, MugState } from '../state/store';
import { getArtImage } from './art-registry';

/* ------------ ruído estável da revelação térmica (cache por tamanho) ------------ */

const noiseCache = new Map<string, Uint8Array>();

function magicNoise(w: number, h: number): Uint8Array {
  const key = `${w}x${h}`;
  const cached = noiseCache.get(key);
  if (cached) return cached;
  // ruído em blocos 4×4 suavizado — célula maior parece a mancha real do revestimento
  const data = new Uint8Array(w * h);
  const cw = Math.ceil(w / 4) + 1;
  const ch = Math.ceil(h / 4) + 1;
  const cell = new Float32Array(cw * ch);
  for (let i = 0; i < cell.length; i++) cell[i] = Math.random();
  for (let y = 0; y < h; y++) {
    const cy = y / 4;
    const y0 = Math.floor(cy);
    const fy = cy - y0;
    for (let x = 0; x < w; x++) {
      const cx = x / 4;
      const x0 = Math.floor(cx);
      const fx = cx - x0;
      const a = cell[y0 * cw + x0];
      const b = cell[y0 * cw + x0 + 1];
      const c = cell[(y0 + 1) * cw + x0];
      const d = cell[(y0 + 1) * cw + x0 + 1];
      const top = a + (b - a) * fx;
      const bottom = c + (d - c) * fx;
      data[y * w + x] = Math.round((top + (bottom - top) * fy) * 255);
    }
  }
  if (noiseCache.size > 4) noiseCache.clear();
  noiseCache.set(key, data);
  return data;
}

/**
 * Revelação térmica da caneca mágica: mistura cada pixel da folha entre a
 * arte revelada e o revestimento preto conforme calor × campo de gradiente + ruído.
 */
function applyMagicReveal(canvas: HTMLCanvasElement, printH: number, mug: MugState) {
  if (mug.magicHeat >= 0.995) return;
  const W = canvas.width;
  const ctx = canvas.getContext('2d')!;
  const heat = Math.max(0, mug.magicHeat);
  const dis = Math.max(0, Math.min(1, mug.magicDissolve));
  const dir = mug.magicDirection;
  const noise = magicNoise(W, printH);
  const img = ctx.getImageData(0, 0, W, printH);
  const px = img.data;
  const edge = 0.09 + dis * 0.5;
  const reach = 1.22; // margem para heat=1 revelar 100%
  const Cx = W / 2;
  const Cy = printH / 2;
  const Nr = Math.hypot(Cx, Cy);

  for (let y = 0; y < printH; y++) {
    const gy = y / printH;
    for (let x = 0; x < W; x++) {
      let g: number;
      if (dir === 'baixo') {
        g = 1 - gy; // y=0 é o TOPO da caneca (flipY) — revela de baixo para cima
      } else if (dir === 'lateral') {
        g = x / W;
      } else {
        g = Math.hypot(x - Cx, y - Cy) / Nr;
      }
      const field = g * (1 - dis) + (noise[y * W + x] / 255) * dis;
      let a = (heat * reach - field) / edge;
      if (a >= 1) continue;
      if (a < 0) a = 0;
      const i = (y * W + x) * 4;
      const k = 1 - a; // peso do revestimento preto
      px[i] = px[i] * a + 19 * k;
      px[i + 1] = px[i + 1] * a + 16 * k;
      px[i + 2] = px[i + 2] * a + 14 * k;
    }
  }
  ctx.putImageData(img, 0, 0);
}

export function canvasHeightFor(width: number): number {
  // o canvas cobre a volta COMPLETA (360°): px/cm = width / CIRC_CM
  const printH = Math.round((width * PRINT_HEIGHT_CM) / CIRC_CM);
  return printH + STRIP_PX * 2;
}

/** v mínimo da área de impressão (faixas ficam abaixo) */
export function printVBase(): number {
  return (STRIP_PX * 2) / canvasHeightFor(CANVAS_W_PREVIEW);
}

const UV_EPS = 0.004;

/**
 * Sobrescreve as UVs do corpo (LatheGeometry) para:
 *  - parede externa → u percorre a VOLTA INTEIRA de 360° (o vão da alça
 *    amostra uma região própria do canvas preenchida com a cor-base —
 *    nunca “vaza” a última coluna da arte);
 *  - borda/pé/fundo externo → faixa de cor exterior;
 *  - interior → faixa de cor interior.
 */
export function remapBodyUVs(geo: THREE.BufferGeometry) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  const total = Math.PI * 2;
  const start = Math.PI + GAP_ANGLE / 2; // gap centrado atrás (alça em -Z)
  const H = canvasHeightFor(CANVAS_W_PREVIEW);
  const printH = H - STRIP_PX * 2;
  const vBase = (STRIP_PX * 2) / H; // v da base da área de impressão
  const vExtMid = (H - printH - STRIP_PX / 2) / H;
  const vIntMid = (H - printH - STRIP_PX - STRIP_PX / 2) / H;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    let u: number, v: number;

    if (y > MUG.printTop + 0.04 || y < MUG.printBottom - 0.06) {
      // borda arredondada, pé, fundo externo → cor-base exterior
      u = 0.985;
      v = vExtMid;
    } else if (r < 3.93) {
      // parede/fundo internos → cor-base interior
      u = 0.985;
      v = vIntMid;
    } else {
      // parede externa → folha de impressão (u cobre os 360°)
      const a = Math.atan2(x, z); // 0 = +Z (frente da arte)
      let rel = (a - start) % total;
      if (rel < 0) rel += total;
      // 0..1 na volta inteira: o vão da alça cai no fim do canvas (cor-base)
      u = Math.min(1 - UV_EPS, Math.max(UV_EPS, rel / total));
      const vf = (y - MUG.printBottom) / (MUG.printTop - MUG.printBottom);
      v = vBase + Math.min(1, Math.max(0, vf)) * (1 - vBase) - UV_EPS * 0.5;
    }
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/**
 * Desenha a camada de texto do usuário (legenda/slogan) sobre a área.
 * W = largura do arco de impressão em px; printH = altura da área em px.
 */
function drawArtText(ctx: CanvasRenderingContext2D, W: number, printH: number, art: ArtState) {
  const text = (art.text ?? '').trim();
  if (!text) return;
  const px = Math.max(8, printH * Math.min(0.24, Math.max(0.04, art.textSize ?? 0.09)));
  ctx.save();
  ctx.font = `800 ${px}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = art.textColor || '#1d130d';
  const x = W / 2;
  const y = printH * (0.55 + Math.max(-1, Math.min(1, art.textY ?? 0)) * 0.42);
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Desenha a arte na área de impressão (printH linhas) do ctx, com os
 * ajustes do usuário (fit, escala, posição, rotação, espelho, repetir)
 * e a camada de texto. Usada pela folha de textura 3D e pela folha
 * planificada para sublimação. W aqui = largura do ARCO de impressão.
 */
export function drawArtIntoArea(ctx: CanvasRenderingContext2D, W: number, printH: number, art: ArtState) {
  const entry = getArtImage(art.imageId);

  if (entry) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const img = entry.source;
    const iw = entry.width;
    const ih = entry.height;
    const repeat = Math.max(1, Math.round(art.repeat));
    const slotW = W / repeat;

    let dw: number, dh: number;
    if (art.fit === 'stretch') {
      dw = slotW;
      dh = printH;
    } else if (art.fit === 'cover') {
      const s = Math.max(slotW / iw, printH / ih);
      dw = iw * s;
      dh = ih * s;
    } else {
      const s = Math.min(slotW / iw, printH / ih);
      dw = iw * s;
      dh = ih * s;
    }
    dw *= art.scale;
    dh *= art.scale;

    const phase = art.offsetX * W; // desloca em volta da caneca (com wrap)
    const cy = printH / 2 + art.offsetY * printH * 0.5;

    for (let i = 0; i < repeat; i++) {
      const cx = i * slotW + slotW / 2 + phase;
      for (const xo of [0, -W, W]) {
        ctx.save();
        ctx.translate(cx + xo, cy);
        ctx.rotate((art.rotation * Math.PI) / 180);
        ctx.scale(art.mirror ? -1 : 1, 1);
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
        ctx.restore();
      }
    }
  }

  drawArtText(ctx, W, printH, art);
}

/**
 * Desenha a arte na folha (canvas) conforme os ajustes do usuário.
 * O canvas cobre a volta completa: a arte fica confinada ao arco de
 * impressão e o vão da alça é preenchido com a cor-base (branco / preto
 * na mágica) — sem listras nem vazamento da última coluna.
 * Na caneca mágica aplica a revelação térmica sobre a área de impressão.
 */
export function renderArtCanvas(
  canvas: HTMLCanvasElement,
  art: ArtState,
  mug: MugState,
) {
  const W = canvas.width;
  const H = canvas.height;
  const S = STRIP_PX * (W / CANVAS_W_PREVIEW);
  const printH = H - S * 2;
  const arcW = Math.round(W * ARC_FRACTION);
  const ctx = canvas.getContext('2d')!;

  const isMagic = mug.variant === 'magic';
  const ext = isMagic ? '#141110' : '#ffffff';
  const interior = mug.variant === 'white' ? '#ffffff' : mug.accentColor;

  // faixas de cor-base (o vão da alça fica sempre com a cor exterior)
  ctx.fillStyle = ext;
  ctx.fillRect(0, 0, W, printH + S);
  ctx.fillStyle = interior;
  ctx.fillRect(0, printH + S, W, H - printH - S);

  // arte confinada ao arco de impressão (x: 0..arcW)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, arcW, printH);
  ctx.clip();
  drawArtIntoArea(ctx, arcW, printH, art);
  ctx.restore();

  if (isMagic) applyMagicReveal(canvas, printH, mug);
}

/** Cria a CanvasTexture com flags corretas de cor/filtragem */
export function makeArtTexture(canvas: HTMLCanvasElement, maxAniso: number): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = Math.min(8, maxAniso);
  tex.flipY = true;
  return tex;
}

/** DPI efetivo da arte na área de impressão (≈ 20,7 cm de arco) */
export function computeDpi(art: ArtState): number | null {
  const entry = getArtImage(art.imageId);
  if (!entry) return null;
  const printH = printHFor();
  const arcPx = Math.round(CANVAS_W_PREVIEW * ARC_FRACTION);
  const slotW = arcPx / Math.max(1, Math.round(art.repeat));
  const iw = entry.naturalWidth;
  const ih = entry.naturalHeight;
  let printedPx: number;
  if (art.fit === 'stretch') printedPx = slotW;
  else if (art.fit === 'cover') printedPx = Math.max(slotW, (iw * printH) / ih);
  else printedPx = Math.min(slotW, (iw * printH) / ih);
  const printedCm = Math.min(PRINT_ARC_CM, printedPx * (PRINT_ARC_CM / arcPx)) * art.scale;
  if (printedCm <= 0.01) return null;
  return iw / (printedCm / 2.54);
}

function printHFor(): number {
  return Math.round((CANVAS_W_PREVIEW * PRINT_HEIGHT_CM) / CIRC_CM);
}
