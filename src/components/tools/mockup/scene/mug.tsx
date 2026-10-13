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
import { CANVAS_W_PREVIEW, FLOAT_LIFT, PEDESTAL_H } from '../lib/config';
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
    const v = 118 + Math.random() * 20;
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
          bumpScale={0.0016}
          roughness={0.16}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.07}
          envMapIntensity={1.2}
          specularIntensity={0.85}
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh geometry={handleGeo} castShadow>
        <meshPhysicalMaterial
          ref={handleMat}
          color={accent}
          roughness={0.18}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.09}
          envMapIntensity={1.2}
        />
      </mesh>
    </>
  );
}

/** altura de apoio da caneca conforme o chão (pedestal sobe, flutuante levanta) */
function baseYFor(floor: string, posY: number): number {
  if (floor === 'pedestal') return PEDESTAL_H + posY;
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
  bodyGeo,
  handleGeo,
  noiseTex,
  envIntensity,
}: {
  companion: CompanionMug;
  art: ArtState;
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
    c.height = canvasHeightFor(CANVAS_W_PREVIEW);
    return c;
  }, []);
  const texture = useMemo(() => makeArtTexture(canvas, gl.capabilities.getMaxAnisotropy()), [canvas, gl]);

  const effArt = companion.showArt ? art : { ...art, imageId: null, name: '', width: 0, height: 0 };
  const effMug = useMemo(() => companionMugState(heroMug, companion), [heroMug, companion]);

  useEffect(() => {
    renderArtCanvas(canvas, effArt, effMug);
    texture.needsUpdate = true;
  }, [effArt, effMug, canvas, texture]);

  useEffect(() => () => texture.dispose(), [texture]);

  const accent = companion.variant === 'white' ? '#ffffff' : companion.accentColor;
  const baseY = baseYFor(floor, 0);

  // flutuação leve (só preview — exportações saem paradas)
  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    g.userData.baseY = baseY;
    if (floor === 'flutuante' && floatAnim && !studioRefs.exporting) {
      g.position.y = baseY + Math.sin(clock.elapsedTime * 1.35 + phase) * 0.2;
    } else {
      g.position.y = baseY;
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

  const bodyGeo = useMemo(() => buildMugBodyGeometry(), []);
  const handleGeo = useMemo(() => buildHandleGeometry(), []);
  const noiseTex = useMemo(() => makeNoiseTexture(), []);

  const canvas = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = CANVAS_W_PREVIEW;
    c.height = canvasHeightFor(CANVAS_W_PREVIEW);
    return c;
  }, []);
  const texture = useMemo(() => makeArtTexture(canvas, gl.capabilities.getMaxAnisotropy()), [canvas, gl]);

  // redesenha a folha quando arte/caneca mudam
  useEffect(() => {
    renderArtCanvas(canvas, art, mug);
    texture.needsUpdate = true;
  }, [art, mug, canvas, texture]);

  useEffect(
    () => () => {
      bodyGeo.dispose();
      handleGeo.dispose();
      noiseTex.dispose();
      texture.dispose();
    },
    [bodyGeo, handleGeo, noiseTex, texture],
  );

  const accent = mug.variant === 'white' ? '#ffffff' : mug.accentColor;
  const baseY = baseYFor(floor, mug.posY);

  // flutuação leve da caneca principal
  useFrame(({ clock }) => {
    const g = heroRef.current;
    if (!g) return;
    g.userData.baseY = baseY;
    if (floor === 'flutuante' && floatAnim && !studioRefs.exporting) {
      g.position.y = baseY + Math.sin(clock.elapsedTime * 1.35) * 0.2;
    } else {
      g.position.y = baseY;
    }
  });

  return (
    <group name="mockup-mugs">
      <group
        ref={heroRef}
        name="mug-float"
        position={[0, baseY, 0]}
        rotation={[THREE.MathUtils.degToRad(mug.tiltX), THREE.MathUtils.degToRad(-mug.rotationY), 0]}
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
          bodyGeo={bodyGeo}
          handleGeo={handleGeo}
          noiseTex={noiseTex}
          envIntensity={envIntensity}
        />
      ))}
    </group>
  );
}
