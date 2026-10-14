/* ============================================================
   Estado central do Mockup Studio — Zustand + undo/redo
   ============================================================ */

'use client';

import { create } from 'zustand';
import {
  BODY_MAX_R, FLOAT_LIFT, MUG_FULL_R, MUG_GAP_MIN, PEDESTAL_H,
  type AreaMode, type FloorType,
} from '../lib/config';

export interface ArtState {
  imageId: string | null;
  name: string;
  width: number; // px naturais
  height: number;
  scale: number; // 0.1..3
  offsetX: number; // -1..1 (wrap em volta da caneca)
  offsetY: number; // -1..1
  rotation: number; // -180..180
  mirror: boolean;
  fit: 'cover' | 'contain' | 'stretch';
  repeat: number; // 1..4
  /** tamanho da área de impressão na caneca (prensa / altura cheia / forno / custom) */
  areaMode: AreaMode;
  areaW: number; // cm — largura do arco (modo custom)
  areaH: number; // cm — altura da área (modo custom)
  /** camada de texto (ideia de editor concorrente, implementada ao nosso jeito) */
  text: string;
  textColor: string;
  textSize: number; // fração da altura da área (0.04..0.24)
  textY: number; // -1..1
}

export interface MugState {
  variant: 'white' | 'accent' | 'magic';
  accentColor: string; // alça e interior (nas mágicas também)
  magicHeat: number; // 0..1 — 0 = fria (preta) · 1 = quente (arte revelada)
  magicDirection: 'baixo' | 'lateral' | 'radial'; // de onde a revelação começa
  magicDissolve: number; // 0..1 — 0 = linha reta · 1 = dissolução total
  rotationY: number; // graus — gira a caneca (não a câmera)
  tiltX: number; // graus -35..35 (inclina p/ frente/trás)
  tiltZ: number; // graus -30..30 (inclina p/ esquerda/direita)
  scale: number; // 0.6..1.4
  posY: number; // cm -1..2
}

export interface LightState {
  preset: string;
  intensity: number; // multiplicador 0.2..2
  temperature: number; // offset em K aplicado via absoluto? usa valor direto -2000..+2000
  rotation: number; // 0..360 gira o rig
  softness: number; // 0..1 suavidade da sombra
  envIntensity: number; // 0..2 reflexos do estúdio
}

export interface BackgroundState {
  type: 'studio-white' | 'studio-dark' | 'gradient' | 'solid' | 'image' | 'transparent';
  colorA: string;
  colorB: string;
  angle: number; // 0..360
  contactShadow: boolean;
  castShadow: boolean;
  /** tipo de chão — padrão: contínuo (sem borda) */
  floor: FloorType;
  /** brilho suave atrás da caneca (look premium) — desligado por padrão */
  glow: boolean;
  /** animação leve de sobe-e-desce (só preview; exportações saem paradas) */
  floatAnim: boolean;
  /* ---- imagem de fundo ---- */
  imageId: string | null;
  imageFit: 'cover' | 'contain' | 'stretch';
  imageZoom: number; // 0.5..3
  imageX: number; // -1..1
  imageY: number; // -1..1
  imageRot: number; // -180..180
  imageMirror: boolean;
  imageBlur: number; // 0..20 px
  imageBright: number; // 0.5..1.6
  /** tinge o ambiente com a cor média da foto */
  matchLight: boolean;
}

export interface CameraState {
  lens: number; // 24..100 mm
  autoRotate: boolean;
  autoRotateSpeed: number; // 0.2..6
}

/** caneca acompanhante para cenas com várias canecas (máx. 3) */
export interface CompanionMug {
  id: string;
  variant: 'white' | 'accent' | 'magic';
  accentColor: string;
  magicHeat: number; // 0..1 (só variante mágica)
  showArt: boolean; // usa a mesma arte da caneca principal
  rotationY: number; // graus
  posX: number; // cm -18..18
  posZ: number; // cm -14..14
  scale: number; // 0.65..1.35
}

