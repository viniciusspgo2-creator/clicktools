/* ============================================================
   Estado central do Mockup Studio — Zustand + undo/redo
   ============================================================ */

'use client';

import { create } from 'zustand';

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
}

export interface MugState {
  variant: 'white' | 'accent' | 'magic';
  accentColor: string; // alça e interior (nas mágicas também)
  magicHeat: number; // 0..1 — 0 = fria (preta) · 1 = quente (arte revelada)
  magicDirection: 'baixo' | 'lateral' | 'radial'; // de onde a revelação começa
  magicDissolve: number; // 0..1 — 0 = linha reta · 1 = dissolução total
  rotationY: number; // graus — gira a caneca (não a câmera)
  tiltX: number; // graus -25..25
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
  type: 'studio-white' | 'studio-dark' | 'gradient' | 'solid' | 'transparent';
  colorA: string;
  colorB: string;
  angle: number; // 0..360
  contactShadow: boolean;
  castShadow: boolean;
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
  posX: number; // cm -9..9
  posZ: number; // cm -6..8
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
};

const initialMug: MugState = {
  variant: 'white',
  accentColor: '#1d130d',
  magicHeat: 0.85,
  magicDirection: 'baixo',
  magicDissolve: 0.35,
  rotationY: 0,
  tiltX: 0,
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

let companionSeq = 0;
export function makeCompanion(partial?: Partial<CompanionMug>): CompanionMug {
  return {
    id: `comp_${Date.now()}_${++companionSeq}`,
    variant: 'accent',
    accentColor: '#e8703a',
    magicHeat: 0.85,
    showArt: true,
    rotationY: -25,
    posX: 5.6,
    posZ: 0.8,
    scale: 0.95,
    ...partial,
  };
}

export const ARRANGEMENTS: Record<string, ReturnType<typeof makeCompanion>[]> = {
  duo: [makeCompanion({ posX: 5.7, posZ: 0.4, rotationY: -28, scale: 0.97 })],
  trio: [
    makeCompanion({ posX: -5.8, posZ: 1.4, rotationY: 30, scale: 0.92 }),
    makeCompanion({ posX: 5.8, posZ: 1.4, rotationY: -30, scale: 0.92, variant: 'white' }),
  ],
  quarto: [
    makeCompanion({ posX: -5.6, posZ: 3.2, rotationY: 24, scale: 0.9 }),
    makeCompanion({ posX: 5.6, posZ: 3.2, rotationY: -24, scale: 0.9, variant: 'white' }),
    makeCompanion({ posX: 0, posZ: -4.6, rotationY: 0, scale: 0.88, variant: 'magic', accentColor: '#8b2f1d' }),
  ],
  vitrine: [
    makeCompanion({ posX: -6.4, posZ: 2.4, rotationY: 42, scale: 0.9 }),
    makeCompanion({ posX: 6.4, posZ: 2.4, rotationY: -42, scale: 0.9, variant: 'white' }),
    makeCompanion({ posX: 0, posZ: -5.6, rotationY: 0, scale: 0.85, variant: 'magic', accentColor: '#1f4d3f' }),
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
  return { art: s.art, mug: s.mug, light: s.light, bg: s.bg, companions: s.companions, fx: s.fx };
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
    past: [],
    future: [],

    setProjectName: (n) => set({ projectName: n }),

    patch: (slice, partial) => {
      guardHistory();
      const current = get()[slice] as unknown as Record<string, unknown>;
      const next = { ...current, ...(partial as Record<string, unknown>) };
      set({ [slice]: next } as unknown as Partial<MockupStore>);
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
      // espalha a nova caneca do lado oposto às existentes
      const posX = n === 0 ? 5.7 : n === 1 ? -5.7 : 0;
      const posZ = n === 2 ? 3.4 : 0.6;
      const rot = n === 0 ? -28 : n === 1 ? 28 : 0;
      const next = [...list, makeCompanion({ posX, posZ, rotationY: rot, scale: n === 2 ? 0.9 : 0.96 })];
      set({ companions: next });
    },

    patchCompanion: (id, partial) => {
      guardHistory();
      set({ companions: get().companions.map((c) => (c.id === id ? { ...c, ...partial } : c)) });
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
      set({ companions: ARRANGEMENTS[kind].map((c) => ({ ...c, id: `comp_${Date.now()}_${++companionSeq}` })) });
    },

    setProjectsOpen: (v) => set({ projectsOpen: v }),

    hydrate: (s) => {
      const st = get();
      set({
        projectName: s.projectName ?? st.projectName,
        art: { ...st.art, ...s.art },
        mug: { ...st.mug, ...s.mug },
        light: { ...st.light, ...s.light },
        bg: { ...st.bg, ...s.bg },
        camera: { ...st.camera, ...s.camera },
        exportSettings: { ...st.exportSettings, ...s.exportSettings },
        companions: s.companions ? s.companions.map((c) => ({ ...c })) : st.companions,
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
      });
    },

    resetAll: () => {
      get().patch('art', { ...initialArt });
      get().patch('mug', { ...initialMug });
      get().patch('light', { ...initialLight });
      get().patch('bg', { ...initialBg });
      get().patch('fx', { ...initialFx });
      guardHistory();
      set({ companions: [] });
    },
  };
});
