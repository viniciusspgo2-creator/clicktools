import Link from "next/link";
<<<<<<< HEAD
import { ArrowLeft, ArrowRight, BookOpen, FileSpreadsheet, FileText, MessageCircle, QrCode, Sparkles } from "lucide-react";
import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { BONUS_TOOLS, LIBRARY_URL } from "@/lib/studio-links";
export const metadata = { title: "5 ferramentas bônus gratuitas | Click & Gruda", description: "QR Code profissional, links de WhatsApp, gerador de orçamentos, editor de PDF e leitor de planilhas: tudo gratuito." };
const icons = [QrCode, MessageCircle, FileSpreadsheet, FileText, BookOpen];
export default function BonusPage() {
  return <div className="cg-bonus-page"><Header/><main><div className="cg-bonus-hero"><div className="cg-container"><Link href="/" className="cg-eyebrow"><ArrowLeft size={15}/> VOLTAR PARA O INÍCIO</Link><div className="mt-8 cg-eyebrow"><Sparkles size={16}/> 5 RECURSOS PARA O SEU DIA A DIA</div><h1 className="cg-display">Bônus <em>gratuitos.</em><br/>Ideias sem complicação.</h1><p>Ferramentas úteis para criar, organizar e vender mais. Sem assinatura, sem código e sem necessidade de pagar pelo Studio.</p><a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-outline">Descobrir a Biblioteca de Artes <ArrowRight size={17}/></a></div></div><div className="cg-container"><div className="cg-bonus-page-grid">{BONUS_TOOLS.map((tool,i)=>{const Icon=icons[i];return <Link href={`/bonus/${tool.id}`} className="cg-bonus-page-card" key={tool.id}><span className="cg-eyebrow">GRÁTIS · 0{i+1}</span><span className="cg-bonus-icon"><Icon size={28}/></span><h2>{tool.title}</h2><p>{tool.description}</p><span className="cg-bonus-bottom">ACESSAR FERRAMENTA <ArrowRight size={19}/></span></Link>})}</div></div></main><Footer/></div>;
=======
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
>>>>>>> dd48c880e81b5a15a4de967f18493b97849f8bcb
}
