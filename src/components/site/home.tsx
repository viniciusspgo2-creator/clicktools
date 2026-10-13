'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useToolsStore, type ToolId } from '@/lib/tools-store';
import { EXTRA_TOOLS, CATEGORY_META } from '@/components/tools/extra/registry';
import { MugsIllustration, TvIllustration, MockupStudioIllustration } from './illustrations';
import {
  QrCode, MessageCircle, FileSpreadsheet, Scale, FileText, Image as ImageIcon,
  Coffee, ArrowRight, ArrowDown, Zap, ShieldCheck, Infinity as InfinityIcon,
  Sparkles, Check, Crown, Download, Tv, Play, Popcorn, Clapperboard, Wrench, Share2, CupSoda,
  LockKeyhole, Wand2,
} from 'lucide-react';

const TOOLS: { id: ToolId; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; chips: string[] }[] = [
  {
    id: 'qr',
    icon: QrCode,
    title: 'Gerador de QR Code',
    desc: 'QR Codes profissionais com logo, cores em gradiente, estilos de pontos, PIX, Wi-Fi, vCard e download em PNG/SVG/WEBP.',
    chips: ['Logo no centro', 'PIX / Wi-Fi / vCard', 'Download HD'],
  },
  {
    id: 'whatsapp',
    icon: MessageCircle,
    title: 'Link para WhatsApp',
    desc: 'Crie links wa.me com mensagem automática e ainda gere um link personalizado com o nome que você quiser — sem números na frente.',
    chips: ['Link com nome', 'Mensagem pronta', 'QR automático'],
  },
  {
    id: 'orcamento',
    icon: FileSpreadsheet,
    title: 'Gerador de Orçamento',
    desc: 'Monte orçamentos profissionais com itens, descontos, condições, logo da empresa e assinaturas. Exporte em PDF na hora.',
    chips: ['Preview ao vivo', 'Descontos', 'Exportar PDF'],
  },
  {
    id: 'contrato',
    icon: Scale,
    title: 'Gerador de Contrato',
    desc: 'Contratos com cláusulas prontas para serviços, venda, NDA, freelancer e manutenção. Você só preenche e baixa em PDF.',
    chips: ['5 modelos', 'Cláusulas automáticas', 'Testemunhas'],
  },
  {
    id: 'pdf',
    icon: FileText,
    title: 'Leitor & Editor de PDF',
    desc: 'Organize páginas, gire, exclua, extraia, mescle PDFs, aplique marca d\u2019água, numeração e edite metadados. 100% no navegador.',
    chips: ['Mesclar PDFs', 'Marca d\u2019água', 'Privacidade total'],
  },
  {
    id: 'imagens',
    icon: ImageIcon,
    title: 'Conversor de Imagens',
    desc: 'Converta até 10 imagens por vez entre JPG, PNG, WEBP e mais — com redimensionamento, qualidade ajustável e download em ZIP.',
    chips: ['10 por lote', 'Redimensionar', 'ZIP final'],
  },
];

const MARQUEE = [
  'Mockup 3D de Canecas', 'QR Code Pro', 'Link de WhatsApp', 'Orçamentos', 'Contratos',
  'Editor de PDF', 'Conversor de Imagens', 'Juros Compostos', 'Sorteador', 'Gerador de Senhas',
  'Código de Barras', 'Paleta de Cores', 'Consulta de CEP', 'Pomodoro',
  'Construtor UTM', '+38 Extras',
];

const STATS = [
  { v: '45+', l: 'ferramentas' },
  { v: '9', l: 'categorias' },
  { v: '100%', l: 'grátis' },
  { v: '0', l: 'cadastros' },
];

const GENRES = ['Ação', 'Comédia', 'Terror', 'Animação', 'Romance', 'Documentário'];

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const card = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 120, damping: 18 } },
};

