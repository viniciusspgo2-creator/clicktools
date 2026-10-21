'use client';

import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Header } from '@/components/site/header';
import { Footer } from '@/components/site/footer';
import { Home } from '@/components/site/home';
import { QrGenerator } from '@/components/tools/qr-generator';
import { WhatsAppLink } from '@/components/tools/whatsapp-link';
import { Orcamento } from '@/components/tools/orcamento';
import { Contrato } from '@/components/tools/contrato';
import { PdfEditor } from '@/components/tools/pdf-editor';
import { ImageConverter } from '@/components/tools/image-converter';
import { ExtrasDirectory } from '@/components/tools/extra/extras-directory';
import { useToolsStore, type ToolId } from '@/lib/tools-store';
import { PremiumGate } from '@/components/site/premium-gate';
import { ArrowLeft } from 'lucide-react';
import { useEffect } from 'react';
import { EXTRA_TOOLS } from '@/components/tools/extra/registry';

const MockupStudio = dynamic(
  () => import('@/components/tools/mockup/mockup-studio').then((m) => m.MockupStudio),
  { ssr: false },
);

const TOOL_META: Record<Exclude<ToolId, 'inicio'>, { title: string; subtitle: string }> = {
  qr: { title: 'Gerador de QR Code', subtitle: 'Personalize cores, logo e formato — e baixe em alta qualidade' },
  whatsapp: { title: 'Gerador de Link para WhatsApp', subtitle: 'Link padrão ou com o nome personalizado que você escolher' },
  orcamento: { title: 'Gerador de Orçamento', subtitle: 'Monte, visualize e exporte orçamentos profissionais em PDF' },
  contrato: { title: 'Gerador de Contrato', subtitle: 'Contratos com cláusulas prontas — preencha e baixe em PDF' },
  pdf: { title: 'Leitor & Editor de PDF', subtitle: 'Organize páginas, mescle, marque d\u2019água e edite — tudo local' },
  imagens: { title: 'Conversor de Imagens', subtitle: 'Converta até 10 imagens por vez para JPG, PNG ou WEBP' },
  mockup: { title: 'Mockup Studio — Canecas 3D', subtitle: 'PREMIUM · Sua arte em 3D fotorrealista, agora com caneca mágica' },
  extras: { title: 'Ferramentas+', subtitle: `${EXTRA_TOOLS.length} utilitários para negócios, impressão, design, texto e mais` },
};

function ToolHeader({ tool }: { tool: Exclude<ToolId, 'inicio'> }) {
  const setActiveTool = useToolsStore((s) => s.setActiveTool);
  const meta = TOOL_META[tool];

  return (
    <div className="mx-auto mb-6 flex max-w-7xl flex-wrap items-center gap-3 px-4 sm:px-6">
      <button
        onClick={() => setActiveTool('inicio')}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary/50 text-muted-foreground transition-all hover:border-primary/50 hover:text-primary active:scale-90"
        aria-label="Voltar ao início"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div>
        <h2 className="font-display text-xl font-bold sm:text-2xl">{meta.title}</h2>
        <p className="text-xs text-muted-foreground sm:text-sm">{meta.subtitle}</p>
      </div>
    </div>
  );
}

export default function Page() {
  const activeTool = useToolsStore((s) => s.activeTool);

  /* deep-link + histórico do navegador: o botão VOLTAR (inclusive o do
     mouse) volta para a ferramenta anterior em vez de sair do site */
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('tool') as ToolId | null;
    if (t && t !== 'inicio' && t in TOOL_META) {
      const extra = new URLSearchParams(window.location.search).get('extra');
      const validExtra = t === 'extras' && EXTRA_TOOLS.some((item) => item.id === extra) ? extra : null;
      window.history.replaceState({ tool: t, ...(validExtra ? { extra: validExtra } : {}) }, '', window.location.href);
      useToolsStore.getState().setActiveTool(t, undefined, { silent: true });
      if (validExtra) useToolsStore.setState({ activeExtra: validExtra as import('@/lib/tools-store').ExtraToolId });
    } else {
      window.history.replaceState({ tool: 'inicio' }, '', window.location.pathname);
    }
    const onPop = (e: PopStateEvent) => {
      const st = e.state as { tool?: ToolId; extra?: string } | null;
      const tool = st?.tool && st.tool in TOOL_META ? st.tool : 'inicio';
      useToolsStore.getState().setActiveTool(tool, undefined, { silent: true });
      if (tool === 'extras' && EXTRA_TOOLS.some((item) => item.id === st?.extra)) useToolsStore.setState({ activeExtra: st?.extra as import('@/lib/tools-store').ExtraToolId });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTool}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            {activeTool === 'inicio' && <Home />}
            {activeTool === 'qr' && (
              <>
                <ToolHeader tool="qr" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6"><QrGenerator /></div>
              </>
            )}
            {activeTool === 'whatsapp' && (
              <>
                <ToolHeader tool="whatsapp" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6"><WhatsAppLink /></div>
              </>
            )}
            {activeTool === 'orcamento' && (
              <>
                <ToolHeader tool="orcamento" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6"><Orcamento /></div>
              </>
            )}
            {activeTool === 'contrato' && (
              <>
                <ToolHeader tool="contrato" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6"><Contrato /></div>
              </>
            )}
            {activeTool === 'pdf' && (
              <>
                <ToolHeader tool="pdf" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6"><PdfEditor /></div>
              </>
            )}
            {activeTool === 'imagens' && (
              <>
                <ToolHeader tool="imagens" />
                <div className="mx-auto max-w-7xl px-4 sm:px-6"><ImageConverter /></div>
              </>
            )}
            {activeTool === 'mockup' && (
              <PremiumGate>
                <MockupStudio />
              </PremiumGate>
            )}
            {activeTool === 'extras' && <ExtrasDirectory />}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
