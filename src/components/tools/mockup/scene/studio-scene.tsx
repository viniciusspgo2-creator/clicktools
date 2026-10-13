/* ============================================================
   Canvas WebGL da cena — composição de tudo + tratamento de
   perda de contexto. Carregado via dynamic import (ssr: false).
   ============================================================ */

'use client';

import { Suspense, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { StudioLights, Backdrop, Ground, StudioContactShadows } from './studio';
import { Mug } from './mug';
import { CameraRig } from './camera-rig';
import { PostFX } from './postfx';
import { studioRefs } from './studio-refs';
import { lensToFov } from '../lib/config';
import { useMockupStore } from '../state/store';

function SceneContent() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const fxEnabled = useMockupStore((s) => s.fx.enabled);
  const exposure = useMockupStore((s) => s.fx.exposure);

  useEffect(() => {
    studioRefs.gl = gl;
    studioRefs.scene = scene;
    studioRefs.camera = camera;
    (window as unknown as Record<string, unknown>).__mugScene = scene;
    return () => {
      studioRefs.gl = undefined;
      studioRefs.scene = undefined;
      studioRefs.camera = undefined;
      delete (window as unknown as Record<string, unknown>).__mugScene;
    };
  }, [gl, scene, camera]);

  // exposição global (vale com e sem pós-processamento)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    gl.toneMappingExposure = 1.06 * exposure;
  }, [gl, exposure]);

  return (
    <>
      <Backdrop />
      <StudioLights />
      <Ground />
      <Mug />
      <StudioContactShadows />
      <CameraRig />
      {fxEnabled && <PostFX />}
    </>
  );
}

export default function StudioCanvas() {
  const [contextLost, setContextLost] = useState(false);

  return (
    <div className="relative h-full w-full">
      <Canvas
        shadows="soft"
        dpr={[1, 2]}
        frameloop="always"
        camera={{ position: [0, 5.8, 27], fov: lensToFov(50), near: 0.4, far: 250 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.06;
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault();
            setContextLost(true);
          });
          gl.domElement.addEventListener('webglcontextrestored', () => setContextLost(false));
        }}
      >
        <Suspense fallback={null}>
          <SceneContent />
        </Suspense>
      </Canvas>

      {contextLost && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="mx-4 max-w-sm rounded-2xl border border-white/10 bg-[#141110] p-6 text-center">
            <p className="font-display text-base font-bold text-white">Restaurando o 3D…</p>
            <p className="mt-2 text-sm text-neutral-400">
              O navegador interrompeu a placa de vídeo momentaneamente. Se a imagem não voltar em alguns
              segundos, recarregue a página.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
