import Link from "next/link";
import { ArrowUpRight, Box } from "lucide-react";
import { LIBRARY_URL } from "@/lib/studio-links";
export function Header() {
  return (
    <header className="relative z-40 border-b border-white/10 bg-[#0d1012] text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="Click Gruda Studio, início"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-black">
            <Box size={23} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            click<span className="text-orange-400">gruda</span>
            <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-400">
              Mockup Studio 3D
            </span>
          </span>
        </Link>
        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-4 text-xs sm:gap-7 sm:text-sm"
        >
          <Link
            href="/bonus"
            className="text-neutral-400 transition-colors hover:text-white"
          >
            Bônus grátis
          </Link>
          <a
            href={LIBRARY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden items-center gap-1 text-neutral-400 hover:text-white sm:flex"
          >
            Biblioteca
            <ArrowUpRight size={14} />
          </a>
          <Link
            href="/mockup-caneca-3d/studio"
            className="rounded-full border border-white/20 px-4 py-2 font-semibold hover:bg-white/10"
          >
            Entrar no Studio
          </Link>
        </nav>
      </div>
    </header>
  );
}
