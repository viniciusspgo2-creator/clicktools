import * as THREE from "three";
import type { MugModel } from "../state/store";
import { buildMugBodyGeometry, buildHandleGeometry, profileRadius } from "./mug-geometry";
export const MODELS: {
  id: MugModel;
  label: string;
  desc: string;
  hasHandle: boolean;
  height: number;
}[] = [
  {
    id: "classic",
    label: "Clássica 325 ml (11 oz)",
    desc: "Cerâmica · 325 ml",
    hasHandle: true,
    height: 9.5,
  },
  {
    id: "square",
    label: "Quadrada",
    desc: "Cantos arredondados",
    hasHandle: true,
    height: 9.5,
  },
  {
    id: "cone",
    label: "Cônica",
    desc: "Base estreita · 350 ml",
    hasHandle: true,
    height: 10.8,
  },
  {
    id: "beer",
    label: "Chopp",
    desc: "Cerâmica alta · 500 ml",
    hasHandle: true,
    height: 14,
  },
  {
    id: "latte",
    label: "Latte",
    desc: "Boca ampla · 450 ml",
    hasHandle: true,
    height: 12,
  },
  {
    id: "tea",
    label: "Xícara de chá",
    desc: "Baixa e ampla · 220 ml",
    hasHandle: true,
    height: 6.5,
  },

];
export function buildModel(model: MugModel = "classic") {
  const def = MODELS.find((x) => x.id === model) ?? MODELS[0];
  const body = buildMugBodyGeometry(undefined, def.id);
  const handle = buildHandleGeometry();
  function deform(g: THREE.BufferGeometry, isHandle: boolean) {
    const p = g.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      let x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i);
      const t = y / 9.5;
      let r = 1;
      if (isHandle && model !== "classic") {
        // Adequa a alça ao raio correspondente do modelo, sem deformar o corpo.
        r = profileRadius(model, Math.max(0, Math.min(1, t))) / profileRadius("classic", Math.max(0, Math.min(1, t)));
      }
      if (model === "square" && !isHandle) {
        const a = Math.atan2(z, x);
        r =
          (1 /
            Math.pow(
              Math.pow(Math.abs(Math.cos(a)), 6) +
                Math.pow(Math.abs(Math.sin(a)), 6),
              1 / 6,
            )) *
          0.88;
      }
      x *= r;
      z *= r;
      y *= def.height / 9.5;
      p.setXYZ(i, x, y, z);
    }
    p.needsUpdate = true;
    g.computeVertexNormals();
    g.computeBoundingBox();
    g.computeBoundingSphere();
  }
  deform(body, false);
  deform(handle, true);
  return { body, handle, def };
}
/** Minimum center height after arbitrary 3-axis rotation, including handle. */
export function supportHeight(
  body: THREE.BufferGeometry,
  handle: THREE.BufferGeometry,
  rotation: THREE.Euler,
  withHandle: boolean,
) {
  const q = new THREE.Quaternion().setFromEuler(rotation),
    v = new THREE.Vector3();
  let min = Infinity;
  for (const geo of withHandle ? [body, handle] : [body]) {
    const p = geo.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      v.y -= 4.75;
      v.applyQuaternion(q);
      min = Math.min(min, v.y);
    }
  }
  return -min;
}
