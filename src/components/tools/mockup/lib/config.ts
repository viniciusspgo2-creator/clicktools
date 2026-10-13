/* ============================================================
   Mockup Studio — constantes, presets e helpers
   Unidades da cena: 1 unidade = 1 cm
   ============================================================ */

export const MUG = {
  height: 9.5, // cm altura total
  topOuterR: 4.11, // raio externo no topo
  bottomOuterR: 3.9, // raio na base (leve conicidade)
  footH: 0.34, // altura do pé/recesso
  innerFloorY: 0.9, // piso interno
  printTop: 9.32, // y do topo da área de impressão
  printBottom: 0.62, // y da base da área de impressão
  paperW: 21, // cm — largura do papel padrão (referência de DPI)
  paperH: 9.5, // cm — altura do papel padrão (referência de DPI)
  gapCirc: 4.6, // cm da circunferência sem impressão (região da alça)
  segments: 180, // segmentos radiais do corpo
} as const;

export const PRINT_HEIGHT_CM = MUG.printTop - MUG.printBottom; // 8.7 cm
/** Raio médio da parede para cálculo da circunferência de impressão */
export const AVG_R = 4.02;
export const CIRC_CM = 2 * Math.PI * AVG_R;
export const GAP_ANGLE = (MUG.gapCirc / CIRC_CM) * Math.PI * 2; // rad
export const PRINT_ARC_CM = CIRC_CM - MUG.gapCirc;

/* ---------------- Textura da arte ---------------- */
export const CANVAS_W_PREVIEW = 2048;
export const CANVAS_W_EXPORT = 4096;
export const STRIP_PX = 32; // faixa de cor-base (exterior / interior)
export const MAX_ART_PX = 4096; // redimensionamento interno da arte
export const MAX_UPLOAD_MB = 25;

/* ---------------- Iluminação ---------------- */
export interface LightPresetDef {
  id: string;
  label: string;
  keyInt: number;
  keyTemp: number;
  keyDir: [number, number, number]; // posição da luz chave
  fillInt: number;
  fillTemp: number;
  rimInt: number;
  rimTemp: number;
  env: number; // intensidade geral do ambiente (reflexos)
  backdrop: 'white' | 'dark';
}

export const LIGHT_PRESETS: LightPresetDef[] = [
  { id: 'suave', label: 'Estúdio Suave', keyInt: 1.15, keyTemp: 5600, keyDir: [-6, 12, 8], fillInt: 0.5, fillTemp: 6800, rimInt: 0.75, rimTemp: 6500, env: 1.0, backdrop: 'white' },
  { id: 'contraste', label: 'Alto Contraste', keyInt: 1.9, keyTemp: 5200, keyDir: [-8, 13, 6], fillInt: 0.14, fillTemp: 7000, rimInt: 1.5, rimTemp: 7200, env: 0.62, backdrop: 'dark' },
  { id: 'janela', label: 'Luz de Janela', keyInt: 1.5, keyTemp: 6300, keyDir: [-11, 9, 3], fillInt: 0.35, fillTemp: 5600, rimInt: 0.4, rimTemp: 6800, env: 0.92, backdrop: 'white' },
  { id: 'premium', label: 'Produto Premium', keyInt: 1.05, keyTemp: 5400, keyDir: [-4, 12, 9], fillInt: 0.45, fillTemp: 6200, rimInt: 1.05, rimTemp: 6400, env: 1.32, backdrop: 'dark' },
  { id: 'quente', label: 'Ambiente Quente', keyInt: 1.2, keyTemp: 3400, keyDir: [-7, 10, 8], fillInt: 0.42, fillTemp: 3000, rimInt: 0.55, rimTemp: 4200, env: 0.85, backdrop: 'white' },
  { id: 'dramatico', label: 'Dramático', keyInt: 1.7, keyTemp: 4800, keyDir: [-2, 14, -6], fillInt: 0.06, fillTemp: 6500, rimInt: 0.95, rimTemp: 7000, env: 0.38, backdrop: 'dark' },
];

