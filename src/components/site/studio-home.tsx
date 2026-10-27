"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Sparkles,
  ShieldCheck,
  Layers3,
  ImageDown,
} from "lucide-react";
import { Header } from "./header";
import { Footer } from "./footer";
import { LIBRARY_URL, SUPPORT_URL, BONUS_TOOLS } from "@/lib/studio-links";
const HeroMug = dynamic(() => import("./studio-preview"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full place-items-center text-sm text-neutral-500">
      Preparando a prévia 3D…
    </div>
  ),
});
export function StudioHome() {
  return (
    <div className="min-h-screen bg-[#0d1012] text-white">
      <Header />
      <main>
        <section className="relative mx-auto grid max-w-7xl items-center gap-8 overflow-hidden px-5 pb-16 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-[1fr_1.05fr] lg:gap-6 lg:pb-24">
          <div className="relative z-10">
            <p className="mb-7 inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-400/10 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-orange-300">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
              FEITO PARA QUEM CRIA PERSONALIZADOS
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-6xl lg:text-[76px]">
              Sua arte.
              <br />
              Uma nova
              <br />
              <span className="text-orange-400">dimensão.</span>
            </h1>
            <p className="mt-7 max-w-md text-base leading-relaxed text-neutral-400 sm:text-lg">
              Transforme suas estampas em mockups 3D que valorizam cada detalhe.
              Cerâmica brilhante, cenários prontos e imagens à altura do seu
              trabalho.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/mockup-caneca-3d/studio"
                className="flex items-center gap-3 rounded-xl bg-orange-500 px-6 py-4 text-sm font-bold text-black transition-colors hover:bg-orange-400"
              >
                Abrir meu Studio
                <ArrowRight size={18} />
              </Link>
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-white/15 px-5 py-4 text-sm font-medium hover:bg-white/5"
              >
                Quero meu acesso ↗
              </a>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs text-neutral-500">
              <ShieldCheck size={14} />
              Premium por código · suas artes ficam no navegador
            </p>
          </div>
          <div className="relative min-h-[410px] sm:min-h-[540px]">
            <div className="absolute inset-[10%] rounded-full bg-orange-600/10 blur-3xl" />
            <div className="absolute inset-0 overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-[#272a2a] to-[#15181a]">
              <HeroMug />
              <div className="pointer-events-none absolute left-5 top-5 rounded-full border border-white/10 bg-black/25 px-3 py-2 text-[10px] uppercase tracking-widest text-neutral-300">
                Prévia 3D interativa
              </div>
              <div className="pointer-events-none absolute bottom-5 left-5 right-5 flex items-end justify-between gap-4">
                <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 backdrop-blur">
                  <p className="text-[10px] uppercase tracking-widest text-orange-300">
                    Seu próximo produto
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    Do arquivo à vitrine.
                  </p>
                </div>
                <span className="text-[10px] text-neutral-400">
                  Arraste para girar ↔
                </span>
              </div>
            </div>
          </div>
        </section>
        <section className="border-y border-white/10 bg-white/[0.02]">
          <div className="mx-auto grid max-w-7xl gap-7 px-5 py-8 sm:grid-cols-3 sm:px-8">
            {[
              [
                Layers3,
                "Composição sem limites",
                "Modelos, estampas e cenários em uma só cena.",
              ],
              [
                Sparkles,
                "Acabamento de verdade",
                "Verniz e luz que revelam a textura da cerâmica.",
              ],
              [
                ImageDown,
                "Pronto para apresentar",
                "Imagem em alta resolução, vídeo e fundo transparente.",
              ],
            ].map(([Icon, title, desc]) => {
              const I = Icon as typeof Layers3;
              return (
                <div key={String(title)} className="flex gap-4">
                  <I className="mt-1 h-5 w-5 shrink-0 text-orange-400" />
                  <div>
                    <h2 className="text-sm font-semibold">{String(title)}</h2>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">
                      {String(desc)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <section id="acesso" className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-orange-400">
            Um Studio completo. Um valor simbólico.
          </p>
          <h2 className="mt-4 text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Mais possibilidades para sua criação.
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="rounded-3xl border border-orange-400/30 bg-orange-400/[0.04] p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-300">
                Já é da Biblioteca?
              </p>
              <h3 className="mt-4 text-3xl font-semibold">
                Seu acesso está incluso.
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-neutral-400">
                Assinantes da Biblioteca Click Gruda usam o Studio
                gratuitamente. Solicite seu código ao suporte.
              </p>
              <a
                href={LIBRARY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-300"
              >
                Conhecer a Biblioteca Studio 3D
                <ArrowUpRight size={16} />
              </a>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-7">
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                Acesso avulso · anual
              </p>
              <h3 className="mt-4 text-5xl font-semibold tracking-tight">
                R$ 34,90
                <span className="ml-1 text-base font-normal text-neutral-500">
                  /ano
                </span>
              </h3>
              <p className="mt-4 text-sm text-neutral-400">
                Todos os recursos do Studio, por um ano.
              </p>
              <p className="mt-3 flex items-center gap-2 text-xs text-neutral-400">
                <Check size={14} className="text-green-400" />
                Um navegador · código pessoal
              </p>
              <a
                href={SUPPORT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-orange-300"
              >
                Liberar pelo WhatsApp
                <ArrowUpRight size={16} />
              </a>
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-neutral-500">
            Pagamento, confirmação da assinatura e liberação pelo suporte no
            WhatsApp.
          </p>
        </section>
        <section className="mx-auto max-w-7xl border-t border-white/10 px-5 py-10 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-300">
                Um extra para o seu dia a dia
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Cinco ferramentas bônus, gratuitas e sem código.
              </p>
            </div>
            <Link
              href="/bonus"
              className="text-xs text-neutral-400 hover:text-orange-300"
            >
              Ver todos os bônus →
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
            {BONUS_TOOLS.map((t) => (
              <Link
                href={`/bonus/${t.id}`}
                key={t.id}
                className="text-xs text-neutral-500 transition-colors hover:text-orange-300"
              >
                {t.title} ↗
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
