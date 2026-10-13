'use client';

import { MessageCircle, Instagram, ExternalLink, Heart, BookOpen, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-between">
          {/* Marca */}
          <div className="flex flex-col items-center gap-2 text-center md:items-start md:text-left">
            { }
            <img src="/logo.png" alt="Click & Gruda" className="h-10 w-auto" />
            <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
              Suíte de ferramentas online <strong className="text-foreground">100% grátis e sem cadastro</strong>.
              Simples, rápido e feito para facilitar o seu dia a dia.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center gap-3 md:items-start">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fale com a gente</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <a
                href="https://wa.me/62998387816"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-whats/40 bg-whats/10 px-3.5 py-1.5 text-xs font-medium text-whats transition-all hover:bg-whats/20 active:scale-95"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Suporte no WhatsApp
              </a>
              <a
                href="https://instagram.com/clickgruda.digital"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20 active:scale-95"
              >
                <Instagram className="h-3.5 w-3.5" /> @clickgruda.digital
              </a>
              <a
                href="https://instagram.com/playmedia.hub"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary transition-all hover:bg-primary/20 active:scale-95"
              >
                <Instagram className="h-3.5 w-3.5" /> @playmedia.hub
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
              <a href="/blog" className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary">
                <BookOpen className="h-3 w-3" /> Blog
              </a>
              <a href="/admin" className="flex items-center gap-1 text-xs text-muted-foreground/60 transition-colors hover:text-foreground">
                <ShieldCheck className="h-3 w-3" /> Admin
              </a>
            </div>
          </div>
        </div>

        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-5 text-center sm:flex-row sm:text-left">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-whats" />
            Feito com <Heart className="h-3 w-3 fill-primary text-primary" /> para quem trabalha por conta própria
          </p>
          <a
            href="https://clickgruda.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
          >
            Desenvolvido por: <strong className="text-foreground group-hover:text-primary">Click &amp; Gruda</strong>
            <ExternalLink className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
          <p className="text-[11px] text-muted-foreground">© {new Date().getFullYear()} Click &amp; Gruda Tools</p>
        </div>
      </div>
    </footer>
  );
}