/** pós-processamento — grading, bloom, vinheta e granulado */
export interface FxState {
  enabled: boolean;
  lut: 'none' | 'vivo' | 'quente' | 'frio' | 'cinema' | 'pb';
  exposure: number; // 0.5..1.8
  contrast: number; // -0.5..0.5
  saturation: number; // -1..1
  temperature: number; // -1..1
  vignette: number; // 0..1
  bloom: number; // 0..1
  grain: number; // 0..1
}

export interface WatermarkState {
  enabled: boolean;
  text: string;
  position: 'tl' | 'tr' | 'bl' | 'br';
  opacity: number; // 0.1..1
  size: number; // fração da largura 0.02..0.06
}

export type VideoAnim = 'giro' | 'orbita' | 'zoom' | 'revelacao';

export interface VideoState {
  anim: VideoAnim;
  duration: number; // 3..10 s
  fps: 24 | 30;
  res: 'sq1080' | 'hd' | 'vertical' | 'wide';
}

export interface GifState {
  anim: VideoAnim;
  duration: number; // 2..8 s
  fps: 10 | 15 | 20;
  width: 360 | 480 | 640;
}

export interface ExportState {
  ratioId: string;
  customW: number;
  customH: number;
  scale: 1 | 2 | 3 | 4;
  format: 'png' | 'jpeg' | 'webp';
  quality: number; // 0.5..1
  transparent: boolean;
}

export interface CameraPresetRequest {
  pos: [number, number, number];
  target: [number, number, number];
  nonce: number;
}

type Snapshot = {
  art: ArtState;
  mug: MugState;
  light: LightState;
  bg: BackgroundState;
  companions: CompanionMug[];
  fx: FxState;
  camera: CameraState;
};

export type PatchSlice = 'art' | 'mug' | 'light' | 'bg' | 'camera' | 'fx' | 'watermark' | 'video' | 'gif';

interface MockupStore {
  projectName: string;
  art: ArtState;
  mug: MugState;
  light: LightState;
  bg: BackgroundState;
  camera: CameraState;
  exportSettings: ExportState;
  companions: CompanionMug[];
  fx: FxState;
  watermark: WatermarkState;
  video: VideoState;
  gif: GifState;
  presetRequest: CameraPresetRequest | null;
  focusNonce: number;
  artAppliedNonce: number; // microinteração ao aplicar arte
  exportOpen: boolean;
  projectsOpen: boolean;
  /** modo "ajustar fundo no 3D" (arrasta a imagem de fundo direto na cena) */
  bgAdjustMode: boolean;
  /** guias de enquadramento (grade de terços) */
  showGuides: boolean;
  /** incrementado quando uma posição foi ajustada para canecas não se sobreporem */
  collisionNonce: number;
  /** incrementado para pedir "Enquadrar tudo" na câmera */
  fitNonce: number;
  // histórico
  past: Snapshot[];
  future: Snapshot[];
  // ações
  setProjectName: (n: string) => void;
  patch: <K extends PatchSlice>(slice: K, partial: Partial<MockupStore[K]>) => void;
  setArtImage: (meta: { imageId: string; name: string; width: number; height: number }) => void;
  clearArt: () => void;
  notifyArtApplied: () => void;
  rotateMug: (deg: number) => void;
  applyCameraPreset: (p: { pos: [number, number, number]; target: [number, number, number] }) => void;
  requestFocus: () => void;
  setExportOpen: (v: boolean) => void;
  setExport: (partial: Partial<ExportState>) => void;
  addCompanion: () => void;
  patchCompanion: (id: string, partial: Partial<CompanionMug>) => void;
  removeCompanion: (id: string) => void;
  arrangeScene: (kind: 'duo' | 'trio' | 'quarto' | 'vitrine' | 'solo') => void;
  spreadEvenly: () => void;
  frameAll: () => void;
  setBgAdjustMode: (v: boolean) => void;
  setShowGuides: (v: boolean) => void;
  setProjectsOpen: (v: boolean) => void;
  hydrate: (s: { projectName?: string; art?: Partial<ArtState>; mug?: Partial<MugState>; light?: Partial<LightState>; bg?: Partial<BackgroundState>; camera?: Partial<CameraState>; exportSettings?: Partial<ExportState>; companions?: CompanionMug[]; fx?: Partial<FxState>; watermark?: Partial<WatermarkState>; video?: Partial<VideoState>; gif?: Partial<GifState> }) => void;
  undo: () => void;
  redo: () => void;
  resetAll: () => void;
}

