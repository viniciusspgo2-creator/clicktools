/* ============================================================
   Exportador de vídeo (MP4) e GIF animado.
   MP4: WebCodecs VideoEncoder + mp4-muxer (H.264, in-memory).
   Fallback: MediaRecorder (MP4 no Safari, WebM no resto).
   GIF: gifenc com paleta adaptativa por frame.
   ============================================================ */

import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import * as THREE from 'three';
import {
  beginFrames, captureFrame, checkH264Support, detectWebCodecs, endFrames, ExportError, fitCamera,
  renderFrame, sceneCenter, setMugOverride, type FrameSession,
} from './frame-capture';
import { useMockupStore, type VideoAnim } from '../state/store';

export const VIDEO_RESOLUTIONS: Record<string, { w: number; h: number; label: string }> = {
  sq1080: { w: 1080, h: 1080, label: 'Quadrado 1080' },
  hd: { w: 1280, h: 720, label: 'HD 720p' },
  vertical: { w: 1080, h: 1920, label: 'Story 1080×1920' },
  wide: { w: 1920, h: 1080, label: 'Wide 1080p' },
};

export interface AnimOpts {
  anim: VideoAnim;
  duration: number;
  fps: number;
  onProgress?: (p: number) => void;
}

/* ---------------- caminho de câmera ---------------- */

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function applyCameraPath(
  anim: VideoAnim,
  t: number,
  cam: THREE.PerspectiveCamera,
  base: THREE.PerspectiveCamera,
  center: THREE.Vector3,
  heatOverride: (v: number) => void,
) {
  const offset = new THREE.Vector3().subVectors(base.position, center);
  const dist = offset.length();

  if (anim === 'giro') {
    const a = t * Math.PI * 2;
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
    cam.position.copy(center).add(offset);
  } else if (anim === 'orbita') {
    const a = Math.sin(t * Math.PI * 2) * THREE.MathUtils.degToRad(46);
    offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
    const bob = Math.sin(t * Math.PI * 4) * dist * 0.045;
    cam.position.copy(center).add(offset).add(new THREE.Vector3(0, bob, 0));
  } else if (anim === 'zoom') {
    const k = 1.28 - 0.34 * easeInOut(t);
    const a = Math.sin(t * Math.PI * 2) * THREE.MathUtils.degToRad(10);
    const off = offset.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a).normalize().multiplyScalar(dist * k);
    cam.position.copy(center).add(off);
  } else {
    // revelacao — câmera parada, calor 0→1 com curva suave
    heatOverride(easeInOut(t));
  }
  cam.lookAt(center);
  cam.updateMatrixWorld();
}

/* ---------------- MP4 ---------------- */

export interface VideoResult {
  blob: Blob;
  filename: string;
  mimeType: string;
  width: number;
  height: number;
  engine: 'webcodecs' | 'mediarecorder';
}

export async function exportVideo(resolution: string, animOpts: AnimOpts): Promise<VideoResult> {
  const res = VIDEO_RESOLUTIONS[resolution] ?? VIDEO_RESOLUTIONS.sq1080;
  const supported = await checkH264Support(res.w, res.h);
  if (supported) return exportVideoWebCodecs(res.w, res.h, animOpts);
  if (typeof MediaRecorder !== 'undefined') return exportVideoMediaRecorder(res.w, res.h, animOpts);
  throw new ExportError(
    'Seu navegador não suporta exportar vídeo. Use o Chrome ou Edge atualizados — ou exporte um GIF.',
  );
}

async function exportVideoWebCodecs(w: number, h: number, { anim, duration, fps, onProgress }: AnimOpts): Promise<VideoResult> {
  const session = beginFrames(w, h, { transparent: false });
  try {
    const base = fitCamera(session);
    const center = sceneCenter(session.scene);
    const isMagic = useMockupStore.getState().mug.variant === 'magic';
    if (anim === 'revelacao' && !isMagic) {
      throw new ExportError('A animação de revelação só funciona na caneca mágica. Escolha outro movimento.');
    }

    // suporte a codec — já checado por checkH264Support; reconfirma o codec string
    let codec = 'avc1.640028';
    for (const c of ['avc1.640028', 'avc1.4d0028', 'avc1.42E01E']) {
      const r = await VideoEncoder.isConfigSupported({ codec: c, width: w, height: h, framerate: fps, bitrate: 10_000_000 });
      if (r.supported) {
        codec = c;
        break;
      }
    }

    const pixels = w * h;
    const bitrate = Math.round(Math.min(24_000_000, Math.max(6_000_000, pixels * fps * 0.14)));
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: { codec: 'avc', width: w, height: h, frameRate: fps },
      fastStart: 'in-memory',
    });

    let encError: Error | null = null;
    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => {
        encError = e instanceof Error ? e : new Error(String(e));
      },
    });
    encoder.configure({ codec, width: w, height: h, bitrate, framerate: fps });

    const total = Math.max(2, Math.round(duration * fps));
    for (let i = 0; i < total; i++) {
      if (encError) throw encError;
      const t = i / (total - 1); // 0..1 inclusive (loop suave no giro: vê a frente no início e fim)
      applyCameraPath(anim, t, base, base, center, (v) => setMugOverride(session, { magicHeat: v }));
      renderFrame(session, base);

      const frame = new VideoFrame(session.gl.domElement, {
        timestamp: Math.round((i * 1e6) / fps),
        duration: Math.round(1e6 / fps),
      });
      encoder.encode(frame, { keyFrame: i % (fps * 2) === 0 });
      frame.close();

      // respeita o backpressure do encoder
      while (encoder.encodeQueueSize > 6) {
        await new Promise((r) => setTimeout(r, 4));
      }
      onProgress?.((i + 1) / total);
    }

    await encoder.flush();
    encoder.close();
    if (encError) throw encError;
    muxer.finalize();

    const blob = new Blob([target.buffer as ArrayBuffer], { type: 'video/mp4' });
    if (!blob.size) throw new ExportError('O vídeo saiu vazio. Tente uma resolução menor.');
    return {
      blob,
      filename: `mockup-caneca-${anim}-${h}p-${Date.now()}.mp4`,
      mimeType: 'video/mp4',
      width: w,
      height: h,
      engine: 'webcodecs',
    };
  } finally {
    endFrames(session);
  }
}

