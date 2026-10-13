/* ============================================================
   Estúdio: iluminação (Environment + Lightformers + luzes reais),
   fundos (gradiente/estúdios/transparente), chão e sombras.
   ============================================================ */

'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { ContactShadows, Environment, Lightformer } from '@react-three/drei';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { useMockupStore } from '../state/store';
import { LIGHT_PRESETS, kelvinToRgb, detectMobile } from '../lib/config';

let rectAreaReady = false;
function ensureRectArea() {
  if (!rectAreaReady) {
    RectAreaLightUniformsLib.init();
    rectAreaReady = true;
  }
}

const rgbCss = ([r, g, b]: [number, number, number]) =>
  `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;

/* ---------------- Luzes ---------------- */

export function StudioLights() {
  const light = useMockupStore((s) => s.light);
  const castShadow = useMockupStore((s) => s.bg.castShadow);
  const mobile = useMemo(() => detectMobile(), []);
  const preset = LIGHT_PRESETS.find((p) => p.id === light.preset) ?? LIGHT_PRESETS[0];
  ensureRectArea();

  const keyPos = useMemo(() => {
    const [x, y, z] = preset.keyDir;
    const a = THREE.MathUtils.degToRad(light.rotation);
    return new THREE.Vector3(x, y, z).applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
  }, [preset.keyDir, light.rotation]);

  const keyColor = useMemo(() => rgbCss(kelvinToRgb(preset.keyTemp + light.temperature)), [preset, light.temperature]);
  const fillColor = useMemo(() => rgbCss(kelvinToRgb(preset.fillTemp + light.temperature)), [preset, light.temperature]);
  const rimColor = useMemo(() => rgbCss(kelvinToRgb(preset.rimTemp + light.temperature)), [preset, light.temperature]);

  // Environment reconstruído apenas em mudanças discretas (preset/rotação grossa)
  const envKey = `${preset.id}-${Math.round(light.rotation / 6) * 6}-${Math.round(light.intensity * 10)}`;

  return (
    <>
      <ambientLight intensity={0.07} />
      {/* luz chave com sombra suave */}
      <directionalLight
        position={keyPos.toArray()}
        intensity={preset.keyInt * light.intensity * 2.4}
        color={keyColor}
        castShadow={castShadow}
        shadow-mapSize-width={mobile ? 1024 : 2048}
        shadow-mapSize-height={mobile ? 1024 : 2048}
        shadow-radius={1 + light.softness * 7}
        shadow-bias={-0.0002}
        shadow-normalBias={0.03}
      >
        <orthographicCamera attach="shadow-camera" args={[-9, 9, 12, -2, 0.5, 60]} />
      </directionalLight>
      {/* preenchimento */}
      <directionalLight
        position={[keyPos.x * -0.9, 7, keyPos.z * 0.6]}
        intensity={preset.fillInt * light.intensity * 1.8}
        color={fillColor}
      />
      {/* recorte (rim) atrás */}
      <directionalLight
        position={[keyPos.x * 0.4, 9, keyPos.z * -1.4]}
        intensity={preset.rimInt * light.intensity * 2}
        color={rimColor}
      />
      {/* softbox retangular real — reflexo de janela na porcelana */}
      <rectAreaLight
        position={[keyPos.x * 0.7, 8.5, keyPos.z * 0.9 + 2]}
        width={7}
        height={10}
        intensity={preset.keyInt * light.intensity * 2.6}
        color={keyColor}
        onUpdate={(self) => self.lookAt(0, 4.5, 0)}
      />

      {/* ambiente de estúdio procedural (softboxes refletem no verniz) */}
      <Environment key={envKey} resolution={mobile ? 256 : 512} frames={1} background={false}>
        <group rotation={[0, THREE.MathUtils.degToRad(Math.round(light.rotation / 6) * 6), 0]}>
          {/* softbox principal */}
          <Lightformer
            form="rect"
            intensity={2.6 * preset.env * light.intensity}
            color={keyColor}
            position={[-4, 6, 7]}
            scale={[9, 6, 1]}
            target={[0, 3.5, 0]}
          />
          {/* preenchedor vertical */}
          <Lightformer
            form="rect"
            intensity={1.1 * preset.env * light.intensity}
            color={fillColor}
            position={[7, 4, 2]}
            scale={[4, 9, 1]}
            target={[0, 3.5, 0]}
          />
          {/* recorte traseiro */}
          <Lightformer
            form="rect"
            intensity={1.8 * preset.env * light.intensity}
            color={rimColor}
            position={[-2, 7, -8]}
            scale={[10, 3, 1]}
            target={[0, 4, 0]}
          />
          {/* teto suave */}
          <Lightformer
            form="rect"
            intensity={1.5 * preset.env * light.intensity}
            color="#ffffff"
            position={[0, 11, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[12, 12, 1]}
          />
          {/* faixa de chão clara (luz refletida) */}
          <Lightformer
            form="rect"
            intensity={0.7 * preset.env * light.intensity}
            color="#fff6ec"
            position={[0, -0.5, 4]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[10, 8, 1]}
          />
        </group>
      </Environment>
    </>
  );
}

/* ---------------- Fundo ---------------- */

const backdropVert = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const backdropFrag = /* glsl */ `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform vec3 uDir;
  varying vec3 vPos;
  void main() {
    vec3 d = normalize(vPos);
    float t = clamp(dot(d, normalize(uDir)) * 0.5 + 0.5, 0.0, 1.0);
    t = smoothstep(0.08, 0.92, t);
    vec3 col = mix(uB, uA, t);
    gl_FragColor = vec4(col, 1.0);
  }
