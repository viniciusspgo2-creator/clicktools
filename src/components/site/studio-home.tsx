"use client";
<<<<<<< HEAD

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Check,
  ChevronDown, CircleHelp, Clock3, Coffee, Download, FileSpreadsheet,
  FileText, Gift, HeartHandshake, Infinity as InfinityIcon, Instagram,
  Layers3, MessageCircle, QrCode, ShieldCheck,
  Sparkles, Star, WandSparkles,
} from "lucide-react";
import { Header } from "./header";
import { Footer } from "./footer";
import { LIBRARY_URL, SUPPORT_URL, DAILY_SUPPORT_URL, BONUS_TOOLS, INSTAGRAM_URL, FACEBOOK_URL } from "@/lib/studio-links";

const gallery = [
  { image: "cafe", name: "Café & humor", type: "Criatividade em cada detalhe" },
  { image: "flork", name: "Flork", type: "Arte com personalidade" },
  { image: "gratidao", name: "Frases & flores", type: "Presentes especiais" },
  { image: "rock", name: "Música", type: "Estilos variados" },
  { image: "calma", name: "Leveza", type: "Ilustrações delicadas" },
  { image: "corrida", name: "Esportes", type: "Temas para fãs" },
  { image: "fe", name: "Fé & espiritualidade", type: "Mensagens inspiradoras" },
  { image: "calendario", name: "Datas especiais", type: "Sazonais e ocasiões" },
  { image: "anime", name: "Geek & diversão", type: "Arte vibrante" },
  { image: "snoopy", name: "Ilustrações", type: "Composições únicas" },
  { image: "jesus", name: "Mensagens de fé", type: "Presentes com significado" },
  { image: "toy", name: "Infantil", type: "Personagens e diversão" },
  { image: "spongebob", name: "Cultura pop", type: "Criatividade para todos os gostos" },
];

const features = [
  { icon: Layers3, title: "Mockups que valorizam", desc: "Apresente estampas em canecas 3D com cenários, enquadramentos e acabamentos ajustáveis." },
  { icon: WandSparkles, title: "Menos tempo, mais criação", desc: "Prepare imagens de apresentação sem montar cenários físicos a cada nova arte." },
  { icon: Download, title: "Pronto para mostrar", desc: "Exporte seus mockups para divulgar no catálogo, nas redes sociais e no WhatsApp." },
];
const bonusIcons = [QrCode, MessageCircle, FileSpreadsheet, FileText, BookOpen];
const faqs = [
  { q: "Quem compra a Biblioteca paga pelo Studio Mockup 3D?", a: "Não. O Studio Mockup 3D está incluso gratuitamente para assinantes da Biblioteca de Artes Click & Gruda. Solicite seu código de acesso ao suporte após a confirmação da compra." },
  { q: "Posso usar apenas o Studio sem adquirir a Biblioteca?", a: "Sim. O acesso avulso custa R$ 12,90 por 24 horas. Durante esse período, você pode gerar quantos mockups desejar, respeitando as capacidades do navegador e dos formatos disponíveis." },
  { q: "O acesso à Biblioteca é realmente vitalício?", a: "A oferta apresentada é de pagamento único de R$ 47,90 para acesso vitalício à Biblioteca, com o Studio 3D incluso para assinantes. Confira na página oficial as condições de compra e de utilização." },
  { q: "Preciso instalar algum aplicativo?", a: "Não. O Studio e as ferramentas bônus funcionam no navegador. Para o Studio 3D, use um navegador atualizado e um dispositivo compatível com gráficos 3D." },
  { q: "Como recebo meu acesso ao Studio?", a: "A liberação é realizada pelo suporte mediante código pessoal. Quem já é assinante pode solicitar o código diretamente pelo WhatsApp." },
  { q: "As ferramentas bônus também são pagas?", a: "Não. Gerador de QR Code, links para WhatsApp, orçamentos, leitor/editor de PDF e leitor de planilhas Excel são ferramentas bônus gratuitas, sem necessidade de código." },
];