const initialArt: ArtState = {
  imageId: null,
  name: '',
  width: 0,
  height: 0,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  mirror: false,
  fit: 'cover',
  repeat: 1,
  areaMode: 'padrao',
  areaW: 20.7,
  areaH: 8.7,
  text: '',
  textColor: '#1d130d',
  textSize: 0.09,
  textY: 0.15,
};

const initialMug: MugState = {
  variant: 'white',
  accentColor: '#1d130d',
  magicHeat: 0.85,
  magicDirection: 'baixo',
  magicDissolve: 0.35,
  rotationY: 0,
  tiltX: 0,
  tiltZ: 0,
  scale: 1,
  posY: 0,
};

const initialLight: LightState = {
  preset: 'suave',
  intensity: 1,
  temperature: 0,
  rotation: 0,
  softness: 0.5,
  envIntensity: 1,
};

const initialBg: BackgroundState = {
  type: 'studio-white',
  colorA: '#e8703a',
  colorB: '#161210',
  angle: 90,
  contactShadow: true,
  castShadow: true,
  floor: 'continuo',
  glow: false,
  floatAnim: false,
  imageId: null,
  imageFit: 'cover',
  imageZoom: 1,
  imageX: 0,
  imageY: 0,
  imageRot: 0,
  imageMirror: false,
  imageBlur: 0,
  imageBright: 1,
  matchLight: false,
};

const initialCamera: CameraState = {
  lens: 50,
  autoRotate: false,
  autoRotateSpeed: 1.6,
};

const initialFx: FxState = {
  enabled: false,
  lut: 'none',
  exposure: 1,
  contrast: 0,
  saturation: 0,
  temperature: 0,
  vignette: 0,
  bloom: 0,
  grain: 0,
};

const initialWatermark: WatermarkState = {
  enabled: false,
  text: 'Feito no Mockup Studio · Click & Gruda',
  position: 'br',
  opacity: 0.7,
  size: 0.028,
};

const initialVideo: VideoState = {
  anim: 'giro',
  duration: 5,
  fps: 30,
  res: 'sq1080',
};

const initialGif: GifState = {
  anim: 'giro',
  duration: 4,
  fps: 15,
  width: 480,
};

/* ============ Encaixe sem sobreposição (T2) ============ */

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const round2 = (v: number) => Math.round(v * 100) / 100;

/** direção mundial da alça no plano XZ (graus, atan2(z, x)) — rotY como no mug.tsx */
function handleDirDeg(rotationY: number): number {
  const rad = (rotationY * Math.PI) / 180;
  return (Math.atan2(-Math.cos(rad), Math.sin(rad)) * 180) / Math.PI;
}

/** raio efetivo de uma caneca NA DIREÇÃO do outro objeto (a alça ocupa um setor ±55°) */
function effRadius(rotationY: number, scale: number, angleToDeg: number): number {
  const hd = handleDirDeg(rotationY);
  const d = Math.abs(((angleToDeg - hd + 540) % 360) - 180); // 0..180
  const rBody = BODY_MAX_R * scale;
  return d <= 55 ? Math.max(rBody, MUG_FULL_R * scale) : rBody;
}

