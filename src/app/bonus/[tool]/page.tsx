import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { BONUS_TOOLS } from "@/lib/studio-links";
import { BonusTool } from "@/components/tools/bonus-tool";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  return { title: BONUS_TOOLS.find((t) => t.id === tool)?.title || "Bônus" };
}
export default async function ToolPage({
  params,
}: {
  params: Promise<{ tool: string }>;
}) {
  const { tool } = await params;
  const meta = BONUS_TOOLS.find((t) => t.id === tool);
  if (!meta) notFound();
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-9 sm:px-6">
        <Link href="/bonus" className="text-xs text-muted-foreground">
          ← Todos os bônus gratuitos
        </Link>
        <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-orange-400">
          Bônus · 100% gratuito
        </p>
        <h1 className="mt-2 text-2xl font-semibold">{meta.title}</h1>
        <p className="mb-7 mt-2 text-sm text-muted-foreground">
          {meta.description}
        </p>
        <BonusTool tool={meta.id} />
      </main>
      <Footer />
    </div>
  );
}
