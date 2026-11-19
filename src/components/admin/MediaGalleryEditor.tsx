'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowUp,
  FileText,
  Image as ImageIcon,
  Plus,
  Trash2,
  Video,
} from 'lucide-react';
import type { MediaAssetData } from '@/data/default-content';
import {
  formatFileSize,
  isNextOptimizableImage,
  parseVideoEmbed,
  type DocumentAttachment,
  type GalleryMediaItem,
} from '@/lib/media/embeds';
import { MediaPickerModal } from './MediaPickerModal';

interface MediaGalleryEditorProps {
  mediaItems: GalleryMediaItem[];
  documents: DocumentAttachment[];
  assets: MediaAssetData[];
  storageConfigured: boolean;
  onMediaChange: (items: GalleryMediaItem[]) => void;
  onDocumentsChange: (docs: DocumentAttachment[]) => void;
  onAssetCreated: (asset: MediaAssetData) => void;
}

function makeItemId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function MediaGalleryEditor({
  mediaItems,
  documents,
  assets,
  storageConfigured,
  onMediaChange,
  onDocumentsChange,
  onAssetCreated,
}: MediaGalleryEditorProps) {
  const [pickerMode, setPickerMode] = useState<'image' | 'pdf' | null>(null);
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoTitleInput, setVideoTitleInput] = useState('');
  const [videoError, setVideoError] = useState('');

  const parsedPreview = videoUrlInput.trim() ? parseVideoEmbed(videoUrlInput) : null;

  function moveMedia(index: number, delta: -1 | 1) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= mediaItems.length) return;
    const copy = [...mediaItems];
    const [moved] = copy.splice(index, 1);
    copy.splice(nextIndex, 0, moved);
    onMediaChange(copy);
  }

  function handleSelectAsset(asset: MediaAssetData) {
    if (pickerMode === 'image') {
      onMediaChange([
        ...mediaItems,
        {
          id: makeItemId('img'),
          type: 'image',
          url: asset.url,
          title: asset.title || asset.filename,
          alt: asset.alt || asset.title || asset.filename,
        },
      ]);
    } else if (pickerMode === 'pdf') {
      onDocumentsChange([
        ...documents,
        {
          id: makeItemId('pdf'),
          title: asset.title || asset.filename.replace(/\.pdf$/i, ''),
          description: asset.alt || '',
          url: asset.url,
          fileName: asset.filename,
          sizeBytes: asset.sizeBytes > 0 ? asset.sizeBytes : undefined,
        },
      ]);
    }
  }

  function handleAddVideo() {
    setVideoError('');
    const parsed = parseVideoEmbed(videoUrlInput);
    if (!parsed) {
      setVideoError(
        'Ingresa un enlace https:// válido de YouTube o Vimeo (por ejemplo, https://youtu.be/...).'
      );
      return;
    }

    onMediaChange([
      ...mediaItems,
      {
        id: makeItemId('vid'),
        type: 'video',
        url: parsed.canonicalUrl,
        title: videoTitleInput.trim() || `${parsed.providerLabel} — Video institucional`,
        thumbnailUrl: parsed.thumbnailUrl ?? undefined,
      },
    ]);

    setVideoUrlInput('');
    setVideoTitleInput('');
    setShowVideoForm(false);
  }

  return (
    <div className="space-y-6 rounded-xl border border-taupe bg-cream p-4 sm:p-5">
      <div>
        <h3 className="font-display text-base font-bold text-espresso">
          Galería Mixta (Imágenes + Videos) y Documentos PDF
        </h3>
        <p className="mt-1 text-xs text-earth">
          Combina múltiples fotografías, enlaces de YouTube o Vimeo, y cartillas PDF
          descargables.
        </p>
      </div>

      {/* Controles de acción */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPickerMode('image')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-umber/40 bg-surface px-3 py-2 text-xs font-semibold text-espresso hover:bg-sand"
        >
          <ImageIcon className="h-3.5 w-3.5 text-umber" aria-hidden="true" />+ Agregar
          imagen
        </button>
        <button
          type="button"
          onClick={() => {
            setVideoError('');
            setShowVideoForm(v => !v);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-umber/40 bg-surface px-3 py-2 text-xs font-semibold text-espresso hover:bg-sand"
        >
          <Video className="h-3.5 w-3.5 text-umber" aria-hidden="true" />+ Agregar video
          (YouTube / Vimeo)
        </button>
        <button
          type="button"
          onClick={() => setPickerMode('pdf')}
          className="inline-flex items-center gap-1.5 rounded-lg border border-umber/40 bg-surface px-3 py-2 text-xs font-semibold text-espresso hover:bg-sand"
        >
          <FileText className="h-3.5 w-3.5 text-umber" aria-hidden="true" />+ Adjuntar PDF
        </button>
      </div>

      {/* Formulario inline para video */}
      {showVideoForm && (
        <div className="space-y-3 rounded-xl border border-gold/50 bg-butter/60 p-4">
          <p className="text-xs font-bold tracking-wider text-umber uppercase">
            Nuevo enlace de video embebido
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              type="url"
              value={videoUrlInput}
              onChange={e => setVideoUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=... o https://vimeo.com/..."
              className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink focus:border-umber"
            />
            <input
              type="text"
              value={videoTitleInput}
              onChange={e => setVideoTitleInput(e.target.value)}
              placeholder="Título descriptivo del video"
              className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink focus:border-umber"
            />
          </div>

          {parsedPreview && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-espresso">
              <span className="rounded-full bg-gold px-2.5 py-0.5 font-bold text-ink">
                {parsedPreview.providerLabel}
              </span>
              <span className="truncate">{parsedPreview.canonicalUrl}</span>
            </div>
          )}

          {videoError && <p className="text-xs font-medium text-red-700">{videoError}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAddVideo}
              className="inline-flex items-center gap-1.5 rounded-lg bg-umber px-3.5 py-1.5 text-xs font-semibold text-cream hover:bg-espresso"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Añadir video a la galería
            </button>
            <button
              type="button"
              onClick={() => setShowVideoForm(false)}
              className="rounded-lg border border-taupe bg-surface px-3.5 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de elementos multimedia */}
      {mediaItems.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-bold tracking-wider text-earth uppercase">
            Elementos de galería ({mediaItems.length})
          </p>
          <div className="space-y-2.5">
            {mediaItems.map((item, idx) => {
              const videoInfo = item.type === 'video' ? parseVideoEmbed(item.url) : null;
              const previewUrl =
                item.type === 'image'
                  ? item.url
                  : item.thumbnailUrl || videoInfo?.thumbnailUrl || null;

              return (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-taupe bg-surface p-3 sm:flex-row sm:items-center"
                >
                  <div className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-sand">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt={item.alt || item.title || 'Vista previa'}
                        fill
                        unoptimized={!isNextOptimizableImage(previewUrl)}
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <Video className="h-6 w-6 text-umber" aria-hidden="true" />
                    )}
                    <span className="absolute bottom-1 left-1 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-cream uppercase">
                      {item.type === 'video'
                        ? videoInfo?.providerLabel || 'Video'
                        : 'Foto'}
                    </span>
                  </div>

                  <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      type="text"
                      value={item.title || ''}
                      placeholder="Título o pie de foto"
                      onChange={e => {
                        const next = mediaItems.map((entry, i) =>
                          i === idx ? { ...entry, title: e.target.value } : entry
                        );
                        onMediaChange(next);
                      }}
                      className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-2.5 py-1.5 text-xs text-ink"
                    />
                    <input
                      type="text"
                      value={item.alt || ''}
                      placeholder={
                        item.type === 'image'
                          ? 'Texto alternativo (accesibilidad)'
                          : 'Descripción breve del video'
                      }
                      onChange={e => {
                        const next = mediaItems.map((entry, i) =>
                          i === idx ? { ...entry, alt: e.target.value } : entry
                        );
                        onMediaChange(next);
                      }}
                      className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-2.5 py-1.5 text-xs text-ink"
                    />
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveMedia(idx, -1)}
                      aria-label="Subir elemento"
                      className="rounded-lg border border-taupe p-1.5 text-espresso hover:bg-sand disabled:opacity-40"
                    >
                      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === mediaItems.length - 1}
                      onClick={() => moveMedia(idx, 1)}
                      aria-label="Bajar elemento"
                      className="rounded-lg border border-taupe p-1.5 text-espresso hover:bg-sand disabled:opacity-40"
                    >
                      <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onMediaChange(mediaItems.filter((_, i) => i !== idx))
                      }
                      aria-label="Quitar de galería"
                      className="rounded-lg border border-red-200 p-1.5 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de documentos PDF */}
      {documents.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-xs font-bold tracking-wider text-earth uppercase">
            Documentos PDF adjuntos ({documents.length})
          </p>
          <div className="space-y-2.5">
            {documents.map((doc, idx) => (
              <div
                key={doc.id}
                className="flex flex-col gap-3 rounded-xl border border-taupe bg-surface p-3 sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-butter text-umber">
                    <FileText className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {doc.sizeBytes ? (
                    <span className="text-[11px] font-medium text-earth">
                      {formatFileSize(doc.sizeBytes)}
                    </span>
                  ) : null}
                </div>

                <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    type="text"
                    value={doc.title}
                    placeholder="Título visible del documento"
                    onChange={e => {
                      const next = documents.map((entry, i) =>
                        i === idx ? { ...entry, title: e.target.value } : entry
                      );
                      onDocumentsChange(next);
                    }}
                    className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-2.5 py-1.5 text-xs text-ink"
                  />
                  <input
                    type="text"
                    value={doc.description || ''}
                    placeholder="Descripción corta para el visitante"
                    onChange={e => {
                      const next = documents.map((entry, i) =>
                        i === idx ? { ...entry, description: e.target.value } : entry
                      );
                      onDocumentsChange(next);
                    }}
                    className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-2.5 py-1.5 text-xs text-ink"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onDocumentsChange(documents.filter((_, i) => i !== idx))}
                  aria-label="Quitar PDF"
                  className="self-start rounded-lg border border-red-200 p-1.5 text-red-700 hover:bg-red-50 sm:self-auto"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <MediaPickerModal
        open={pickerMode !== null}
        mode={pickerMode ?? 'all'}
        assets={assets}
        storageConfigured={storageConfigured}
        onSelect={handleSelectAsset}
        onAssetCreated={onAssetCreated}
        onClose={() => setPickerMode(null)}
      />
    </div>
  );
}
