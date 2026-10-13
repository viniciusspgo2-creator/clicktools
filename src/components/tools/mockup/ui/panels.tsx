/* ============================================================
   Painéis do estúdio (Arte, Caneca, Cena, Iluminação, Câmera)
   + diálogo de exportação de imagem.
   ============================================================ */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ImagePlus, CupSoda, Mountain, Lightbulb, Camera, Sparkles, Download, Loader2,
  Trash2, Wand2, RotateCw, FlipHorizontal2, Crosshair, Check, TriangleAlert, Flame, Snowflake,
  Play, Square, Grid3X3, Maximize, Move, Eye,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMockupStore, type VideoState } from '../state/store';
import { loadArtFile, makeSampleArt, getArtImage } from '../lib/art-registry';
import { computeDpi } from '../lib/art-canvas';
import { loadBgFile, ensureScenes, SCENES, drawSceneThumb } from '../lib/background-registry';
import {
  BACKGROUND_LABELS, CAMERA_PRESETS, EXPORT_RATIOS, FLOOR_OPTIONS, LIGHT_PRESETS, MAX_EXPORT_PX,
  type BackgroundType,
} from '../lib/config';
import { ColorRow, MiniButton, PrimaryButton, Section, Segmented, SliderRow, ToggleRow } from './controls';
import { downloadBlob, exportImage, ExportError } from '../exporters/image-exporter';
import { exportVideo, exportGif, VIDEO_RESOLUTIONS } from '../exporters/video-exporter';
import { exportBatch, batchVariantsFor } from '../exporters/batch-exporter';
import { exportTemplate } from '../exporters/template-exporter';
import { cn } from '@/lib/utils';

/* ---------------- uploader ---------------- */

function useArtUploader() {
  const { toast } = useToast();
  const setArtImage = useMockupStore((s) => s.setArtImage);
  const notifyArtApplied = useMockupStore((s) => s.notifyArtApplied);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      const file = files && files[0];
      if (!file) return;
      setBusy(true);
      try {
        const entry = await loadArtFile(file);
        setArtImage({ imageId: entry.id, name: entry.name, width: entry.naturalWidth, height: entry.naturalHeight });
        notifyArtApplied();
        toast({ title: 'Arte aplicada!', description: `${file.name} envolvendo a caneca.` });
      } catch (e) {
        toast({
          title: 'Não deu para usar essa arte',
          description: e instanceof Error ? e.message : 'Arquivo inválido.',
          variant: 'destructive',
        });
      } finally {
        setBusy(false);
      }
    },
    [setArtImage, notifyArtApplied, toast],
  );

  return { inputRef, handleFiles, busy, openFilePicker: () => inputRef.current?.click() };
}

/* ---------------- Arte ---------------- */

export function ArtPanel() {
  const art = useMockupStore((s) => s.art);
  const patch = useMockupStore((s) => s.patch);
  const clearArt = useMockupStore((s) => s.clearArt);
  const notifyArtApplied = useMockupStore((s) => s.notifyArtApplied);
  const { inputRef, handleFiles, busy, openFilePicker } = useArtUploader();
  const hasArt = !!art.imageId;
  const dpi = useMemo(() => computeDpi(art), [art]);

  return (
    <Section title="Arte" icon={ImagePlus} defaultOpen>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {!hasArt ? (
        <button
          onClick={openFilePicker}
          disabled={busy}
          className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] px-4 py-6 transition-colors hover:border-primary/50 hover:bg-primary/5"
        >
          {busy ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImagePlus className="h-6 w-6 text-primary" />}
          <span className="text-xs font-semibold text-neutral-200">Enviar arte</span>
          <span className="text-center text-[10px] leading-relaxed text-neutral-500">
            PNG, JPG, WebP, SVG ou AVIF · clique, arraste aqui ou cole com Ctrl+V
          </span>
        </button>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-semibold text-neutral-100">{art.name}</p>
              <p className="text-[10px] text-neutral-500">
                {art.width} × {art.height} px
              </p>
            </div>
            <MiniButton onClick={openFilePicker} className="shrink-0">
              Trocar
            </MiniButton>
            <MiniButton onClick={clearArt} className="shrink-0 hover:!border-red-500/50 hover:!text-red-400">
              <Trash2 className="h-3 w-3" />
            </MiniButton>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            {dpi === null ? null : dpi >= 300 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                <Check className="h-3 w-3" /> {Math.round(dpi)} DPI · excelente para sublimação
              </span>
            ) : dpi >= 150 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                {Math.round(dpi)} DPI · qualidade boa
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
                <TriangleAlert className="h-3 w-3" /> {Math.round(dpi)} DPI · abaixo de 150, pode sair borrado
              </span>
            )}
          </div>
        </div>
      )}

      <MiniButton
        onClick={() => {
          const s = makeSampleArt();
          const { setArtImage, notifyArtApplied } = useMockupStore.getState();
          setArtImage({ imageId: s.id, name: s.name, width: s.naturalWidth, height: s.naturalHeight });
          notifyArtApplied();
        }}
        className="w-full"
      >
        <Wand2 className="mr-1 inline h-3 w-3 text-primary" /> Usar arte de exemplo
      </MiniButton>

      {/* texto escrito direto na caneca (sai também na folha de sublimação) */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
        <p className="mb-1.5 text-[11px] font-medium text-neutral-400" title="Escreva uma frase ou nome — vai para a caneca e para a folha de sublimação">
          Texto na caneca (opcional)
        </p>
        <input
          value={art.text}
          maxLength={40}
          onChange={(e) => patch('art', { text: e.target.value })}
          placeholder="Ex.: Feliz Aniversário! "
          className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-primary/60"
        />
        {art.text.trim() && (
          <div className="mt-2 space-y-2">
            <ColorRow label="Cor do texto" value={art.textColor} onChange={(v) => patch('art', { textColor: v })} />
            <SliderRow
              label="Tamanho do texto"
              value={art.textSize * 100}
              min={4}
              max={24}
              onChange={(v) => patch('art', { textSize: v / 100 })}
              defaultValue={9}
              format={(v) => `${Math.round(v)}% da altura`}
            />
            <SliderRow
              label="Altura do texto"
              value={art.textY * 100}
              min={-100}
              max={100}
              onChange={(v) => patch('art', { textY: v / 100 })}
              defaultValue={15}
            />
          </div>
        )}
      </div>

      {hasArt && (
        <>
          <Segmented
            label="Ajuste à área"
            value={art.fit}
            options={[
              { value: 'cover', label: 'Preencher' },
              { value: 'contain', label: 'Conter' },
              { value: 'stretch', label: 'Esticar' },
            ]}
            onChange={(v) => patch('art', { fit: v })}
          />
          <SliderRow label="Tamanho" value={art.scale * 100} min={10} max={300} onChange={(v) => patch('art', { scale: v / 100 })} defaultValue={100} format={(v) => `${Math.round(v)}%`} />
          <SliderRow
            label="Posição em volta (frente ← → trás)"
            value={art.offsetX * 100}
            min={-100}
            max={100}
            onChange={(v) => patch('art', { offsetX: v / 100 })}
            defaultValue={0}
          />
          <SliderRow label="Altura" value={art.offsetY * 100} min={-100} max={100} onChange={(v) => patch('art', { offsetY: v / 100 })} defaultValue={0} />
          <SliderRow label="Rotação" value={art.rotation} min={-180} max={180} onChange={(v) => patch('art', { rotation: v })} defaultValue={0} format={(v) => `${Math.round(v)}°`} />
          <SliderRow label="Repetir lateralmente" value={art.repeat} min={1} max={4} onChange={(v) => patch('art', { repeat: Math.round(v) })} defaultValue={1} format={(v) => `${Math.round(v)}× na volta`} />
          <div className="flex gap-1.5">
            <MiniButton onClick={() => patch('art', { mirror: !art.mirror })} active={art.mirror} className="flex-1">
              <FlipHorizontal2 className="mr-1 inline h-3 w-3" /> Espelhar
            </MiniButton>
            <MiniButton
              onClick={() => patch('art', { offsetX: 0, offsetY: 0, rotation: 0, scale: 1 })}
              className="flex-1"
            >
              <Crosshair className="mr-1 inline h-3 w-3" /> Centralizar
            </MiniButton>
          </div>
        </>
      )}
    </Section>
  );
}