function minDistBetween(
  a: { rotationY: number; scale: number; posX: number; posZ: number },
  b: { rotationY: number; scale: number; posX: number; posZ: number },
): number {
  const angA = (Math.atan2(b.posZ - a.posZ, b.posX - a.posX) * 180) / Math.PI;
  return effRadius(a.rotationY, a.scale, angA) + effRadius(b.rotationY, b.scale, angA + 180) + MUG_GAP_MIN;
}

interface Posed {
  posX: number;
  posZ: number;
  rotationY: number;
  scale: number;
}

/**
 * Empurra as canecas acompanhantes até nenhuma encostar na principal
 * (em 0,0) nem entre si — respeitando a alça em qualquer rotação.
 */
function resolveOverlaps(
  list: CompanionMug[],
  hero: { rotationY: number; scale: number },
): { list: CompanionMug[]; moved: boolean } {
  const arr = list.map((c) => ({ ...c }));
  let moved = false;

  for (let iter = 0; iter < 24; iter++) {
    let touched = false;

    for (let i = 0; i < arr.length; i++) {
      const c = arr[i];
      // vs caneca principal
      const dist = Math.hypot(c.posX, c.posZ);
      const need = minDistBetween(
        { ...hero, posX: 0, posZ: 0 },
        c as Posed,
      );
      if (dist < need - 0.01) {
        const a = dist > 0.001 ? Math.atan2(c.posZ, c.posX) : Math.PI / 2;
        arr[i] = { ...c, posX: round2(Math.cos(a) * need), posZ: round2(Math.sin(a) * need) };
        touched = true;
      }
      // vs outras acompanhantes
      for (let j = i + 1; j < arr.length; j++) {
        const o = arr[j];
        const dd = Math.hypot(o.posX - arr[i].posX, o.posZ - arr[i].posZ);
        const need2 = minDistBetween(arr[i] as Posed, o as Posed);
        if (dd < need2 - 0.01) {
          const a = dd > 0.001 ? Math.atan2(o.posZ - arr[i].posZ, o.posX - arr[i].posX) : 0.7;
          const push = (need2 - dd) / 2 + 0.06;
          arr[i] = {
            ...arr[i],
            posX: round2(arr[i].posX - Math.cos(a) * push),
            posZ: round2(arr[i].posZ - Math.sin(a) * push),
          };
          arr[j] = {
            ...o,
            posX: round2(o.posX + Math.cos(a) * push),
            posZ: round2(o.posZ + Math.sin(a) * push),
          };
          touched = true;
        }
      }
    }

    if (!touched) break;
    moved = true;
  }

  const limited = arr.map((c) => ({
    ...c,
    posX: clamp(c.posX, -18, 18),
    posZ: clamp(c.posZ, -14, 14),
  }));
  return { list: limited, moved };
}

let companionSeq = 0;
export function makeCompanion(partial?: Partial<CompanionMug>): CompanionMug {
  return {
    id: `comp_${Date.now()}_${++companionSeq}`,
    variant: 'accent',
    accentColor: '#e8703a',
    magicHeat: 0.85,
    showArt: true,
    rotationY: -25,
    posX: 10.8,
    posZ: 0.6,
    scale: 0.95,
    ...partial,
  };
}

/**
 * Arranjos prontos — posições calculadas para NUNCA encostar nem
 * atravessar em qualquer rotação (alças apontam para fora do grupo).
 */
