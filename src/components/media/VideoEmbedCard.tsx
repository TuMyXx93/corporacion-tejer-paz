'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ExternalLink, Play, Video } from 'lucide-react';
import { isNextOptimizableImage, parseVideoEmbed } from '@/lib/media/embeds';

interface VideoEmbedCardProps {
  url: string;
  title?: string;
  thumbnailUrl?: string;
  aspectClassName?: string;
}

export function VideoEmbedCard({
  url,
  title,
  thumbnailUrl,
  aspectClassName = 'aspect-video',
}: VideoEmbedCardProps) {
  const [activated, setActivated] = useState(false);
  const parsed = parseVideoEmbed(url);

  if (!parsed) {
    return null;
  }

  const displayTitle = title?.trim() || `${parsed.providerLabel} — Corporación Tejer Paz`;

  if (!parsed.embedUrl) {
    return (
      <div
        className={`relative flex w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-taupe bg-espresso p-6 text-center text-cream ${aspectClassName}`}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink uppercase">
          <Video className="h-3.5 w-3.5" aria-hidden="true" />
          {parsed.providerLabel}
        </span>
        <p className="mt-3 max-w-md font-display text-lg font-bold text-cream">
          {displayTitle}
        </p>
        <a
          href={parsed.canonicalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cream px-4 py-2 text-sm font-semibold text-espresso transition-colors hover:bg-butter"
        >
          Ver video externo
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    );
  }

  if (activated) {
    const separator = parsed.embedUrl.includes('?') ? '&' : '?';
    const autoplayUrl = `${parsed.embedUrl}${separator}autoplay=1`;
    return (
      <div
        className={`relative w-full overflow-hidden rounded-xl border border-taupe bg-ink ${aspectClassName}`}
      >
        <iframe
          src={autoplayUrl}
          title={displayTitle}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    );
  }

  const poster = thumbnailUrl?.trim() || parsed.thumbnailUrl;

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      aria-label={`Reproducir video: ${displayTitle}`}
      className={`group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-taupe bg-espresso text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-umber ${aspectClassName}`}
    >
      {poster ? (
        <Image
          src={poster}
          alt={displayTitle}
          fill
          unoptimized={!isNextOptimizableImage(poster)}
          sizes="(max-width: 768px) 100vw, 720px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      ) : (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-br from-espresso via-ink to-umber"
        />
      )}

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/25 transition-colors group-hover:via-ink/25"
      />

      <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-full border-2 border-cream/90 bg-gold text-ink shadow-lg transition-transform duration-200 group-hover:scale-110">
        <Play className="ml-1 h-7 w-7 fill-ink" aria-hidden="true" />
      </span>

      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-wrap items-end justify-between gap-2 p-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-0.5 text-[11px] font-semibold text-butter uppercase">
            <Video className="h-3 w-3 text-gold" aria-hidden="true" />
            {parsed.providerLabel}
          </span>
          <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-cream sm:text-base">
            {displayTitle}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-cream/90 px-2.5 py-1 text-xs font-semibold text-espresso">
          Reproducir
        </span>
      </div>
    </button>
  );
}
