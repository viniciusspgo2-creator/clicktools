/* ============================================================
   Componente da caneca — corpo + alça + materiais PBR + textura
   (+ canecas acompanhantes para cenas multi-canecas)
   Com suporte a: chão pedestal (apoio), modo flutuante (animação
   leve de sobe-e-desce, parada durante exportações) e foco.
   ============================================================ */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useMockupStore, type ArtState, type CompanionMug, type MugState } from '../state/store';
import { buildHandleGeometry, buildMugBodyGeometry } from './mug-geometry';
import { canvasHeightFor, makeArtTexture, renderArtCanvas } from '../lib/art-canvas';
import { CANVAS_W_PREVIEW, FLOAT_LIFT, PEDESTAL_H, PLATE_H, resolvePrintArea } from '../lib/config';
import { floatPhaseFor } from './studio';
import { studioRefs } from './studio-refs';

/** micro-ruído para irregularidade do esmalte (bumpMap sutil) */
function makeNoiseTexture(): THREE.CanvasTexture {
  const S = 256;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 122 + Math.random() * 12;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  return t;
}

interface MugMeshProps {
  bodyGeo: THREE.BufferGeometry;
  handleGeo: THREE.BufferGeometry;
  noiseTex: THREE.CanvasTexture;
  texture: THREE.CanvasTexture;
  accent: string;
  envIntensity: number;
  name?: string;
}

function MugMesh({ bodyGeo, handleGeo, noiseTex, texture, accent, envIntensity, name }: MugMeshProps) {
  const bodyMat = useRef<THREE.MeshPhysicalMaterial>(null!);
  const handleMat = useRef<THREE.MeshPhysicalMaterial>(null!);

  useEffect(() => {
    if (bodyMat.current) bodyMat.current.envMapIntensity = 0.35 + 0.85 * envIntensity;
    if (handleMat.current) handleMat.current.envMapIntensity = 0.35 + 0.85 * envIntensity;
  }, [envIntensity]);

  return (
    <>
      <mesh geometry={bodyGeo} castShadow receiveShadow name={name}>
        <meshPhysicalMaterial
          ref={bodyMat}
          map={texture}
          bumpMap={noiseTex}
          bumpScale={0.0011}
          roughness={0.16}
          metalness={0}
          clearcoat={0.9}
          clearcoatRoughness={0.12}
          envMapIntensity={1.05}
          specularIntensity={0.5}
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh geometry={handleGeo} castShadow>
        <meshPhysicalMaterial
          ref={handleMat}
          color={accent}
          roughness={0.18}
          metalness={0}
          clearcoat={0.9}
          clearcoatRoughness={0.14}
          envMapIntensity={1.05}
        />
      </mesh>
    </>
  );
}

/** altura de apoio da caneca conforme o chão (pedestal/base sobem, flutuante levanta) */
function baseYFor(floor: string, posY: number): number {
  if (floor === 'pedestal') return PEDESTAL_H + posY;
  if (floor === 'base-redonda' || floor === 'base-quadrada') return PLATE_H + posY;
  if (floor === 'flutuante') return FLOAT_LIFT + posY;
  return posY;
}

/** estado "efetivo" de render da folha para uma acompanhante */
function companionMugState(mug: MugState, c: CompanionMug): MugState {
  return {
    ...mug,
    variant: c.variant,
    accentColor: c.accentColor,
    magicHeat: c.magicHeat,
  };
}

