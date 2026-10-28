"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Check, ChevronDown,
  CircleHelp, Coffee, Download, Gift, Infinity as InfinityIcon, Layers3,
  Lightbulb, LockKeyhole, MessageCircle, Move, Palette, ShieldCheck,
  Sparkles, Star, WandSparkles,
} from "lucide-react";
import { Header } from "./header";
import { Footer } from "./footer";
import {
  LIBRARY_URL, SUPPORT_URL, DISCOVERY_SUPPORT_URL, BONUS_TOOLS,
} from "@/lib/studio-links";

const studioHref = "/mockup-caneca-3d/studio";
const experiences = [
  { id: "arte", icon: Palette, label: "Sua arte, em 3D", kicker: "DA IDEIA AO PRODUTO", title: "Sua criação. Outro ponto de vista.", description: "Aplique sua estampa na caneca, ajuste a posição e veja a composição ganhar volume. Experimente, gire e encontre o seu melhor ângulo.", art: "cafe", scene: "16-studio-creme", color: "#d79e55", tag: "Estampa + volume" },
  { id: "acabamento", icon: Sparkles, label: "Acabamento", kicker: "OS DETALHES FAZEM A DIFERENÇA", title: "O brilho que valoriza cada detalhe.", description: "Explore o acabamento da cerâmica, o verniz e os reflexos. Uma apresentação com profundidade, sem deixar sua arte em segundo plano.", art: "calma", scene: "18-studio-grafite", color: "#8f92ba", tag: "Cerâmica + reflexos" },
  { id: "luz", icon: Lightbulb, label: "Luz & cenário", kicker: "VOCÊ ASSINA A DIREÇÃO DE ARTE", title: "A atmosfera certa para a sua ideia.", description: "Combine cenários, fundos e iluminação. Do estúdio minimalista a uma cena acolhedora, dê contexto à sua criação.", art: "gratidao", scene: "15-varanda", color: "#74866a", tag: "Luz + atmosfera" },
  { id: "composicao", icon: Move, label: "Composição", kicker: "CADA CANECA NO SEU LUGAR", title: "Uma composição com a sua assinatura.", description: "Adicione outras canecas, ajuste posições e explore enquadramentos. Crie uma apresentação que conte a história da sua coleção.", art: "flork", scene: "01-madeira-nogueira", color: "#b38557", tag: "Posição + enquadramento" },
  { id: "exportacao", icon: Download, label: "Sua apresentação", kicker: "DA TELA PARA OS SEUS CLIENTES", title: "Pronto para fazer sua arte aparecer.", description: "Exporte imagens em alta resolução e vídeos nos formatos disponíveis. Apresente seu trabalho nas redes sociais e no WhatsApp.", art: "fe", scene: "04-marmore-branco", color: "#bfa26b", tag: "Imagem + vídeo" },
];
const libraryArt = [
  { image: "cafe", name: "Café & humor" }, { image: "flork", name: "Frases & personalidade" },
  { image: "gratidao", name: "Flores & afeto" }, { image: "fe", name: "Fé & inspiração" },
  { image: "corrida", name: "Esportes & paixões" }, { image: "calendario", name: "Datas especiais" },
];
const faqs = [
  { q: "Quem pode acessar o Studio Mockup 3D?", a: "O Studio é exclusivo para assinantes da Biblioteca de Artes Click & Gruda. Se você já tem a Biblioteca, solicite seu código pessoal ao suporte e entre no Studio sem uma cobrança adicional." },
  { q: "O que está incluso nos R$ 47,90?", a: "O valor é da Biblioteca de Artes: pagamento único e acesso vitalício a milhares de artes para canecas, organizadas por categorias, temas e datas sazonais, com atualizações. O Studio Mockup 3D está incluso para assinantes." },
  { q: "Posso conhecer a plataforma antes?", a: "Pode, sim. Chame nosso suporte pelo WhatsApp para conhecer a Biblioteca, entender os recursos do Studio e esclarecer suas dúvidas antes de adquirir o acesso." },
  { q: "Preciso instalar algum programa?", a: "Não. O Studio funciona direto no navegador. Para trabalhar com gráficos 3D, use um navegador atualizado e um dispositivo compatível com WebGL." },
  { q: "Posso usar minhas próprias artes?", a: "Sim. Você pode enviar suas imagens e ajustar a aplicação na caneca. Para o melhor resultado, use arquivos de boa resolução e confira o enquadramento antes de exportar." },
  { q: "Como recebo meu código de acesso?", a: "Após a confirmação da compra da Biblioteca, solicite seu código pessoal ao suporte. Se você já é assinante, fale com a equipe pelo WhatsApp para receber orientação de acesso." },
];
function Reveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduced = useReducedMotion();
  return <motion.div className={className} initial={reduced ? false : { opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .08 }} transition={{ duration: .55, delay, ease: [.2, .8, .2, 1] }}>{children}</motion.div>;
}

