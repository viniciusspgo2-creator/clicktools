/* ============================================================
   Captura de frames offscreen — motor compartilhado por todos
   os exportadores (imagem, vídeo, GIF, ZIP e folha).
   Salva o estado do renderer, permite animar câmera/textura por
   frame, respeita pós-processamento e restaura tudo no fim.
   ============================================================ */

import * as THREE from "three";
import { getStudioPlan } from "../lib/entitlements";
import {
  mugsGroup,
  settleFloaters,
  studioRefs,
  visibleMugBounds,
} from "../scene/studio-refs";
import { alignBackdrop } from "../scene/bg-image";
import { useMockupStore, type MugState } from "../state/store";
import { renderArtCanvas, canvasHeightFor } from "../lib/art-canvas";
import { CANVAS_W_EXPORT, resolvePrintArea } from "../lib/config";

export class ExportError extends Error {}

export interface FrameOpts {
  width: number;
  height: number;
  transparent?: boolean;
  /** overrides do estado da caneca p/ render da folha (lote de variantes) */
  mugOverride?: Partial<MugState>;
  /** desliga o supersampling (gravação em tempo real precisa ser leve) */
  noSupersample?: boolean;
  /** teto do supersampling (vídeo usa 1,5: memória/GPU sob pressão) */
  ssCap?: number;
}

export interface FrameSession {
  gl: THREE.WebGLRenderer;
  scene: THREE.Scene;
  width: number;
  height: number;
  ssWidth: number;
  ssHeight: number;
  oldSize: THREE.Vector2;
  oldPR: number;
  oldBg: THREE.Color | THREE.Texture | null;
  tex: THREE.CanvasTexture | null;
  previewCanvas: HTMLCanvasElement | null; // canvas original de preview (restaurado no fim)
  artCanvas: HTMLCanvasElement | null;
  hidden: THREE.Object3D[];
  ground: THREE.Mesh | null;
  oldGroundMat: THREE.Material | undefined;
  shadowMat: THREE.ShadowMaterial | null;
  usingTransparent: boolean;
  usingFx: boolean;
  mugOverride: Partial<MugState>;
  lastRenderKey: string;
  companionTextures: {
    tex: THREE.CanvasTexture;
    preview: HTMLCanvasElement;
    canvas: HTMLCanvasElement;
    art: import("../state/store").ArtState;
    mug: MugState;
  }[];
}

export function detectWebCodecs(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof VideoEncoder !== "undefined" &&
    typeof VideoFrame !== "undefined"
  );
}

