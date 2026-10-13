/* ============================================================
   Componente da caneca — corpo + alça + materiais PBR + textura
   (+ canecas acompanhantes para cenas multi-canecas)
   ============================================================ */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { useMockupStore, type ArtState, type CompanionMug, type MugState } from '../state/store';
import { buildHandleGeometry, buildMugBodyGeometry } from './mug-geometry';
import { canvasHeightFor, makeArtTexture, renderArtCanvas } from '../lib/art-canvas';
import { CANVAS_W_PREVIEW } from '../lib/config';

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

  return (
    <group
      position={[companion.posX, 0, companion.posZ]}
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

  return (
    <group name="mockup-mugs">
      <group
        name="mockup-mug"
        position={[0, mug.posY, 0]}
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
