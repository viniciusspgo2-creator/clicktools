/* Referências da cena para uso fora do Canvas (exportadores) */

import type * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import type { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import type { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import type { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export const studioRefs: {
  gl?: THREE.WebGLRenderer;
  scene?: THREE.Scene;
  camera?: THREE.PerspectiveCamera;
  controls?: OrbitControlsImpl | null;
  composer?: EffectComposer | null;
  renderPass?: RenderPass | null;
  gradePass?: ShaderPass | null;
  bloomPass?: UnrealBloomPass | null;
} = {};

/** grupo que contém todas as canecas (hero + acompanhantes) */
export function mugsGroup(scene: THREE.Scene): THREE.Object3D | null {
  return scene.getObjectByName('mockup-mugs') ?? scene.getObjectByName('mockup-mug') ?? null;
}
