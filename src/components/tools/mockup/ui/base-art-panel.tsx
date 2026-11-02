"use client";
import { useRef, useState } from "react";
import { CircleArrowUp } from "lucide-react";
import { useMockupStore } from "../state/store";
import { loadArtFile, removeArtImage } from "../lib/art-registry";
import { studioRefs } from "../scene/studio-refs";
import { baseArtTransform } from "../lib/base-art";
import { Section, SliderRow } from "./controls";
export function BaseArtPanel() {
  const st = useMockupStore(), id = st.selectedIds[0] ?? "hero";
  const mug = id === "hero" ? st.mug : st.companions.find(c => c.id === id);
  const art = id === "hero" ? st.art : st.companions.find(c => c.id === id)?.art ?? st.art;
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [viewing, setViewing] = useState(false);
  const sequence = useRef(0);
  const previous = useRef<{id:string; tiltX:number; tiltZ:number; pos:number[]; target:number[]; zoom:number; rotating:boolean} | null>(null);
  const patch = (p: Partial<typeof art>) => st.patchObjectArt(id, p);
  const t = baseArtTransform(art);
  async function upload(file: File) {
    const request = ++sequence.current, target = id;
    setBusy(true);
    try {
      const entry = await loadArtFile(file), current = useMockupStore.getState();
      const piece = target === "hero" ? current.mug : current.companions.find(c => c.id === target);
      if (request !== sequence.current || !piece || piece.locked) { removeArtImage(entry.id); return; }
      current.patchObjectArt(target, { baseImageId: entry.id }); setMessage("Arte aplicada somente à base da peça escolhida.");
    } catch(e) { setMessage(e instanceof Error ? e.message : "Não foi possível abrir a imagem."); }
    finally { if (request === sequence.current) setBusy(false); }
  }
  function inspect() {
    const s = useMockupStore.getState(), camera = studioRefs.camera, controls = studioRefs.controls;
    if (!camera || !controls || !mug || mug.locked) return;
    if (previous.current) {
      const p = previous.current; s.patchObject(p.id,{tiltX:p.tiltX,tiltZ:p.tiltZ});
      s.setZoom(p.zoom); s.applyCameraPreset({pos:p.pos as [number,number,number],target:p.target as [number,number,number]});
      s.patch("camera",{autoRotate:p.rotating}); previous.current=null; setViewing(false); return;
    }
    previous.current={id,tiltX:mug.tiltX??0,tiltZ:mug.tiltZ??0,pos:camera.position.toArray(),target:controls.target.toArray(),zoom:s.zoom,rotating:s.camera.autoRotate};
    s.patch("camera",{autoRotate:false}); s.patchObject(id,{tiltX:180,tiltZ:0}); s.setZoom(100);
    const target: [number,number,number]=[mug.posX??0,5*mug.scale+(mug.posY??0),mug.posZ??0];
    const d=8*mug.scale/Math.sin(camera.fov*Math.PI/360);
    s.applyCameraPreset({pos:[target[0]+0.01,target[1]+d,target[2]+0.1],target});setViewing(true);
  }
  return <Section title="Arte da base — Bocão" icon={CircleArrowUp} defaultOpen>
    <p className="cg-hint">Imagem independente na parte de baixo. A área circular segue o modelo da caneca. O que sair do círculo será recortado.</p>
    <fieldset disabled={!mug || mug.locked || busy} className="space-y-3">
      <label className="cg-file-label">{busy ? "Abrindo imagem…" : art.baseImageId ? "Substituir arte da base" : "Enviar arte da base"}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif" onChange={e=>{const f=e.target.files?.[0];if(f)void upload(f);e.target.value="";}} /></label>
      <button type="button" className="cg-secondary" onClick={inspect}>{viewing ? "Voltar à vista anterior" : "Ver parte inferior"}</button>
      {art.baseImageId && <>
        <SliderRow label="Escala da base" value={t.scale} min={0.1} max={3} step={0.01} defaultValue={1} onChange={baseScale=>patch({baseScale})}/>
        <SliderRow label="Base · horizontal" value={t.x} min={-1} max={1} step={0.01} defaultValue={0} onChange={baseOffsetX=>patch({baseOffsetX})}/>
        <SliderRow label="Base · vertical" value={t.y} min={-1} max={1} step={0.01} defaultValue={0} onChange={baseOffsetY=>patch({baseOffsetY})}/>
        <SliderRow label="Rotação da arte da base" value={art.baseRotation??0} min={-180} max={180} onChange={baseRotation=>patch({baseRotation})}/>
        <div className="cg-pills"><button type="button" onClick={()=>patch({baseOffsetX:0,baseOffsetY:0})}>Centralizar base</button><button type="button" onClick={()=>patch({baseScale:1,baseOffsetX:0,baseOffsetY:0,baseRotation:0})}>Resetar base</button><button type="button" onClick={()=>patch({baseImageId:null})}>Remover arte da base</button></div>
      </>}
    </fieldset><p role="status" className="cg-hint">{message}</p>
  </Section>;
}
