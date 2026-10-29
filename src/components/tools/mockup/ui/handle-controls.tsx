"use client";

import { Coffee } from "lucide-react";
import { useMockupStore } from "../state/store";
import { Section } from "./controls";

export function HandleControls({ active }: { active: string }) {
  const st = useMockupStore();
  const piece = active === "hero" ? st.mug : st.companions.find(c => c.id === active);
  if (!piece) return null;
  const style = piece.handleStyle ?? st.mug.handleStyle;
  return <Section title="Modelo da alça" icon={Coffee} defaultOpen>
    <div className="cg-handle-choices" role="group" aria-label="Escolher modelo de alça">
      {(["classic", "rounded"] as const).map(id => <button type="button" key={id}
        disabled={!!piece.locked} aria-pressed={style === id}
        onClick={() => st.patchObject(active, { handleStyle: id })}>
        <svg viewBox="0 0 80 72" aria-hidden="true" fill="none">
          <path d="M21 8v56" stroke="currentColor" strokeWidth="3" opacity=".25" />
          <path d={id === "classic" ? "M22 18C32 18 31 13 40 17C58 24 59 48 43 54C34 59 31 55 22 55" : "M22 13C40 11 58 12 59 35C60 58 43 62 22 59"}
            stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        </svg>
        <strong>{id === "classic" ? "Original" : "Arredondada"}</strong>
        <small>{id === "classic" ? "Clássica e compacta" : "Formato D · alongada"}</small>
      </button>)}
    </div>
    <p className="cg-hint">Alça em 3D com acabamento de cerâmica. A escolha vale somente para esta caneca.</p>
  </Section>;
}
