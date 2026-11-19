'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand, Play, X } from 'lucide-react';
import {
  isNextOptimizableImage,
  parseVideoEmbed,
  type GalleryMediaItem,
} from '@/lib/media/embeds';
import { VideoEmbedCard } from './VideoEmbedCard';

interface MixedMediaShowcaseProps {
  items: GalleryMediaItem[];
  aspectClassName?: string;
  heading?: string;
}

export function MixedMediaShowcase({
  items,
  aspectClassName = 'aspect-[16/10]',
  heading,
}: MixedMediaShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxImage, setLightboxImage] = useState<GalleryMediaItem | null>(null);

  const safeIndex = activeIndex < items.length ? activeIndex : 0;
  const activeItem = items[safeIndex];

  useEffect(() => {
    if (!lightboxImage) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setLightboxImage(null);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  if (!items || items.length === 0 || !activeItem) {
    return null;
  }

  function handlePrev() {
    setActiveIndex(prev => (prev - 1 + items.length) % items.length);
  }

  function handleNext() {
    setActiveIndex(prev => (prev + 1) % items.length);
  }

  return (
    <div className="space-y-3">
      {heading && (
        <h3 className="font-display text-lg font-bold text-espresso">{heading}</h3>
      )}

      <div className="overflow-hidden rounded-2xl border border-taupe bg-surface shadow-xs">
        <div className="relative">
          {activeItem.type === 'video' ? (
            <VideoEmbedCard
              url={activeItem.url}
              title={activeItem.title || activeItem.alt}
              thumbnailUrl={activeItem.thumbnailUrl}
              aspectClassName={aspectClassName}
            />
          ) : (
            <div className={`relative w-full overflow-hidden bg-sand ${aspectClassName}`}>
              <Image
                src={activeItem.url}
                alt={activeItem.alt || activeItem.title || 'Fotografía institucional'}
                fill
                unoptimized={!isNextOptimizableImage(activeItem.url)}
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setLightboxImage(activeItem)}
                aria-label={`Ampliar fotografía: ${activeItem.title || activeItem.alt || 'imagen'}`}
                className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-lg bg-ink/85 px-3 py-1.5 text-xs font-semibold text-cream shadow-sm transition-colors hover:bg-umber"
              >
                <Expand className="h-3.5 w-3.5" aria-hidden="true" />
                Ampliar
              </button>
            </div>
          )}

          {items.length > 1 && (
            <>
              <span className="pointer-events-none absolute top-3 right-3 z-20 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-semibold text-cream">
                {safeIndex + 1} / {items.length}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Elemento multimedia anterior"
                className="absolute top-1/2 left-3 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/85 text-cream shadow-md transition-colors hover:bg-umber"
              >
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Siguiente elemento multimedia"
                className="absolute top-1/2 right-3 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-ink/85 text-cream shadow-md transition-colors hover:bg-umber"
              >
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        {(activeItem.title || activeItem.alt) && (
          <div className="border-t border-taupe/70 bg-sand/50 px-4 py-2.5">
            <p className="text-xs font-medium text-espresso sm:text-sm">
              {activeItem.title || activeItem.alt}
            </p>
          </div>
        )}

        {items.length > 1 && (
          <div className="flex gap-2 overflow-x-auto border-t border-taupe/70 bg-cream p-3">
            {items.map((item, idx) => {
              const isSelected = idx === safeIndex;
              const videoParsed =
                item.type === 'video' ? parseVideoEmbed(item.url) : null;
              const thumbSrc =
                item.type === 'image'
                  ? item.url
                  : item.thumbnailUrl || videoParsed?.thumbnailUrl || null;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`Ver elemento ${idx + 1}: ${item.title || item.alt || item.type}`}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border transition-all ${
                    isSelected
                      ? 'border-umber ring-2 ring-umber ring-offset-1'
                      : 'border-taupe opacity-80 hover:opacity-100'
                  }`}
                >
                  {thumbSrc ? (
                    <Image
                      src={thumbSrc}
                      alt={item.title || item.alt || 'Miniatura'}
                      fill
                      unoptimized={!isNextOptimizableImage(thumbSrc)}
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-espresso text-gold">
                      <Play className="h-4 w-4" aria-hidden="true" />
                    </span>
                  )}
                  {item.type === 'video' && thumbSrc && (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/40">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold text-ink">
                        <Play className="ml-0.5 h-3 w-3 fill-ink" aria-hidden="true" />
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {lightboxImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lightboxImage.title || lightboxImage.alt || 'Vista ampliada'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-taupe bg-surface shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-4 border-b border-taupe px-4 py-3">
              <p className="truncate text-sm font-semibold text-espresso">
                {lightboxImage.title || lightboxImage.alt || 'Fotografía ampliada'}
              </p>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                aria-label="Cerrar vista ampliada"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-taupe text-espresso hover:bg-sand"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <div className="relative h-[65vh] w-full bg-ink">
              <Image
                src={lightboxImage.url}
                alt={lightboxImage.alt || lightboxImage.title || 'Fotografía ampliada'}
                fill
                unoptimized={!isNextOptimizableImage(lightboxImage.url)}
                sizes="90vw"
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
