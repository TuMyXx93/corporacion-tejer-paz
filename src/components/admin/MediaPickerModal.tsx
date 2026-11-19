'use client';

import { useEffect, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { upload } from '@vercel/blob/client';
import {
  Check,
  FileText,
  Image as ImageIcon,
  Search,
  Upload,
  Video,
  X,
} from 'lucide-react';
import type { MediaAssetData } from '@/data/default-content';
import { formatFileSize, isNextOptimizableImage } from '@/lib/media/embeds';
import { inferAssetTypeFromMime, sanitizeUploadFilename } from '@/lib/storage';

interface MediaPickerModalProps {
  open: boolean;
  mode?: 'image' | 'pdf' | 'all';
  assets: MediaAssetData[];
  storageConfigured: boolean;
  onSelect: (asset: MediaAssetData) => void;
  onAssetCreated: (asset: MediaAssetData) => void;
  onClose: () => void;
}

export function MediaPickerModal(props: MediaPickerModalProps) {
  if (!props.open) return null;
  return <MediaPickerModalInner {...props} />;
}

function MediaPickerModalInner({
  mode = 'all',
  assets,
  storageConfigured,
  onSelect,
  onAssetCreated,
  onClose,
}: MediaPickerModalProps) {
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !uploading) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uploading, onClose]);

  const filtered = assets.filter(asset => {
    if (mode === 'image' && asset.assetType !== 'image') return false;
    if (mode === 'pdf' && asset.assetType !== 'pdf') return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      asset.title.toLowerCase().includes(q) ||
      asset.filename.toLowerCase().includes(q) ||
      asset.alt.toLowerCase().includes(q) ||
      asset.url.toLowerCase().includes(q)
    );
  });

  const acceptAttr =
    mode === 'pdf'
      ? 'application/pdf'
      : mode === 'image'
        ? 'image/jpeg,image/png,image/webp,image/avif'
        : 'image/jpeg,image/png,image/webp,image/avif,application/pdf';

  async function handleDirectUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const safeName = sanitizeUploadFilename(file.name);
      const blob = await upload(`media/${safeName}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/media/upload',
      });

      const mimeType = blob.contentType || file.type || 'image/jpeg';
      const assetType = inferAssetTypeFromMime(mimeType);
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: blob.url,
          pathname: blob.pathname,
          filename: file.name,
          title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
          alt: '',
          mimeType,
          sizeBytes: file.size,
          assetType,
          storageProvider: 'vercel-blob',
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        asset?: MediaAssetData;
      };
      if (!res.ok || !json.asset) {
        throw new Error(json.error || 'No se pudo registrar el archivo subido.');
      }

      onAssetCreated(json.asset);
      onSelect(json.asset);
      onClose();
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Error al subir archivo a Vercel Blob.'
      );
    } finally {
      setUploading(false);
      input.value = '';
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-3 backdrop-blur-xs sm:p-5"
      onClick={() => {
        if (!uploading) onClose();
      }}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-taupe bg-surface shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-taupe bg-cream px-5 py-4">
          <div className="min-w-0">
            <h2
              id="media-picker-title"
              className="font-display text-lg font-bold text-espresso"
            >
              {mode === 'pdf'
                ? 'Seleccionar o subir documento PDF'
                : mode === 'image'
                  ? 'Seleccionar o subir imagen'
                  : 'Biblioteca Multimedia Institucional'}
            </h2>
            <p className="text-xs text-earth">
              Elige un recurso existente o súbelo directamente a Vercel Blob.
            </p>
          </div>

          <button
            type="button"
            disabled={uploading}
            onClick={onClose}
            aria-label="Cerrar selector multimedia"
            className="rounded-lg border border-taupe bg-surface p-2 text-espresso hover:bg-sand disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-taupe bg-sand/40 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-earth"
              aria-hidden="true"
            />
            <input
              id="media-picker-search"
              name="mediaPickerSearch"
              aria-label="Buscar archivo por nombre, título o texto alternativo"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre, título o texto alternativo..."
              className="w-full rounded-lg border border-taupe bg-surface py-2 pr-3 pl-9 text-sm text-ink focus:border-umber"
            />
          </div>

          <label
            htmlFor="media-picker-upload"
            className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg bg-umber px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-espresso ${
              !storageConfigured || uploading ? 'cursor-not-allowed opacity-60' : ''
            }`}
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>
              {uploading
                ? 'Subiendo...'
                : mode === 'pdf'
                  ? 'Subir PDF nuevo'
                  : 'Subir archivo nuevo'}
            </span>
            <input
              id="media-picker-upload"
              name="mediaPickerUpload"
              type="file"
              accept={acceptAttr}
              disabled={!storageConfigured || uploading}
              onChange={handleDirectUpload}
              className="sr-only"
            />
          </label>
        </div>

        {uploadError && (
          <p
            role="alert"
            className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-medium text-red-800"
          >
            {uploadError}
          </p>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-taupe bg-cream p-8 text-center">
              <p className="text-sm font-medium text-espresso">
                No hay recursos que coincidan con tu filtro.
              </p>
              <p className="mt-1 text-xs text-earth">
                Sube un archivo nuevo arriba o sincroniza tus blobs desde la pestaña
                Multimedia.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {filtered.map(asset => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => {
                    onSelect(asset);
                    onClose();
                  }}
                  className="group flex flex-col overflow-hidden rounded-xl border border-taupe bg-surface text-left transition-all hover:border-umber hover:shadow-md"
                >
                  <div className="relative flex h-36 w-full items-center justify-center overflow-hidden bg-sand">
                    {asset.assetType === 'image' ? (
                      <Image
                        src={asset.url}
                        alt={asset.alt || asset.title || asset.filename}
                        fill
                        unoptimized={!isNextOptimizableImage(asset.url)}
                        sizes="280px"
                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    ) : asset.assetType === 'pdf' ? (
                      <div className="flex flex-col items-center gap-2 text-umber">
                        <FileText className="h-10 w-10" aria-hidden="true" />
                        <span className="rounded bg-butter px-2 py-0.5 text-[11px] font-bold uppercase">
                          Documento PDF
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-umber">
                        <Video className="h-10 w-10" aria-hidden="true" />
                        <span className="rounded bg-butter px-2 py-0.5 text-[11px] font-bold uppercase">
                          Video externo
                        </span>
                      </div>
                    )}
                    <span className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-umber text-cream opacity-0 shadow transition-opacity group-hover:opacity-100">
                      <Check className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </div>

                  <div className="flex-1 space-y-1 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-umber uppercase">
                        {asset.assetType === 'image' ? (
                          <ImageIcon className="h-3 w-3" aria-hidden="true" />
                        ) : asset.assetType === 'pdf' ? (
                          <FileText className="h-3 w-3" aria-hidden="true" />
                        ) : (
                          <Video className="h-3 w-3" aria-hidden="true" />
                        )}
                        {asset.storageProvider}
                      </span>
                      {asset.sizeBytes > 0 && (
                        <span className="text-[11px] text-earth">
                          {formatFileSize(asset.sizeBytes)}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-sm font-semibold text-ink">
                      {asset.title || asset.filename}
                    </p>
                    <p className="truncate text-xs text-earth">
                      {asset.alt || asset.filename}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
