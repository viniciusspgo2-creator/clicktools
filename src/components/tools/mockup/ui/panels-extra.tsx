/* ============================================================
   Painéis extras — Multicaneca (cenas com várias canecas) e
   Pós-processamento (LUTs, bloom, vinheta, granulado).
   ============================================================ */

'use client';

import { Flame, Layers, Plus, Snowflake, Sparkles, Trash2, Users } from 'lucide-react';
import { useMockupStore, type CompanionMug } from '../state/store';
import { ColorRow, MiniButton, Section, Segmented, SliderRow, ToggleRow } from './controls';
import { FX_LUTS } from '../scene/postfx';
import { cn } from '@/lib/utils';

/* ---------------- Multicaneca ---------------- */

const ARRANGE_OPTIONS: { kind: 'solo' | 'duo' | 'trio' | 'quarto' | 'vitrine'; label: string }[] = [
  { kind: 'solo', label: '1 caneca' },
  { kind: 'duo', label: 'Duo' },
  { kind: 'trio', label: 'Trio' },
  { kind: 'quarto', label: 'Quarteto' },
  { kind: 'vitrine', label: 'Vitrine' },
];

export function MultiMugPanel() {
  const companions = useMockupStore((s) => s.companions);
  const arrangeScene = useMockupStore((s) => s.arrangeScene);
  const addCompanion = useMockupStore((s) => s.addCompanion);

  return (
    <Section title="Multicaneca" icon={Users}>
      <p className="text-[10px] leading-relaxed text-neutral-500">
        Monte cenas com até 4 canecas — a principal fica no centro e as acompanhantes compartilham a mesma arte.
      </p>
      <div className="grid grid-cols-5 gap-1">
        {ARRANGE_OPTIONS.map((o) => {
          const active = o.kind === 'solo' ? companions.length === 0 : ARRANGE_SIZE[o.kind] === companions.length;
          return (
            <button
              key={o.kind}
              onClick={() => arrangeScene(o.kind)}
              className={cn(
                'rounded-lg border px-1 py-2 text-[10px] font-bold transition-all',
                active
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {companions.length > 0 && (
        <div className="space-y-2">
          {companions.map((c, i) => (
            <CompanionCard key={c.id} companion={c} index={i + 2} />
          ))}
          {companions.length < 3 && (
            <MiniButton onClick={addCompanion} className="w-full">
              <Plus className="mr-1 inline h-3 w-3 text-primary" /> Adicionar caneca
            </MiniButton>
          )}
        </div>
      )}
    </Section>
  );
}

const ARRANGE_SIZE: Record<string, number> = { duo: 1, trio: 2, quarto: 3, vitrine: 3 };

function CompanionCard({ companion, index }: { companion: CompanionMug; index: number }) {
  const patch = useMockupStore((s) => s.patchCompanion);
  const remove = useMockupStore((s) => s.removeCompanion);
  const c = companion;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-display text-[10px] font-bold text-primary">
          {index}
        </span>
        <span className="flex-1 text-[11px] font-semibold text-neutral-200">Caneca {index}</span>
        <button
          onClick={() => remove(c.id)}
          className="rounded-lg p-1 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          aria-label={`Remover caneca ${index}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <Segmented
        value={c.variant}
        options={[
          { value: 'white', label: 'Branca' },
          { value: 'accent', label: 'Colorida' },
          { value: 'magic', label: 'Mágica' },
        ]}
        onChange={(v) => patch(c.id, { variant: v })}
      />
      {c.variant !== 'white' && (
        <ColorRow label="Cor" value={c.accentColor} onChange={(v) => patch(c.id, { accentColor: v })} />
      )}
      <ToggleRow label="Mostrar a arte" checked={c.showArt} onChange={(v) => patch(c.id, { showArt: v })} />
      {c.variant === 'magic' && (
        <>
          <SliderRow
            label="Calor"
            value={c.magicHeat * 100}
            min={0}
            max={100}
            onChange={(v) => patch(c.id, { magicHeat: v / 100 })}
            defaultValue={85}
            format={(v) => (v <= 2 ? 'fria' : v >= 98 ? 'quente' : `${Math.round(v)}% revelado`)}
          />
          <div className="flex gap-1.5">
            <MiniButton onClick={() => patch(c.id, { magicHeat: 1 })} className="flex-1">
              <Flame className="mr-1 inline h-3 w-3 text-amber-400" /> Quente
            </MiniButton>
            <MiniButton onClick={() => patch(c.id, { magicHeat: 0 })} className="flex-1">
              <Snowflake className="mr-1 inline h-3 w-3 text-sky-300" /> Fria
            </MiniButton>
          </div>
        </>
      )}
      <SliderRow label="Posição lateral" value={c.posX} min={-9} max={9} step={0.1} onChange={(v) => patch(c.id, { posX: v })} defaultValue={5.6} format={(v) => `${v.toFixed(1)} cm`} />
      <SliderRow label="Profundidade" value={c.posZ} min={-6} max={8} step={0.1} onChange={(v) => patch(c.id, { posZ: v })} defaultValue={0.8} format={(v) => `${v.toFixed(1)} cm`} />
      <SliderRow label="Rotação" value={c.rotationY} min={-180} max={180} onChange={(v) => patch(c.id, { rotationY: v })} defaultValue={-25} format={(v) => `${Math.round(v)}°`} />
      <SliderRow label="Tamanho" value={c.scale * 100} min={65} max={135} onChange={(v) => patch(c.id, { scale: v / 100 })} defaultValue={95} format={(v) => `${Math.round(v)}%`} />
    </div>
  );
}

/* ---------------- Pós-processamento ---------------- */

export function FXPanel() {
  const fx = useMockupStore((s) => s.fx);
  const patch = useMockupStore((s) => s.patch);

  return (
    <Section title="Pós-processamento" icon={Sparkles}>
      <ToggleRow label="Ativar efeitos" checked={fx.enabled} onChange={(v) => patch('fx', { enabled: v })} />
      {!fx.enabled && (
        <p className="text-[10px] leading-relaxed text-neutral-500">
          LUTs cinematográficas, bloom, vinheta e granulado — vale para o preview, as imagens e os vídeos exportados.
        </p>
      )}
      {fx.enabled && (
        <>
          <div>
            <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Look (LUT)</p>
            <div className="grid grid-cols-3 gap-1">
              {FX_LUTS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => patch('fx', { lut: l.id, ...l.patch })}
                  className={cn(
                    'rounded-lg border px-1 py-1.5 text-[10px] font-bold transition-all',
                    fx.lut === l.id
                      ? 'border-primary/60 bg-primary/15 text-primary'
                      : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
          <SliderRow label="Exposição" value={fx.exposure * 100} min={50} max={180} onChange={(v) => patch('fx', { exposure: v / 100 })} defaultValue={100} format={(v) => `${Math.round(v)}%`} />
          <SliderRow label="Contraste" value={fx.contrast * 100} min={-50} max={60} onChange={(v) => patch('fx', { contrast: v / 100 })} defaultValue={0} />
          <SliderRow label="Saturação" value={fx.saturation * 100} min={-100} max={80} onChange={(v) => patch('fx', { saturation: v / 100 })} defaultValue={0} />
          <SliderRow
            label="Temperatura"
            value={fx.temperature * 100}
            min={-100}
            max={100}
            onChange={(v) => patch('fx', { temperature: v / 100 })}
            defaultValue={0}
            format={(v) => (v === 0 ? 'neutra' : v > 0 ? `+${Math.round(v)} quente` : `${Math.round(v)} fria`)}
          />
          <SliderRow label="Bloom (brilho suave)" value={fx.bloom * 100} min={0} max={100} onChange={(v) => patch('fx', { bloom: v / 100 })} defaultValue={0} />
          <SliderRow label="Vinheta" value={fx.vignette * 100} min={0} max={90} onChange={(v) => patch('fx', { vignette: v / 100 })} defaultValue={0} />
          <SliderRow label="Granulado" value={fx.grain * 100} min={0} max={100} onChange={(v) => patch('fx', { grain: v / 100 })} defaultValue={0} />
        </>
      )}
    </Section>
  );
}

/* ícone reutilizado no layout */
export const MultiMugIcon = Layers;
