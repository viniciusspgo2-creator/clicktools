/* eslint-disable react-hooks/immutability -- Three.js GPU handles and transforms intentionally use the engine's imperative API. */
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { TransformControls } from "@react-three/drei";
import {
  useMockupStore,
  type ArtState,
  type MugState,
  type CompanionMug,
} from "../state/store";
import { buildModel, supportHeight } from "./model-geometry";
import { getArtImage } from "../lib/art-registry";
import {
  makeArtTexture,
  renderArtCanvas,
  canvasHeightFor,
  renderMetalMask,
} from "../lib/art-canvas";
import { NEUTRAL_ADJUSTMENTS } from "../lib/art-adjustments";
import { FLOAT_LIFT, PEDESTAL_H, PLATE_H, detectMobile } from "../lib/config";
import { studioRefs } from "./studio-refs";

function CeramicMaterial({
  texture,
  mug,
  metalMask,
  height,
}: {
  texture?: THREE.Texture;
  mug: MugState;
  metalMask?: THREE.Texture;
  height: number;
}) {
  const maps = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    for (let y = 0; y < 256; y++) {
      const v = y < 238 ? 255 - (y / 238) * 12 : y < 246 ? 235 : 180;
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(0, y, 64, 1);
    }
    const ao = new THREE.CanvasTexture(c);
    ao.colorSpace = THREE.NoColorSpace;
    const n = document.createElement("canvas");
    n.width = n.height = 64;
    const nc = n.getContext("2d")!;
    const image = nc.createImageData(64, 64);
    for (let i = 0; i < image.data.length; i += 4) {
      const v = 126 + (Math.sin(i * 13.13) * 0.5 + 0.5) * 5;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
    nc.putImageData(image, 0, 0);
    const bump = new THREE.CanvasTexture(n);
    bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
    return { ao, bump };
  }, []);
  useEffect(
    () => () => {
      maps.ao.dispose();
      maps.bump.dispose();
    },
    [maps],
  );
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      map: texture,
      roughness: mug.roughness ?? 0.16,
      clearcoat: mug.clearcoat ?? 1,
      clearcoatRoughness: 0.09,
      metalness: metalMask ? 1 : 0,
      metalnessMap: metalMask ?? null,
      aoMap: maps.ao,
      aoMapIntensity: 0.5,
      bumpMap: maps.bump,
      bumpScale: 0.002,
      specularIntensity: 0.6,
      envMapIntensity: mug.reflection ?? 0.8,
      toneMapped: !mug.faithfulColor || !!metalMask,
    });
    if (mug.faithfulColor && !metalMask) {
      m.onBeforeCompile = (shader) => {
        shader.vertexShader = `varying float vCeramicHeight; varying vec2 vCeramicUV;\n${shader.vertexShader}`.replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvCeramicHeight = position.y; vCeramicUV = uv;",
        );
        shader.fragmentShader = `varying float vCeramicHeight; varying vec2 vCeramicUV;\n${shader.fragmentShader}`;
        shader.fragmentShader = shader.fragmentShader.replace(
          "vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;",
          `vec3 shadingRatio = totalDiffuse / max(diffuseColor.rgb, vec3(0.0001));
     float formShade = clamp(dot(shadingRatio, vec3(0.2126,0.7152,0.0722)),0.0,1.0);
     vec3 outgoingLight = diffuseColor.rgb * (0.68 + 0.32 * formShade) + totalSpecular + totalEmissiveRadiance;
     // Interior occupies its own constant UV strip. Cavity shading belongs
     // there, so it never darkens the printed artwork or its white areas.
     if (vCeramicUV.y < 0.03) {
       float cavity = mix(0.42, 0.94, smoothstep(0.05, 1.0, vCeramicHeight / ${height.toFixed(3)}));
       outgoingLight = diffuseColor.rgb * (0.62 + 0.2 * formShade) * cavity + min(totalSpecular, vec3(0.08)) + totalEmissiveRadiance;
     }`,
        );
      };
      m.customProgramCacheKey = () => `clickgruda-faithful-v2-${height}`;
    }
    return m;
  }, [
    maps,
    texture,
    metalMask,
    mug.roughness,
    mug.clearcoat,
    mug.reflection,
    mug.faithfulColor,
    height,
  ]);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={material} attach="material" />;
}
function MugObject({
  id,
  mug,
  art,
  showArt = true,
}: {
  id: string;
  mug: MugState;
  art: ArtState;
  showArt?: boolean;
}) {
  const gl = useThree((s) => s.gl);
  const floor = useMockupStore((s) => s.bg.floor);
  const float = useMockupStore((s) => s.bg.floatAnim);
  const selected = useMockupStore((s) => s.selectedIds.includes(id));
  const tool = useMockupStore((s) => s.tool);
  const snap = useMockupStore((s) => s.snapEnabled);
  const compare = useMockupStore((s) => s.compareArt);
  const [object, setObject] = useState<THREE.Group | null>(null);
  const entryGroup = useRef<THREE.Group>(null);
  const dragArt = useRef<{ x: number; y: number; art: ArtState } | null>(null);
  const startPose = useRef<THREE.Vector3 | null>(null);
  const initialized = useRef(false);
  const entranceStart = useRef<number | null>(null);
  const model = useMemo(() => buildModel(mug.model), [mug.model]);
  useEffect(
    () => () => {
      model.body.dispose();
      model.handle.dispose();
    },
    [model],
  );
  const outline = useMemo(
    () =>
      new THREE.EdgesGeometry(
        new THREE.BoxGeometry(
          8.5,
          model.def.height,
          model.def.hasHandle ? 11.3 : 8.5,
        ),
      ),
    [model],
  );
  useEffect(() => () => outline.dispose(), [outline]);
  const canvas = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = detectMobile() ? 1536 : 2560;
    c.height = canvasHeightFor(c.width, undefined, mug.model);
    return c;
  }, [mug.model]);
  const texture = useMemo(
    () => makeArtTexture(canvas, gl.capabilities.getMaxAnisotropy()),
    [canvas, gl],
  );
  const metalMask = useMemo(() => {
    if (!art.metallic) return undefined;
    const c = document.createElement("canvas");
    c.width = canvas.width;
    c.height = canvas.height;
    renderMetalMask(c, art);
    const texture = new THREE.CanvasTexture(c);
    texture.wrapS = THREE.RepeatWrapping;
    texture.colorSpace = THREE.NoColorSpace;
    return texture;
  }, [art, canvas]);
  useEffect(() => () => metalMask?.dispose(), [metalMask]);
  const baseTexture = useMemo(() => {
    const entry = getArtImage(art.baseImageId ?? null);
    if (!entry) return null;
    const c = document.createElement("canvas");
    c.width = c.height = 1024;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = mug.baseColor ?? mug.bodyColor;
    ctx.fillRect(0, 0, 1024, 1024);
    const scale = Math.min(1024 / entry.width, 1024 / entry.height);
    const w = entry.width * scale,
      h = entry.height * scale;
    ctx.drawImage(entry.source, (1024 - w) / 2, (1024 - h) / 2, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [art.baseImageId, mug.baseColor, mug.bodyColor]);
  useEffect(() => () => baseTexture?.dispose(), [baseTexture]);
  const effective = useMemo(
    () => ({
      ...art,
      ...(compare ? NEUTRAL_ADJUSTMENTS : {}),
      ...(!showArt ? { imageId: null, text: "" } : {}),
    }),
    [art, compare, showArt],
  );
  useEffect(() => {
    renderArtCanvas(canvas, effective, mug);
    texture.needsUpdate = true;
  }, [canvas, effective, mug, texture]);
  useEffect(() => {
    const restored = () => {
      renderArtCanvas(canvas, effective, mug);
      texture.needsUpdate = true;
    };
    gl.domElement.addEventListener("webglcontextrestored", restored);
    return () =>
      gl.domElement.removeEventListener("webglcontextrestored", restored);
  }, [gl, canvas, texture, effective, mug]);
  useEffect(() => () => texture.dispose(), [texture]);
  const rotation = useMemo(
    () =>
      new THREE.Euler(
        THREE.MathUtils.degToRad(mug.tiltX ?? 0),
        THREE.MathUtils.degToRad(-mug.rotationY),
        THREE.MathUtils.degToRad(mug.tiltZ ?? 0),
      ),
    [mug.tiltX, mug.rotationY, mug.tiltZ],
  );
  const support = useMemo(
    () =>
      supportHeight(model.body, model.handle, rotation, model.def.hasHandle) *
      mug.scale,
    [model, rotation, mug.scale],
  );
  const base =
    (floor === "pedestal"
      ? PEDESTAL_H
      : floor.startsWith("base-")
        ? PLATE_H
        : floor === "flutuante"
          ? FLOAT_LIFT
          : 0) + (mug.posY ?? 0);
  useFrame(({ clock }, delta) => {
    if (!object) return;
    if (!initialized.current) {
      initialized.current = true;
      entranceStart.current = clock.elapsedTime;
    }
    if (entryGroup.current) {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const t =
        reduced || studioRefs.exporting
          ? 1
          : Math.min(
              1,
              (clock.elapsedTime - (entranceStart.current ?? 0)) / 1.25,
            );
      const e = 1 - Math.pow(1 - t, 3);
      entryGroup.current.position.y = (1 - e) * 5;
      entryGroup.current.rotation.y = (1 - e) * -0.75;
      entryGroup.current.scale.setScalar(0.82 + 0.18 * e);
    }
    if (
      !studioRefs.exporting &&
      floor === "flutuante" &&
      float &&
      tool === "select"
    )
      object.position.y =
        base + support + Math.sin(clock.elapsedTime * 1.35) * 0.18;
    if (studioRefs.artRefreshFrames && !studioRefs.exporting) {
      renderArtCanvas(canvas, effective, mug);
      texture.needsUpdate = true;
      if (id === "hero") studioRefs.artRefreshFrames--;
    }
  });
  const click = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (tool === "pan") return;
    useMockupStore.getState().select(id, e.shiftKey || e.ctrlKey || e.metaKey);
  };
  const startArt = (e: ThreeEvent<PointerEvent>) => {
    click(e);
    if (tool !== "art" || mug.locked) return;
    dragArt.current = { x: e.clientX, y: e.clientY, art };
    gl.domElement.setPointerCapture(e.pointerId);
    if (studioRefs.controls) studioRefs.controls.enabled = false;
  };
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragArt.current;
      if (!d) return;
      useMockupStore
        .getState()
        .patchObjectArt(id, {
          offsetX: d.art.offsetX + (e.clientX - d.x) / 500,
          offsetY: d.art.offsetY - (e.clientY - d.y) / 250,
        });
    };
    const end = () => {
      dragArt.current = null;
      if (studioRefs.controls) studioRefs.controls.enabled = true;
    };
    gl.domElement.addEventListener("pointermove", move);
    gl.domElement.addEventListener("pointerup", end);
    return () => {
      gl.domElement.removeEventListener("pointermove", move);
      gl.domElement.removeEventListener("pointerup", end);
    };
  }, [gl, id]);
  const handle =
    mug.variant === "white"
      ? mug.handleColor
      : mug.handleColor !== "#ffffff"
        ? mug.handleColor
        : mug.accentColor;
  return (
    <>
      <group
        ref={setObject}
        name="mug-float"
        visible={!mug.hidden}
        position={[mug.posX ?? 0, base + support, mug.posZ ?? 0]}
        rotation={rotation}
        scale={mug.scale}
        userData={{ baseY: base + support, objectId: id }}
        onPointerDown={startArt}
        onDoubleClick={(e) => {
          e.stopPropagation();
          useMockupStore.getState().requestFocus();
        }}
      >
        {selected && tool !== "select" && !mug.hidden && !mug.locked && (
          <lineSegments
            name="selection-outline"
            geometry={outline}
            position={[
              0,
              model.def.height / 2 - 4.75,
              model.def.hasHandle ? -1.2 : 0,
            ]}
          >
            <lineBasicMaterial
              color="#ff8654"
              transparent
              opacity={0.25}
              depthTest={false}
            />
          </lineSegments>
        )}
        <group ref={entryGroup} name="mug-entrance">
          <group position={[0, -4.75, 0]}>
            <mesh
              geometry={model.body}
              castShadow
              receiveShadow
              name={id === "hero" ? "mug-body" : "mug-body-comp"}
              userData={{ objectId: id }}
            >
              <CeramicMaterial
                texture={texture}
                mug={mug}
                metalMask={metalMask}
                height={model.def.height}
              />
            </mesh>
            {baseTexture && (
              <mesh
                position={[0, (0.335 * model.def.height) / 9.5, 0]}
                rotation={[
                  Math.PI / 2,
                  0,
                  ((art.baseRotation ?? 0) * Math.PI) / 180,
                ]}
              >
                <circleGeometry args={[model.def.hasHandle ? 3.25 : 2.5, 64]} />
                <meshPhysicalMaterial
                  map={baseTexture}
                  roughness={mug.roughness}
                  clearcoat={mug.clearcoat}
                  side={THREE.FrontSide}
                />
              </mesh>
            )}
            {model.def.hasHandle && (
              <mesh geometry={model.handle} castShadow>
                <meshPhysicalMaterial
                  color={handle}
                  roughness={mug.roughness}
                  clearcoat={mug.clearcoat}
                  clearcoatRoughness={0.09}
                  envMapIntensity={mug.reflection}
                />
              </mesh>
            )}
            {(mug.model === "thermal" || mug.model === "squeeze") && (
              <mesh position={[0, model.def.height + 0.16, 0]} castShadow>
                <cylinderGeometry
                  args={[
                    mug.model === "squeeze" ? 2.1 : 4.05,
                    mug.model === "squeeze" ? 2.25 : 4.08,
                    0.5,
                    64,
                  ]}
                />
                <meshPhysicalMaterial
                  color={
                    mug.handleColor === "#ffffff" ? "#25272b" : mug.handleColor
                  }
                  roughness={0.35}
                  clearcoat={0.3}
                />
              </mesh>
            )}
          </group>
        </group>
      </group>
      {object &&
        selected &&
        !mug.hidden &&
        !mug.locked &&
        ["move", "rotate", "scale"].includes(tool) && (
          <TransformControls
            object={object}
            mode={
              tool === "move"
                ? "translate"
                : tool === "rotate"
                  ? "rotate"
                  : "scale"
            }
            size={0.8}
            name="studio-gizmo"
            translationSnap={snap ? 0.5 : undefined}
            rotationSnap={snap ? Math.PI / 12 : undefined}
            scaleSnap={snap ? 0.05 : undefined}
            onMouseDown={() => {
              startPose.current = object.position.clone();
            }}
            onMouseUp={() => {
              const st = useMockupStore.getState();
              const delta = object.position
                .clone()
                .sub(startPose.current ?? object.position);
              st.patchObject(id, {
                posX: object.position.x,
                posZ: object.position.z,
                posY: (mug.posY ?? 0) + delta.y,
                tiltX: THREE.MathUtils.radToDeg(object.rotation.x),
                rotationY: -THREE.MathUtils.radToDeg(object.rotation.y),
                tiltZ: THREE.MathUtils.radToDeg(object.rotation.z),
                scale: Math.max(0.2, Math.min(3, object.scale.x)),
              });
              if (tool === "move")
                for (const other of st.selectedIds.filter((x) => x !== id)) {
                  const o =
                    other === "hero"
                      ? st.mug
                      : st.companions.find((c) => c.id === other);
                  if (o)
                    st.patchObject(other, {
                      posX: (o.posX ?? 0) + delta.x,
                      posY: (o.posY ?? 0) + delta.y,
                      posZ: (o.posZ ?? 0) + delta.z,
                    });
                }
            }}
          />
        )}
    </>
  );
}
export function Mug() {
  const art = useMockupStore((s) => s.art),
    mug = useMockupStore((s) => s.mug),
    companions = useMockupStore((s) => s.companions);
  return (
    <group name="mockup-mugs">
      <MugObject id="hero" mug={mug} art={art} />
      {companions.map((c) => (
        <MugObject
          key={c.id}
          id={c.id}
          mug={
            {
              ...mug,
              ...c,
              model: c.model ?? mug.model,
              tiltX: c.tiltX ?? 0,
              tiltZ: c.tiltZ ?? 0,
              posY: c.posY ?? 0,
              hidden: c.hidden ?? false,
              locked: c.locked ?? false,
            } as MugState
          }
          art={c.art ?? art}
          showArt={c.showArt}
        />
      ))}
    </group>
  );
}
