/* ============================================================
   Geometria procedural da caneca de porcelana 11 oz (325 ml)
   - Corpo: LatheGeometry com perfil real (borda arredondada,
     parede cônica, interior liso, fundo e pé com anel de apoio)
   - Alça: varredura de seção ELÍPTICA ao longo de curva suave
   - UVs: projeção cilíndrica exata da folha de impressão
   - ANÉIS EXATOS nas fronteiras da área de impressão: a transição
     arte → cor-base acontece entre dois anéis praticamente colados
     (0,5 mm), o que elimina qualquer faixa esmaecida na borda.
   ============================================================ */

import * as THREE from "three";
import { MUG, V_EXT, V_INT, texV, type PrintArea } from "../lib/config";

type P = [number, number]; // [raio, y]

/** pontos de um arco (circular), de a0 a a1 inclusive */
function arcPoints(
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  n: number,
): P[] {
  const pts: P[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/** nós da parede externa cônica (interpolação linear entre eles) */
const WALL_KNOTS: P[] = [
  [3.98, 0.14],
  [4.01, 0.4],
  [4.03, 0.9],
  [4.05, 1.6],
  [4.08, 3.2],
  [4.1, 6.0],
  [4.11, 8.7],
  [4.115, 9.35],
];

/** Perfis independentes para cada família de caneca.
 * Cada perfil controla as dimensões de base, parede e boca.
 */
export type CeramicProfile = "classic" | "square" | "cone" | "beer" | "latte" | "tea";
export function profileRadius(model: CeramicProfile, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (model) {
    case "cone": return 3.08 + 1.12 * clamped;
    case "beer": return 4.28 + 0.26 * Math.pow(clamped, 3);
    case "latte": return 3.0 + 1.88 * Math.pow(clamped, 0.93);
    case "tea": return 4.06 + 0.75 * clamped;
    default: return 3.9 + 0.215 * clamped;
  }
}

/**
 * Perfil do corpo, do centro do fundo externo, subindo pela parede,
 * passando pela borda e descendo pelo interior. Pontos duplicados criam
 * arestas vivas (cantos do pé) e a emenda borda → interior (a duplicata
 * é uma aresta de comprimento ZERO onde o UV pula para a cor interior,
 * sem interpolar textura nenhuma).
 *
 * NÃO há mais anéis na fronteira da arte: a borda da arte é definida na
 * textura. Era isso que causava as faixas coloridas (um anel de 0,05 mm
 * esticava toda a textura numa linha fina).
 */
function bodyProfile(model: CeramicProfile): { pts: P[]; iWall0: number; iArcEnd: number } {
  const pts: P[] = [];
  // Base lisa e fechada, sem anel ou relevo.
  const baseR = profileRadius(model, 0);
  pts.push([0, 0.025]);
  pts.push([baseR * 0.85, 0.025]);
  pts.push([baseR * 0.943, 0.025]);
  pts.push([baseR * 0.982, 0.07]);
  pts.push([baseR, 0.16]);
  // duplicata: a partir daqui o UV segue a altura (a arte pode envolver o chanfro do pé)
  const iWall0 = pts.length;
  pts.push([baseR, 0.16]);
  // ---- paredes externas independentes por tipo de cerâmica ----
  pts.push(...WALL_KNOTS.map(([, y]) => [profileRadius(model, y / 9.35), y] as P));
  // Borda esmaltada com raio de ~1,55 mm e parede de ~3,1 mm.
  const topR = profileRadius(model, 1);
  pts.push(...arcPoints(topR - 0.155, 9.35, 0.155, 0, Math.PI, 12).slice(1));
  const iArcEnd = pts.length - 1;
  pts.push([topR - 0.31, 9.35]); // UV constante no interior
  // ---- parede interna segue o perfil externo, mantendo espessura física ----
  pts.push([profileRadius(model, 8.4 / 9.35) - 0.34, 8.4]);
  pts.push([profileRadius(model, 6.0 / 9.35) - 0.34, 6.0]);
  pts.push([profileRadius(model, 3.4 / 9.35) - 0.34, 3.4]);
  pts.push([profileRadius(model, 1.7 / 9.35) - 0.34, 1.7]);
  // ---- canto interno e piso interno ----
  pts.push([baseR - 0.52, 1.02]);
  pts.push([Math.max(0.5, baseR - 1), 0.92]);
  pts.push([Math.max(0.5, baseR - 2), 0.9]);
  pts.push([Math.max(0.5, baseR - 3), 0.9]);
  pts.push([0, 0.9]);
  return { pts, iWall0, iArcEnd };
}

/**
 * @param _area mantido por compatibilidade: a geometria NÃO depende mais da
 * área de impressão (a arte é limitada pela textura, não pelo modelo 3D).
 */
export function buildMugBodyGeometry(_area?: PrintArea, model: CeramicProfile = "classic"): THREE.BufferGeometry {
  const { pts, iWall0, iArcEnd } = bodyProfile(model);
  const N = pts.length;
  const geo = new THREE.LatheGeometry(
    pts.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.0001), y)),
    MUG.segments,
  );

  // UVs: u contínuo em volta (a costura do Lathe é duplicada, sem salto) com
  // a FRENTE da caneca no meio da textura; v linear com a altura na parede.
  // Pé/fundo → faixa exterior; interior → faixa interior (cores sólidas).
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uvAttr = geo.attributes.uv as THREE.BufferAttribute;
  for (let k = 0; k < pos.count; k++) {
    const j = k % N; // vértices do Lathe: i * N + j
    const u = uvAttr.getX(k) + 0.5; // textura com RepeatWrapping
    let v: number;
    if (j < iWall0) v = V_EXT;
    else if (j <= iArcEnd) v = texV(pos.getY(k));
    else v = V_INT;
    uvAttr.setXY(k, u, v);
  }
  uvAttr.needsUpdate = true;

  geo.computeVertexNormals();
  return geo;
}

