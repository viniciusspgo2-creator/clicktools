/* ============================================================
   Mockup Studio — shell completo
   Desktop: painéis laterais + viewport 3D central + barra inferior.
   Mobile: viewport no topo + bottom sheet com abas.
   ============================================================ */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Coffee, Download, FolderOpen, Loader2, MessageCircle, MousePointer2, Pause, Play,
  Redo2, RotateCcw, Sparkles, Undo2,
} from 'lucide-react';
import { useToolsStore } from '@/lib/tools-store';
import { useToast } from '@/hooks/use-toast';
import { useMockupStore } from './state/store';
import { ArtPanel, CameraPanel, ExportDialog, LightPanel, MugPanel, ScenePanel } from './ui/panels';
import { FXPanel, MultiMugPanel } from './ui/panels-extra';
import { ProjectsDialog, autosaveSession, restoreLastSession } from './ui/projects-dialog';
import { MiniButton, PrimaryButton } from './ui/controls';
import { CAMERA_PRESETS } from './lib/config';
import { loadBgFile } from './lib/background-registry';
import { cn } from '@/lib/utils';

const StudioCanvas = dynamic(() => import('./scene/studio-scene'), {
  ssr: false,
  loading: () => <StudioSkeleton />,
});

function StudioSkeleton() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[radial-gradient(ellipse_at_50%_35%,#1c1611,#0a0908)]">
      <div className="relative">
        <Coffee className="h-10 w-10 text-primary" />
        <span className="pulse-dot absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-primary" />
      </div>
      <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
        Preparando o estúdio 3D…
      </p>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full w-1/3 rounded-full bg-primary"
          animate={{ x: ['-100%', '300%'] }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
        />
      </div>
    </div>
  );
}

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

type MobileTab = 'arte' | 'caneca' | 'cena' | 'luz' | 'fx' | 'camera';

export function MockupStudio() {
  const setActiveTool = useToolsStore((s) => s.setActiveTool);
  const undo = useMockupStore((s) => s.undo);
  const redo = useMockupStore((s) => s.redo);
  const resetAll = useMockupStore((s) => s.resetAll);
  const rotateMug = useMockupStore((s) => s.rotateMug);
  const requestFocus = useMockupStore((s) => s.requestFocus);
  const patch = useMockupStore((s) => s.patch);
  const camera = useMockupStore((s) => s.camera);
  const applyCameraPreset = useMockupStore((s) => s.applyCameraPreset);
  const setExportOpen = useMockupStore((s) => s.setExportOpen);
  const setProjectsOpen = useMockupStore((s) => s.setProjectsOpen);
  const notifyArtApplied = useMockupStore((s) => s.notifyArtApplied);
  const artAppliedNonce = useMockupStore((s) => s.artAppliedNonce);
  const art = useMockupStore((s) => s.art);
  const bgType = useMockupStore((s) => s.bg.type);
  const bgAdjustMode = useMockupStore((s) => s.bgAdjustMode);
  const showGuides = useMockupStore((s) => s.showGuides);
  const projectName = useMockupStore((s) => s.projectName);
  const setProjectName = useMockupStore((s) => s.setProjectName);
  const canUndo = useMockupStore((s) => s.past.length > 0);
  const canRedo = useMockupStore((s) => s.future.length > 0);
  const { toast } = useToast();

  const [supported, setSupported] = useState<boolean | null>(null);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState<MobileTab>('arte');
  const fileRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const restoredRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSupported(hasWebGL());
  }, []);

  /* ---- restauração da última sessão + autosave (IndexedDB) ---- */
  useEffect(() => {
    if (supported !== true || restoredRef.current) return;
    restoredRef.current = true;
    (async () => {
      const s = useMockupStore.getState();
      const pristine = !s.art.imageId && s.past.length === 0 && s.companions.length === 0;
      if (!pristine) return;
      const ok = await restoreLastSession();
      if (ok && useMockupStore.getState().art.imageId) {
        useMockupStore.getState().notifyArtApplied();
        toast({ title: 'Última sessão restaurada', description: 'Sua cena anterior voltou — gerencie em Projetos.' });
      }
    })();
    const interval = setInterval(() => autosaveSession(), 25_000);
    const onHide = () => {
      autosaveSession();
    };
    window.addEventListener('pagehide', onHide);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pagehide', onHide);
    };
  }, [supported, toast]);

  /* ---- colar imagem (Ctrl+V) ---- */
  const pasteHandler = useCallback(
    (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (f) {
            const { setArtImage } = useMockupStore.getState();
            import('./lib/art-registry').then(async ({ loadArtFile }) => {
              try {
                const entry = await loadArtFile(f);
                setArtImage({ imageId: entry.id, name: entry.name, width: entry.naturalWidth, height: entry.naturalHeight });
                notifyArtApplied();
                toast({ title: 'Arte colada e aplicada!', description: 'Ctrl+V funcionou lindamente.' });
              } catch (err) {
                toast({
                  title: 'Imagem inválida',
                  description: err instanceof Error ? err.message : 'Tente outro arquivo.',
                  variant: 'destructive',
                });
              }
            });
          }
          e.preventDefault();
          return;
        }
      }
    },
    [notifyArtApplied, toast],
  );

  useEffect(() => {
    window.addEventListener('paste', pasteHandler);
    return () => window.removeEventListener('paste', pasteHandler);
  }, [pasteHandler]);

  /* ---- atalhos de teclado (não disparam enquanto digita) ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      const st = useMockupStore.getState();
      if (st.exportOpen || st.projectsOpen) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }
      if (mod) return;
      // espaço só alterna o giro quando NADA selecionável está focado —
      // antes, um botão focado recebia clique + alternância (duplo disparo)
      if (e.key === ' ' && t && (t.tagName === 'BUTTON' || t.tagName === 'A' || t.closest?.('[role=switch]'))) return;
      switch (e.key.toLowerCase()) {
        case 'r':
          rotateMug(45);
          break;
        case 'f':
          requestFocus();
          break;
        case ' ':
          e.preventDefault();
          patch('camera', { autoRotate: !useMockupStore.getState().camera.autoRotate });
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, rotateMug, requestFocus, patch]);

  /* ---- drag & drop (arte OU fundo, conforme o fundo ativo) ---- */
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      if (useMockupStore.getState().bg.type === 'image') {
        loadBgFile(file)
          .then((entry) => {
            patch('bg', { imageId: entry.id, imageZoom: 1, imageX: 0, imageY: 0, imageRot: 0 });
            toast({ title: 'Fundo trocado!', description: `${file.name} agora é o cenário.` });
          })
          .catch((err) => {
            toast({
              title: 'Imagem inválida para o fundo',
              description: err instanceof Error ? err.message : 'Tente outro arquivo.',
              variant: 'destructive',
            });
          });
        return;
      }
      if (fileRef.current) {
        const dt = new DataTransfer();
        dt.items.add(file);
        fileRef.current.files = dt.files;
        fileRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    },
    [patch, toast],
  );

  if (supported === false) {
    return (
      <div className="flex h-[calc(100dvh-61px)] items-center justify-center bg-[#0a0908] px-4">
        <div className="max-w-md rounded-2xl border border-white/10 bg-[#141110] p-8 text-center">
          <Coffee className="mx-auto h-10 w-10 text-primary" />
          <h2 className="font-display mt-4 text-xl font-bold text-white">Seu navegador não suporta 3D</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-400">
            O Mockup Studio precisa de WebGL. Atualize o navegador (Chrome, Safari, Edge ou Firefox recentes)
            ou fale com a gente no WhatsApp que ajudamos na hora.
          </p>
          <a
            href="https://wa.me/62998387816"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-display text-sm font-bold text-[#1d130d]"
          >
            <MessageCircle className="h-4 w-4" /> Falar com o suporte
          </a>
        </div>
      </div>
    );
  }

  const viewport = (
    <div className="relative h-full w-full">
      {supported !== null && <StudioCanvas />}

      {/* guias de enquadramento (grade de terços) */}
      {showGuides && (
        <div className="pointer-events-none absolute inset-0 z-[5]" aria-hidden>
          <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
          <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
          <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
          <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
        </div>
      )}

      {/* modo ajustar fundo: arrasta a imagem direto na cena */}
      {bgAdjustMode && bgType === 'image' && <BgAdjustOverlay />}

      {/* microinteração: flash ao aplicar arte */}
      {artAppliedNonce > 0 && (
        <motion.div
          key={artAppliedNonce}
          initial={{ opacity: 0.9 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="pointer-events-none absolute inset-0 z-10 rounded-none ring-2 ring-inset ring-primary/70"
        />
      )}

      {/* presets rápidos de câmera */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center">
        <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/10 bg-black/55 p-1 backdrop-blur-md">
          {CAMERA_PRESETS.filter((p) => ['frente', 'tres-quartos', 'costas', 'close-arte', 'heroi'].includes(p.id)).map((p) => (
            <button
              key={p.id}
              onClick={() => applyCameraPreset(p)}
              className="rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* dica quando não há arte */}
      {!art.imageId && !bgAdjustMode && (
        <div className="pointer-events-none absolute left-1/2 top-5 z-10 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-black/60 px-4 py-2 text-[11px] font-semibold text-neutral-200 backdrop-blur-md">
            <MousePointer2 className="h-3.5 w-3.5 text-primary" />
            Arraste uma imagem aqui, cole com Ctrl+V ou use o painel Arte
          </div>
        </div>
      )}

      {/* overlay de drag */}
      {dragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center border-2 border-dashed border-primary bg-primary/10 backdrop-blur-[2px]">
          <div className="rounded-2xl bg-black/70 px-6 py-4 text-center">
            <Sparkles className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 font-display text-sm font-bold text-white">
              {bgType === 'image' ? 'Solte para usar como fundo' : 'Solte para aplicar a arte'}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const hiddenFile = (
    <input
      ref={fileRef}
      type="file"
      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
      className="hidden"
      onChange={(e) => {
        const files = e.target.files;
        if (!files?.length) return;
        const { setArtImage } = useMockupStore.getState();
        import('./lib/art-registry').then(async ({ loadArtFile }) => {
          try {
            const entry = await loadArtFile(files[0]);
            setArtImage({ imageId: entry.id, name: entry.name, width: entry.naturalWidth, height: entry.naturalHeight });
            notifyArtApplied();
            toast({ title: 'Arte aplicada!', description: `${files[0].name} envolvendo a caneca.` });
          } catch (err) {
            toast({
              title: 'Não deu para usar essa arte',
              description: err instanceof Error ? err.message : 'Arquivo inválido.',
              variant: 'destructive',
            });
          }
        });
        e.target.value = '';
      }}
    />
  );

  return (
    <div
      ref={rootRef}
      id="mockup-root"
      className="relative flex h-[calc(100dvh-61px)] min-h-[540px] flex-col overflow-hidden bg-[#0a0908] text-neutral-100"
      onDragEnter={(e) => {
        e.preventDefault();
        dragCounter.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => {
        dragCounter.current -= 1;
        if (dragCounter.current <= 0) setDragging(false);
      }}
      onDrop={onDrop}
    >
      {hiddenFile}

      {/* ---------- barra superior ---------- */}
      <div className="relative z-30 flex min-h-[56px] shrink-0 items-center gap-2 border-b border-white/[0.08] bg-[#0d0b0a]/95 px-3 shadow-[0_8px_24px_-20px_rgba(0,0,0,.9)] backdrop-blur-xl sm:px-4">
        <button
          onClick={() => setActiveTool('inicio')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[.025] text-neutral-400 transition-colors hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
          aria-label="Voltar às ferramentas"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"><Coffee className="h-4 w-4 text-primary" /></span>
          <span className="hidden font-display text-sm font-bold leading-tight sm:block">
            Mockup <span className="text-primary">Studio</span><span className="mt-0.5 block text-[9px] font-medium uppercase tracking-[.16em] text-neutral-500">Workspace 3D</span>
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400 sm:inline-flex">
            Premium
          </span>
        </div>
        <input
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="mx-1 min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-2 py-2 text-xs text-neutral-300 outline-none transition-colors hover:border-white/10 focus:border-primary/35 focus:bg-black/30"
          aria-label="Nome do projeto"
          placeholder="Nome do projeto"
        />
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={undo} disabled={!canUndo} aria-label="Desfazer" className="rounded-lg border border-transparent p-2 text-neutral-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-25" title="Desfazer (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={redo} disabled={!canRedo} aria-label="Refazer" className="rounded-lg border border-transparent p-2 text-neutral-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-25" title="Refazer (Ctrl+Shift+Z)">
            <Redo2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              resetAll();
              toast({ title: 'Tudo zerado', description: 'A cena voltou ao padrão — Ctrl+Z desfaz se mudar de ideia.' });
            }}
            className="flex items-center gap-1 rounded-lg border border-white/10 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wide text-neutral-300 transition-colors hover:border-primary/50 hover:text-primary"
            title="Resetar tudo para começar do zero"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={() => setProjectsOpen(true)}
            className="rounded-lg border border-transparent p-2 text-neutral-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
            title="Meus projetos"
          >
            <FolderOpen className="h-4 w-4" />
          </button>
          <PrimaryButton onClick={() => setExportOpen(true)} className="ml-1 !px-4 !py-2">
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar</span>
          </PrimaryButton>
        </div>
      </div>

      {/* ---------- desktop ---------- */}
      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[292px_1fr_292px]">
        <aside aria-label="Controles de arte, caneca e cena" className="min-h-0 space-y-2.5 overflow-y-auto border-r border-white/[0.07] bg-[#0d0b0a] p-3.5 thin-scroll">
          <ArtPanel />
          <MugPanel />
          <MultiMugPanel />
          <ScenePanel />
        </aside>
        <main aria-label="Prévia 3D da caneca" className="relative min-h-0 bg-[radial-gradient(ellipse_at_50%_55%,#211811,#0b0a09_70%)]">{viewport}</main>
        <aside aria-label="Controles de iluminação, efeitos e câmera" className="min-h-0 space-y-2.5 overflow-y-auto border-l border-white/[0.07] bg-[#0d0b0a] p-3.5 thin-scroll">
          <LightPanel />
          <FXPanel />
          <CameraPanel />
        </aside>
      </div>

      {/* barra inferior (desktop) */}
      <div className="hidden h-[46px] shrink-0 items-center justify-between border-t border-white/[0.07] bg-[#0d0b0a] px-4 lg:flex">
        <div className="flex items-center gap-2">
          <button
            onClick={() => patch('camera', { autoRotate: !camera.autoRotate })}
            title={camera.autoRotate ? 'Para o giro automático da câmera' : 'Gira a caneca sozinha para mostrar todos os lados'}
            aria-label={camera.autoRotate ? 'Parar giro automático' : 'Girar automaticamente'}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-all',
              camera.autoRotate ? 'bg-primary text-[#1d130d]' : 'border border-white/10 text-neutral-300 hover:text-white',
            )}
          >
            {camera.autoRotate ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {camera.autoRotate ? 'Parar giro' : 'Girar automaticamente'}
          </button>
          {camera.autoRotate && (
            <input
              type="range"
              min={0.2}
              max={6}
              step={0.1}
              value={camera.autoRotateSpeed}
              onChange={(e) => patch('camera', { autoRotateSpeed: +e.target.value })}
              className="w-28 accent-[#e8703a]"
              aria-label="Velocidade do giro"
              title="Velocidade do giro"
            />
          )}
        </div>
        <p className="text-[10px] text-neutral-500">
          <kbd className="rounded bg-white/10 px-1">Espaço</kbd> girar/parar · <kbd className="rounded bg-white/10 px-1">R</kbd> girar a caneca 45° ·{' '}
          <kbd className="rounded bg-white/10 px-1">F</kbd> focar · <kbd className="rounded bg-white/10 px-1">Ctrl+V</kbd> colar arte
        </p>
        <div className="flex items-center gap-1">
          {(['lateral-esq', 'topo', 'close-alca'] as const).map((id) => {
            const p = CAMERA_PRESETS.find((c) => c.id === id)!;
            return (
              <MiniButton key={id} onClick={() => applyCameraPreset(p)} title={`Ver a caneca de: ${p.label}`}>
                {p.label}
              </MiniButton>
            );
          })}
        </div>
      </div>

      {/* ---------- mobile ---------- */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <div className="relative h-[40dvh] min-h-[300px] shrink-0">{viewport}</div>
        <div className="flex shrink-0 gap-1 border-b border-white/[0.07] bg-[#0d0b0a] px-2 py-2">
          {(
            [
              ['arte', 'Arte'],
              ['caneca', 'Caneca'],
              ['cena', 'Cena'],
              ['luz', 'Luz'],
              ['fx', 'Efeitos'],
              ['camera', 'Câmera'],
            ] as [MobileTab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={cn(
                'flex-1 rounded-lg px-2 py-2 text-[11px] font-bold transition-all',
                tab === id ? 'bg-primary text-[#1d130d]' : 'text-neutral-400 hover:bg-white/5',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#0d0b0a] p-3 thin-scroll">
          {tab === 'arte' && <ArtPanel />}
          {tab === 'caneca' && <MugPanel />}
          {tab === 'cena' && (
            <>
              <MultiMugPanel />
              <div className="h-2.5" />
              <ScenePanel />
            </>
          )}
          {tab === 'luz' && <LightPanel />}
          {tab === 'fx' && <FXPanel />}
          {tab === 'camera' && <CameraPanel />}
        </div>
      </div>

      <ExportDialog />
      <ProjectsDialog />
      <LoadingPulse />
    </div>
  );
}

/** pequeno loader flutuante quando a arte está sendo processada */
function LoadingPulse() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const unsub = useMockupStore.subscribe((s) => {
      if (s.art.imageId) {
        setShow(true);
        t = setTimeout(() => setShow(false), 450);
      }
    });
    return () => {
      unsub();
      clearTimeout(t);
    };
  }, []);
  if (!show) return null;
  return (
    <div className="pointer-events-none absolute right-4 top-16 z-30 flex items-center gap-2 rounded-full border border-primary/40 bg-black/70 px-3.5 py-2 text-[11px] font-bold text-primary backdrop-blur">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Aplicando arte…
    </div>
  );
}

/* ============================================================
   Modo "Ajustar fundo no 3D" — arrasta a imagem de fundo direto
   na cena, com guias de centro e encaixe magnético. Duplo clique
   recentra. Também serve no toque (pointer events).
   ============================================================ */

function BgAdjustOverlay() {
  const patch = useMockupStore((s) => s.patch);
  const setBgAdjustMode = useMockupStore((s) => s.setBgAdjustMode);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const st = useMockupStore.getState();
    const dx = ((e.clientX - last.current.x) / rect.width) * 1.6;
    const dy = ((e.clientY - last.current.y) / rect.height) * 1.6;
    last.current = { x: e.clientX, y: e.clientY };
    let nx = Math.max(-1, Math.min(1, st.bg.imageX + dx));
    let ny = Math.max(-1, Math.min(1, st.bg.imageY + dy));
    // encaixe magnético no centro
    if (Math.abs(nx) < 0.035) nx = 0;
    if (Math.abs(ny) < 0.035) ny = 0;
    patch('bg', { imageX: Math.round(nx * 1000) / 1000, imageY: Math.round(ny * 1000) / 1000 });
  };

  const onPointerUp = () => {
    dragging.current = false;
  };

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-20 cursor-move touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDoubleClick={() => patch('bg', { imageX: 0, imageY: 0 })}
    >
      {/* guias de centro */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-primary/60" />
      <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-primary/60" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-8 w-8 rounded-full border-2 border-primary/80" />
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
        <div className="flex items-center gap-3 rounded-full border border-primary/40 bg-black/70 px-4 py-2 text-[11px] font-semibold text-neutral-100 backdrop-blur-md">
          <span>Arraste para posicionar o fundo · duplo clique recentra</span>
          <button
            onClick={() => setBgAdjustMode(false)}
            className="rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-[#1d130d]"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
