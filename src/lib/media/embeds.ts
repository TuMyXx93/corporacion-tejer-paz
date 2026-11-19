export interface GalleryMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title?: string;
  alt?: string;
  thumbnailUrl?: string;
}

export interface DocumentAttachment {
  id: string;
  title: string;
  description?: string;
  url: string;
  fileName?: string;
  sizeBytes?: number;
}

export interface ParsedVideoEmbed {
  provider: 'youtube' | 'vimeo' | 'external';
  videoId: string | null;
  embedUrl: string | null;
  thumbnailUrl: string | null;
  canonicalUrl: string;
  providerLabel: string;
}

const YOUTUBE_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID_REGEX = /^\d{4,15}$/;

function extractYouTubeId(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  const parts = parsed.pathname.split('/').filter(Boolean);

  if (host === 'youtu.be') {
    const candidate = parts[0] ?? '';
    return YOUTUBE_ID_REGEX.test(candidate) ? candidate : null;
  }

  if (
    host === 'youtube.com' ||
    host === 'm.youtube.com' ||
    host === 'youtube-nocookie.com'
  ) {
    if (parts[0] === 'watch' || parsed.pathname === '/watch') {
      const v = parsed.searchParams.get('v') ?? '';
      return YOUTUBE_ID_REGEX.test(v) ? v : null;
    }
    if (parts[0] === 'embed' || parts[0] === 'shorts' || parts[0] === 'live') {
      const candidate = parts[1] ?? '';
      return YOUTUBE_ID_REGEX.test(candidate) ? candidate : null;
    }
  }

  return null;
}

function extractVimeoId(parsed: URL): string | null {
  const host = parsed.hostname.toLowerCase().replace(/^www\./, '');
  if (host !== 'vimeo.com' && host !== 'player.vimeo.com') return null;

  const parts = parsed.pathname.split('/').filter(Boolean);
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    if (VIMEO_ID_REGEX.test(parts[i])) {
      return parts[i];
    }
  }
  return null;
}

/**
 * Normalizes and validates an external video link (YouTube, Vimeo, or HTTPS fallback).
 * Always uses privacy-enhanced embed domains (`youtube-nocookie.com` / `player.vimeo.com?dnt=1`).
 */
export function parseVideoEmbed(rawUrl: string): ParsedVideoEmbed | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:') {
    return null;
  }

  const ytId = extractYouTubeId(parsed);
  if (ytId) {
    return {
      provider: 'youtube',
      videoId: ytId,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1`,
      thumbnailUrl: `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`,
      canonicalUrl: `https://www.youtube.com/watch?v=${ytId}`,
      providerLabel: 'YouTube',
    };
  }

  const vimeoId = extractVimeoId(parsed);
  if (vimeoId) {
    return {
      provider: 'vimeo',
      videoId: vimeoId,
      embedUrl: `https://player.vimeo.com/video/${vimeoId}?dnt=1`,
      thumbnailUrl: null,
      canonicalUrl: `https://vimeo.com/${vimeoId}`,
      providerLabel: 'Vimeo',
    };
  }

  return {
    provider: 'external',
    videoId: null,
    embedUrl: null,
    thumbnailUrl: null,
    canonicalUrl: parsed.toString(),
    providerLabel: 'Video externo',
  };
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
}

/**
 * Only local static assets (`/images/...`) go through Next.js `/_next/image`.
 * Remote CDN assets (Vercel Blob, R2, YouTube/Vimeo thumbs) load directly
 * from their edge CDNs so multi-megabyte uploads never hit upstream proxy timeouts.
 */
export function isNextOptimizableImage(url: string): boolean {
  return url.trim().startsWith('/');
}