/* ---------------- Caneca ---------------- */

export function MugPanel() {
  const mug = useMockupStore((s) => s.mug);
  const patch = useMockupStore((s) => s.patch);
  const rotateMug = useMockupStore((s) => s.rotateMug);
  const isMagic = mug.variant === 'magic';
  const [playing, setPlaying] = useState(false);
  const rafRef = useRef<number | null>(null);
  const holdHeatRef = useRef<number | null>(null);

  const stopPlay = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setPlaying(false);
  }, []);

  useEffect(() => () => stopPlay(), [stopPlay, mug.variant]);

  /** pré-visualização: a caneca preta começa a revelar a arte */
  const startPlay = useCallback(() => {
    stopPlay();
    setPlaying(true);
    const t0 = performance.now();
    const dur = 3000;
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      useMockupStore.getState().patch('mug', { magicHeat: 0.02 + e * 0.98 });
      if (k < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        setPlaying(false);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [stopPlay]);

  const holdCold = () => {
    if (holdHeatRef.current === null) holdHeatRef.current = mug.magicHeat;
    patch('mug', { magicHeat: 0 });
  };
  const releaseCold = () => {
    if (holdHeatRef.current !== null) {
      patch('mug', { magicHeat: holdHeatRef.current });
      holdHeatRef.current = null;
    }
  };

  return (
    <Section title="Caneca" icon={CupSoda} defaultOpen>
      <Segmented
        label="Modelo — porcelana 11 oz (325 ml)"
        value={mug.variant}
        options={[
          { value: 'white', label: 'Branca' },
          { value: 'accent', label: 'Colorida' },
          { value: 'magic', label: 'Mágica' },
        ]}
        onChange={(v) => {
          stopPlay();
          patch('mug', { variant: v });
        }}
      />
      {mug.variant !== 'white' && (
        <ColorRow label="Cor da alça e interior" value={mug.accentColor} onChange={(v) => patch('mug', { accentColor: v })} />
      )}
      {isMagic && (
        <>
          <SliderRow
            label="Calor (revelação)"
            value={mug.magicHeat * 100}
            min={0}
            max={100}
            onChange={(v) => patch('mug', { magicHeat: v / 100 })}
            defaultValue={85}
            format={(v) => (v <= 2 ? 'fria — tudo preto' : v >= 98 ? 'quente — arte revelada' : `${Math.round(v)}% revelado`)}
          />
          <div className="flex gap-1.5">
            {playing ? (
              <MiniButton onClick={stopPlay} active className="flex-1">
                <Square className="mr-1 inline h-3 w-3" /> Parar
              </MiniButton>
            ) : (
              <MiniButton onClick={startPlay} className="flex-1" >
                <Play className="mr-1 inline h-3 w-3 text-primary" /> Ver revelação
              </MiniButton>
            )}
            <MiniButton onClick={() => patch('mug', { magicHeat: 1 })} className="flex-1">
              <Flame className="mr-1 inline h-3 w-3 text-amber-400" /> Quente
            </MiniButton>
            <MiniButton onClick={() => patch('mug', { magicHeat: 0 })} className="flex-1">
              <Snowflake className="mr-1 inline h-3 w-3 text-sky-300" /> Fria
            </MiniButton>
          </div>
          <MiniButton
            onClick={() => {}}
            onPointerDown={holdCold}
            onPointerUp={releaseCold}
            onPointerLeave={releaseCold}
            className="w-full"
          >
            <Eye className="mr-1 inline h-3 w-3" /> Segurar p/ ver antes
          </MiniButton>
          <Segmented
            label="Direção da revelação"
            value={mug.magicDirection}
            options={[
              { value: 'baixo', label: 'De baixo p/ cima' },
              { value: 'lateral', label: 'Lateral' },
              { value: 'radial', label: 'Do centro' },
            ]}
            onChange={(v) => patch('mug', { magicDirection: v })}
          />
          <SliderRow
            label="Borda da revelação"
            value={mug.magicDissolve * 100}
            min={0}
            max={100}
            onChange={(v) => patch('mug', { magicDissolve: v / 100 })}
            defaultValue={35}
            format={(v) => (v <= 2 ? 'linha reta' : `${Math.round(v)}% de dissolução`)}
          />
        </>
      )}
      <SliderRow
        label="Rotação da caneca"
        value={mug.rotationY}
        min={0}
        max={360}
        onChange={(v) => patch('mug', { rotationY: v })}
        defaultValue={0}
        format={(v) => `${Math.round(v)}°`}
      />
      <div className="flex gap-1.5">
        <MiniButton onClick={() => rotateMug(180)} className="flex-1">
          Virar 180°
        </MiniButton>
        <MiniButton onClick={() => rotateMug(45)} className="flex-1">
          Girar +45°
        </MiniButton>
      </div>
      <SliderRow
        label="Inclinação"
        value={mug.tiltX}
        min={-35}
        max={35}
        onChange={(v) => patch('mug', { tiltX: v })}
        defaultValue={0}
        format={(v) => `${Math.round(v)}°`}
      />
      <SliderRow label="Tamanho na cena" value={mug.scale * 100} min={60} max={140} onChange={(v) => patch('mug', { scale: v / 100 })} defaultValue={100} format={(v) => `${Math.round(v)}%`} />
      <SliderRow label="Altura na cena" value={mug.posY * 10} min={-8} max={20} onChange={(v) => patch('mug', { posY: v / 10 })} defaultValue={0} format={(v) => `${(v / 10).toFixed(1)} cm`} />
      {isMagic && (
        <p className="text-[10px] leading-relaxed text-neutral-500">
          A revelação também sai na exportação — crie imagens &quot;antes e depois&quot; exportando
          com a caneca fria e depois quente, ou vídeo em Movimento &quot;Revelação&quot;.
        </p>
      )}
    </Section>
  );
}

/* ---------------- Cena (fundo e chão) ---------------- */

const BG_OPTIONS: { value: BackgroundType; label: string; title: string }[] = [
  { value: 'studio-white', label: 'Branco', title: 'Fundo branco puro (padrão)' },
  { value: 'studio-dark', label: 'Escuro', title: 'Estúdio escuro premium' },
  { value: 'gradient', label: 'Gradiente', title: 'Duas cores em degradê' },
  { value: 'solid', label: 'Cor', title: 'Uma cor sólida' },
  { value: 'image', label: 'Imagem', title: 'Use uma foto sua como fundo' },
  { value: 'transparent', label: 'Sem fundo', title: 'Transparente — exporta PNG/WebP com alfa' },
];

/** galeria de cenários prontos, todos gerados por código */
function ScenesGallery() {
  const patch = useMockupStore((s) => s.patch);
  const current = useMockupStore((s) => s.bg.imageId);
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureScenes();
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    SCENES.forEach((s, i) => {
      const c = refs.current[i];
      if (c) drawSceneThumb(c, s.id);
    });
  }, [ready]);

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-medium text-neutral-400" title="Cenários desenhados pelo próprio estúdio — sem direitos autorais">
        Cenários prontos
      </p>
      <div className="grid grid-cols-4 gap-1">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            onClick={() =>
              patch('bg', {
                type: 'image',
                imageId: s.id,
                imageFit: 'cover',
                imageZoom: 1,
                imageX: 0,
                imageY: 0,
                imageRot: 0,
                imageMirror: false,
                imageBlur: 0,
                imageBright: 1,
              })
            }
            title={s.label}
            className={cn(
              'overflow-hidden rounded-lg border transition-all',
              current === s.id ? 'border-primary ring-1 ring-primary/60' : 'border-white/10 hover:border-white/30',
            )}
          >
            <canvas ref={(el) => { refs.current[i] = el; }} width={128} height={72} className="block h-auto w-full" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ScenePanel() {
  const bg = useMockupStore((s) => s.bg);
  const patch = useMockupStore((s) => s.patch);
  const bgAdjustMode = useMockupStore((s) => s.bgAdjustMode);
  const setBgAdjustMode = useMockupStore((s) => s.setBgAdjustMode);
  const { toast } = useToast();
  const [busyBg, setBusyBg] = useState(false);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const handleBgFile = useCallback(
    async (file: File | undefined | null) => {
      if (!file) return;
      setBusyBg(true);
      try {
        const entry = await loadBgFile(file);
        patch('bg', {
          type: 'image',
          imageId: entry.id,
          imageFit: 'cover',
          imageZoom: 1,
          imageX: 0,
          imageY: 0,
          imageRot: 0,
          imageMirror: false,
          imageBlur: 0,
          imageBright: 1,
        });
        toast({ title: 'Fundo aplicado!', description: `${file.name} agora é o cenário da cena.` });
      } catch (e) {
        toast({
          title: 'Não deu para usar essa imagem',
          description: e instanceof Error ? e.message : 'Tente outro arquivo.',
          variant: 'destructive',
        });
      } finally {
        setBusyBg(false);
      }
    },
    [patch, toast],
  );

  return (
    <Section title="Fundo & cena" icon={Mountain} defaultOpen>
      <input
        ref={bgInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleBgFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      <p className="text-[11px] font-medium text-neutral-400">Fundo</p>
      <div className="grid grid-cols-3 gap-1">
        {BG_OPTIONS.map((o) => (
          <button
            key={o.value}
            title={o.title}
            onClick={() => patch('bg', { type: o.value })}
            className={cn(
              'rounded-lg border px-1 py-2 text-[10px] font-bold transition-all',
              bg.type === o.value
                ? 'border-primary/60 bg-primary/15 text-primary'
                : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {bg.type === 'gradient' && (
        <>
          <ColorRow label="Cor 1 (topo)" value={bg.colorA} onChange={(v) => patch('bg', { colorA: v })} />
          <ColorRow label="Cor 2 (base)" value={bg.colorB} onChange={(v) => patch('bg', { colorB: v })} />
          <SliderRow label="Ângulo" value={bg.angle} min={0} max={360} onChange={(v) => patch('bg', { angle: v })} defaultValue={90} format={(v) => `${Math.round(v)}°`} />
        </>
      )}
      {bg.type === 'solid' && <ColorRow label="Cor do fundo" value={bg.colorB} onChange={(v) => patch('bg', { colorB: v })} />}

      {bg.type === 'image' && (
        <>
          <button
            onClick={() => bgInputRef.current?.click()}
            disabled={busyBg}
            className="flex w-full flex-col items-center gap-1.5 rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] px-4 py-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
          >
            {busyBg ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <ImagePlus className="h-5 w-5 text-primary" />}
            <span className="text-xs font-semibold text-neutral-200">Enviar foto de fundo</span>
            <span className="text-center text-[10px] leading-relaxed text-neutral-500">
              JPG, PNG ou WebP · use foto horizontal 1920×1080 ou maior
            </span>
          </button>

          <ScenesGallery />

          <Segmented
            label="Encaixe da foto"
            value={bg.imageFit}
            options={[
              { value: 'cover', label: 'Cobrir' },
              { value: 'contain', label: 'Conter' },
              { value: 'stretch', label: 'Esticar' },
            ]}
            onChange={(v) => patch('bg', { imageFit: v })}
          />
          <SliderRow
            label="Zoom"
            value={bg.imageZoom * 100}
            min={50}
            max={300}
            onChange={(v) => patch('bg', { imageZoom: v / 100 })}
            defaultValue={100}
            format={(v) => `${(v / 100).toFixed(1)}×`}
          />
          <SliderRow
            label="Posição horizontal"
            value={bg.imageX * 100}
            min={-100}
            max={100}
            onChange={(v) => patch('bg', { imageX: v / 100 })}
            defaultValue={0}
          />
          <SliderRow
            label="Posição vertical"
            value={bg.imageY * 100}
            min={-100}
            max={100}
            onChange={(v) => patch('bg', { imageY: v / 100 })}
            defaultValue={0}
          />
          <SliderRow
            label="Rotação da foto"
            value={bg.imageRot}
            min={-180}
            max={180}
            onChange={(v) => patch('bg', { imageRot: v })}
            defaultValue={0}
            format={(v) => `${Math.round(v)}°`}
          />
          <div className="flex gap-1.5">
            <MiniButton onClick={() => patch('bg', { imageMirror: !bg.imageMirror })} active={bg.imageMirror} className="flex-1">
              <FlipHorizontal2 className="mr-1 inline h-3 w-3" /> Espelhar
            </MiniButton>
            <MiniButton
              onClick={() => patch('bg', { imageX: 0, imageY: 0, imageZoom: 1, imageRot: 0 })}
              className="flex-1"
            >
              <Crosshair className="mr-1 inline h-3 w-3" /> Centralizar
            </MiniButton>
          </div>
          <SliderRow
            label="Desfoque"
            value={bg.imageBlur}
            min={0}
            max={20}
            step={0.5}
            onChange={(v) => patch('bg', { imageBlur: v })}
            defaultValue={0}
            format={(v) => (v <= 0.2 ? 'sem desfoque' : `${v.toFixed(1)} px`)}
          />
          <SliderRow
            label="Clarear / escurecer"
            value={bg.imageBright * 100}
            min={50}
            max={160}
            onChange={(v) => patch('bg', { imageBright: v / 100 })}
            defaultValue={100}
            format={(v) => (v === 100 ? 'normal' : v > 100 ? `+${Math.round(v - 100)}% claro` : `${Math.round(100 - v)}% escuro`)}
          />
          <ToggleRow
            label="Combinar luz com o fundo"
            checked={bg.matchLight}
            onChange={(v) => patch('bg', { matchLight: v })}
          />
          <p className="text-[10px] leading-relaxed text-neutral-500">
            Tinge levemente a iluminação com a cor média da foto — a caneca fica “dentro” do cenário.
          </p>
          <MiniButton onClick={() => setBgAdjustMode(!bgAdjustMode)} active={bgAdjustMode} className="w-full">
            <Move className="mr-1 inline h-3 w-3" /> Ajustar fundo no 3D
          </MiniButton>
          {bgAdjustMode && (
            <p className="text-[10px] leading-relaxed text-primary">
              Modo ativo: arraste direto na cena para posicionar (guia de centro com encaixe magnético). Duplo clique recentra.
            </p>
          )}
        </>
      )}
      {bg.type === 'transparent' && (
        <p className="text-[10px] leading-relaxed text-neutral-500">
          Fundo invisível para exportar PNG/WebP com alfa — a sombra continua sobre a transparência.
        </p>
      )}

      <p className="pt-1 text-[11px] font-medium text-neutral-400" title="Como a base da cena aparece embaixo da caneca">
        Chão
      </p>
      <div className="grid grid-cols-4 gap-1">
        {FLOOR_OPTIONS.map((o) => (
          <button
            key={o.value}
            title={o.title}
            onClick={() => patch('bg', { floor: o.value })}
            className={cn(
              'rounded-lg border px-1 py-2 text-[10px] font-bold transition-all',
              (bg.floor ?? 'continuo') === o.value
                ? 'border-primary/60 bg-primary/15 text-primary'
                : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {(bg.floor ?? 'continuo') === 'flutuante' && (
        <ToggleRow
          label="Flutuar suavemente"
          checked={bg.floatAnim}
          onChange={(v) => patch('bg', { floatAnim: v })}
        />
      )}
      {(bg.floor ?? 'continuo') === 'flutuante' && (
        <p className="text-[10px] leading-relaxed text-neutral-500">
          Sem chão: a sombra vira um borrão suave no ar — quanto mais alta a caneca, mais difusa. As exportações saem paradas.
        </p>
      )}
      <ToggleRow label="Sombra de contato" checked={bg.contactShadow} onChange={(v) => patch('bg', { contactShadow: v })} />
      <ToggleRow label="Sombra projetada" checked={bg.castShadow} onChange={(v) => patch('bg', { castShadow: v })} />
    </Section>
  );
}

/* ---------------- Iluminação ---------------- */

export function LightPanel() {
  const light = useMockupStore((s) => s.light);
  const patch = useMockupStore((s) => s.patch);

  return (
    <Section title="Iluminação" icon={Lightbulb} defaultOpen>
      <div className="grid grid-cols-2 gap-1">
        {LIGHT_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => patch('light', { preset: p.id })}
            className={cn(
              'rounded-lg border px-2 py-2 text-[10px] font-bold transition-all',
              light.preset === p.id
                ? 'border-primary/60 bg-primary/15 text-primary'
                : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
      <SliderRow label="Intensidade geral" value={light.intensity * 100} min={20} max={200} onChange={(v) => patch('light', { intensity: v / 100 })} defaultValue={100} format={(v) => `${Math.round(v)}%`} />
      <SliderRow label="Cor da luz" value={light.temperature} min={-2500} max={2500} onChange={(v) => patch('light', { temperature: v })} defaultValue={0} format={(v) => (v === 0 ? 'neutra' : v > 0 ? `+${Math.round(v)} K (mais quente)` : `${Math.round(v)} K (mais fria)`)} />
      <SliderRow label="Girar o estúdio" value={light.rotation} min={0} max={360} onChange={(v) => patch('light', { rotation: v })} defaultValue={0} format={(v) => `${Math.round(v)}°`} />
      <SliderRow label="Suavidade das sombras" value={light.softness * 100} min={0} max={100} onChange={(v) => patch('light', { softness: v / 100 })} defaultValue={50} format={(v) => `${Math.round(v)}%`} />
      <SliderRow label="Reflexos do estúdio" value={light.envIntensity * 100} min={0} max={200} onChange={(v) => patch('light', { envIntensity: v / 100 })} defaultValue={100} format={(v) => `${Math.round(v)}%`} />
    </Section>
  );
}

/* ---------------- Câmera ---------------- */

export function CameraPanel() {
  const camera = useMockupStore((s) => s.camera);
  const patch = useMockupStore((s) => s.patch);
  const applyPreset = useMockupStore((s) => s.applyCameraPreset);
  const rotateMug = useMockupStore((s) => s.rotateMug);
  const requestFocus = useMockupStore((s) => s.requestFocus);
  const frameAll = useMockupStore((s) => s.frameAll);
  const showGuides = useMockupStore((s) => s.showGuides);
  const setShowGuides = useMockupStore((s) => s.setShowGuides);

  const toggleFullscreen = () => {
    const el = document.getElementById('mockup-root');
    if (!document.fullscreenElement) el?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <Section title="Câmera" icon={Camera} defaultOpen>
      <SliderRow
        label="Lente (zoom óptico)"
        value={camera.lens}
        min={24}
        max={100}
        onChange={(v) => patch('camera', { lens: v })}
        defaultValue={50}
        format={(v) => `${Math.round(v)} mm equivalente`}
      />
      <div className="grid grid-cols-3 gap-1">
        {CAMERA_PRESETS.map((p) => (
          <MiniButton key={p.id} onClick={() => applyPreset(p)} className="!px-1 !text-[10px]" title={`Ver a caneca de: ${p.label}`}>
            {p.label}
          </MiniButton>
        ))}
      </div>
      <div className="flex gap-1.5">
        <MiniButton onClick={requestFocus} className="flex-1" title="Aproxima a câmera da caneca">
          <Crosshair className="mr-1 inline h-3 w-3" /> Focar (F)
        </MiniButton>
        <MiniButton onClick={() => rotateMug(180)} className="flex-1" title="Mostra o lado de trás da caneca">
          <RotateCw className="mr-1 inline h-3 w-3" /> Virar
        </MiniButton>
      </div>
      <MiniButton onClick={frameAll} className="w-full" title="Ajusta a câmera para caber todas as canecas no quadro">
        <Move className="mr-1 inline h-3 w-3" /> Enquadrar tudo
      </MiniButton>
      <ToggleRow label="Giro automático" checked={camera.autoRotate} onChange={(v) => patch('camera', { autoRotate: v })} />
      {camera.autoRotate && (
        <SliderRow label="Velocidade do giro" value={camera.autoRotateSpeed} min={0.2} max={6} step={0.1} onChange={(v) => patch('camera', { autoRotateSpeed: v })} defaultValue={1.6} />
      )}
      <ToggleRow
        label="Guias de enquadramento"
        checked={showGuides}
        onChange={setShowGuides}
      />
      <p className="-mt-2 text-[10px] leading-relaxed text-neutral-500">
        Grade de terços para compor a foto como profissional.
      </p>
      <MiniButton onClick={toggleFullscreen} className="w-full" title="Mostra o estúdio em tela cheia">
        <Maximize className="mr-1 inline h-3 w-3" /> Tela cheia
      </MiniButton>
    </Section>
  );
}

/* ---------------- Diálogo de exportação ---------------- */

type ExportTab = 'imagem' | 'video' | 'gif' | 'lote' | 'folha';

const EXPORT_TABS: { id: ExportTab; label: string }[] = [
  { id: 'imagem', label: 'Imagem' },
  { id: 'video', label: 'Vídeo' },
  { id: 'gif', label: 'GIF' },
  { id: 'lote', label: 'Lote' },
  { id: 'folha', label: 'Folha' },
];

export function ExportDialog() {
  const open = useMockupStore((s) => s.exportOpen);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const [tab, setTab] = useState<ExportTab>('imagem');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto border-white/10 bg-[#141110] text-neutral-100 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" /> Exportar
          </DialogTitle>
          <DialogDescription className="text-xs text-neutral-400">
            Imagens em alta resolução, vídeo em MP4, GIF animado, lote em ZIP e a folha de sublimação.
          </DialogDescription>
        </DialogHeader>

        <div className="mb-1 flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
          {EXPORT_TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 rounded-lg px-1.5 py-2 text-[11px] font-bold transition-all',
                tab === t.id ? 'bg-primary text-[#1d130d] shadow-sm' : 'text-neutral-400 hover:bg-white/5 hover:text-neutral-200',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'imagem' && <ImageTab />}
        {tab === 'video' && <VideoTab />}
        {tab === 'gif' && <GifTab />}
        {tab === 'lote' && <BatchTab />}
        {tab === 'folha' && <TemplateTab />}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- aba imagem ---------- */

function ImageTab() {
  const es = useMockupStore((s) => s.exportSettings);
  const setExport = useMockupStore((s) => s.setExport);
  const art = useMockupStore((s) => s.art);
  const wm = useMockupStore((s) => s.watermark);
  const patch = useMockupStore((s) => s.patch);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const ratio = EXPORT_RATIOS.find((r) => r.id === es.ratioId);
  const width = (es.ratioId === 'custom' ? es.customW : ratio?.w ?? 1080) * es.scale;
  const height = (es.ratioId === 'custom' ? es.customH : ratio?.h ?? 1080) * es.scale;

  const estimate = useMemo(() => {
    const px = width * height;
    const f = es.format === 'png' ? 0.9 : es.format === 'jpeg' ? 0.12 * es.quality : 0.09 * es.quality;
    const bytes = px * f;
    return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
  }, [width, height, es.format, es.quality]);

  const doExport = async () => {
    setBusy(true);
    try {
      const res = await exportImage({
        width,
        height,
        format: es.format,
        quality: es.quality,
        transparent: es.transparent,
      });
      downloadBlob(res.blob, res.filename);
      setOpen(false);
      toast({
        title: 'Imagem exportada!',
        description: `${res.width} × ${res.height} · ${(res.blob.size / 1024 / 1024).toFixed(1)} MB — pronta para Instagram.`,
      });
    } catch (e) {
      toast({
        title: 'Falha na exportação',
        description: e instanceof ExportError ? e.message : 'Erro inesperado ao renderizar a imagem.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  const tooBig = width > MAX_EXPORT_PX || height > MAX_EXPORT_PX;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Proporção</p>
        <div className="grid grid-cols-3 gap-1.5">
          {EXPORT_RATIOS.map((r) => (
            <button
              key={r.id}
              onClick={() => setExport({ ratioId: r.id })}
              className={cn(
                'rounded-lg border px-2 py-2 text-[10px] font-bold transition-all',
                es.ratioId === r.id
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
              )}
            >
              {r.label}
              <span className="block text-[9px] font-normal opacity-70">
                {r.w}×{r.h}
              </span>
            </button>
          ))}
        </div>
      </div>

      {es.ratioId === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-[11px] text-neutral-400">Largura (px)</p>
            <input
              type="number"
              value={es.customW}
              min={200}
              max={MAX_EXPORT_PX}
              onChange={(e) => setExport({ customW: Math.max(200, Math.min(MAX_EXPORT_PX, +e.target.value || 1080)) })}
              className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-primary/60"
            />
          </div>
          <div>
            <p className="mb-1 text-[11px] text-neutral-400">Altura (px)</p>
            <input
              type="number"
              value={es.customH}
              min={200}
              max={MAX_EXPORT_PX}
              onChange={(e) => setExport({ customH: Math.max(200, Math.min(MAX_EXPORT_PX, +e.target.value || 1080)) })}
              className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-primary/60"
            />
          </div>
        </div>
      )}

      <Segmented
        label="Qualidade / escala"
        value={String(es.scale)}
        options={[
          { value: '1', label: '1×' },
          { value: '2', label: '2× HD' },
          { value: '3', label: '3×' },
          { value: '4', label: '4×' },
        ]}
        onChange={(v) => setExport({ scale: Number(v) as 1 | 2 | 3 | 4 })}
      />

      <Segmented
        label="Formato"
        value={es.format}
        options={[
          { value: 'png', label: 'PNG' },
          { value: 'jpeg', label: 'JPG' },
          { value: 'webp', label: 'WebP' },
        ]}
        onChange={(v) => setExport({ format: v })}
      />

      {es.format !== 'png' && (
        <SliderRow label="Compressão" value={es.quality * 100} min={50} max={100} onChange={(v) => setExport({ quality: v / 100 })} defaultValue={92} format={(v) => `${Math.round(v)}%`} />
      )}

      {es.format !== 'jpeg' && (
        <ToggleRow label="Sem fundo (PNG transparente)" checked={es.transparent} onChange={(v) => setExport({ transparent: v })} />
      )}

      <WatermarkBox wm={wm} patch={patch} />

      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px]">
        <span className="text-neutral-400">
          Saída: <strong className="text-neutral-100">{width} × {height} px</strong>
        </span>
        <span className="text-neutral-500">≈ {estimate}</span>
      </div>

      {!art.imageId && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> A caneca está sem arte — envie uma imagem ou use o exemplo.
        </p>
      )}
      {tooBig && (
        <p className="flex items-center gap-1.5 text-[11px] text-red-400">
          <TriangleAlert className="h-3.5 w-3.5" /> Reduza a escala: máximo de {MAX_EXPORT_PX} px por lado.
        </p>
      )}

      <PrimaryButton onClick={doExport} disabled={busy || tooBig} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? 'Renderizando…' : 'Exportar agora'}
      </PrimaryButton>
    </div>
  );
}

/* ---------- marca d'água (compartilhada) ---------- */

function WatermarkBox({
  wm,
  patch,
}: {
  wm: ReturnType<typeof useMockupStore.getState>['watermark'];
  patch: ReturnType<typeof useMockupStore.getState>['patch'];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
      <ToggleRow label="Marca d'água" checked={wm.enabled} onChange={(v) => patch('watermark', { enabled: v })} />
      {wm.enabled && (
        <div className="mt-2 space-y-2">
          <input
            value={wm.text}
            onChange={(e) => patch('watermark', { text: e.target.value.slice(0, 60) })}
            placeholder="Texto da marca d'água"
            className="w-full rounded-md border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-neutral-100 outline-none focus:border-primary/60"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-neutral-500">Posição</span>
            <div className="flex flex-1 gap-1">
              {(
                [
                  ['tl', '↑←'],
                  ['tr', '↑→'],
                  ['bl', '↓←'],
                  ['br', '↓→'],
                ] as const
              ).map(([p, icon]) => (
                <button
                  key={p}
                  onClick={() => patch('watermark', { position: p })}
                  className={cn(
                    'flex-1 rounded-md border py-1 text-[10px] font-bold transition-all',
                    wm.position === p ? 'border-primary/60 bg-primary/15 text-primary' : 'border-white/10 text-neutral-400 hover:text-neutral-200',
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <SliderRow label="Tamanho" value={wm.size * 100} min={1.6} max={6} step={0.1} onChange={(v) => patch('watermark', { size: v / 100 })} defaultValue={2.8} format={(v) => `${v.toFixed(1)}% da largura`} />
          <SliderRow label="Opacidade" value={wm.opacity * 100} min={10} max={100} onChange={(v) => patch('watermark', { opacity: v / 100 })} defaultValue={70} format={(v) => `${Math.round(v)}%`} />
        </div>
      )}
    </div>
  );
}

/* ---------- aba vídeo ---------- */

function VideoTab() {
  const video = useMockupStore((s) => s.video);
  const patch = useMockupStore((s) => s.patch);
  const mug = useMockupStore((s) => s.mug);
  const bg = useMockupStore((s) => s.bg);
  const wm = useMockupStore((s) => s.watermark);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const isMagic = mug.variant === 'magic';

  const doExport = async () => {
    setBusy(true);
    setProgress(0);
    try {
      const res = await exportVideo(video.res, {
        anim: video.anim,
        duration: video.duration,
        fps: video.fps,
        onProgress: setProgress,
      });
      downloadBlob(res.blob, res.filename);
      setOpen(false);
      toast({
        title: 'Vídeo exportado!',
        description: `${res.width} × ${res.height} · ${(res.blob.size / 1024 / 1024).toFixed(1)} MB · MP4 (H.264)`,
      });
    } catch (e) {
      toast({
        title: 'Falha no vídeo',
        description: e instanceof ExportError ? e.message : 'Erro inesperado ao renderizar o vídeo.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <Segmented
        label="Movimento"
        value={video.anim}
        options={[
          { value: 'giro', label: 'Giro 360°' },
          { value: 'orbita', label: 'Órbita' },
          { value: 'zoom', label: 'Zoom' },
          { value: 'revelacao', label: 'Revelação' },
        ]}
        onChange={(v) => patch('video', { anim: v })}
      />
      {video.anim === 'revelacao' && !isMagic && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> A revelação térmica exige a caneca mágica (aba Caneca).
        </p>
      )}
      {bg.type === 'transparent' && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> Vídeo não tem alfa: com fundo transparente ele sai preto. Escolha um fundo na aba Cena.
        </p>
      )}

      <SliderRow label="Duração" value={video.duration} min={3} max={10} onChange={(v) => patch('video', { duration: v })} defaultValue={5} format={(v) => `${v} segundos`} />

      <Segmented
        label="Quadros por segundo"
        value={String(video.fps)}
        options={[
          { value: '24', label: '24 fps' },
          { value: '30', label: '30 fps' },
        ]}
        onChange={(v) => patch('video', { fps: Number(v) as 24 | 30 })}
      />

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Resolução</p>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(VIDEO_RESOLUTIONS).map(([id, r]) => (
            <button
              key={id}
              onClick={() => patch('video', { res: id as VideoState['res'] })}
              className={cn(
                'rounded-lg border px-2 py-2 text-[10px] font-bold transition-all',
                video.res === id
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
              )}
            >
              {r.label}
              <span className="block text-[9px] font-normal opacity-70">
                {r.w}×{r.h}
              </span>
            </button>
          ))}
        </div>
      </div>

      <WatermarkBox wm={wm} patch={patch} />

      {busy && <ProgressBar progress={progress} label={`Renderizando ${Math.round(progress * 100)}%`} />}

      <PrimaryButton onClick={doExport} disabled={busy || (video.anim === 'revelacao' && !isMagic)} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? 'Gravando…' : 'Gerar MP4'}
      </PrimaryButton>
      <p className="text-center text-[10px] text-neutral-500">
        H.264 via WebCodecs — sem upload, tudo no seu dispositivo. Navegadores antigos usam gravação em tempo real.
      </p>
    </div>
  );
}

/* ---------- aba GIF ---------- */

function GifTab() {
  const gif = useMockupStore((s) => s.gif);
  const patch = useMockupStore((s) => s.patch);
  const mug = useMockupStore((s) => s.mug);
  const wm = useMockupStore((s) => s.watermark);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const isMagic = mug.variant === 'magic';

  const doExport = async () => {
    setBusy(true);
    setProgress(0);
    try {
      const res = await exportGif(gif.width, {
        anim: gif.anim,
        duration: gif.duration,
        fps: gif.fps,
        onProgress: setProgress,
      });
      downloadBlob(res.blob, res.filename);
      setOpen(false);
      toast({
        title: 'GIF exportado!',
        description: `${res.width} × ${res.height} · ${(res.blob.size / 1024 / 1024).toFixed(1)} MB · loop infinito`,
      });
    } catch (e) {
      toast({
        title: 'Falha no GIF',
        description: e instanceof ExportError ? e.message : 'Erro inesperado ao gerar o GIF.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <Segmented
        label="Movimento"
        value={gif.anim}
        options={[
          { value: 'giro', label: 'Giro 360°' },
          { value: 'orbita', label: 'Órbita' },
          { value: 'zoom', label: 'Zoom' },
          { value: 'revelacao', label: 'Revelação' },
        ]}
        onChange={(v) => patch('gif', { anim: v })}
      />
      {gif.anim === 'revelacao' && !isMagic && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> A revelação térmica exige a caneca mágica.
        </p>
      )}

      <SliderRow label="Duração" value={gif.duration} min={2} max={8} onChange={(v) => patch('gif', { duration: v })} defaultValue={4} format={(v) => `${v} segundos`} />

      <Segmented
        label="Quadros por segundo"
        value={String(gif.fps)}
        options={[
          { value: '10', label: '10' },
          { value: '15', label: '15' },
          { value: '20', label: '20' },
        ]}
        onChange={(v) => patch('gif', { fps: Number(v) as 10 | 15 | 20 })}
      />

      <Segmented
        label="Largura"
        value={String(gif.width)}
        options={[
          { value: '360', label: '360 px' },
          { value: '480', label: '480 px' },
          { value: '640', label: '640 px' },
        ]}
        onChange={(v) => patch('gif', { width: Number(v) as 360 | 480 | 640 })}
      />

      <WatermarkBox wm={wm} patch={patch} />

      {busy && <ProgressBar progress={progress} label={`Gerando GIF ${Math.round(progress * 100)}%`} />}

      <PrimaryButton onClick={doExport} disabled={busy || (gif.anim === 'revelacao' && !isMagic)} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? 'Gerando…' : 'Gerar GIF'}
      </PrimaryButton>
    </div>
  );
}

/* ---------- aba lote ---------- */

const BATCH_ANGLE_IDS = ['atual', 'frente', 'tres-quartos', 'costas', 'lateral-esq', 'heroi', 'close-arte', 'topo'];

function BatchTab() {
  const mug = useMockupStore((s) => s.mug);
  const art = useMockupStore((s) => s.art);
  const wm = useMockupStore((s) => s.watermark);
  const patch = useMockupStore((s) => s.patch);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const { toast } = useToast();
  const [angles, setAngles] = useState<string[]>(['atual', 'frente', 'tres-quartos']);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [ratioId, setRatioId] = useState('sq');
  const [transparent, setTransparent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const variants = batchVariantsFor(mug.variant);
  const ratio = EXPORT_RATIOS.find((r) => r.id === ratioId) ?? EXPORT_RATIOS[0];

  const toggleAngle = (id: string) =>
    setAngles((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  const doExport = async () => {
    setBusy(true);
    setProgress(0);
    try {
      const res = await exportBatch({
        angles,
        variants,
        width: ratio.w,
        height: ratio.h,
        format,
        quality: 0.92,
        transparent: transparent && format === 'png',
        onProgress: setProgress,
      });
      downloadBlob(res.blob, res.filename);
      setOpen(false);
      toast({
        title: 'ZIP gerado!',
        description: `${res.count} imagens · ${(res.blob.size / 1024 / 1024).toFixed(1)} MB`,
      });
    } catch (e) {
      toast({
        title: 'Falha no lote',
        description: e instanceof ExportError ? e.message : 'Erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Ângulos (escolha vários)</p>
        <div className="grid grid-cols-4 gap-1">
          {BATCH_ANGLE_IDS.map((id) => {
            const p = CAMERA_PRESETS.find((c) => c.id === id);
            const label = id === 'atual' ? 'Atual' : p?.label ?? id;
            return (
              <button
                key={id}
                onClick={() => toggleAngle(id)}
                className={cn(
                  'rounded-lg border px-1 py-2 text-[10px] font-bold transition-all',
                  angles.includes(id)
                    ? 'border-primary/60 bg-primary/15 text-primary'
                    : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Variantes</p>
        <div className="flex flex-wrap gap-1">
          {variants.map((v) => (
            <span key={v.id} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-neutral-300">
              {v.label}
            </span>
          ))}
        </div>
        {mug.variant !== 'magic' && (
          <p className="mt-1 text-[10px] text-neutral-500">
            Dica: com a caneca mágica selecionada o lote sai com as versões fria e quente.
          </p>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-medium text-neutral-400">Proporção</p>
        <div className="grid grid-cols-4 gap-1">
          {EXPORT_RATIOS.filter((r) => r.id !== 'catalog').map((r) => (
            <button
              key={r.id}
              onClick={() => setRatioId(r.id)}
              className={cn(
                'rounded-lg border px-1 py-2 text-[10px] font-bold transition-all',
                ratioId === r.id
                  ? 'border-primary/60 bg-primary/15 text-primary'
                  : 'border-white/10 bg-white/[0.03] text-neutral-400 hover:text-neutral-200',
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <Segmented
        label="Formato"
        value={format}
        options={[
          { value: 'png', label: 'PNG' },
          { value: 'jpeg', label: 'JPG' },
        ]}
        onChange={(v) => setFormat(v)}
      />
      {format === 'png' && <ToggleRow label="Sem fundo (PNG transparente)" checked={transparent} onChange={setTransparent} />}

      <WatermarkBox wm={wm} patch={patch} />

      {!art.imageId && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> A caneca está sem arte.
        </p>
      )}
      {busy && <ProgressBar progress={progress} label={`Renderizando ${Math.round(progress * 100)}%`} />}

      <PrimaryButton onClick={doExport} disabled={busy || !angles.length || !art.imageId} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? 'Gerando…' : `Exportar ${angles.length * variants.length} imagens em ZIP`}
      </PrimaryButton>
    </div>
  );
}

/* ---------- aba folha (template planificado) ---------- */

function TemplateTab() {
  const art = useMockupStore((s) => s.art);
  const [dpi, setDpi] = useState<300 | 600>(300);
  const [fullWrap, setFullWrap] = useState(false);
  const [guides, setGuides] = useState(true);
  const setOpen = useMockupStore((s) => s.setExportOpen);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const widthCm = fullWrap ? 25.3 : 21.0;
  const heightCm = 8.7;
  const outW = Math.round((widthCm * dpi) / 2.54);
  const outH = Math.round((heightCm * dpi) / 2.54);

  const doExport = async () => {
    setBusy(true);
    try {
      const res = await exportTemplate({ dpi, fullWrap, guides });
      downloadBlob(res.blob, res.filename);
      setOpen(false);
      toast({
        title: 'Folha gerada!',
        description: `${res.width} × ${res.height} px · ${dpi} DPI — pronta para a prensa.`,
      });
    } catch (e) {
      toast({
        title: 'Falha na folha',
        description: e instanceof ExportError ? e.message : 'Erro inesperado.',
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-[11px] leading-relaxed text-neutral-300">
        A folha planificada é a arte no tamanho exato de impressão da caneca 11 oz — envie direto para a prensa
        térmica. Os ajustes do painel Arte (escala, posição, repetir) são aplicados.
      </p>

      <Segmented
        label="Resolução de impressão"
        value={String(dpi)}
        options={[
          { value: '300', label: '300 DPI (padrão)' },
          { value: '600', label: '600 DPI (máx.)' },
        ]}
        onChange={(v) => setDpi(Number(v) as 300 | 600)}
      />

      <ToggleRow label="Volta completa (inclui a região da alça)" checked={fullWrap} onChange={setFullWrap} />
      <ToggleRow label="Guias de corte e margem de segurança" checked={guides} onChange={setGuides} />

      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px]">
        <span className="text-neutral-400">
          Área: <strong className="text-neutral-100">{widthCm.toFixed(1).replace('.', ',')} × {heightCm.toFixed(1).replace('.', ',')} cm</strong>
        </span>
        <span className="text-neutral-500">{outW} × {outH} px</span>
      </div>

      {!art.imageId && (
        <p className="flex items-center gap-1.5 text-[11px] text-amber-400">
          <TriangleAlert className="h-3.5 w-3.5" /> Envie uma arte primeiro.
        </p>
      )}

      <PrimaryButton onClick={doExport} disabled={busy || !art.imageId} className="w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        {busy ? 'Gerando…' : 'Baixar folha PNG'}
      </PrimaryButton>
    </div>
  );
}

/* ---------- barra de progresso ---------- */

function ProgressBar({ progress, label }: { progress: number; label: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] text-neutral-400">
        <span>{label}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${Math.max(3, progress * 100)}%` }} />
      </div>
    </div>
  );
}
