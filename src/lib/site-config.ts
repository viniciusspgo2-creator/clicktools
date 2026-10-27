/* ============================================================
   Configuração do site (SEO) — persistida em SiteConfig
   ============================================================ */

import { db } from "@/lib/db";

export interface SeoConfig {
  siteName: string;
  defaultTitle: string;
  titleTemplate: string; // ex.: "%s | Click & Gruda Tools"
  description: string;
  keywords: string[];
  siteUrl: string;
  ogImage: string;
  twitterCreator: string;
  gaId: string; // Google Analytics (vazio = desligado)
}

export const DEFAULT_SEO: SeoConfig = {
  siteName: "Click Gruda Studio 3D",
  defaultTitle: "Click Gruda — Studio Mockup 3D",
  titleTemplate: "%s | Click & Gruda Tools",
  description:
    "Studio premium de mockups 3D para personalizados. Incluso na Biblioteca Click Gruda ou R$ 34,90 por ano. QR Code, WhatsApp, orçamento, PDF e Excel como bônus gratuitos.",
  keywords: [
    "ferramentas online grátis",
    "gerador de QR Code",
    "link personalizado WhatsApp",
    "gerador de orçamento",
    "gerador de contrato",
    "editor de PDF",
    "conversor de imagens",
    "mockup 3D canecas",
    "sublimação de canecas",
    "Click e Gruda",
  ],
  siteUrl: "https://clickgruda.vercel.app",
  ogImage: "/og/og-default.png",
  twitterCreator: "",
  gaId: "",
};

const SEO_KEY = "seo";

export async function getSeoConfig(): Promise<SeoConfig> {
  try {
    const row = await db.siteConfig.findUnique({ where: { key: SEO_KEY } });
    if (row) {
      const parsed = JSON.parse(row.value) as Partial<SeoConfig>;
      return { ...DEFAULT_SEO, ...parsed };
    }
  } catch {
    /* banco indisponível → defaults */
  }
  return DEFAULT_SEO;
}

export async function saveSeoConfig(
  partial: Partial<SeoConfig>,
): Promise<SeoConfig> {
  const current = await getSeoConfig();
  const next: SeoConfig = {
    ...current,
    ...partial,
    keywords: Array.isArray(partial.keywords)
      ? partial.keywords
      : current.keywords,
  };
  await db.siteConfig.upsert({
    where: { key: SEO_KEY },
    update: { value: JSON.stringify(next) },
    create: { key: SEO_KEY, value: JSON.stringify(next) },
  });
  return next;
}