/** An editorial illustration, explicitly labelled; the interactive renderer lives in the Studio. */
function MugPreview({ art = "cafe", className = "" }: { art?: string; className?: string }) {
  return <div className={`cg-product-mug ${className}`} aria-hidden="true" style={{ "--mug-art": `url('/cg-home/${art}.webp')` } as CSSProperties}>
    <div className="cg-product-handle" />
    <div className="cg-product-body"><div className="cg-product-print" /><div className="cg-product-glaze" /><div className="cg-product-rim" /></div>
    <div className="cg-product-shadow" />
  </div>;
}
function ExperiencePanels() {
  const [active, setActive] = useState("arte");
  return <div className="cg-experience-panels">
    {experiences.map((item, i) => {
      const open = active === item.id;
      return <article className={`cg-experience-panel ${open ? "is-expanded" : ""}`} key={item.id}
        style={{ "--panel-color": item.color } as CSSProperties} onMouseEnter={() => setActive(item.id)}>
        <Image src={`/mockup/backgrounds/${item.scene}.jpg`} alt="" fill sizes="(max-width: 700px) 100vw, 700px" className="cg-experience-background" />
        <div className="cg-experience-shade" />
        <div className="cg-experience-mug"><MugPreview art={item.art} />{item.id === "composicao" && <MugPreview art="cafe" className="cg-product-secondary" />}</div>
        <button type="button" className="cg-experience-trigger" aria-expanded={open} aria-controls={`experience-${item.id}`}
          onFocus={() => setActive(item.id)} onClick={() => setActive(item.id)}>
          <span className="cg-experience-index">0{i + 1}</span>
          <span className="cg-experience-label"><item.icon size={19} />{item.label}</span>
          <span className="cg-experience-toggle"><ArrowUpRight size={18} /></span>
        </button>
        <div id={`experience-${item.id}`} className="cg-experience-content" hidden={!open}>
          <span className="cg-experience-tag">{item.tag}</span>
          <span className="cg-eyebrow">{item.kicker}</span><h3>{item.title}</h3><p>{item.description}</p>
          <Link href={studioHref} className="cg-experience-link">Explorar no Studio <ArrowRight size={16} /></Link>
        </div>
      </article>;
    })}
  </div>;
}
export function StudioHome() {
  return <div className="cg-landing min-h-screen text-white">
    <Header />
    <main>
      <section id="inicio" className="cg-hero cg-hero-product relative isolate overflow-hidden">
        <div className="cg-hero-grid" aria-hidden="true" /><div className="cg-hero-glow cg-hero-glow-a" aria-hidden="true" />
        <div className="cg-container cg-hero-inner">
          <div className="cg-hero-content"><Reveal>
            <span className="cg-kicker"><span className="cg-kicker-dot" /> EXCLUSIVO PARA ASSINANTES DA BIBLIOTECA</span>
            <h1 className="cg-display cg-hero-title">Sua arte.<br />Uma caneca.<br /><em>Outra dimensão.</em></h1>
            <p className="cg-hero-description">Transforme suas estampas em apresentações que dão vontade de ter. Seu <strong>Studio Mockup 3D</strong>, com luz, acabamento e composição nas suas mãos.</p>
            <div className="cg-hero-actions"><Link href={studioHref} className="cg-button cg-button-primary"><WandSparkles size={18} /> Já sou assinante <ArrowRight size={18} /></Link><a href="#studio" className="cg-button cg-button-outline">Conhecer os recursos <ArrowRight size={17} /></a></div>
            <a href={DISCOVERY_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="cg-hero-discovery"><MessageCircle size={15} /> Quer conhecer antes? Chame o suporte <ArrowUpRight size={14} /></a>
            <div className="cg-hero-proof"><span><ShieldCheck size={15} /> Código pessoal</span><span><InfinityIcon size={15} /> Biblioteca vitalícia</span><span><Coffee size={15} /> Studio incluso</span></div>
          </Reveal></div>
          <Reveal className="cg-product-stage">
            <div className="cg-stage-top"><span><span className="cg-live-dot" /> CLICK & GRUDA STUDIO</span><span>03 / CRIAR SEM LIMITES</span></div>
            <div className="cg-stage-orbit" aria-hidden="true" /><div className="cg-stage-ring" aria-hidden="true" />
            <div className="cg-stage-product"><MugPreview art="cafe" /><MugPreview art="gratidao" className="cg-product-companion" /></div>
            <div className="cg-stage-pills" aria-hidden="true"><span><Sparkles size={13} /> Esmalte polido</span><span><Lightbulb size={13} /> Luz de estúdio</span></div>
            <div className="cg-stage-caption"><div><span>SUA ARTE É A PROTAGONISTA</span><strong>O próximo detalhe faz a diferença.</strong></div><span className="cg-stage-mark">3D</span></div>
            <p className="cg-stage-disclaimer">Composição ilustrativa · crie sua versão no Studio</p>
          </Reveal>
        </div>
        <div className="cg-container cg-hero-footnote"><span>FEITO PARA QUEM VIVE DE PERSONALIZAR.</span><a href="#studio">Explore as possibilidades <ChevronDown size={14} /></a></div>
      </section>

      <div className="cg-marquee" aria-label="Recursos do Studio"><div className="cg-marquee-track">{[0, 1].map(i => <div key={i} className="cg-marquee-items" aria-hidden={i === 1}>{["STUDIO MOCKUP 3D", "CERÂMICA & REFLEXOS", "LUZ DE ESTÚDIO", "SUA ARTE EM DESTAQUE", "COMPOSIÇÃO CRIATIVA", "BIBLIOTECA VITALÍCIA"].map(item => <span key={item}><Star size={12} fill="currentColor" />{item}</span>)}</div>)}</div></div>

      <section id="studio" className="cg-section cg-experience-section"><div className="cg-container">
        <Reveal className="cg-experience-heading"><div><span className="cg-eyebrow"><Coffee size={16} /> SEU ESTÚDIO, SUAS POSSIBILIDADES</span><h2 className="cg-display">Mais do que mostrar.<br /><em>Faça sentir.</em></h2></div><p>Uma boa apresentação começa nos detalhes. Explore cada etapa e descubra o que você pode criar.<span>Passe o mouse, toque ou navegue com Tab.</span></p></Reveal>
        <ExperiencePanels />
        <p className="cg-experience-note">Imagens ilustrativas com artes da Biblioteca. A aparência no Studio depende da sua arte, da cena e dos ajustes escolhidos.</p>
      </div></section>

      <section className="cg-process-section"><div className="cg-container cg-process-layout"><Reveal><span className="cg-eyebrow"><WandSparkles size={16} /> MENOS ETAPAS. MAIS CRIATIVIDADE.</span><h2 className="cg-display">Sua ideia pronta<br />para <em>ser vista.</em></h2><p>Sem fotografar uma caneca a cada nova estampa. Teste combinações no navegador e encontre uma apresentação com a sua identidade.</p><Link href={studioHref} className="cg-text-link">Entrar com meu código <ArrowRight size={17} /></Link></Reveal><div className="cg-process-steps">{[
        { n: "01", title: "Traga sua arte", desc: "Envie uma imagem sua ou escolha uma arte da Biblioteca para começar." },
        { n: "02", title: "Encontre seu estilo", desc: "Ajuste a aplicação, experimente o acabamento e componha a luz da cena." },
        { n: "03", title: "Apresente com confiança", desc: "Confira os detalhes e exporte o resultado para mostrar aos seus clientes." },
      ].map(step => <Reveal key={step.n} className="cg-process-step"><span>{step.n}</span><div><h3>{step.title}</h3><p>{step.desc}</p></div><ArrowUpRight size={20} /></Reveal>)}</div></div></section>

      <section className="cg-section cg-library-section" id="biblioteca"><div className="cg-container">
        <Reveal className="cg-library-heading"><div><span className="cg-eyebrow"><BookOpen size={16} /> BIBLIOTECA DE ARTES CLICK & GRUDA</span><h2 className="cg-display">Milhares de ideias.<br /><em>Todas no seu lugar.</em></h2></div><div><p>Artes para canecas organizadas por categorias, temas e datas sazonais. Encontre aquela ideia para o Dia das Mães, uma frase para presentear ou o tema que o seu cliente pediu.</p><p><strong>Com atualizações e acesso vitalício.</strong> Mais tempo criando, menos tempo procurando arquivos.</p></div></Reveal>
        <div className="cg-library-preview-grid">{libraryArt.map((item, i) => <Reveal key={item.image} delay={i % 3 * .04} className="cg-library-preview"><div className="cg-library-preview-image"><Image src={`/cg-home/${item.image}.webp`} alt={`Exemplo de arte para canecas: ${item.name}`} fill sizes="(max-width: 600px) 90vw, (max-width: 900px) 45vw, 380px" className="object-cover" /></div><div><strong>{item.name}</strong><span>EXEMPLO DO ACERVO <ArrowUpRight size={13} /></span></div></Reveal>)}</div>
        <div className="cg-library-preview-foot"><span>Uma pequena amostra. Muitas outras possibilidades na Biblioteca.</span><a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="cg-text-link">Conhecer o acervo <ArrowUpRight size={16} /></a></div>
        <Reveal className="cg-library-benefits">{[{ icon: Layers3, title: "Milhares de artes", desc: "Um acervo para explorar e criar" }, { icon: BookOpen, title: "Tudo organizado", desc: "Categorias, temas e datas sazonais" }, { icon: Sparkles, title: "Com atualizações", desc: "Novas ideias para o seu trabalho" }, { icon: Coffee, title: "Studio incluso", desc: "Exclusivo para assinantes" }].map(f => <div key={f.title}><f.icon size={23} /><strong>{f.title}</strong><p>{f.desc}</p></div>)}</Reveal>
      </div></section>

      <section className="cg-section cg-access-section" id="acessos"><div className="cg-container cg-access-layout">
        <Reveal className="cg-access-copy"><span className="cg-eyebrow"><LockKeyhole size={16} /> UM ACESSO. MUITAS POSSIBILIDADES.</span><h2 className="cg-display">A Biblioteca é sua.<br />O Studio <em>vem junto.</em></h2><p>O Studio Mockup 3D é um benefício exclusivo para assinantes da Biblioteca de Artes. Um lugar para encontrar suas próximas estampas e uma ferramenta para apresentá-las.</p><ul>{["Milhares de artes para canecas", "Categorias, temas e datas sazonais", "Atualizações do acervo", "Studio Mockup 3D incluso para assinantes"].map(item => <li key={item}><Check size={17} />{item}</li>)}</ul><div className="cg-access-existing"><BadgeCheck size={23} /><div><strong>Já faz parte da Biblioteca?</strong><span>Solicite seu código pessoal e entre no Studio.</span><a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer">Pedir meu código <ArrowUpRight size={14} /></a></div></div></Reveal>
        <Reveal className="cg-membership-card"><span className="cg-membership-tag"><InfinityIcon size={16} /> ACESSO VITALÍCIO À BIBLIOTECA</span><div className="cg-membership-art"><Image src="/cg-home/logo-clickgruda.webp" alt="Click & Gruda" width={180} height={42} /><BookOpen size={43} strokeWidth={1.2} /></div><h3>Biblioteca de Artes</h3><p>Seu próximo projeto começa aqui.</p><div className="cg-membership-price" aria-label="47 reais e 90 centavos"><span>R$</span>47<sup>,90</sup></div><span className="cg-membership-cadence">Pagamento único · sem mensalidade</span><a href={LIBRARY_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-primary">Quero conhecer a Biblioteca <ArrowUpRight size={18} /></a><div className="cg-membership-note"><ShieldCheck size={16} /><span>Studio 3D incluso para assinantes.<br />Confira os detalhes na página da Biblioteca.</span></div></Reveal>
      </div></section>

      <section className="cg-section cg-faq-section" id="faq"><div className="cg-container cg-faq-layout"><Reveal><span className="cg-eyebrow"><CircleHelp size={16} /> ANTES DE COMEÇAR</span><h2 className="cg-display">Boas ideias.<br /><em>Nenhuma dúvida.</em></h2><p>Quer conhecer antes? Nossa equipe te ajuda a entender como tudo funciona.</p><a href={DISCOVERY_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-outline cg-faq-discovery"><MessageCircle size={18} /> Chamar o suporte no WhatsApp <ArrowUpRight size={15} /></a></Reveal><div className="cg-faq-list">{faqs.map((faq, i) => <details key={faq.q} className="cg-faq-item" open={i === 0}><summary><span>{faq.q}</span><ChevronDown size={20} /></summary><p>{faq.a}</p></details>)}</div></div></section>

      <section className="cg-bonus-compact"><div className="cg-container"><Reveal className="cg-bonus-compact-heading"><div><span className="cg-eyebrow"><Gift size={16} /> UM EXTRA PARA O SEU DIA A DIA</span><h2 className="cg-display">Pequenas ferramentas.<br /><em>Uma boa ajuda.</em></h2><p>Além do Studio, cinco utilitários gratuitos para facilitar sua rotina.</p></div><Link href="/bonus" className="cg-button cg-button-outline">Explorar os bônus <ArrowRight size={17} /></Link></Reveal><div className="cg-bonus-chip-list">{BONUS_TOOLS.map(t => <Link key={t.id} href={`/bonus/${t.id}`}>{t.title}<ArrowUpRight size={15} /></Link>)}</div></div></section>

      <section className="cg-container cg-bottom-space"><Reveal className="cg-final-cta cg-final-product"><div><span className="cg-eyebrow"><Sparkles size={16} /> A PRÓXIMA CRIAÇÃO É SUA</span><h2 className="cg-display">Sua arte já é especial.<br /><em>Mostre isso.</em></h2><p>A Biblioteca inspira. O Studio transforma sua apresentação. E você coloca a criatividade em tudo.</p><div className="cg-final-actions"><Link href={studioHref} className="cg-button cg-button-primary">Entrar no Studio <ArrowRight size={18} /></Link><a href={DISCOVERY_SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="cg-button cg-button-outline"><MessageCircle size={17} /> Quero conhecer antes</a></div></div><div className="cg-final-mascot"><Image src="/cg-home/mascote.webp" alt="Mascote da Click & Gruda acenando para você" fill sizes="(max-width: 620px) 200px, 300px" className="object-contain" /></div></Reveal></section>
    </main><Footer />
  </div>;
}
