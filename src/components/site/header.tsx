'use client';

import { motion } from 'framer-motion';
import { useToolsStore, type ToolId } from '@/lib/tools-store';
import {
  Home, QrCode, MessageCircle, FileSpreadsheet, Scale, FileText, Image as ImageIcon, CupSoda, Wrench,
  BookOpen,
} from 'lucide-react';
import { EXTRA_TOOLS } from '@/components/tools/extra/registry';

const NAV: { id: ToolId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'inicio', label: 'Início', icon: Home },
  { id: 'qr', label: 'QR Code', icon: QrCode },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { id: 'orcamento', label: 'Orçamento', icon: FileSpreadsheet },
  { id: 'contrato', label: 'Contrato', icon: Scale },
  { id: 'pdf', label: 'Editor PDF', icon: FileText },
  { id: 'imagens', label: 'Imagens', icon: ImageIcon },
  { id: 'mockup', label: 'Mockup 3D', icon: CupSoda },
  { id: 'extras', label: 'Ferramentas+', icon: Wrench },
];

export function Header() {
  const { activeTool, setActiveTool } = useToolsStore();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => window.location.pathname === '/' ? setActiveTool('inicio') : window.location.assign('/')}
          className="flex shrink-0 items-center gap-2.5 transition-transform active:scale-95"
          aria-label="Ir para o início"
        >
          { }
          <img src="/icons/icon-192.png" alt="Logo Click & Gruda" className="h-9 w-9 rounded-lg" />
          <div className="hidden text-left sm:block">
            <p className="font-display text-sm font-bold leading-none">
              Click <span className="text-primary">&amp;</span> Gruda
              <span className="ml-1 text-[10px] font-medium text-muted-foreground">Tools</span>
            </p>
            <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Ferramentas grátis</p>
          </div>
        </button>

        {/* Nav */}
        <nav className="thin-scroll ml-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border/70 bg-secondary/40 p-1" aria-label="Ferramentas">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => id === "mockup" ? window.location.assign("/mockup-caneca-3d") : setActiveTool(id)}
              title={label}
              aria-pressed={activeTool === id}
              className={`relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:px-3.5 ${
                activeTool === id ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTool === id && (
                <motion.span
                  layoutId="nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-primary"
                />
              )}
              <Icon className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10">{label}</span>
              {id === 'mockup' && (
                <span
                  className={`relative z-10 hidden rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none sm:inline ${
                    activeTool === id ? 'bg-black/25 text-amber-300' : 'bg-amber-400/20 text-amber-500'
                  }`}
                  title="Ferramenta premium"
                >
                  PRO
                </span>
              )}
              {id === 'extras' && (
                <span
                  className={`relative z-10 hidden rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none sm:inline ${
                    activeTool === id ? 'bg-black/25 text-white' : 'bg-primary/15 text-primary'
                  }`}
                >
                  +{EXTRA_TOOLS.length}
                </span>
              )}
            </button>
          ))}

          {/* blog — rota real */}
          <a
            href="/blog"
            className="relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-3.5"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Blog</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
