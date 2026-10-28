import type { MugState } from "../state/store";

export type CeramicFinish = Pick<MugState, "roughness" | "clearcoat" | "clearcoatRoughness" | "specularIntensity" | "reflection" | "glazeStrength">;
export const CERAMIC_FINISHES: { id: string; label: string; description: string; values: CeramicFinish }[] = [
  { id: "satin", label: "Acetinado", description: "Reflexo suave e espalhado", values: {
    roughness: 0.3, clearcoat: 0.55, clearcoatRoughness: 0.2, specularIntensity: 0.6, reflection: 0.5, glazeStrength: 0.65,
  } },
  { id: "sublimation", label: "Sublimação", description: "Porcelana polida com verniz e reflexos de softbox", values: {
    roughness: 0.055, clearcoat: 1, clearcoatRoughness: 0.025, specularIntensity: 1, reflection: 1.25, glazeStrength: 1.45,
  } },
  { id: "gloss", label: "Alto brilho", description: "Brilho destacado com reflexos mais nítidos", values: {
    roughness: 0.045, clearcoat: 1, clearcoatRoughness: 0.025, specularIntensity: 1, reflection: 1.4, glazeStrength: 2.2,
  } },
  { id: "glazed", label: "Vitrificado", description: "Esmalte bem polido com reflexos intensos", values: {
    roughness: 0.025, clearcoat: 1, clearcoatRoughness: 0.015, specularIntensity: 1, reflection: 2, glazeStrength: 3,
  } },
];

export function ceramicFinishValues(mug: Partial<MugState>): CeramicFinish {
  return Object.fromEntries(Object.entries(CERAMIC_FINISHES[1].values)
    .map(([key, fallback]) => [key, mug[key as keyof CeramicFinish] ?? fallback])) as CeramicFinish;
}
