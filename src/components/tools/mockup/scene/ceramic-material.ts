import * as THREE from "three";
import type { MugState } from "../state/store";

/** One recipe for the body, handle (including its welds), and bottom print. */
export const CERAMIC_PBR = {
  roughness: 0.08,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.04,
  reflectivity: 0.5,
  // Three links reflectivity to IOR; assigning IOR last keeps 1.52 authoritative.
  ior: 1.52,
  specularIntensity: 0.9,
} as const;

export function createCeramicMaterial(
  mug: Pick<MugState, "roughness" | "clearcoat" | "reflection" | "faithfulColor">,
  options: { color?: THREE.ColorRepresentation; map?: THREE.Texture; metalMask?: THREE.Texture } = {},
): THREE.MeshPhysicalMaterial {
  const material = new THREE.MeshPhysicalMaterial({
    ...CERAMIC_PBR,
    color: new THREE.Color(options.color ?? "#ffffff"),
    specularColor: new THREE.Color(0xffffff),
    roughness: mug.roughness ?? CERAMIC_PBR.roughness,
    clearcoat: mug.clearcoat ?? CERAMIC_PBR.clearcoat,
    envMapIntensity: mug.reflection ?? 0.8,
    map: options.map ?? null,
    metalness: options.metalMask ? 1 : 0,
    metalnessMap: options.metalMask ?? null,
    // The optional fidelity mode protects sRGB inks from display tone mapping.
    // It applies to ALL ceramic parts, including an untextured white handle.
    toneMapped: !mug.faithfulColor || !!options.metalMask,
  });

  if (mug.faithfulColor && !options.metalMask) {
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <opaque_fragment>",
        `// Neutral luminance shading retains the hue of the original ink.
        vec3 ceramicResponse = totalDiffuse / max(diffuseColor.rgb, vec3(0.0001));
        float ceramicShade = clamp(dot(ceramicResponse, vec3(0.2126, 0.7152, 0.0722)), 0.24, 1.0);
        vec3 ceramicBase = diffuseColor.rgb * (0.55 + 0.45 * ceramicShade);
        // Compress glaze highlights smoothly; dark inks retain dark midtones.
        // Specular reflections still describe curvature, rather than a flat decal.
        float ceramicLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
        float ceramicLimit = mix(0.003, 0.14, smoothstep(0.0, 0.75, ceramicLuma));
        vec3 ceramicDiffuseEnergy = totalDiffuse;
        #ifdef USE_CLEARCOAT
          ceramicDiffuseEnergy *= (1.0 - material.clearcoat * Fcc);
        #endif
        vec3 ceramicReflection = max(outgoingLight - ceramicDiffuseEnergy - totalEmissiveRadiance, vec3(0.0));
        float ceramicPeak = max(max(ceramicReflection.r, ceramicReflection.g), ceramicReflection.b);
        vec3 ceramicGlaze = ceramicReflection / (1.0 + ceramicPeak / ceramicLimit);
        outgoingLight = ceramicBase + ceramicGlaze + totalEmissiveRadiance;
        #include <opaque_fragment>`,
      );
    };
    material.customProgramCacheKey = () => "clickgruda-ceramic-faithful-v3";
  }
  return material;
}