function Reveal({
  children, className, delay = 0, id,
}: { children: React.ReactNode; className?: string; delay?: number; id?: string }) {
  return (
    <motion.div
      id={id}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ type: 'spring', stiffness: 110, damping: 18, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ================= HERO (preto) ================= */

function Hero() {
  return (
    <div className="relative overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="grid-bg absolute inset-0" />
        <div className="aurora -top-24 left-1/4 h-72 w-72 bg-primary/25" />
        <div className="aurora right-10 top-40 h-60 w-60 bg-whats/15" style={{ animationDelay: '-6s' }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-14 sm:px-6 sm:pb-28 sm:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            100% grátis · sem cadastro · funciona direto no navegador
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-display text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
          >
            45 ferramentas que seu negócio precisa,{' '}
            <span className="text-gradient-brand">em um só lugar</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            QR Codes avançados, links elegantes para WhatsApp, orçamentos, contratos,
            edição de PDFs, conversão de imagens <strong className="text-foreground">e mais 38 utilitários bônus</strong> —
            rápido, privado e sem pagar nada.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="mt-7 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={() => scrollTo('essenciais')}
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-sm font-bold text-primary-foreground shadow-[0_10px_30px_-8px_rgba(232,112,58,0.6)] transition-transform hover:scale-[1.04] active:scale-95"
            >
              Ver ferramentas
              <ArrowDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </button>
            <button
              onClick={() => scrollTo('todas-ferramentas')}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-6 py-3 font-display text-sm font-bold text-primary transition-colors hover:bg-primary/20 active:scale-95"
            >
              <Wrench className="h-4 w-4" />
              Explorar as +38 extras
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Processamento instantâneo</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-whats" /> Seus arquivos não saem do seu dispositivo</span>
            <span className="flex items-center gap-1.5"><InfinityIcon className="h-3.5 w-3.5 text-primary" /> Uso ilimitado</span>
          </motion.div>
        </div>

        {/* stats */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <div
              key={s.l}
              className="glass-card rounded-2xl px-4 py-4 text-center transition-transform hover:-translate-y-1"
            >
              <p className="font-display text-2xl font-bold text-primary sm:text-3xl">{s.v}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-wider text-muted-foreground">{s.l}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ================= FAIXA MARQUEE (laranja) ================= */

function MarqueeBand() {
  return (
    <div className="relative z-20 -my-6 rotate-[-1.3deg] scale-[1.03]">
      <div className="border-y-2 border-[#1d130d]/50 bg-[linear-gradient(90deg,#f08048,#e8703a_40%,#e0622e)] py-3 shadow-[0_14px_44px_-12px_rgba(232,112,58,0.6)]">
        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex shrink-0 items-center gap-8 pr-8" aria-hidden={copy === 1}>
                {MARQUEE.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-8 whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.14em] text-[#1d130d]"
                  >
                    {item}
                    <Coffee className="h-4 w-4 opacity-70" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= ESSENCIAIS (branco) ================= */

function EssentialsSection() {
  const setActiveTool = useToolsStore((s) => s.setActiveTool);

  return (
    <section id="essenciais" className="relative scroll-mt-16 bg-[#faf6f0] pb-20 pt-24 sm:pt-28">
      <div className="dot-grid-light pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d130d] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ffb488]">
              <Sparkles className="h-3 w-3" /> As essenciais
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-[#1d130d] sm:text-4xl">
              6 ferramentas que resolvem seu dia a dia
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#7c6f63] sm:text-base">
              Rápidas, gratuitas e direto no navegador. Clique em qualquer uma para começar —
              e role a página que tem muito mais te esperando.
            </p>
          </div>
          <button
            onClick={() => scrollTo('todas-ferramentas')}
            className="group inline-flex shrink-0 items-center gap-2 self-start rounded-full border-2 border-[#e8703a] bg-white px-5 py-2.5 font-display text-xs font-bold uppercase tracking-wide text-[#e8703a] transition-colors hover:bg-[#e8703a] hover:text-white sm:self-auto"
          >
            +38 bônus logo abaixo
            <ArrowDown className="h-3.5 w-3.5 transition-transform group-hover:translate-y-0.5" />
          </button>
        </Reveal>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {TOOLS.map((tool) => (
            <motion.button
              key={tool.id}
              variants={card}
              onClick={() => setActiveTool(tool.id)}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.98 }}
              className="card-light group relative overflow-hidden rounded-2xl border border-[#eadfd2] bg-white p-5 text-left transition-colors duration-300 hover:border-[#e8703a]/60 sm:p-6"
            >
              <div className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-[#e8703a]/20 to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#fdeee3] text-[#e8703a] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <tool.icon className="h-5 w-5" />
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[#e8703a] opacity-0 transition-all duration-300 group-hover:opacity-100">
                    Abrir <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold text-[#1d130d]">{tool.title}</h3>
                <p className="mt-2 min-h-16 text-sm leading-relaxed text-[#7c6f63]">{tool.desc}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {tool.chips.map((chip) => (
                    <span key={chip} className="rounded-full border border-[#eee3d6] bg-[#faf4ec] px-2.5 py-0.5 text-[10px] font-medium text-[#8b7d6e]">
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>

        {/* ===== Mockup Studio de Canecas — PREMIUM ===== */}
        <Reveal className="mt-6" delay={0.05}>
          <button
            onClick={() => setActiveTool('mockup')}
            className="card-light group relative flex w-full flex-col items-center gap-4 overflow-hidden rounded-2xl border-2 border-amber-400/70 bg-[linear-gradient(120deg,#fffdf6,#fff3d6_55%,#fdeee3)] px-6 py-5 text-center transition-all hover:border-amber-500 sm:flex-row sm:text-left"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-600 text-[#1d130d] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
              <Crown className="h-6 w-6" />
            </span>
            <div className="flex-1">
              <p className="font-display text-sm font-bold uppercase tracking-wide text-[#1d130d]">
                Mockup 3D Studio — <span className="text-amber-600">ferramenta premium!</span>
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#7c6f63]">
                Estúdio fotorrealista no navegador: sua arte envolvendo a caneca, luz de estúdio,
                caneca mágica e exportação em alta resolução.{' '}
                <strong className="text-[#1d130d]">Incluído para assinantes da Biblioteca de Artes</strong> —
                acesso por código exclusivo.
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-4 py-2 font-display text-xs font-bold uppercase tracking-wide text-[#1d130d] shadow-lg transition-transform group-hover:scale-105">
              Abrir com código <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </button>
        </Reveal>

        <ExtrasPanel />
      </div>
    </section>
  );
}

/* ================= PAINEL +38 FERRAMENTAS (preto sobre branco) ================= */

function ExtrasPanel() {
  const setActiveTool = useToolsStore((s) => s.setActiveTool);

  const cats = CATEGORY_META.map((c) => {
    const list = EXTRA_TOOLS.filter((t) => t.category === c.id);
    return { ...c, count: list.length, examples: list.slice(0, 2).map((t) => t.title) };
  });

  return (
    <Reveal id="todas-ferramentas" className="mt-14 scroll-mt-20">
      <div className="relative overflow-hidden rounded-3xl bg-[#0f0c0a] p-6 shadow-[0_30px_80px_-30px_rgba(29,19,13,0.5)] sm:p-10">
        <div className="dot-grid-dark pointer-events-none absolute inset-0" />
        <div className="aurora -right-24 -top-28 h-80 w-80 bg-primary/30" />
        <span className="watermark pointer-events-none absolute -bottom-7 right-2 hidden font-display text-[130px] font-bold leading-none lg:block">
          MAIS
        </span>

        <div className="relative grid gap-8 lg:grid-cols-[1fr_1.35fr] lg:gap-12">
          {/* texto */}
          <div className="flex flex-col items-start">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1d130d]">
              <Wrench className="h-3 w-3" /> Ferramentas+ · bônus grátis
            </span>
            <h3 className="mt-4 font-display text-3xl font-bold leading-tight text-[#f3ede4] sm:text-4xl">
              Tem muito mais
              <span className="text-gradient-brand"> além das 6 essenciais</span>
            </h3>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-[#a89c8e] sm:text-base">
              Finanças, segurança, texto, design, produtividade e mais: 38 utilitários extras
              esperando por você — todos grátis, sem cadastro e no mesmo lugar.
            </p>
            <div className="mt-5 flex items-center gap-4 text-xs text-[#a89c8e]">
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> 38 utilitários</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> 9 categorias</span>
              <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-primary" /> R$ 0,00</span>
            </div>
            <button
              onClick={() => setActiveTool('extras')}
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-display text-sm font-bold text-[#1d130d] shadow-[0_10px_30px_-8px_rgba(232,112,58,0.7)] transition-transform hover:scale-[1.04] active:scale-95"
            >
              Abrir todas as ferramentas
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* categorias */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {cats.map((cat, i) => (
              <motion.button
                key={cat.id}
                onClick={() => setActiveTool('extras')}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 140, damping: 18 }}
                className="group rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left backdrop-blur transition-colors hover:border-primary/50 hover:bg-white/[0.07]"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                    style={{ backgroundColor: `${cat.cor}22`, color: cat.cor }}
                  >
                    <cat.icon className="h-4 w-4" />
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-[#f3ede4]">
                    {cat.count}
                  </span>
                </div>
                <p className="mt-2 font-display text-xs font-bold text-[#f3ede4]">{cat.label}</p>
                <p className="mt-0.5 truncate text-[10px] text-[#8b7d6e]">{cat.examples.join(' · ')}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

/* ================= BANNER PREMIUM — MOCKUP 3D STUDIO (preto com dourado) ================= */

const MOCKUP_FEATURES = [
  'Canecas 3D fotorrealistas com verniz, sombras e reflexos reais',
  'Sua arte envolvendo a caneca em projeção cilíndrica exata',
  'Caneca branca, colorida e MÁGICA com revelação térmica animada',
  'Vídeo MP4 em giro 360°, GIF animado e lote de ângulos em ZIP',
  'Cenas com várias canecas + folha de sublimação em 300/600 DPI',
  '100% no navegador — sua arte não sai do seu dispositivo',
];

function MockupBanner() {
  const setActiveTool = useToolsStore((s) => s.setActiveTool);

  return (
    <section id="mockup-3d" className="relative scroll-mt-16 overflow-hidden bg-[#080706] py-20 sm:py-24">
      {/* brilhos dourados */}
      <div className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-primary/15 blur-[110px]" />
      <div className="dot-grid-dark pointer-events-none absolute inset-0 opacity-50" />
      <span className="watermark pointer-events-none absolute -top-6 right-4 hidden font-display text-[150px] font-bold leading-none lg:block">
        3D
      </span>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        {/* texto */}
        <Reveal>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-300">
            <Crown className="h-3.5 w-3.5" /> Premium · Novidade
          </span>

          <h2 className="font-display mt-4 text-4xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl">
            MOCKUP
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-200 bg-clip-text text-transparent">
              3D STUDIO
            </span>
          </h2>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-neutral-300 sm:text-base">
            Fotos de estúdio fotorrealistas das suas canecas — sem estúdio, sem fotógrafo,
            sem mensalidade. Carregue a arte, escolha a luz e exporte em alta resolução
            direto do navegador.
          </p>

          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {MOCKUP_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-[13px] leading-snug text-neutral-200">
                <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-amber-400/15">
                  <Check className="h-3 w-3 text-amber-400" />
                </span>
                {f}
              </li>
            ))}
          </ul>

          {/* selo de acesso */}
          <div className="mt-7 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3">
            <LockKeyhole className="h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-xs leading-relaxed text-neutral-200">
              <strong className="text-amber-300">Ferramenta PREMIUM</strong> — liberada para
              assinantes da <strong className="text-white">Biblioteca de Artes</strong>. Acesso
              vitalício pelo seu código exclusivo.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTool('mockup')}
              className="group flex items-center gap-2 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wide text-[#1d130d] shadow-[0_18px_50px_-12px_rgba(251,191,36,0.55)] transition-all hover:scale-[1.03] hover:brightness-110 active:scale-95"
            >
              <Wand2 className="h-4 w-4 transition-transform group-hover:rotate-12" />
              Abrir Mockup Studio
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="https://clickgruda.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 font-display text-xs font-bold uppercase tracking-wide text-neutral-200 transition-colors hover:border-amber-400/50 hover:text-amber-300"
            >
              <Crown className="h-4 w-4" /> Conhecer a Biblioteca
            </a>
          </div>
        </Reveal>

        {/* ilustração */}
        <Reveal delay={0.12} className="relative">
          <div className="mx-auto max-w-[520px] rounded-3xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm sm:p-6">
            <MockupStudioIllustration />
          </div>
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/10 blur-[90px]" />
        </Reveal>
      </div>
    </section>
  );
}

/* ================= BANNER 1 — BIBLIOTECA DE ARTES PARA CANECAS (laranja) ================= */

function CanecasBanner() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#f08048_0%,#e8703a_45%,#d95f2b_100%)] py-16 sm:py-24">
      <span className="watermark-dark pointer-events-none absolute -top-5 right-0 select-none font-display text-[24vw] font-bold leading-none sm:text-[170px]">
        CANECAS
      </span>
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-16 top-16 h-56 w-56 rounded-full bg-[#1d130d]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        {/* texto */}
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#1d130d] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
            <Crown className="h-3.5 w-3.5 text-[#ffb488]" />
            Sessão exclusiva · produto digital
          </span>

          <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
            BIBLIOTECA DE
            <br />
            <span className="text-[#1d130d]">ARTES PARA CANECAS</span>
          </h2>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/90">
            Um acervo completo, organizado e pronto para usar: escolha a arte, baixe em alta
            resolução e aplique nas suas canecas em minutos. Perfeito para quem vende
            personalizados e quer produção profissional.
          </p>

          <ul className="mt-6 space-y-2.5">
            {[
              'Artes exclusivas, organizadas e prontas para imprimir',
              'Downloads em alta resolução para canecas mágicas',
              'Acesso vitalício: pague uma vez e use para sempre',
              'Novidades adicionadas constantemente',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-white">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#e8703a]">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-wrap items-end gap-6">
            <div className="rounded-2xl bg-white px-6 py-4 shadow-[0_20px_50px_-18px_rgba(29,19,13,0.5)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#b9845c]">
                Acesso vitalício por apenas
              </p>
              <p className="font-display text-4xl font-bold leading-tight text-[#1d130d] sm:text-5xl">
                R$ 47,90
              </p>
              <p className="text-[11px] font-medium text-[#8b7d6e]">pagamento único · acesso para sempre</p>
            </div>
            <a
              href="https://clickgruda.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full bg-[#1d130d] px-7 py-4 font-display text-sm font-bold uppercase tracking-wide text-white shadow-xl transition-transform hover:scale-[1.04] active:scale-95"
            >
              Quero meu acesso
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </Reveal>

        {/* ilustração */}
        <Reveal delay={0.1} className="relative">
          <div className="floaty relative mx-auto max-w-lg">
            <MugsIllustration />
            <div className="floaty absolute -top-1 left-2 flex items-center gap-1.5 rounded-full bg-[#1d130d] px-3.5 py-2 text-xs font-semibold text-white shadow-lg">
              <Crown className="h-3.5 w-3.5 text-[#ffb488]" /> Acesso vitalício
            </div>
            <div className="floaty absolute right-0 top-1/3 flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[#1d130d] shadow-lg [animation-delay:1.3s]">
              <Download className="h-3.5 w-3.5 text-[#e8703a]" /> Alta resolução
            </div>
            <div className="floaty absolute -bottom-3 left-8 flex items-center gap-1.5 rounded-full bg-[#1d130d] px-3.5 py-2 text-xs font-semibold text-white shadow-lg [animation-delay:2.2s]">
              <Sparkles className="h-3.5 w-3.5 text-[#ffb488]" /> Novidades frequentes
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= BANNER 2 — TV ONLINE (preto) ================= */

function TvBanner() {
  return (
    <section className="relative overflow-hidden bg-[#0a0908] py-16 sm:py-24">
      <span className="watermark pointer-events-none absolute -bottom-5 left-0 select-none font-display text-[24vw] font-bold leading-none sm:text-[170px]">
        CINEMA
      </span>
      <div className="dot-grid-dark pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="aurora -left-24 top-10 h-80 w-80 bg-primary/20" />
        <div className="aurora -right-20 bottom-0 h-64 w-64 bg-primary/15" style={{ animationDelay: '-8s' }} />
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        {/* ilustração */}
        <Reveal className="relative order-2 lg:order-1">
          <div className="floaty relative mx-auto max-w-lg [animation-delay:0.8s]">
            <TvIllustration />
            <div className="floaty absolute -top-2 right-6 flex items-center gap-1.5 rounded-full bg-[#e8703a] px-3.5 py-2 text-xs font-semibold text-[#1d130d] shadow-lg">
              <Popcorn className="h-3.5 w-3.5" /> Filmes
            </div>
            <div className="floaty absolute bottom-6 left-0 flex items-center gap-1.5 rounded-full bg-[#f3ede4] px-3.5 py-2 text-xs font-semibold text-[#1d130d] shadow-lg [animation-delay:1.4s]">
              <Clapperboard className="h-3.5 w-3.5 text-[#e8703a]" /> Séries
            </div>
            <div className="floaty absolute right-2 bottom-16 flex items-center gap-1.5 rounded-full border border-primary/50 bg-[#171310] px-3.5 py-2 text-xs font-semibold text-primary shadow-lg [animation-delay:2.4s]">
              <Zap className="h-3.5 w-3.5" /> 24h no ar
            </div>
          </div>
        </Reveal>

        {/* texto */}
        <Reveal delay={0.08} className="order-1 lg:order-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#ef4444]/40 bg-[#ef4444]/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#fca5a5]">
            <Tv className="h-3.5 w-3.5" />
            Play Media Hub · streaming
          </span>

          <h2 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-[#f3ede4] sm:text-5xl">
            TV ONLINE - FILMES E SÉRIES
          </h2>

          <p className="text-gradient-brand mt-3 font-display text-xl font-bold uppercase tracking-wide sm:text-2xl">
            Diversão e entretenimento garantido
          </p>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-[#a89c8e]">
            Dê play e relaxe: um catálogo pensado para toda a família, com filmes e séries
            para todas as idades e gostos. É só escolher, apertar o play e aproveitar.
          </p>

          <ul className="mt-6 space-y-2.5">
            {[
              'Filmes e séries para todos os gostos e idades',
              'Assista no celular, computador ou na TV',
              'Catálogo atualizado constantemente',
              'Entretenimento 24 horas, onde você estiver',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-[#f3ede4]">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8703a] text-[#1d130d]">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {GENRES.map((g) => (
              <span key={g} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-[#a89c8e]">
                {g}
              </span>
            ))}
          </div>

          <a
            href="https://clickgruda.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-7 inline-flex items-center gap-2.5 rounded-full bg-[#e8703a] px-8 py-4 font-display text-sm font-bold uppercase tracking-wide text-[#1d130d] shadow-[0_16px_40px_-10px_rgba(232,112,58,0.7)] transition-transform hover:scale-[1.04] active:scale-95"
          >
            <Play className="h-4 w-4 fill-current" />
            Assistir agora
          </a>
        </Reveal>
      </div>
    </section>
  );
}

/* ================= CTA FINAL (branco) ================= */

function FinalCta() {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Click & Gruda Tools',
          text: '44 ferramentas online grátis, sem cadastro!',
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(window.location.origin);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      /* compartilhamento cancelado */
    }
  };

  return (
    <section className="relative bg-[#faf6f0] py-16">
      <div className="dot-grid-light pointer-events-none absolute inset-0" />
      <Reveal className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h3 className="font-display text-3xl font-bold tracking-tight text-[#1d130d] sm:text-4xl">
          Cansado de caçar ferramenta por aí?
        </h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#7c6f63] sm:text-base">
          Aqui são 45 ferramentas grátis, sem cadastro e sem pegadinha. Salve o site nos favoritos
          e mande para aquele amigo que trabalha por conta própria — ele vai agradecer.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => scrollTo('essenciais')}
            className="group inline-flex items-center gap-2 rounded-full bg-[#e8703a] px-6 py-3 font-display text-sm font-bold text-white shadow-[0_12px_32px_-10px_rgba(232,112,58,0.7)] transition-transform hover:scale-[1.04] active:scale-95"
          >
            Usar as ferramentas
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          <button
            onClick={share}
            className="inline-flex items-center gap-2 rounded-full border-2 border-[#1d130d] bg-white px-6 py-3 font-display text-sm font-bold text-[#1d130d] transition-colors hover:bg-[#1d130d] hover:text-white active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            {copied ? 'Link copiado!' : 'Compartilhar'}
          </button>
        </div>
      </Reveal>
    </section>
  );
}

/* ================= HOME ================= */

export function Home() {
  return (
    <div className="relative">
      <Hero />
      <MarqueeBand />
      <EssentialsSection />
      <MockupBanner />
      <CanecasBanner />
      <TvBanner />
      <FinalCta />
    </div>
  );
}

