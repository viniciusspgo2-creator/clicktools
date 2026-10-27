import Link from "next/link";
import { LIBRARY_URL, SUPPORT_URL } from "@/lib/studio-links";
export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-[#0d1012] px-5 py-8 text-xs text-neutral-400">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5">
        <p>© {new Date().getFullYear()} Click Gruda · Studio Mockup 3D</p>
        <div className="flex flex-wrap gap-5">
          <a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer">
            Biblioteca Studio 3D ↗
          </a>
          <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">
            Suporte no WhatsApp
          </a>
          <Link href="/bonus">Bônus gratuitos</Link>
          <Link href="/admin">Admin Master</Link>
        </div>
      </div>
    </footer>
  );
}
