'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXTRA_TOOLS, CATEGORY_META, getExtraTool, type ExtraCategory } from './registry';
import { useToolsStore } from '@/lib/tools-store';
import { BackToExtrasButton } from './shell';
import { Search, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function ExtrasDirectory() {
  const { activeExtra, openExtra, extrasCategory, setExtrasCategory } = useToolsStore();
  const [cat, setCat] = useState<ExtraCategory | 'todas'>(() =>
    CATEGORY_META.some((item) => item.id === extrasCategory) ? extrasCategory as ExtraCategory : 'todas',
  );
  const [busca, setBusca] = useState('');

  const filtradas = EXTRA_TOOLS.filter((t) => {
    const okCat = cat === 'todas' || t.category === cat;
    const q = busca.trim().toLowerCase();
    const categoryLabel = CATEGORY_META.find((item) => item.id === t.category)?.label ?? '';
    const searchable = `${t.title} ${t.desc} ${t.id} ${categoryLabel}`.toLocaleLowerCase('pt-BR');
    const okBusca = !q || searchable.includes(q);
    return okCat && okBusca;
  });

  /* ----- visualização de UMA ferramenta aberta ----- */
  if (activeExtra) {
    const tool = getExtraTool(activeExtra);
    if (tool) {
      const Comp = tool.Component;
      return (
        <motion.div
          key={tool.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="mx-auto mb-5 flex max-w-5xl items-center gap-3 px-4 sm:px-6">
            <BackToExtrasButton />
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <tool.icon className="h-4 w-4" />
            </span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">
              {CATEGORY_META.find((c) => c.id === tool.category)?.label} · Ferramentas+
            </span>
          </div>
          <Comp />
        </motion.div>
      );
    }
  }

  /* ----- diretório ----- */
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Search className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold sm:text-2xl">Ferramentas+ · {EXTRA_TOOLS.length} utilitários</h2>
          <p className="text-sm text-muted-foreground">Calculadoras, geradores e conversores — tudo grátis, rápido e sem cadastro</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nome, categoria ou função…" aria-label="Buscar ferramentas por nome, categoria ou função" className="h-10 pl-9 pr-9"
          />
          {busca && <button type="button" onClick={() => setBusca('')} aria-label="Limpar busca" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">×</button>}
        </div>
      </div>
      <p className="-mt-3 mb-4 text-xs text-muted-foreground" aria-live="polite">
        {filtradas.length} de {EXTRA_TOOLS.length} ferramentas
        {cat !== 'todas' ? ` · ${CATEGORY_META.find((item) => item.id === cat)?.label}` : ''}
      </p>

      {/* filtro por categoria */}
      <div className="thin-scroll mb-6 flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => { setCat('todas'); setExtrasCategory(null); }}
          aria-pressed={cat === 'todas'}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
            cat === 'todas' ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
          }`}
        >
          Todas ({EXTRA_TOOLS.length})
        </button>
        {CATEGORY_META.map((c) => {
          const count = EXTRA_TOOLS.filter((t) => t.category === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => { setCat(c.id); setExtrasCategory(c.id); }}
              aria-pressed={cat === c.id}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all active:scale-95 ${
                cat === c.id ? 'text-white' : 'border-border bg-secondary/40 text-muted-foreground hover:text-foreground'
              }`}
              style={cat === c.id ? { background: c.cor, borderColor: c.cor } : undefined}
            >
              <c.icon className="h-3.5 w-3.5" />
              {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* grid */}
      <motion.div layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <AnimatePresence mode="popLayout">
          {filtradas.map((tool) => (
            <motion.button
              layout
              key={tool.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.18 }}
              onClick={() => openExtra(tool.id)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4 text-left backdrop-blur transition-colors hover:border-primary/40"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary transition-transform duration-300 group-hover:scale-110">
                  <tool.icon className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{tool.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{tool.desc}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="rounded-full bg-secondary/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {CATEGORY_META.find((c) => c.id === tool.category)?.label}
                </span>
                <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
              </div>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>

      {filtradas.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma ferramenta encontrada{busca ? <> para &quot;{busca}&quot;</> : ' nesta categoria'}.</p>
          <button type="button" onClick={() => { setBusca(''); setCat('todas'); setExtrasCategory(null); }} className="mt-3 rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10">
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}