export const ARRANGEMENTS: Record<string, ReturnType<typeof makeCompanion>[]> = {
  duo: [makeCompanion({ posX: 10.8, posZ: 0.6, rotationY: 90, scale: 0.98 })],
  trio: [
    makeCompanion({ posX: -10.8, posZ: 0.8, rotationY: -90, scale: 0.94 }),
    makeCompanion({ posX: 10.8, posZ: 0.8, rotationY: 90, scale: 0.94, variant: 'white' }),
  ],
  quarto: [
    makeCompanion({ posX: -10.6, posZ: 3.4, rotationY: -115, scale: 0.92 }),
    makeCompanion({ posX: 10.6, posZ: 3.4, rotationY: 115, scale: 0.92, variant: 'white' }),
    makeCompanion({ posX: 0, posZ: -12.4, rotationY: 0, scale: 0.9, variant: 'magic', accentColor: '#8b2f1d' }),
  ],
  vitrine: [
    makeCompanion({ posX: -12.2, posZ: 2.2, rotationY: -125, scale: 0.9 }),
    makeCompanion({ posX: 12.2, posZ: 2.2, rotationY: 125, scale: 0.9, variant: 'white' }),
    makeCompanion({ posX: 0, posZ: -12.8, rotationY: 0, scale: 0.86, variant: 'magic', accentColor: '#1f4d3f' }),
  ],
};

const initialExport: ExportState = {
  ratioId: 'sq',
  customW: 1080,
  customH: 1080,
  scale: 2,
  format: 'png',
  quality: 0.92,
  transparent: false,
};

const HISTORY_LIMIT = 60;
let commitTimer: ReturnType<typeof setTimeout> | null = null;

function snap(s: MockupStore): Snapshot {
  return { art: s.art, mug: s.mug, light: s.light, bg: s.bg, companions: s.companions, fx: s.fx, camera: s.camera };
}

