import type { MetadataRoute } from 'next';
import { getSeoConfig } from '@/lib/site-config';
import { ALL_ARTICLES } from '@/data/blog';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const seo = await getSeoConfig();
  const base = (seo.siteUrl || 'https://clickgruda.vercel.app').replace(/\/+$/, '');

  const statics: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.9 },
  ];

  const posts: MetadataRoute.Sitemap = ALL_ARTICLES.map((a) => ({
    url: `${base}/blog/${a.slug}`,
    lastModified: new Date(`${a.date}T12:00:00-03:00`),
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...statics, ...posts];
}