/** fallback universal: animação em tempo real capturada via MediaRecorder */
async function exportVideoMediaRecorder(w: number, h: number, { anim, duration, fps, onProgress }: AnimOpts): Promise<VideoResult> {
  const session = beginFrames(w, h, { transparent: false });
  try {
    const canvas = session.gl.domElement as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream };
    if (typeof canvas.captureStream !== 'function') {
      throw new ExportError('Seu navegador não suporta gravação de vídeo. Use Chrome, Edge ou Safari recentes.');
    }
    const mimes = [
      'video/mp4;codecs=avc1.42E01E',
      'video/mp4',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const mimeType = mimes.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
    const stream = canvas.captureStream(fps);
    const rec = new MediaRecorder(stream, {
      mimeType: mimeType || undefined,
      videoBitsPerSecond: 10_000_000,
    });
    const chunks: BlobPart[] = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };

    const base = fitCamera(session);
    const center = sceneCenter(session.scene);
    const done = new Promise<Blob>((resolve) => {
      rec.onstop = () => resolve(new Blob(chunks, { type: mimeType || 'video/webm' }));
    });

    rec.start(200);
    const t0 = performance.now();
    const durMs = duration * 1000;
    await new Promise<void>((resolve) => {
      const tick = () => {
        const elapsed = performance.now() - t0;
        const t = Math.min(1, elapsed / durMs);
        applyCameraPath(anim, t, base, base, center, (v) => setMugOverride(session, { magicHeat: v }));
        renderFrame(session, base);
        onProgress?.(t);
        if (t >= 1) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    // deixa o último frame respirar
    await new Promise((r) => setTimeout(r, 220));
    rec.stop();
    const blob = await done;
    const ext = (mimeType || 'video/webm').includes('mp4') ? 'mp4' : 'webm';
    return {
      blob,
      filename: `mockup-caneca-${anim}-${h}p-${Date.now()}.${ext}`,
      mimeType: mimeType || 'video/webm',
      width: w,
      height: h,
      engine: 'mediarecorder',
    };
  } finally {
    endFrames(session);
  }
}

/* ---------------- GIF ---------------- */

export interface GifResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
}

export async function exportGif(width: number, animOpts: AnimOpts): Promise<GifResult> {
  const { anim, duration, fps, onProgress } = animOpts;
  const isMagic = useMockupStore.getState().mug.variant === 'magic';
  if (anim === 'revelacao' && !isMagic) {
    throw new ExportError('A animação de revelação só funciona na caneca mágica. Escolha outro movimento.');
  }

  // supersampling 2× para GIF mais nítido
  const rw = Math.min(1280, width * 2);
  const rh = rw;
  const session: FrameSession = beginFrames(rw, rh, { transparent: false });
  try {
    const base = fitCamera(session);
    const center = sceneCenter(session.scene);
    const gif = GIFEncoder();
    const total = Math.max(4, Math.round(duration * fps));

    for (let i = 0; i < total; i++) {
      const t = i / total; // loop perfeito: último frame ≠ primeiro
      applyCameraPath(anim, t, base, base, center, (v) => setMugOverride(session, { magicHeat: v }));
      renderFrame(session, base);
      const small = await captureFrame(session, width, width);
      const { data } = small.getContext('2d')!.getImageData(0, 0, width, width);
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, width, width, { palette, delay: Math.round(1000 / fps), repeat: 0 });
      onProgress?.((i + 1) / total);
      // deixa a UI respirar
      if (i % 3 === 2) await new Promise((r) => setTimeout(r, 0));
    }
    gif.finish();
    const blob = new Blob([gif.bytes() as BlobPart], { type: 'image/gif' });
    return { blob, filename: `mockup-caneca-${anim}-${width}px-${Date.now()}.gif`, width, height: width };
  } finally {
    endFrames(session);
  }
}

export { detectWebCodecs };