/**
 * Alça em "C" clássico: varredura de seção ELÍPTICA ao longo de curva suave
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
      "catmullrom",
      0.5,
    );
  }
  return handleCurve;
}

/** semi-eixos da seção elíptica da alça */
export const HANDLE_A_X = 0.76; // largura (X)
export const HANDLE_B_N = 0.57; // espessura no plano da curva

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

  const tubular = 112;
  const radial = 32;
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
      const n = new THREE.Vector3(
        ox / (aX * aX),
        (perp.y * on) / (bN * bN),
        (perp.z * on) / (bN * bN),
      ).normalize();
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
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  return geo;
}

/**
 * Pedestal redondo premium com bordas arredondadas (bevel) — usado no
 * modo de chão "Podium". O raio acompanha o tamanho do grupo de canecas.
 */
export function buildPedestalGeometry(
  radius: number,
  height: number,
): THREE.BufferGeometry {
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

/** prato redondo de cerâmica (base redonda) */
export function buildRoundPlateGeometry(
  radius: number,
  height: number,
): THREE.BufferGeometry {
  const bev = Math.min(0.22, height * 0.35);
  const r = Math.max(4.5, radius);
  const pts: THREE.Vector2[] = [
    new THREE.Vector2(0.0001, 0),
    new THREE.Vector2(r * 0.9, 0),
    new THREE.Vector2(r - bev * 0.35, 0.015),
    new THREE.Vector2(r, bev),
    new THREE.Vector2(r, height - bev * 0.4),
    new THREE.Vector2(r - bev * 0.4, height),
    new THREE.Vector2(0.0001, height),
  ];
  const geo = new THREE.LatheGeometry(pts, 96);
  geo.computeVertexNormals();
  return geo;
}

/** placa quadrada com cantos arredondados (base quadrada) */
export function buildSquarePlateGeometry(
  size: number,
  height: number,
): THREE.BufferGeometry {
  const half = Math.max(5, size) / 2;
  const bev = Math.min(0.28, height * 0.42);
  const shape = new THREE.Shape();
  const r = Math.min(bev, half * 0.2);
  shape.moveTo(-half + r, -half);
  shape.lineTo(half - r, -half);
  shape.quadraticCurveTo(half, -half, half, -half + r);
  shape.lineTo(half, half - r);
  shape.quadraticCurveTo(half, half, half - r, half);
  shape.lineTo(-half + r, half);
  shape.quadraticCurveTo(-half, half, -half, half - r);
  shape.lineTo(-half, -half + r);
  shape.quadraticCurveTo(-half, -half, -half + r, -half);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.05, height - bev * 2),
    bevelEnabled: true,
    bevelThickness: bev,
    bevelSize: bev,
    bevelSegments: 3,
    curveSegments: 12,
  });
  geo.rotateX(-Math.PI / 2); // deita a placa (extrusão é em +Z)
  // normaliza: assenta no chão (y: 0..height) e centra em XZ
  geo.computeBoundingBox();
  const bb = geo.boundingBox!;
  geo.translate(
    -((bb.max.x + bb.min.x) / 2),
    -bb.min.y,
    -((bb.max.z + bb.min.z) / 2),
  );
  geo.computeVertexNormals();
  return geo;
}
