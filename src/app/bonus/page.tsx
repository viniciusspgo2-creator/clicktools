import Link from "next/link";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { BONUS_TOOLS } from "@/lib/studio-links";
export const metadata = { title: "Bônus gratuitos" };
export default function BonusPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-14">
        <Link href="/" className="text-sm text-muted-foreground">
          ← Studio Mockup 3D
        </Link>
        <p className="mt-10 text-xs font-semibold uppercase tracking-widest text-orange-400">
          Seu kit de apoio
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold">
          Bônus gratuitos
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Ferramentas práticas para acompanhar sua criação. Todas gratuitas, sem
          assinatura e sem código de acesso.
        </p>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {BONUS_TOOLS.map((t, i) => (
            <Link
              className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-orange-400/50"
              key={t.id}
              href={`/bonus/${t.id}`}
            >
              <p className="text-xs text-orange-400">0{i + 1} · GRÁTIS</p>
              <h2 className="mt-4 text-lg font-semibold">
                {t.title}
                <span className="float-right text-orange-400">↗</span>
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {t.description}
              </p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
