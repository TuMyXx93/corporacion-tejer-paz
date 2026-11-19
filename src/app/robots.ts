import type { MetadataRoute } from 'next';
import { resolvePublicSiteUrl } from '@/lib/auth/origins';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolvePublicSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