/** Temperatura de cor (K) → RGB aproximado 0..1 */
export function kelvinToRgb(k: number): [number, number, number] {
  const t = Math.min(12000, Math.max(1500, k)) / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.47 * Math.log(t) - 161.12;
  } else {
    r = 329.7 * Math.pow(t - 60, -0.1332);
    g = 288.12 * Math.pow(t - 60, -0.0755);
  }
  if (t >= 66) b = 255;
  else if (t <= 19) b = 0;
  else b = 138.52 * Math.log(t - 10) - 305.04;
  const cl = (v: number) => Math.min(255, Math.max(0, v)) / 255;
  return [cl(r), cl(g), cl(b)];
}

/* ---------------- Câmera ---------------- */
export interface CameraPresetDef {
  id: string;
  label: string;
  pos: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: CameraPresetDef[] = [
  { id: 'frente', label: 'Frente', pos: [0, 5.8, 27], target: [0, 4.75, 0] },
  { id: 'tres-quartos', label: '3/4', pos: [17.5, 9, 18.5], target: [0, 4.6, 0] },
  { id: 'costas', label: 'Costas', pos: [0, 5.8, -27], target: [0, 4.75, 0] },
  { id: 'lateral-esq', label: 'Lateral esq.', pos: [-27, 5.8, 0], target: [0, 4.75, 0] },
  { id: 'lateral-dir', label: 'Lateral dir.', pos: [27, 5.8, 0], target: [0, 4.75, 0] },
  { id: 'alca-esq', label: 'Alça à esq.', pos: [23, 6, -14], target: [0, 4.7, -1.5] },
  { id: 'alca-dir', label: 'Alça à dir.', pos: [-23, 6, -14], target: [0, 4.7, -1.5] },
  { id: 'topo', label: 'Topo', pos: [0.01, 29, 5.5], target: [0, 3, 0] },
  { id: 'heroi', label: 'Ângulo herói', pos: [4.5, 1.4, 21.5], target: [0, 4.3, 0] },
  { id: 'angulo-alto', label: 'Ângulo alto', pos: [0, 25, 13], target: [0, 3.3, 0] },
  { id: 'close-arte', label: 'Close na arte', pos: [0, 5.2, 15.5], target: [0, 5, 0] },
  { id: 'close-alca', label: 'Close na alça', pos: [0, 5.2, -16], target: [0, 5, -2] },
];

/** FOV vertical a partir de uma lente full-frame (sensor 24mm de altura) */
export function lensToFov(lensMm: number): number {
  return (2 * Math.atan(12 / lensMm) * 180) / Math.PI;
}

/* ---------------- Fundos ---------------- */
export type BackgroundType = 'studio-white' | 'studio-dark' | 'gradient' | 'solid' | 'transparent';

export const BACKGROUND_LABELS: Record<BackgroundType, string> = {
  'studio-white': 'Estúdio branco infinito',
  'studio-dark': 'Estúdio escuro premium',
  gradient: 'Gradiente colorido',
  solid: 'Cor sólida',
  transparent: 'Transparente (PNG/WebP alfa)',
};

/* ---------------- Exportação ---------------- */
export interface RatioDef {
  id: string;
  label: string;
  w: number;
  h: number;
}

export const EXPORT_RATIOS: RatioDef[] = [
  { id: 'sq', label: 'Feed 1:1', w: 1080, h: 1080 },
  { id: 'portrait', label: 'Retrato 4:5', w: 1080, h: 1350 },
  { id: 'story', label: 'Story 9:16', w: 1080, h: 1920 },
  { id: 'wide', label: 'Wide 16:9', w: 1920, h: 1080 },
  { id: 'pinterest', label: 'Pinterest 2:3', w: 1000, h: 1500 },
  { id: 'catalog', label: 'Catálogo 1:1', w: 1000, h: 1000 },
];

export const MAX_EXPORT_PX = 8192;

/* ---------------- Qualidade do dispositivo ---------------- */
export function detectMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent) || (navigator.hardwareConcurrency ?? 8) <= 4;
}