function CompanionView({
  companion,
  art,
  area,
  bodyGeo,
  handleGeo,
  noiseTex,
  envIntensity,
}: {
  companion: CompanionMug;
  art: ArtState;
  area: ReturnType<typeof resolvePrintArea>;
  bodyGeo: THREE.BufferGeometry;
  handleGeo: THREE.BufferGeometry;
  noiseTex: THREE.CanvasTexture;
  envIntensity: number;
}) {
  const gl = useThree((s) => s.gl);
  const heroMug = useMockupStore((s) => s.mug);
  const floor = useMockupStore((s) => s.bg.floor);
  const floatAnim = useMockupStore((s) => s.bg.floatAnim);
  const groupRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => floatPhaseFor(companion.id), [companion.id]);

  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = CANVAS_W_PREVIEW;
    c.height = canvasHeightFor(CANVAS_W_PREVIEW, area);
    return c;
  }, []);
  const texture = useMemo(() => makeArtTexture(canvas, gl.capabilities.getMaxAnisotropy()), [canvas, gl]);

  const effArt = companion.showArt ? art : { ...art, imageId: null, name: '', width: 0, height: 0 };
  const effMug = useMemo(() => companionMugState(heroMug, companion), [heroMug, companion]);

  useEffect(() => {
    if (canvas.height !== canvasHeightFor(CANVAS_W_PREVIEW, area)) {
      canvas.height = canvasHeightFor(CANVAS_W_PREVIEW, area);
    }
    renderArtCanvas(canvas, effArt, effMug, area);
    texture.needsUpdate = true;
  }, [effArt, effMug, canvas, texture, area]);

  // blindagem: se o contexto WebGL cair e for restaurado (driver/GPU fraca
  // durante exportações pesadas), redesenha a folha e re-sobe a textura —
  // sem isso a caneca ficaria branca até o usuário mexer em algo
  useEffect(() => {
    const onRestored = () => {
      const st = useMockupStore.getState();
      const a = companion.showArt ? st.art : { ...st.art, imageId: null };
      renderArtCanvas(canvas, a, companionMugState(st.mug, companion), area);
      texture.needsUpdate = true;
    };
    gl.domElement.addEventListener('webglcontextrestored', onRestored);
    return () => gl.domElement.removeEventListener('webglcontextrestored', onRestored);
  }, [gl, canvas, texture, area, companion]);

  useEffect(() => () => texture.dispose(), [texture]);

  const accent = companion.variant === 'white' ? '#ffffff' : companion.accentColor;
  const baseY = baseYFor(floor, 0);

  // flutuação leve (só preview — exportações saem paradas) + refresh da folha
  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (g) {
      g.userData.baseY = baseY;
      if (floor === 'flutuante' && floatAnim && !studioRefs.exporting) {
        g.position.y = baseY + Math.sin(clock.elapsedTime * 1.35 + phase) * 0.2;
      } else {
        g.position.y = baseY;
      }
    }
    if ((studioRefs.artRefreshFrames ?? 0) > 0 && !studioRefs.exporting) {
      const st = useMockupStore.getState();
      renderArtCanvas(canvas, companion.showArt ? st.art : { ...st.art, imageId: null }, companionMugState(st.mug, companion));
      texture.needsUpdate = true;
    }
  });

  return (
    <group
      ref={groupRef}
      name="mug-float"
      position={[companion.posX, baseY, companion.posZ]}
      rotation={[0, THREE.MathUtils.degToRad(-companion.rotationY), 0]}
      scale={companion.scale}
      onDoubleClick={(e) => {
        e.stopPropagation();
        import('./camera-rig').then((m) => m.focusOn(e.point));
      }}
    >
      <MugMesh
        bodyGeo={bodyGeo}
        handleGeo={handleGeo}
        noiseTex={noiseTex}
        texture={texture}
        accent={accent}
        envIntensity={envIntensity}
        name="mug-body-comp"
      />
    </group>
  );
}

