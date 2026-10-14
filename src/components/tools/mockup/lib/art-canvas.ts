/* ============================================================
   Motor de arte em canvas — desenha a arte na "folha" que
   envolve o corpo da caneca em projeção cilíndrica.

   Layout do canvas (flipY=true):
     linhas [0 .. printH)            → área de impressão (v: 1 → vBase)
     linhas [printH .. printH+S)     → cor-base exterior (alça, borda, pé)
     linhas [printH+S .. H)          → cor-base interior

   A área de impressão é PARAMETRIZÁVEL (prensa / altura cheia /
   forno 360° / personalizada) e os UVs ganham um inset que impede
   o "bleed" da filtragem bilinear+mip na fronteira arte/cor-base —
   a arte sai limpa, sem bordas ou marcações estranhas.
   ============================================================ */

import * as THREE from 'three';
import {
  CANVAS_W_PREVIEW, STRIP_PX, MUG, CIRC_CM, UV_PAD_PX,
  resolvePrintArea, type PrintArea,
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

export function canvasHeightFor(width: number, area?: PrintArea): number {
  // o canvas cobre a volta COMPLETA (360°): px/cm = width / CIRC_CM
  const a = area ?? resolvePrintArea({});
  const printH = Math.round((width * a.heightCm) / CIRC_CM);
  return printH + STRIP_PX * 2;
}

/** v mínimo da área de impressão (faixas ficam abaixo) */
export function printVBase(area?: PrintArea): number {
  const a = area ?? resolvePrintArea({});
  return (STRIP_PX * 2) / canvasHeightFor(CANVAS_W_PREVIEW, a);
}

const UV_EPS = 0.004;

/**
 * Sobrescreve as UVs do corpo (LatheGeometry) para:
 *  - parede externa → u percorre o ARCO DE IMPRESSÃO da área ativa com INSET
 *    anti-bleed (a filtragem nunca mistura a arte com a cor-base);
 *  - borda/pé/fundo externo → faixa de cor exterior;
 *  - interior → faixa de cor interior.
 * O vão da alça amostra uma região própria preenchida com a cor-base.
 */
export function remapBodyUVs(geo: THREE.BufferGeometry, area?: PrintArea) {
  const a = area ?? resolvePrintArea({});
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = new Float32Array(pos.count * 2);
  const total = Math.PI * 2;
  const gapAngle = (a.gapCm / CIRC_CM) * total;
  const arcAngle = total - gapAngle;
  const start = Math.PI + gapAngle / 2; // gap centrado atrás (alça em -Z)
  const H = canvasHeightFor(CANVAS_W_PREVIEW, a);
  const printH = H - STRIP_PX * 2;
  const vBase = (STRIP_PX * 2) / H; // v da base da área de impressão
  const vExtMid = (H - printH - STRIP_PX / 2) / H;
  const vIntMid = (H - printH - STRIP_PX - STRIP_PX / 2) / H;

  const arcFrac = a.arcCm / CIRC_CM;
  // inset em unidades de textura (4 px) — mata o bleed na fronteira
  const padU = UV_PAD_PX / CANVAS_W_PREVIEW;
  const padV = UV_PAD_PX / H;
  const vLo = vBase + padV;
  const vHi = 1 - padV;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.sqrt(x * x + z * z);
    let u: number, v: number;

    // tolerância milimétrica: os anéis da geometria ficam a ±0,011 cm das
    // fronteiras — a transição arte → cor-base tem menos de 0,1 mm (navalha)
    if (y > a.printTop + 0.008 || y < a.printBottom - 0.008) {
      // borda arredondada, pé, fundo externo → cor-base exterior
      u = 0.988;
      v = vExtMid;
    } else if (r < 3.93) {
      // parede/fundo internos → cor-base interior
      u = 0.988;
      v = vIntMid;
    } else {
      // parede externa → folha de impressão
      const ang = Math.atan2(x, z); // 0 = +Z (frente da arte)
      let rel = (ang - start) % total;
      if (rel < 0) rel += total;
      if (rel <= arcAngle) {
        // dentro do arco impresso → amostra a arte com inset nas duas pontas
        const k = rel / arcAngle;
        u = padU + k * (arcFrac - 2 * padU);
      } else {
        // vão da alça → cor-base
        u = Math.min(1 - UV_EPS, arcFrac + ((rel - arcAngle) / total));
      }
      const vf = (y - a.printBottom) / (a.printTop - a.printBottom);
      v = vLo + Math.min(1, Math.max(0, vf)) * (vHi - vLo);
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
 *
 * `wrapW` = período da volta COMPLETA (360°) em px do canvas. As cópias
 * de continuidade (a arte que “sai” de um lado reaparece do outro depois
 * de uma volta inteira) são desenhadas nesse período — nunca no período
 * do arco: com o período errado as cópias invadiam a área visível e
 * criavam as listras/faixas duplicadas perto das bordas da arte.
 * `wrapW = 0` desliga as cópias (folha plana de impressão).
 */
export function drawArtIntoArea(
  ctx: CanvasRenderingContext2D,
  W: number,
  printH: number,
  art: ArtState,
  wrapW?: number,
) {
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

    const wrap = Math.max(0, wrapW ?? W); // volta completa em px (0 = sem cópias)
    const phase = art.offsetX * W; // desloca em volta da caneca (com wrap)
    const cy = printH / 2 + art.offsetY * printH * 0.5;

    for (let i = 0; i < repeat; i++) {
      const cx = i * slotW + slotW / 2 + phase;
      // cópias de continuidade PRIMEIRO, cópia principal por último —
      // em zoom extremo (arte maior que a volta) a principal domina
      for (const xo of wrap > 0 ? [-wrap, wrap, 0] : [0]) {
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
 * impressão da área ativa e o vão da alça é preenchido com a cor-base —
 * sem listras nem vazamento da última coluna.
 * Na caneca mágica aplica a revelação térmica sobre a área de impressão.
 */
export function renderArtCanvas(
  canvas: HTMLCanvasElement,
  art: ArtState,
  mug: MugState,
  area?: PrintArea,
) {
  const a = area ?? resolvePrintArea(art);
  const W = canvas.width;
  const H = canvas.height;
  const S = STRIP_PX * (W / CANVAS_W_PREVIEW);
  const printH = H - S * 2;
  const arcW = Math.round(W * (a.arcCm / CIRC_CM));
  const ctx = canvas.getContext('2d')!;

  const isMagic = mug.variant === 'magic';
  const ext = isMagic ? '#141110' : '#ffffff';
  const interior = mug.variant === 'white' ? '#ffffff' : mug.accentColor;

  // faixas de cor-base (o vão da alça fica sempre com a cor exterior)
  ctx.fillStyle = ext;
  ctx.fillRect(0, 0, W, printH + S);
  ctx.fillStyle = interior;
  ctx.fillRect(0, printH + S, W, H - printH - S);

  // arte confinada ao arco de impressão (x: 0..arcW); o wrap usa a volta
  // COMPLETA do canvas (W) — nunca o arco — para não criar listras nas bordas
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, arcW, printH);
  ctx.clip();
  drawArtIntoArea(ctx, arcW, printH, art, W);
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
  tex.anisotropy = Math.min(16, maxAniso);
  tex.flipY = true;
  return tex;
}

/** DPI efetivo da arte na área de impressão ativa */
export function computeDpi(art: ArtState, area?: PrintArea): number | null {
  const entry = getArtImage(art.imageId);
  if (!entry) return null;
  const a = area ?? resolvePrintArea(art);
  const printH = Math.round((CANVAS_W_PREVIEW * a.heightCm) / CIRC_CM);
  const arcPx = Math.round(CANVAS_W_PREVIEW * (a.arcCm / CIRC_CM));
  const slotW = arcPx / Math.max(1, Math.round(art.repeat));
  const iw = entry.naturalWidth;
  const ih = entry.naturalHeight;
  let printedPx: number;
  if (art.fit === 'stretch') printedPx = slotW;
  else if (art.fit === 'cover') printedPx = Math.max(slotW, (iw * printH) / ih);
  else printedPx = Math.min(slotW, (iw * printH) / ih);
  const printedCm = Math.min(a.arcCm, printedPx * (a.arcCm / arcPx)) * art.scale;
  if (printedCm <= 0.01) return null;
  return iw / (printedCm / 2.54);
}

/**
 * Escala exata para a arte preencher a altura (ou a largura) da área,
 * respeitando o modo de encaixe atual — usada pelos botões rápidos do painel.
 */
export function computeFitScale(
  art: ArtState,
  target: 'height' | 'width',
  area?: PrintArea,
): number | null {
  const entry = getArtImage(art.imageId);
  if (!entry) return null;
  const a = area ?? resolvePrintArea(art);
  const printH = Math.round((CANVAS_W_PREVIEW * a.heightCm) / CIRC_CM);
  const arcPx = Math.round(CANVAS_W_PREVIEW * (a.arcCm / CIRC_CM));
  const slotW = arcPx / Math.max(1, Math.round(art.repeat));
  const iw = entry.width;
  const ih = entry.height;
  if (iw <= 0 || ih <= 0) return null;
  if (art.fit === 'stretch') return 1; // esticado já preenche os dois eixos
  const s = art.fit === 'cover'
    ? Math.max(slotW / iw, printH / ih)
    : Math.min(slotW / iw, printH / ih);
  const dwBase = iw * s;
  const dhBase = ih * s;
  const k = target === 'height' ? printH / dhBase : slotW / dwBase;
  return Math.max(0.1, Math.min(3, art.scale * k));
}