/** capacidade do H.264 no navegador (WebCodecs) */
export async function checkH264Support(
  width: number,
  height: number,
): Promise<boolean> {
  if (!detectWebCodecs()) return false;
  try {
    const configs = [
      {
        codec: "avc1.640028",
        width,
        height,
        framerate: 30,
        bitrate: 12_000_000,
      },
      {
        codec: "avc1.4d0028",
        width,
        height,
        framerate: 30,
        bitrate: 12_000_000,
      },
      {
        codec: "avc1.42E01E",
        width,
        height,
        framerate: 30,
        bitrate: 12_000_000,
      },
    ];
    for (const cfg of configs) {
      const r = await VideoEncoder.isConfigSupported(cfg as VideoEncoderConfig);
      if (r.supported) return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Prepara o renderer para renderizar frames offscreen de width×height.
 * Faz upgrade da textura da arte para 4096px e esconde fundo se transparente.
 */
export function beginFrames(
  width: number,
  height: number,
  opts: Omit<FrameOpts, "width" | "height"> = {},
): FrameSession {
  const { gl, scene } = studioRefs;
  if (studioRefs.exporting)
    throw new ExportError("Outra exportação está em andamento.");
  if (!gl || !scene)
    throw new ExportError(
      "Cena ainda não carregada. Aguarde um instante e tente de novo.",
    );

  const isMobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
  const maxBuffer = Math.min(
    gl.capabilities.maxTextureSize || 4096,
    6200,
    isMobile ? 4200 : Infinity,
  );
  // com pós-processamento ativo o composer já trabalha em HalfFloat multi-pass:
  // supersampling dobra memória e custo — desativa
  const fx = useMockupStore.getState().fx;
  // UnrealBloomPass escreve alfa opaco. O recorte transparente usa o render
  // direto, preservando iluminação/exposição, sem efeitos de tela inteira.
  const usingFx = !opts.transparent && fx.enabled && !!studioRefs.composer;
  const ssCap = Math.max(1, Math.min(opts.ssCap ?? 2, usingFx ? 1 : 2));
  const ss = opts.noSupersample
    ? 1
    : Math.max(
        1,
        Math.min(ssCap, Math.min(maxBuffer / width, maxBuffer / height)),
      );
  const ssWidth = Math.round(width * ss);
  const ssHeight = Math.round(height * ss);

  const oldSize = gl.getSize(new THREE.Vector2());
  const oldPR = gl.getPixelRatio();
  const oldBg = scene.background;

  // upgrade da textura da arte para exportação nítida
  const mugGroup = mugsGroup(scene);
  const body = mugGroup?.getObjectByName("mug-body") as THREE.Mesh | undefined;
  const mat = body?.material as THREE.MeshPhysicalMaterial | undefined;
  let tex: THREE.CanvasTexture | null = null;
  let previewCanvas: HTMLCanvasElement | null = null;
  let artCanvas: HTMLCanvasElement | null = null;
  if (mat?.map && (mat.map as THREE.CanvasTexture).isCanvasTexture) {
    tex = mat.map as THREE.CanvasTexture;
    previewCanvas = tex.image as HTMLCanvasElement;
    artCanvas = document.createElement("canvas");
    artCanvas.width = CANVAS_W_EXPORT;
    artCanvas.height = canvasHeightFor(
      CANVAS_W_EXPORT,
      resolvePrintArea(useMockupStore.getState().art),
      useMockupStore.getState().mug.model,
    );
    renderWithOverride(artCanvas, opts.mugOverride ?? {});
    tex.image = artCanvas;
    tex.needsUpdate = true;
  }

  const companionTextures: FrameSession["companionTextures"] = [];
  mugGroup?.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.name !== "mug-body-comp") return;
    const material = mesh.material as THREE.MeshPhysicalMaterial;
    const tex = material.map as THREE.CanvasTexture;
    if (!tex?.isCanvasTexture) return;
    const st = useMockupStore.getState();
    const c = st.companions.find((c) => c.id === mesh.userData.objectId);
    if (!c) return;
    const art = c.showArt
      ? (c.art ?? st.art)
      : { ...(c.art ?? st.art), imageId: null, text: "" };
    const mug = { ...st.mug, ...c } as MugState;
    const canvas = document.createElement("canvas");
    canvas.width = CANVAS_W_EXPORT;
    canvas.height = canvasHeightFor(CANVAS_W_EXPORT, undefined, mug.model);
    renderArtCanvas(canvas, art, mug);
    companionTextures.push({
      tex,
      preview: tex.image as HTMLCanvasElement,
      canvas,
      art,
      mug,
    });
    tex.image = canvas;
    tex.needsUpdate = true;
  });

  // transparência verdadeira
  const hidden: THREE.Object3D[] = [];
  scene.traverse((o) => {
    if (
      (o.name === "studio-gizmo" ||
        o.name === "selection-outline" ||
        o.type === "TransformControlsRoot") &&
      o.visible
    ) {
      o.visible = false;
      hidden.push(o);
    }
  });
  const ground = scene.getObjectByName("ground") as THREE.Mesh | null;
  const oldGroundMat = ground?.material as THREE.Material | undefined;
  let shadowMat: THREE.ShadowMaterial | null = null;
  const usingTransparent = !!opts.transparent;

  studioRefs.exporting = true;
  studioRefs.exportTransparent = usingTransparent;
  // congela a flutuação na pose de descanso
  settleFloaters(scene);

  try {
    if (usingTransparent) {
      scene.background = null;
      // esconde TUDO que é fundo/cenário — só canecas + sombras permanecem
      for (const name of ["backdrop", "glowboard", "pedestal", "bg-image"]) {
        const o = scene.getObjectByName(name);
        if (o && o.visible) {
          o.visible = false;
          hidden.push(o);
        }
      }
      if (ground && !(oldGroundMat instanceof THREE.ShadowMaterial)) {
        shadowMat = new THREE.ShadowMaterial({
          transparent: true,
          opacity: 0.32,
        });
        ground.material = shadowMat;
      }
    }

    gl.setPixelRatio(1);
    gl.setSize(ssWidth, ssHeight, false);
    gl.setClearColor(0x000000, usingTransparent ? 0 : 1);
  } catch (e) {
    // restaura o que deu
    if (tex && mat?.map === tex) tex.needsUpdate = true;
    throw e;
  }

  return {
    gl,
    scene,
    width,
    height,
    ssWidth,
    ssHeight,
    oldSize,
    oldPR,
    oldBg,
    tex,
    previewCanvas,
    artCanvas,
    hidden,
    ground,
    oldGroundMat,
    shadowMat,
    usingTransparent,
    usingFx,
    mugOverride: opts.mugOverride ?? {},
    lastRenderKey: "",
    companionTextures,
  };
}

