/* ============================================================
   Painéis do estúdio (Arte, Caneca, Cena, Iluminação, Câmera)
   + diálogo de exportação de imagem.
   ============================================================ */

'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ImagePlus, CupSoda, Mountain, Lightbulb, Camera, Sparkles, Download, Loader2,
  Trash2, Wand2, RotateCw, FlipHorizontal2, Crosshair, Check, TriangleAlert, Flame, Snowflake,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMockupStore, type VideoState } from '../state/store';
import { loadArtFile, makeSampleArt, getArtImage } from '../lib/art-registry';
import { computeDpi } from '../lib/art-canvas';
import {
  BACKGROUND_LABELS, CAMERA_PRESETS, EXPORT_RATIOS, LIGHT_PRESETS, MAX_EXPORT_PX,
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
        onChange={(v) => patch('mug', { variant: v })}
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
            <MiniButton onClick={() => patch('mug', { magicHeat: 1 })} className="flex-1">
              <Flame className="mr-1 inline h-3 w-3 text-amber-400" /> Quente
            </MiniButton>
            <MiniButton onClick={() => patch('mug', { magicHeat: 0 })} className="flex-1">
              <Snowflake className="mr-1 inline h-3 w-3 text-sky-300" /> Fria
            </MiniButton>
          </div>
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
            label="Dissolução da borda"
            value={mug.magicDissolve * 100}
            min={0}
            max={100}
            onChange={(v) => patch('mug', { magicDissolve: v / 100 })}
            defaultValue={35}
            format={(v) => (v <= 2 ? 'linha reta' : `${Math.round(v)}% de ruído`)}
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
      <SliderRow label="Inclinação" value={mug.tiltX} min={-25} max={25} onChange={(v) => patch('mug', { tiltX: v })} defaultValue={0} format={(v) => `${Math.round(v)}°`} />
      <SliderRow label="Tamanho na cena" value={mug.scale * 100} min={60} max={140} onChange={(v) => patch('mug', { scale: v / 100 })} defaultValue={100} format={(v) => `${Math.round(v)}%`} />
      <SliderRow label="Altura na cena" value={mug.posY * 10} min={-8} max={20} onChange={(v) => patch('mug', { posY: v / 10 })} defaultValue={0} format={(v) => `${(v / 10).toFixed(1)} cm`} />
      {isMagic && (
        <p className="text-[10px] leading-relaxed text-neutral-500">
          A revelação também sai na exportação — crie imagens &quot;antes e depois&quot; exportando
          com a caneca fria e depois quente.
        </p>
      )}
    </Section>
  );
}

/* ---------------- Cena (fundo) ---------------- */

const BG_OPTIONS: { value: BackgroundType; label: string }[] = [
  { value: 'studio-white', label: 'Branco' },
  { value: 'studio-dark', label: 'Escuro' },
  { value: 'gradient', label: 'Gradiente' },
  { value: 'solid', label: 'Cor' },
  { value: 'transparent', label: 'Alfa' },
];

export function ScenePanel() {
  const bg = useMockupStore((s) => s.bg);
  const patch = useMockupStore((s) => s.patch);

  return (
    <Section title="Fundo & cena" icon={Mountain}>
      <div className="grid grid-cols-5 gap-1">
        {BG_OPTIONS.map((o) => (
          <button
            key={o.value}
            title={BACKGROUND_LABELS[o.value]}
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
      {bg.type === 'solid' && <ColorRow label="Cor do fundo e chão" value={bg.colorB} onChange={(v) => patch('bg', { colorB: v })} />}
      <ToggleRow label="Sombra de contato" checked={bg.contactShadow} onChange={(v) => patch('bg', { contactShadow: v })} />
      <ToggleRow label="Sombra projetada" checked={bg.castShadow} onChange={(v) => patch('bg', { castShadow: v })} />
      {bg.type === 'transparent' && (
        <p className="text-[10px] leading-relaxed text-neutral-500">
          Fundo invisível para exportar PNG/WebP com alfa — a sombra continua sobre a transparência.
        </p>
      )}
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
      <SliderRow label="Temperatura da luz" value={light.temperature} min={-2500} max={2500} onChange={(v) => patch('light', { temperature: v })} defaultValue={0} format={(v) => (v === 0 ? 'neutra' : v > 0 ? `+${Math.round(v)} K (mais quente)` : `${Math.round(v)} K (mais fria)`)} />
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

  return (
    <Section title="Câmera" icon={Camera} defaultOpen>
      <SliderRow
        label="Lente"
        value={camera.lens}
        min={24}
        max={100}
        onChange={(v) => patch('camera', { lens: v })}
        defaultValue={50}
        format={(v) => `${Math.round(v)} mm equivalente`}
      />
      <div className="grid grid-cols-3 gap-1">
        {CAMERA_PRESETS.map((p) => (
          <MiniButton key={p.id} onClick={() => applyPreset(p)} className="!px-1 !text-[10px]">
            {p.label}
          </MiniButton>
        ))}
      </div>
      <div className="flex gap-1.5">
        <MiniButton onClick={requestFocus} className="flex-1">
          <Crosshair className="mr-1 inline h-3 w-3" /> Focar (F)
        </MiniButton>
        <MiniButton onClick={() => rotateMug(180)} className="flex-1">
          <RotateCw className="mr-1 inline h-3 w-3" /> Virar
        </MiniButton>
      </div>
      <ToggleRow label="Giro automático (turntable)" checked={camera.autoRotate} onChange={(v) => patch('camera', { autoRotate: v })} />
      {camera.autoRotate && (
        <SliderRow label="Velocidade do giro" value={camera.autoRotateSpeed} min={0.2} max={6} step={0.1} onChange={(v) => patch('camera', { autoRotateSpeed: v })} defaultValue={1.6} />
      )}
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
        <ToggleRow label="Fundo transparente (alfa)" checked={es.transparent} onChange={(v) => setExport({ transparent: v })} />
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
      {format === 'png' && <ToggleRow label="Fundo transparente (alfa)" checked={transparent} onChange={setTransparent} />}

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