function Reveal({ children, className = "", delay = 0, id }: { children: React.ReactNode; className?: string; delay?: number; id?: string }) {
  const reduced = useReducedMotion();
  return <motion.div id={id} className={className} initial={reduced ? false : { opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .12 }} transition={{ duration: .65, delay, ease: [.2,.8,.2,1] }}>{children}</motion.div>;
}

export function StudioHome() {
  return (
    <div className="cg-landing min-h-screen text-white">
      <Header />
      <main>
        <section id="inicio" className="cg-hero relative isolate overflow-hidden">
          <div className="cg-hero-grid" aria-hidden="true" />
          <div className="cg-hero-glow cg-hero-glow-a" aria-hidden="true" />
          <div className="cg-hero-glow cg-hero-glow-b" aria-hidden="true" />
          <div className="cg-container cg-hero-inner">
            <div className="cg-hero-content">
              <Reveal>
                <span className="cg-kicker"><span className="cg-kicker-dot" /> O ESTÚDIO DA SUA PRÓXIMA GRANDE IDEIA</span>
                <h1 className="cg-display cg-hero-title">Sua arte merece <em>aparecer.</em><br/><span>Seu negócio merece</span> <em>crescer.</em></h1>
                <p className="cg-hero-description">Crie apresentações de canecas que impressionam com o <strong>Studio Mockup 3D</strong>. E descubra a Biblioteca Click & Gruda: milhares de artes organizadas e o Studio incluso para assinantes.</p>
                <div className="cg-hero-actions">
                  <Link href="/mockup-caneca-3d/studio" className="cg-button cg-button-primary"><WandSparkles size={18} /> Abrir o Studio <ArrowRight size={18}/></Link>
                  <a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-outline">Conhecer a Biblioteca <ArrowUpRight size={17}/></a>
                </div>
                <div className="cg-hero-proof"><span><ShieldCheck size={16}/> Acesso com código pessoal</span><span><InfinityIcon size={16}/> Biblioteca vitalícia</span><span><Gift size={16}/> 5 bônus grátis</span></div>
              </Reveal>
            </div>
            <div className="cg-hero-visual" aria-label="Mascote oficial Click & Gruda em uma composição visual laranja">
              <div className="cg-orbit" aria-hidden="true" />
              <div className="cg-hero-mascot"><Image src="/cg-home/mascote.webp" alt="Mascote oficial da Click & Gruda, uma caneca simpática com detalhes laranja" fill priority sizes="(max-width: 780px) 85vw, 600px" className="object-contain" /></div>
              <div className="cg-floating cg-floating-one"><Sparkles size={18}/><span>Crie. Apresente.<strong>Impressione.</strong></span></div>
              <div className="cg-floating cg-floating-two"><span className="cg-float-icon"><Check size={20}/></span><span><strong>Studio 3D incluso</strong><small>para assinantes da Biblioteca</small></span></div>
              <div className="cg-hero-visual-caption">CLICK & GRUDA <span>•</span> CRIATIVIDADE SEM LIMITES</div>
            </div>
          </div>
          <div className="cg-hero-bottom" aria-hidden="true"><span>SEU PRÓXIMO PROJETO COMEÇA AQUI</span><span className="cg-scroll-line"/></div>
        </section>

        <div className="cg-marquee" aria-label="Recursos da Click & Gruda"><div className="cg-marquee-track">{[0,1].map((i) => <div key={i} className="cg-marquee-items" aria-hidden={i===1}>{["STUDIO MOCKUP 3D", "BIBLIOTECA DE ARTES", "ACESSO VITALÍCIO", "ARTES ORGANIZADAS", "CRIAÇÃO SEM COMPLICAÇÃO", "BÔNUS GRATUITOS"].map((item) => <span key={item}><Star size={13} fill="currentColor"/>{item}</span>)}</div>)}</div></div>

        <section className="cg-section cg-studio-section" id="studio">
          <div className="cg-container">
            <Reveal className="cg-section-heading cg-heading-center"><span className="cg-eyebrow"><Coffee size={16}/> STUDIO MOCKUP 3D</span><h2 className="cg-display">Uma arte bonita merece uma <em>apresentação à altura.</em></h2><p>Da estampa ao produto: monte a sua cena, ajuste os detalhes e apresente suas ideias de forma profissional.</p></Reveal>
            <div className="cg-feature-grid">{features.map((f,i) => <Reveal key={f.title} delay={i*.08} className="cg-feature-card"><span className="cg-feature-num">0{i+1} / 03</span><div className="cg-feature-icon"><f.icon size={27} strokeWidth={1.7}/></div><h3>{f.title}</h3><p>{f.desc}</p><span className="cg-feature-corner"><ArrowUpRight size={17}/></span></Reveal>)}</div>
            <Reveal className="cg-studio-showcase"><div className="cg-showcase-art"><div className="cg-showcase-lines" aria-hidden="true"/><Image src="/cg-home/mascote.webp" alt="Mascote Click & Gruda" width={380} height={500} className="cg-showcase-mascot" /></div><div className="cg-showcase-copy"><span className="cg-eyebrow">SEM ESTÚDIO FÍSICO. SEM COMPLICAÇÃO.</span><h3 className="cg-display">Seu trabalho ganha <em>outra dimensão.</em></h3><p>Escolha a arte, personalize a caneca virtual, experimente os cenários e leve a apresentação para onde seus clientes estão.</p><Link href="/mockup-caneca-3d/studio" className="cg-button cg-button-primary">Experimentar o Studio <ArrowRight size={17}/></Link></div></Reveal>
          </div>
        </section>

        <section className="cg-section cg-library-section" id="biblioteca">
          <div className="cg-container">
            <Reveal className="cg-library-intro"><div><span className="cg-eyebrow"><BookOpen size={16}/> A BIBLIOTECA DA CLICK & GRUDA</span><h2 className="cg-display">Chega de procurar.<br/><em>Comece a criar.</em></h2><p>Quem trabalha com sublimação sabe: não adianta ter milhares de arquivos perdidos em pastas. O que faz diferença é encontrar uma arte que você realmente queira usar — sem perder tempo.</p><p>Na <strong>Biblioteca de Artes Click & Gruda</strong>, você encontra um acervo selecionado, organizado por temas, categorias e datas especiais, com novas artes adicionadas regularmente.</p><div className="cg-library-tags"><span>Artes para canecas</span><span>Datas comemorativas</span><span>Flork</span><span>Frases</span><span>Geek</span><span>Fé</span><span>Esportes</span><span>e muito mais</span></div><a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-primary">Explorar a Biblioteca <ArrowUpRight size={18}/></a></div><div className="cg-library-poster"><div className="cg-library-poster-light"/><Image src="/cg-home/mascote.webp" alt="Mascote da Biblioteca Click & Gruda" fill sizes="(max-width: 900px) 80vw, 450px" className="object-contain"/><span className="cg-library-stamp">ACESSO<br/><strong>VITALÍCIO</strong></span></div></Reveal>
          </div>
          <div className="cg-gallery-strip"><div className="cg-container cg-gallery-top"><div><span className="cg-eyebrow">UMA PEQUENA AMOSTRA DO ACERVO</span><h3>Ideias para todos os estilos.</h3></div><span>Artes enviadas pela Click & Gruda</span></div><div className="cg-art-marquee"><div className="cg-art-track">{[0,1].map((repeat)=><div className="cg-art-series" key={repeat} aria-hidden={repeat===1}>{gallery.map((item)=><div className="cg-art-card" key={item.image}><div className="cg-art-image"><Image src={`/cg-home/${item.image}.webp`} alt={repeat===0 ? `Arte de caneca: ${item.name}` : ""} fill sizes="300px" className="object-contain"/></div><div className="cg-art-caption"><strong>{item.name}</strong><span>{item.type}</span></div></div>)}</div>)}</div></div></div>
          <div className="cg-container"><Reveal className="cg-library-benefits">{[{icon:BadgeCheck,title:"Seleção cuidadosa",desc:"Mais qualidade, menos arquivos sem utilidade"},{icon:BookOpen,title:"Tudo organizado",desc:"Encontre por tema, categoria ou ocasião"},{icon:Sparkles,title:"Novidades constantes",desc:"Acervo atualizado regularmente"},{icon:Coffee,title:"Studio incluso",desc:"Mockup 3D gratuito para assinantes"}].map((f)=><div key={f.title}><f.icon size={23}/><strong>{f.title}</strong><p>{f.desc}</p></div>)}</Reveal><Reveal className="cg-community-bar"><div><span className="cg-eyebrow">FAÇA PARTE DA NOSSA COMUNIDADE</span><h3>Acompanhe ideias, lançamentos e novidades.</h3></div><div className="cg-community-social"><a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><Instagram size={21}/> Acompanhar no Instagram <ArrowUpRight size={17}/></a><a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer"><span className="cg-facebook-mark">f</span> Seguir no Facebook <ArrowUpRight size={17}/></a></div></Reveal></div>
        </section>

        <section className="cg-section cg-pricing-section" id="acessos"><div className="cg-container"><Reveal className="cg-section-heading cg-heading-center"><span className="cg-eyebrow"><InfinityIcon size={16}/> ESCOLHA COMO COMEÇAR</span><h2 className="cg-display">Um dia para testar. <em>Uma vida para aproveitar.</em></h2><p>O Studio Mockup 3D é gratuito para assinantes da Biblioteca de Artes. Se você quer apenas usar o Studio por um dia, também tem essa opção.</p></Reveal>
          <div className="cg-pricing-grid"><Reveal className="cg-price-card cg-price-featured"><div className="cg-price-glow" aria-hidden="true"/><div className="cg-price-top"><span className="cg-price-tag"><Star size={14} fill="currentColor"/> MELHOR CUSTO-BENEFÍCIO</span><BookOpen size={29}/></div><h3>Biblioteca Click & Gruda</h3><p className="cg-price-sub">A melhor escolha para quem trabalha com personalização.</p><div className="cg-price"><span>R$</span>47<sup>,90</sup></div><p className="cg-price-cadence">Pagamento único · ACESSO VITALÍCIO</p><div className="cg-price-rule"/><ul><li><Check/> Biblioteca com milhares de artes</li><li><Check/> Studio Mockup 3D incluso gratuitamente</li><li><Check/> Novas artes e temas especiais</li><li><Check/> Acervo organizado para encontrar rápido</li><li><Check/> Acesso vitalício à Biblioteca</li></ul><a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-primary cg-price-button">Quero acesso vitalício <ArrowUpRight size={18}/></a><small>Conheça todos os detalhes da oferta no site oficial.</small></Reveal>
          <Reveal className="cg-price-card cg-price-daily" delay={.12}><div className="cg-price-top"><span className="cg-price-tag cg-tag-neutral"><Clock3 size={14}/> PARA USO PONTUAL</span><Clock3 size={28}/></div><h3>Studio por 24 horas</h3><p className="cg-price-sub">Precisa criar seus mockups apenas hoje? Entre e produza.</p><div className="cg-price"><span>R$</span>12<sup>,90</sup></div><p className="cg-price-cadence">Acesso avulso · válido por 24 horas</p><div className="cg-price-rule"/><ul><li><Check/> Acesso ao Studio Mockup 3D</li><li><Check/> Gere quantos mockups quiser em 24h</li><li><Check/> Ferramentas de edição e exportação do Studio</li><li><Check/> Liberação por código via suporte</li></ul><a href={DAILY_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-secondary cg-price-button">Liberar 24h pelo WhatsApp <ArrowUpRight size={18}/></a><div className="cg-upgrade-note"><Sparkles size={17}/><span>Vai usar de novo? Por apenas <strong>R$ 47,90</strong> você leva a Biblioteca inteira, com acesso vitalício e Studio incluso.</span></div></Reveal></div>
          <Reveal className="cg-subscriber-note"><BadgeCheck size={21}/><div><strong>Já é assinante da Biblioteca?</strong><span>Você já tem direito ao Studio sem pagar nada a mais. Solicite seu código ao suporte.</span></div><a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">Pedir meu código <ArrowUpRight size={16}/></a></Reveal>
          </div></section>

        <section className="cg-section cg-bonus-section" id="bonus"><div className="cg-container"><Reveal className="cg-bonus-heading"><div><span className="cg-eyebrow"><Gift size={16}/> NOSSO PRESENTE PARA VOCÊ</span><h2 className="cg-display">5 ferramentas bônus. <em>Grátis de verdade.</em></h2><p>Recursos úteis para quem cria, atende e vende. Sem assinatura, sem código e sem complicação.</p></div><Link href="/bonus" className="cg-button cg-button-outline">Ver todos os bônus <ArrowRight size={17}/></Link></Reveal><div className="cg-bonus-grid">{BONUS_TOOLS.map((t,i)=>{const Icon=bonusIcons[i];return <Reveal key={t.id} delay={i*.05} className="cg-bonus-card"><Link href={`/bonus/${t.id}`} aria-label={`Abrir ${t.title}`} className="cg-bonus-card-link"><span className="cg-bonus-numeral">0{i+1}</span><span className="cg-bonus-icon"><Icon size={30} strokeWidth={1.6}/></span><strong>{t.title}</strong><p>{t.description}</p><span className="cg-bonus-bottom"><span>ACESSAR GRÁTIS</span><ArrowUpRight size={20}/></span></Link></Reveal>})}</div></div></section>

        <section className="cg-section cg-faq-section" id="faq"><div className="cg-container cg-faq-layout"><Reveal><span className="cg-eyebrow"><CircleHelp size={16}/> DÚVIDAS FREQUENTES</span><h2 className="cg-display">Sem dúvidas.<br/><em>Só possibilidades.</em></h2><p>O que você precisa saber para começar a usar a plataforma.</p><a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="cg-faq-support"><MessageCircle size={19}/> Falar com o suporte <ArrowUpRight size={15}/></a></Reveal><div className="cg-faq-list">{faqs.map((faq,i)=><details key={faq.q} className="cg-faq-item" open={i===0}><summary><span>{faq.q}</span><ChevronDown size={20}/></summary><p>{faq.a}</p></details>)}</div></div></section>

        <section className="cg-container cg-bottom-space"><Reveal className="cg-final-cta"><div className="cg-final-cta-orbit" aria-hidden="true"/><div><span className="cg-eyebrow"><HeartHandshake size={16}/> SUA CRIATIVIDADE É O NOSSO NEGÓCIO</span><h2 className="cg-display">Menos tempo procurando. <em>Mais tempo criando.</em></h2><p>Entre para a Biblioteca Click & Gruda por R$ 47,90, aproveite o acesso vitalício e use o Studio Mockup 3D sem custo adicional.</p><div className="cg-final-actions"><a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-primary">Quero a Biblioteca <ArrowRight size={18}/></a><Link href="/mockup-caneca-3d/studio" className="cg-button cg-button-outline">Conhecer o Studio <ArrowUpRight size={18}/></Link></div></div><div className="cg-final-mascot"><Image src="/cg-home/mascote.webp" alt="Mascote Click & Gruda" fill sizes="360px" className="object-contain"/></div></Reveal></section>
=======
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
>>>>>>> dd48c880e81b5a15a4de967f18493b97849f8bcb
      </main>
      <Footer />
    </div>
  );
}
