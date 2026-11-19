import type { MetadataRoute } from 'next';
import { resolvePublicSiteUrl } from '@/lib/auth/origins';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = resolvePublicSiteUrl();
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/proyectos`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ];
}
