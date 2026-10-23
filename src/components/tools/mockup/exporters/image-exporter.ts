/* ============================================================
   Exportador de imagem — render offscreen em alta resolução
   com enquadramento inteligente, transparência verdadeira,
   pós-processamento, marca d'água e restauração completa.
   ============================================================ */

import {
  applyWatermark,
  beginFrames,
  captureFrame,
  downloadBlob,
  endFrames,
  fitCamera,
  ExportError,
  renderFrame,
} from "./frame-capture";

export interface ExportOpts {
  width: number;
  height: number;
  format: "png" | "jpeg" | "webp";
  quality: number;
  transparent: boolean;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  width: number;
  height: number;
}

export { ExportError, downloadBlob };

export async function exportImage(opts: ExportOpts): Promise<ExportResult> {
  const width = Math.round(opts.width);
  const height = Math.round(opts.height);
  const usingTransparent = opts.transparent && opts.format !== "jpeg";

  const session = beginFrames(width, height, { transparent: usingTransparent });
  try {
    const cam2 = fitCamera(session);
    // render offscreen + captura síncrona
    renderFrame(session, cam2);
    const out = await captureFrame(
      session,
      width,
      height,
      opts.transparent && opts.format === "jpeg" ? "#ffffff" : undefined,
    );

    const mime =
      opts.format === "png"
        ? "image/png"
        : opts.format === "jpeg"
          ? "image/jpeg"
          : "image/webp";
    const blob = await new Promise<Blob>((res, rej) =>
      out.toBlob(
        (b) =>
          b ? res(b) : rej(new ExportError("Falha ao codificar a imagem.")),
        mime,
        opts.quality,
      ),
    );
    const ext = opts.format === "jpeg" ? "jpg" : opts.format;
    const filename = `mockup-caneca-${width}x${height}-${Date.now()}.${ext}`;
    return { blob, filename, width, height };
  } finally {
    endFrames(session);
  }
}

/** canvas 2D direto (usado para miniaturas de projetos) */
export async function exportImageCanvas(
  opts: ExportOpts,
): Promise<HTMLCanvasElement> {
  const width = Math.round(opts.width);
  const height = Math.round(opts.height);
  const session = beginFrames(width, height, {
    transparent: opts.transparent && opts.format !== "jpeg",
  });
  try {
    const cam2 = fitCamera(session);
    renderFrame(session, cam2);
    return await captureFrame(
      session,
      width,
      height,
      opts.transparent && opts.format === "jpeg" ? "#ffffff" : undefined,
    );
  } finally {
    endFrames(session);
  }
}

export { applyWatermark };
