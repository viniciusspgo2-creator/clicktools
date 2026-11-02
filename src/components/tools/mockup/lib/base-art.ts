import type { ArtState } from "../state/store";
export function baseArtTransform(art: Partial<ArtState>) {
  const value = (n: number | undefined, fallback: number, min: number, max: number) => Math.min(max, Math.max(min, Number.isFinite(n) ? n! : fallback));
  return { scale: value(art.baseScale, 1, 0.1, 3), x: value(art.baseOffsetX, 0, -1, 1), y: value(art.baseOffsetY, 0, -1, 1) };
}
