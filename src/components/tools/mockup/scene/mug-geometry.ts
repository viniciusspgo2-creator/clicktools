/* ============================================================
   Geometria procedural da caneca de porcelana 11 oz (325 ml)
   - Corpo: LatheGeometry com perfil real (borda arredondada,
     parede cônica, interior liso, fundo e pé com anel de apoio)
   - Alça: varredura de seção ELÍPTICA ao longo de curva suave
   - UVs: projeção cilíndrica exata da folha de impressão
   ============================================================ */

import * as THREE from 'three';
import { MUG } from '../lib/config';
import { remapBodyUVs } from '../lib/art-canvas';

type P = [number, number]; // [raio, y]

/** pontos intermediários de um arco (circular) entre dois raios */
function arcPoints(cx: number, cy: number, r: number, a0: number, a1: number, n: number): P[] {
  const pts: P[] = [];
  for (let i = 1; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/**
 * Perfil (polilinha em (r, y)) do corpo, do centro do fundo externo,
 * subindo pela parede, passando pela borda e descendo pelo interior.
 * Pontos duplicados criam arestas vivas onde precisa (cantos do pé).
 */
function bodyProfile(): P[] {
  const pts: P[] = [];
  // ---- fundo externo rebaixado + pé ----
  pts.push([0, MUG.footH]); // centro recesso
  pts.push([3.3, MUG.footH]);
  pts.push([3.52, MUG.footH]); // canto interno do anel
  pts.push([3.72, 0.08]); // chanfro do pé
  pts.push([MUG.bottomOuterR, 0]); // borda de contato com o chão (aresta viva)
  pts.push([MUG.bottomOuterR, 0]);
  pts.push([3.98, 0.14]);
  pts.push([4.02, 0.45]);
  pts.push([4.03, MUG.printBottom]); // v=0 exato da folha de impressão
  pts.push([4.04, 0.95]);
  // ---- parede externa cônicа ----
  pts.push([4.05, 1.3]);
  pts.push([4.08, 3.2]);
  pts.push([4.1, 6.0]);
  pts.push([4.11, 8.7]);
  pts.push([4.11, 9.2]);
  // ---- borda arredondada (raio ~0.15) ----
  pts.push(...arcPoints(3.96, 9.35, 0.155, 0, Math.PI, 7)); // de (4.115,9.35) até (3.805,9.35) por cima
  // ---- parede interna ----
  pts.push([3.8, 8.4]);
  pts.push([3.78, 6.0]);
  pts.push([3.74, 3.4]);
  pts.push([3.7, 1.7]);
  // ---- canto interno e piso interno ----
  pts.push([3.52, 1.02]);
  pts.push([3.0, 0.92]);
  pts.push([2.0, 0.9]);
  pts.push([1.0, 0.9]);
  pts.push([0, 0.9]);
  return pts;
}

export function buildMugBodyGeometry(): THREE.BufferGeometry {
  const pts = bodyProfile().map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y));
  const geo = new THREE.LatheGeometry(pts, MUG.segments);
  remapBodyUVs(geo);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Alça em "C" clássica: varredura de seção ELÍPTICA ao longo de curva suave
 * no plano YZ (atrás da caneca, em -Z), com extremidades embutidas na parede.
 */

/** curva da alça compartilhada (lazy) — usada pela geometria e pela caixa */
let handleCurve: THREE.CatmullRomCurve3 | null = null;
function getHandleCurve(): THREE.CatmullRomCurve3 {
  if (!handleCurve) {
    handleCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 7.5, -3.7),
        new THREE.Vector3(0, 7.75, -5.15),
        new THREE.Vector3(0, 7.1, -6.25),
        new THREE.Vector3(0, 5.4, -6.62),
        new THREE.Vector3(0, 3.6, -6.35),
        new THREE.Vector3(0, 2.45, -5.3),
        new THREE.Vector3(0, 2.2, -3.75),
      ],
      false,
      'catmullrom',
      0.5,
    );
  }
  return handleCurve;
}

/** semi-eixos da seção elíptica da alça */
export const HANDLE_A_X = 0.5; // largura (X)
export const HANDLE_B_N = 0.37; // espessura no plano da curva

/** Caixa real da alça: alcance máximo a partir do centro da caneca (cm) */
let handleExtentCache: number | null = null;
export function handleExtentR(): number {
  if (handleExtentCache === null) {
    const curve = getHandleCurve();
    let maxZ = 0;
    for (let i = 0; i <= 64; i++) {
      maxZ = Math.max(maxZ, Math.abs(curve.getPointAt(i / 64).z));
    }
    handleExtentCache = maxZ + HANDLE_B_N + 0.16; // espessura + folga de verniz
  }
  return handleExtentCache;
}

export function buildHandleGeometry(): THREE.BufferGeometry {
  const curve = getHandleCurve();

  const tubular = 72;
  const radial = 22;
  const aX = HANDLE_A_X;
  const bN = HANDLE_B_N;

  const frames = curve.computeFrenetFrames(tubular, false);
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const X = new THREE.Vector3(1, 0, 0);

  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    const C = curve.getPointAt(t);
    const T = frames.tangents[Math.min(i, tubular - 1)].clone().normalize();
    // perpendicular dentro do plano YZ (T ⊥ X, pois a curva é plana em YZ)
    const perp = new THREE.Vector3().crossVectors(X, T).normalize();
    // afunilamento leve nas pontas (embutidas na parede)
    const taper = 0.82 + 0.18 * Math.sin(Math.PI * Math.min(1, Math.max(0, t)));
    for (let j = 0; j <= radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      const ox = Math.cos(th) * aX * taper;
      const on = Math.sin(th) * bN * taper;
      const v = new THREE.Vector3(
        C.x + ox,
        C.y + perp.y * on,
        C.z + perp.z * on,
      );
      positions.push(v.x, v.y, v.z);
      // normal aproximada
      const n = new THREE.Vector3(ox / (aX * aX), (perp.y * on) / (bN * bN), (perp.z * on) / (bN * bN)).normalize();
      normals.push(n.x, n.y, n.z);
      uvs.push(j / radial, t);
    }
  }
  const ring = radial + 1;
  for (let i = 0; i < tubular; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * ring + j;
      const b = a + ring;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/**
 * Pedestal redondo premium com bordas arredondadas (bevel) — usado no
 * modo de chão "Pedestal". O raio acompanha o tamanho do grupo de canecas.
 */
export function buildPedestalGeometry(radius: number, height: number): THREE.BufferGeometry {
  const bev = Math.min(0.24, height * 0.3, radius * 0.12);
  const r = Math.max(3, radius);
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0001, 0),
    new THREE.Vector2(r * 0.86, 0),
    new THREE.Vector2(r - bev * 0.4, 0.02),
    new THREE.Vector2(r, bev),
    new THREE.Vector2(r, height - bev),
    new THREE.Vector2(r - bev, height),
    new THREE.Vector2(0.0001, height),
  ];
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  return geo;
}
