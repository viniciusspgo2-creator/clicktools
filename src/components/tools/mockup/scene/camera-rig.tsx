/* ============================================================
   Câmera: lente configurável, OrbitControls com inércia,
   presets com transição animada, foco por duplo clique / tecla F.
   ============================================================ */

'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { useMockupStore } from '../state/store';
import { CAMERA_PRESETS, lensToFov } from '../lib/config';
import { mugsGroup, studioRefs } from './studio-refs';

type Anim = {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  t0: number;
  dur: number;
};

/** bus de foco (duplo clique na caneca / tecla F) */
let focusHandler: ((point: THREE.Vector3 | null) => void) | null = null;
export function focusOn(point: THREE.Vector3 | null) {
  focusHandler?.(point);
}

const MUG_CENTER = new THREE.Vector3(0, 4.75, 0);
const MUG_RADIUS = 7.6; // bounding aproximado com alça

/** aplica a lente na câmera three (mutação intencional do objeto 3D) */
function applyLens(camera: THREE.PerspectiveCamera, lensMm: number) {
  camera.fov = lensToFov(lensMm);
  camera.updateProjectionMatrix();
}

/** bounding esférico de todas as canecas (hero + acompanhantes) */
function mugsBounding(scene: THREE.Scene | undefined): { center: THREE.Vector3; radius: number } {
  const group = scene ? mugsGroup(scene) : null;
  if (!group) return { center: MUG_CENTER.clone(), radius: MUG_RADIUS };
  const box = new THREE.Box3().setFromObject(group);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  return { center: sphere.center, radius: Math.max(MUG_RADIUS * 0.8, sphere.radius * 1.05) };
}

export function CameraRig() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const lens = useMockupStore((s) => s.camera.lens);
  const autoRotate = useMockupStore((s) => s.camera.autoRotate);
  const autoRotateSpeed = useMockupStore((s) => s.camera.autoRotateSpeed);
  const presetRequest = useMockupStore((s) => s.presetRequest);
  const focusNonce = useMockupStore((s) => s.focusNonce);
  const fitNonce = useMockupStore((s) => s.fitNonce);
  const [anim, setAnim] = useState<Anim | null>(null);

  // hook de depuração (útil para suporte e testes)
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__mugCam = camera;
  }, [camera]);

  // registra controls + bounding para os exportadores
  useEffect(() => {
    studioRefs.controls = controlsRef.current;
    return () => {
      studioRefs.controls = undefined;
    };
  }, []);

  // lente
  useEffect(() => {
    applyLens(camera, lens);
  }, [camera, lens]);

  // registra handler de foco
  useEffect(() => {
    focusHandler = (point) => {
      const controls = controlsRef.current;
      if (!controls) return;
      const target = point ? point.clone() : mugsBounding(scene).center;
      // enquadra a caneca: aproxima ao raio de enquadramento
      const vFov = THREE.MathUtils.degToRad(camera.fov);
      const dist = mugsBounding(scene).radius / Math.sin(vFov / 2) * 0.72;
      const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
      const pos = target.clone().add(dir.multiplyScalar(point ? Math.min(dist, camera.position.distanceTo(controls.target)) : dist));
      setAnim({
        fromPos: camera.position.clone(),
        toPos: pos,
        fromTarget: controls.target.clone(),
        toTarget: target,
        t0: performance.now(),
        dur: 700,
      });
    };
    return () => {
      focusHandler = null;
    };
  }, [camera, scene]);

  // preset de câmera
  useEffect(() => {
    if (!presetRequest) return;
    setAnim({
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(...presetRequest.pos),
      fromTarget: controlsRef.current ? controlsRef.current.target.clone() : MUG_CENTER.clone(),
      toTarget: new THREE.Vector3(...presetRequest.target),
      t0: performance.now(),
      dur: 850,
    });
  }, [presetRequest, camera]);

  // "Enquadrar tudo": aproxima/afasta para o grupo inteiro caber no quadro
  useEffect(() => {
    if (!fitNonce) return;
    const controls = controlsRef.current;
    if (!controls) return;
    const { center, radius } = mugsBounding(scene);
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const aspect = (gl.getSize(new THREE.Vector2()).x || 1) / (gl.getSize(new THREE.Vector2()).y || 1);
    const hHalf = Math.atan(Math.tan(vFov / 2) * aspect);
    const dist = Math.min(90, (radius / Math.sin(Math.min(vFov / 2, hHalf))) * 1.12);
    const dir = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    setAnim({
      fromPos: camera.position.clone(),
      toPos: center.clone().addScaledVector(dir, dist),
      fromTarget: controls.target.clone(),
      toTarget: center.clone(),
      t0: performance.now(),
      dur: 800,
    });
  }, [fitNonce, scene, camera]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    if (anim) {
      const k = Math.min(1, (performance.now() - anim.t0) / anim.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; // easeInOutCubic
      camera.position.lerpVectors(anim.fromPos, anim.toPos, e);
      controls.target.lerpVectors(anim.fromTarget, anim.toTarget, e);
      if (k >= 1) {
        setAnim(null);
      }
      controls.update();
    } else {
      // clamp do pan
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, -6, 6);
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0.5, 12);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, -6, 6);
    }
  });

  // perda de foco de contexto WebGL — nada a fazer aqui, tratado no Canvas

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan
      screenSpacePanning
      minDistance={6.5}
      maxDistance={95}
      maxPolarAngle={1.54}
      autoRotate={autoRotate && !anim}
      autoRotateSpeed={autoRotateSpeed}
      target={[0, 4.7, 0]}
    />
  );
}