`;

function hexToVec(hex: string): THREE.Color {
  return new THREE.Color(hex).convertSRGBToLinear();
}

export function Backdrop() {
  const bg = useMockupStore((s) => s.bg);

  const { uA, uB, uDir } = useMemo(() => {
    let a = '#ffffff';
    let b = '#e8e2d9';
    let dirAngleDeg = 90;
    if (bg.type === 'studio-white') {
      a = '#ffffff';
      b = '#ddd7cc';
      dirAngleDeg = 90;
    } else if (bg.type === 'studio-dark') {
      a = '#2b2721';
      b = '#060505';
      dirAngleDeg = 90;
    } else if (bg.type === 'gradient') {
      a = bg.colorA;
      b = bg.colorB;
      dirAngleDeg = bg.angle;
    } else if (bg.type === 'solid') {
      a = bg.colorB;
      b = bg.colorB;
    }
    const aRad = THREE.MathUtils.degToRad(dirAngleDeg);
    const dir = new THREE.Vector3(Math.cos(aRad) * 0.45, 1, Math.sin(aRad) * 0.45).normalize();
    return { uA: a, uB: b, uDir: dir };
  }, [bg]);

  const uniforms = {
    uA: { value: hexToVec(uA) },
    uB: { value: hexToVec(uB) },
    uDir: { value: uDir },
  };

  if (bg.type === 'transparent') return null;

  return (
    <>
      <mesh name="backdrop" scale={70}>
        <sphereGeometry args={[1, 48, 32]} />
        <shaderMaterial
          vertexShader={backdropVert}
          fragmentShader={backdropFrag}
          uniforms={uniforms}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      {bg.type === 'studio-dark' || bg.type === 'solid' ? <GlowBoard /> : null}
    </>
  );
}

/** brilho suave atrás da caneca (look premium no fundo escuro) */
function GlowBoard() {
  const tex = useMemo(() => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,178,128,0.55)');
    g.addColorStop(0.45, 'rgba(232,112,58,0.18)');
    g.addColorStop(1, 'rgba(232,112,58,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  return (
    <mesh name="glowboard" position={[0, 6, -28]}>
      <planeGeometry args={[38, 26]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* ---------------- Chão + sombras ---------------- */

export function Ground() {
  const bg = useMockupStore((s) => s.bg);
  const envIntensity = useMockupStore((s) => s.light.envIntensity);

  const color = useMemo(() => {
    switch (bg.type) {
      case 'studio-white':
        return '#efebe3';
      case 'studio-dark':
        return '#0b0a09';
      case 'gradient':
        return bg.colorB;
      case 'solid':
        return bg.colorB;
      default:
        return '#111111';
    }
  }, [bg]);

  if (bg.type === 'transparent') {
    return (
      <mesh name="ground" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[16, 64]} />
        <shadowMaterial transparent opacity={0.32} />
      </mesh>
    );
  }

  return (
    <mesh name="ground" rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <circleGeometry args={[16, 64]} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0} envMapIntensity={0.25 + envIntensity * 0.3} />
    </mesh>
  );
}

export function StudioContactShadows() {
  const enabled = useMockupStore((s) => s.bg.contactShadow);
  const softness = useMockupStore((s) => s.light.softness);
  const mobile = useMemo(() => detectMobile(), []);
  if (!enabled) return null;
  return (
    <ContactShadows
      position={[0, 0.002, 0]}
      opacity={0.48}
      scale={15}
      blur={2.2 + softness * 2.4}
      far={3.4}
      resolution={mobile ? 256 : 512}
      color="#20140b"
      frames={Infinity}
    />
  );
}