export function Mug() {
  const gl = useThree((s) => s.gl);
  const art = useMockupStore((s) => s.art);
  const mug = useMockupStore((s) => s.mug);
  const companions = useMockupStore((s) => s.companions);
  const envIntensity = useMockupStore((s) => s.light.envIntensity);
  const floor = useMockupStore((s) => s.bg.floor);
  const floatAnim = useMockupStore((s) => s.bg.floatAnim);
  const heroRef = useRef<THREE.Group>(null);

  // área de impressão ativa (muda com o painel Arte)
  const area = useMemo(() => resolvePrintArea(art), [art.areaMode, art.areaW, art.areaH, art.areaY]);

  // geometria fixa — a área de impressão só muda a textura (sem anéis/fronteiras no 3D)
  const bodyGeo = useMemo(() => buildMugBodyGeometry(), []);
  const handleGeo = useMemo(() => buildHandleGeometry(), []);
  const noiseTex = useMemo(() => makeNoiseTexture(), []);

  useEffect(() => () => bodyGeo.dispose(), [bodyGeo]);

  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = CANVAS_W_PREVIEW;
    c.height = canvasHeightFor(CANVAS_W_PREVIEW, area);
    return c;
  }, []);
  const texture = useMemo(() => makeArtTexture(canvas, gl.capabilities.getMaxAnisotropy()), [canvas, gl]);

  // redesenha a folha quando arte/caneca/área mudam
  useEffect(() => {
    if (canvas.height !== canvasHeightFor(CANVAS_W_PREVIEW, area)) {
      canvas.height = canvasHeightFor(CANVAS_W_PREVIEW, area);
    }
    renderArtCanvas(canvas, art, mug, area);
    texture.needsUpdate = true;
  }, [art, mug, canvas, texture, area]);

  // blindagem: contexto WebGL restaurado (queda de driver/GPU fraca durante
  // exportações) → redesenha a folha e re-sobe a textura na hora
  useEffect(() => {
    const onRestored = () => {
      const st = useMockupStore.getState();
      if (canvas.height !== canvasHeightFor(CANVAS_W_PREVIEW, area)) {
        canvas.height = canvasHeightFor(CANVAS_W_PREVIEW, area);
      }
      renderArtCanvas(canvas, st.art, st.mug, area);
      texture.needsUpdate = true;
    };
    gl.domElement.addEventListener('webglcontextrestored', onRestored);
    return () => gl.domElement.removeEventListener('webglcontextrestored', onRestored);
  }, [gl, canvas, texture, area]);

  useEffect(
    () => () => {
      handleGeo.dispose();
      noiseTex.dispose();
      texture.dispose();
    },
    [handleGeo, noiseTex, texture],
  );

  const accent = mug.variant === 'white' ? '#ffffff' : mug.accentColor;
  const baseY = baseYFor(floor, mug.posY);

  // flutuação leve da caneca principal + refresh assistido da folha
  useFrame(({ clock }) => {
    const g = heroRef.current;
    if (g) {
      g.userData.baseY = baseY;
      if (floor === 'flutuante' && floatAnim && !studioRefs.exporting) {
        g.position.y = baseY + Math.sin(clock.elapsedTime * 1.35) * 0.2;
      } else {
        g.position.y = baseY;
      }
    }
    // pós-exportação: redesenha a folha por alguns frames — o primeiro frame
    // com o contexto WebGL realmente restaurado re-sobe a textura
    if ((studioRefs.artRefreshFrames ?? 0) > 0 && !studioRefs.exporting) {
      studioRefs.artRefreshFrames = (studioRefs.artRefreshFrames ?? 0) - 1;
      const st = useMockupStore.getState();
      renderArtCanvas(canvas, st.art, st.mug, area);
      texture.needsUpdate = true;
    }
  });

  return (
    <group name="mockup-mugs">
      <group
        ref={heroRef}
        name="mug-float"
        position={[0, baseY, 0]}
        rotation={[
          THREE.MathUtils.degToRad(mug.tiltX),
          THREE.MathUtils.degToRad(-mug.rotationY),
          THREE.MathUtils.degToRad(mug.tiltZ),
        ]}
        scale={mug.scale}
        onDoubleClick={(e) => {
          e.stopPropagation();
          import('./camera-rig').then((m) => m.focusOn(e.point));
        }}
      >
        <MugMesh
          bodyGeo={bodyGeo}
          handleGeo={handleGeo}
          noiseTex={noiseTex}
          texture={texture}
          accent={accent}
          envIntensity={envIntensity}
          name="mug-body"
        />
      </group>

      {companions.map((c) => (
        <CompanionView
          key={c.id}
          companion={c}
          art={art}
          area={area}
          bodyGeo={bodyGeo}
          handleGeo={handleGeo}
          noiseTex={noiseTex}
          envIntensity={envIntensity}
        />
      ))}
    </group>
  );
}