/** renderiza a folha em alta resolução com overrides aplicados */
function renderWithOverride(
  canvas: HTMLCanvasElement,
  override: Partial<MugState>,
) {
  const { art, mug } = useMockupStore.getState();
  renderArtCanvas(canvas, art, { ...mug, ...override }, resolvePrintArea(art));
}

/** atualiza overrides da caneca (ex.: calor da mágica animando); re-renderiza só se mudou */
export function setMugOverride(
  session: FrameSession,
  override: Partial<MugState>,
) {
  session.mugOverride = override;
  if (!session.tex || !session.artCanvas) return;
  const key = JSON.stringify(override);
  if (key === session.lastRenderKey) return;
  session.lastRenderKey = key;
  renderWithOverride(session.artCanvas, override);
  session.tex.needsUpdate = true;
  for (const item of session.companionTextures) {
    renderArtCanvas(item.canvas, item.art, {
      ...item.mug,
      ...(item.mug.variant === "magic" ? override : {}),
    });
    item.tex.needsUpdate = true;
  }
}

/** câmera temporária com enquadramento inteligente das canecas */
export function fitCamera(session: FrameSession): THREE.PerspectiveCamera {
  const refCam = studioRefs.camera;
  if (!refCam) throw new ExportError("Câmera indisponível.");
  const bounds = visibleMugBounds(session.scene);
  if (bounds.isEmpty())
    throw new ExportError("Mostre pelo menos uma peça antes de exportar.");
  const center = sceneCenter(session.scene);

  const cam2 = refCam.clone();
  cam2.aspect = session.width / session.height;
  cam2.updateProjectionMatrix();

  const viewDir = new THREE.Vector3()
    .subVectors(center, refCam.position)
    .normalize();
  const vHalf = THREE.MathUtils.degToRad(cam2.fov) / 2;
  const hHalf = Math.atan(Math.tan(vHalf) * cam2.aspect);
  const fitDist =
    (sceneSphereRadius(session.scene) / Math.sin(Math.min(vHalf, hHalf))) *
    1.06;
  const dist = Math.max(refCam.position.distanceTo(center), fitDist);
  cam2.position.copy(center).addScaledVector(viewDir, -dist);
  cam2.lookAt(center);
  return cam2;
}

/**
 * centro do conjunto de canecas — calculado só com os CORPOS (sem a alça):
 * a alça salta para trás e deslocaria a órbita do vídeo, fazendo a caneca
 * "girar meio fora do centro".
 */
export function sceneCenter(scene: THREE.Scene): THREE.Vector3 {
  const group = mugsGroup(scene);
  if (!group) return new THREE.Vector3(0, 4.75, 0);
  const box = new THREE.Box3();
  let has = false;
  group.traverse((o) => {
    const m = o as THREE.Mesh;
    if (
      m.isMesh &&
      m.parent?.visible !== false &&
      m.visible &&
      (m.name === "mug-body" || m.name === "mug-body-comp")
    ) {
      m.updateWorldMatrix(true, false);
      const b = new THREE.Box3().setFromObject(m);
      if (b.isEmpty()) return;
      if (!has) {
        box.copy(b);
        has = true;
      } else {
        box.union(b);
      }
    }
  });
  if (!has) return new THREE.Vector3(0, 4.75, 0);
  return box.getBoundingSphere(new THREE.Sphere()).center;
}

/** raio do conjunto de canecas */
export function sceneSphereRadius(scene: THREE.Scene): number {
  const group = mugsGroup(scene);
  if (!group) return 6.2;
  const box = visibleMugBounds(scene);
  if (box.isEmpty()) return 6.2;
  const r = box.getBoundingSphere(new THREE.Sphere()).radius;
  return Math.max(6.2, r);
}