export const useMockupStore = create<MockupStore>((set, get) => {
  /** agenda coalescência do histórico (um snapshot por rajada de mudanças) */
  const scheduleCommit = () => {
    if (commitTimer) clearTimeout(commitTimer);
    commitTimer = setTimeout(() => {
      commitTimer = null;
    }, 500);
  };

  /** guarda snapshot ANTES da rajada (uma vez) */
  const guardHistory = () => {
    const s = get();
    if (!commitTimer) {
      const past = [...s.past, snap(s)].slice(-HISTORY_LIMIT);
      set({ past, future: [] } as Partial<MockupStore>);
    }
    scheduleCommit();
  };

  return {
    projectName: 'Mockup sem título',
    art: initialArt,
    mug: initialMug,
    light: initialLight,
    bg: initialBg,
    camera: initialCamera,
    exportSettings: initialExport,
    companions: [],
    fx: initialFx,
    watermark: initialWatermark,
    video: initialVideo,
    gif: initialGif,
    presetRequest: null,
    focusNonce: 0,
    artAppliedNonce: 0,
    exportOpen: false,
    projectsOpen: false,
    bgAdjustMode: false,
    showGuides: false,
    collisionNonce: 0,
    fitNonce: 0,
    past: [],
    future: [],

    setProjectName: (n) => set({ projectName: n }),

    patch: (slice, partial) => {
      guardHistory();
      const current = get()[slice] as unknown as Record<string, unknown>;
      const next = { ...current, ...(partial as Record<string, unknown>) };
      set({ [slice]: next } as unknown as Partial<MockupStore>);

      // ao girar/escalar a caneca principal, garante que nenhuma acompanhante fique sobreposta
      if (slice === 'mug' && ('rotationY' in partial || 'scale' in partial)) {
        const st = get();
        if (st.companions.length) {
          const res = resolveOverlaps(st.companions, { rotationY: st.mug.rotationY, scale: st.mug.scale });
          if (res.moved) set({ companions: res.list, collisionNonce: st.collisionNonce + 1 });
        }
      }
    },

    setArtImage: (meta) => {
      get().patch('art', {
        imageId: meta.imageId,
        name: meta.name,
        width: meta.width,
        height: meta.height,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        mirror: false,
        repeat: 1,
        // toda arte inserida PREENCHE a área inteira (topo a base, como o
        // modelo de referência) — sem espaço branco; ajustável nos controles
        fit: 'cover',
      });
      set((s) => ({ artAppliedNonce: s.artAppliedNonce + 1 }));
    },
    clearArt: () => {
      get().patch('art', { imageId: null, name: '', width: 0, height: 0 });
    },

    notifyArtApplied: () => set((s) => ({ artAppliedNonce: s.artAppliedNonce + 1 })),

    rotateMug: (deg) => {
      const r = get().mug.rotationY;
      get().patch('mug', { rotationY: ((r + deg) % 360 + 360) % 360 });
    },

    applyCameraPreset: (p) =>
      set((s) => ({ presetRequest: { pos: p.pos, target: p.target, nonce: s.presetRequest ? s.presetRequest.nonce + 1 : 1 } })),

    requestFocus: () => set((s) => ({ focusNonce: s.focusNonce + 1 })),

    setExportOpen: (v) => set({ exportOpen: v }),

    setExport: (partial) => set((s) => ({ exportSettings: { ...s.exportSettings, ...partial } })),

    addCompanion: () => {
      guardHistory();
      const list = get().companions;
      if (list.length >= 3) return;
      const n = list.length;
      // spots folgados (nunca encostam) — alça apontando para fora do grupo
      const spots: { posX: number; posZ: number; rotationY: number }[] = [
        { posX: 10.8, posZ: 0.6, rotationY: 90 },
        { posX: -10.8, posZ: 0.8, rotationY: -90 },
        { posX: 0, posZ: -12.4, rotationY: 0 },
      ];
      const spot = spots[n] ?? spots[0];
      const res = resolveOverlaps(
        [...list, makeCompanion({ ...spot, scale: n === 2 ? 0.9 : 0.96 })],
        { rotationY: get().mug.rotationY, scale: get().mug.scale },
      );
      set({ companions: res.list, collisionNonce: res.moved ? get().collisionNonce + 1 : get().collisionNonce });
    },

    patchCompanion: (id, partial) => {
      guardHistory();
      // liberdade total: a pessoa posiciona onde quiser — só impedimos
      // que uma caneca fique literalmente DENTRO da outra
      const list = get().companions.map((c) => (c.id === id ? { ...c, ...partial } : c));
      const touchesPose = 'posX' in partial || 'posZ' in partial || 'scale' in partial || 'rotationY' in partial;
      if (touchesPose) {
        const st = get();
        const res = resolveOverlaps(list, { rotationY: st.mug.rotationY, scale: st.mug.scale });
        const requested = list.find((c) => c.id === id);
        const final = res.list.find((c) => c.id === id);
        const adjusted =
          requested && final &&
          (Math.abs(requested.posX - final.posX) > 0.02 || Math.abs(requested.posZ - final.posZ) > 0.02);
        set({
          companions: res.list,
          collisionNonce: adjusted ? st.collisionNonce + 1 : st.collisionNonce,
        });
      } else {
        set({ companions: list });
      }
    },

    removeCompanion: (id) => {
      guardHistory();
      set({ companions: get().companions.filter((c) => c.id !== id) });
    },

    arrangeScene: (kind) => {
      guardHistory();
      if (kind === 'solo') {
        set({ companions: [] });
        return;
      }
      const st = get();
      const fresh = ARRANGEMENTS[kind].map((c) => ({ ...c, id: `comp_${Date.now()}_${++companionSeq}` }));
      const res = resolveOverlaps(fresh, { rotationY: st.mug.rotationY, scale: st.mug.scale });
      set({ companions: res.list });
    },

    /** distribui as acompanhantes ao redor da principal, sem encostar */
    spreadEvenly: () => {
      guardHistory();
      const st = get();
      const list = st.companions;
      if (!list.length) return;
      const angleSets: Record<number, number[]> = {
        1: [90],
        2: [90, -90],
        3: [90, -150, -30],
      };
      const angles = angleSets[list.length] ?? angleSets[3];
      const maxScale = Math.max(...list.map((c) => c.scale), st.mug.scale);
      const radius = Math.max(10.8, BODY_MAX_R * maxScale * 2 + MUG_GAP_MIN + 0.6);
      const next = list.map((c, i) => {
        const a = (angles[i % angles.length] * Math.PI) / 180;
        const posX = round2(Math.cos(a) * radius);
        const posZ = round2(Math.sin(a) * radius);
        // alça aponta para fora: (sin ry, -cos ry) = direção radial
        const rotationY = Math.round(((Math.atan2(posX, -posZ) * 180) / Math.PI + 360) % 360);
        return { ...c, posX, posZ, rotationY };
      });
      const res = resolveOverlaps(next, { rotationY: st.mug.rotationY, scale: st.mug.scale });
      set({ companions: res.list });
    },

    /** pede à câmera que enquadre o grupo inteiro */
    frameAll: () => set((s) => ({ fitNonce: s.fitNonce + 1 })),

    setBgAdjustMode: (v) => set({ bgAdjustMode: v }),
    setShowGuides: (v) => set({ showGuides: v }),

    setProjectsOpen: (v) => set({ projectsOpen: v }),

    hydrate: (s) => {
      const st = get();
      const companions = s.companions
        ? s.companions.map((c) => ({
            ...c,
            posX: clamp(Number.isFinite(c.posX) ? c.posX : 10.8, -18, 18),
            posZ: clamp(Number.isFinite(c.posZ) ? c.posZ : 0.6, -14, 14),
            scale: clamp(Number.isFinite(c.scale) ? c.scale : 0.95, 0.65, 1.35),
          }))
        : st.companions;
      const mug = { ...st.mug, ...s.mug };
      set({
        projectName: s.projectName ?? st.projectName,
        art: { ...st.art, ...s.art },
        mug,
        light: { ...st.light, ...s.light },
        bg: { ...st.bg, ...s.bg },
        camera: { ...st.camera, ...s.camera },
        exportSettings: { ...st.exportSettings, ...s.exportSettings },
        companions: resolveOverlaps(companions, mug).list,
        fx: { ...st.fx, ...s.fx },
        watermark: { ...st.watermark, ...s.watermark },
        video: { ...st.video, ...s.video },
        gif: { ...st.gif, ...s.gif },
      });
      if (s.art) set((x) => ({ artAppliedNonce: x.artAppliedNonce + 1 }));
    },

    undo: () => {
      if (commitTimer) {
        clearTimeout(commitTimer);
        commitTimer = null;
      }
      const s = get();
      if (!s.past.length) return;
      const prev = s.past[s.past.length - 1];
      set({
        past: s.past.slice(0, -1),
        future: [snap(s), ...s.future].slice(0, HISTORY_LIMIT),
        art: prev.art,
        mug: prev.mug,
        light: prev.light,
        bg: prev.bg,
        companions: prev.companions,
        fx: prev.fx,
        camera: prev.camera,
      });
    },

    redo: () => {
      if (commitTimer) {
        clearTimeout(commitTimer);
        commitTimer = null;
      }
      const s = get();
      if (!s.future.length) return;
      const next = s.future[0];
      set({
        past: [...s.past, snap(s)].slice(-HISTORY_LIMIT),
        future: s.future.slice(1),
        art: next.art,
        mug: next.mug,
        light: next.light,
        bg: next.bg,
        companions: next.companions,
        fx: next.fx,
        camera: next.camera,
      });
    },

    resetAll: () => {
      // zera TUDO de verdade: arte, caneca, luz, cena, efeitos, câmera e acompanhantes
      // (mantém um passo de histórico para poder desfazer o reset se for acidental)
      guardHistory();
      set({
        art: { ...initialArt },
        mug: { ...initialMug },
        light: { ...initialLight },
        bg: { ...initialBg },
        fx: { ...initialFx },
        camera: { ...initialCamera },
        companions: [],
        bgAdjustMode: false,
      });
    },
  };
});

/* usados pelos painéis para rótulos coerentes */
export const FLOAT_DEFAULT_LIFT = FLOAT_LIFT;
export const PEDESTAL_TOP = PEDESTAL_H;