/** renderiza um frame (com pós-processamento se ativo) */
export function renderFrame(
  session: FrameSession,
  cam: THREE.PerspectiveCamera,
) {
  // fundo imagem acompanha a câmera que renderiza (encaixe por quadro)
  alignBackdrop(session.scene, cam);
  const composer = studioRefs.composer;
  const renderPass = studioRefs.renderPass;
  if (session.usingFx && composer && renderPass) {
    renderPass.camera = cam;
    composer.setPixelRatio(1);
    composer.setSize(session.ssWidth, session.ssHeight);
    composer.render();
  } else {
    session.gl.render(session.scene, cam);
  }
}

/** captura o framebuffer atual num canvas 2D com downscale + marca d'água */
export async function captureFrame(
  session: FrameSession,
  w?: number,
  h?: number,
  bgFill?: string,
): Promise<HTMLCanvasElement> {
  const outW = w ?? session.width;
  const outH = h ?? session.height;
  const dataUrl = session.gl.domElement.toDataURL("image/png");
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const out = document.createElement("canvas");
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  if (bgFill) {
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, outW, outH);
  }
  ctx.drawImage(img, 0, 0, outW, outH);
  applyWatermark(ctx, outW, outH);
  return out;
}

/** marca d'água configurável (desenhada por cima do frame) */
export function applyWatermark(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
) {
  const policy = useMockupStore.getState().watermark;
  const wm =
    getStudioPlan() === "free"
      ? {
          ...policy,
          enabled: true,
          text: "Click&Gruda · Mockup Studio",
          opacity: 0.75,
        }
      : policy;
  if (!wm.enabled || !wm.text.trim()) return;
  const fs = Math.max(11, Math.round(W * wm.size));
  ctx.save();
  ctx.font = `700 ${fs}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
  ctx.globalAlpha = Math.max(0.05, Math.min(1, wm.opacity));
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = fs * 0.3;
  ctx.fillStyle = "#ffffff";
  const pad = Math.round(W * 0.026);
  const m = ctx.measureText(wm.text);
  const bottom = wm.position.startsWith("b");
  const right = wm.position.endsWith("r");
  ctx.textAlign = right ? "right" : "left";
  ctx.textBaseline = bottom ? "alphabetic" : "top";
  ctx.fillText(
    wm.text,
    right ? W - pad : pad,
    bottom ? H - pad * 0.6 : pad * 0.8,
  );
  ctx.restore();
}

/** restaura o estado completo do renderer */
export function endFrames(session: FrameSession) {
  const { gl, scene } = session;
  studioRefs.exporting = false;
  studioRefs.exportTransparent = false;
  // pede o refresh assistido da folha nos próximos frames — cobre a queda/
  // restauração assíncrona do contexto WebGL durante a exportação
  studioRefs.artRefreshFrames = 45;
  if (session.tex && session.previewCanvas) {
    // REDESENHA a folha de preview do estado atual antes de devolver a
    // textura — à prova de contexto WebGL perdido/restaurado durante a
    // exportação (a caneca nunca fica branca depois de exportar) e de
    // qualquer mudança de estado que tenha passado durante o processo.
    try {
      renderWithOverride(session.previewCanvas, session.mugOverride);
    } catch {
      /* estado indisponível: mantém o conteúdo atual do canvas */
    }
    session.tex.image = session.previewCanvas;
    session.tex.needsUpdate = true;
  }
  for (const item of session.companionTextures) {
    item.tex.image = item.preview;
    item.tex.needsUpdate = true;
  }
  if (session.usingTransparent) scene.background = session.oldBg;
  for (const o of session.hidden) o.visible = true;
  if (session.ground && session.oldGroundMat)
    session.ground.material = session.oldGroundMat;
  session.shadowMat?.dispose();
  gl.setPixelRatio(session.oldPR);
  gl.setSize(session.oldSize.x, session.oldSize.y, false);
  gl.setClearColor(0x000000, 0);
  const cam = studioRefs.camera;
  if (cam) {
    settleFloaters(scene);
    gl.render(scene, cam);
  }
}

/** dispara o download de um Blob no navegador */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
