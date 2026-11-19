'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import {
  Check,
  CloudUpload,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Video,
} from 'lucide-react';
import type { MediaAssetData } from '@/data/default-content';
import {
  formatFileSize,
  isNextOptimizableImage,
  parseVideoEmbed,
} from '@/lib/media/embeds';
import { inferAssetTypeFromMime, sanitizeUploadFilename } from '@/lib/storage';
import { ConfirmDialog } from '../ConfirmDialog';
import type { AdminFeedbackHandlers } from '../types';

interface MediaLibraryTabProps {
  assets: MediaAssetData[];
  storageProvider: string;
  storageConfigured: boolean;
  onAssetsChange: (assets: MediaAssetData[]) => void;
  feedback: AdminFeedbackHandlers;
}

type AssetFilter = 'all' | 'image' | 'video' | 'pdf';

export function MediaLibraryTab({
  assets,
  storageProvider,
  storageConfigured,
  onAssetsChange,
  feedback,
}: MediaLibraryTabProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<AssetFilter>('all');
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Add video URL form
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);

  // Inline edit metadata
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<MediaAssetData | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = {
    all: assets.length,
    image: assets.filter(a => a.assetType === 'image').length,
    video: assets.filter(a => a.assetType === 'video').length,
    pdf: assets.filter(a => a.assetType === 'pdf').length,
  };

  const filtered = assets.filter(asset => {
    if (filter !== 'all' && asset.assetType !== filter) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      asset.title.toLowerCase().includes(q) ||
      asset.filename.toLowerCase().includes(q) ||
      asset.alt.toLowerCase().includes(q) ||
      asset.url.toLowerCase().includes(q)
    );
  });

  async function handleDirectFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    feedback.clearFeedback();
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
        throw new Error(json.error || 'Subido al Blob, pero falló el registro en BD.');
      }

      onAssetsChange([json.asset, ...assets.filter(a => a.id !== json.asset!.id)]);
      feedback.setNotice(
        `Archivo "${file.name}" subido directamente a Vercel Blob y añadido a la biblioteca.`
      );
    } catch (err) {
      feedback.setError(
        err instanceof Error
          ? err.message
          : 'Error al subir archivo. Verifica BLOB_READ_WRITE_TOKEN.'
      );
    } finally {
      setUploading(false);
      input.value = '';
    }
  }

  async function handleRegisterVideo(event: FormEvent) {
    event.preventDefault();
    feedback.clearFeedback();
    const parsed = parseVideoEmbed(videoUrl);
    if (!parsed) {
      feedback.setError(
        'Ingresa un enlace https:// válido de YouTube o Vimeo (ej. https://youtu.be/...).'
      );
      return;
    }

    setSavingVideo(true);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: parsed.canonicalUrl,
          pathname: `video/${parsed.provider}/${parsed.videoId || 'external'}`,
          filename: videoTitle.trim() || `${parsed.providerLabel} Video`,
          title: videoTitle.trim() || `${parsed.providerLabel} — Video institucional`,
          alt: '',
          mimeType: 'video/external',
          sizeBytes: 0,
          assetType: 'video',
          storageProvider: 'external',
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        asset?: MediaAssetData;
      };
      if (!res.ok || !json.asset) {
        feedback.setError(json.error || 'No se pudo registrar el enlace de video.');
        return;
      }
      onAssetsChange([json.asset, ...assets.filter(a => a.id !== json.asset!.id)]);
      setVideoUrl('');
      setVideoTitle('');
      feedback.setNotice(`Enlace de ${parsed.providerLabel} guardado en biblioteca.`);
    } finally {
      setSavingVideo(false);
    }
  }

  async function handleSync(migrateLocal: boolean) {
    feedback.clearFeedback();
    if (migrateLocal) setMigrating(true);
    else setSyncing(true);

    try {
      const res = await fetch('/api/admin/media/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ migrateLocal }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        syncedCount?: number;
        uploadedCount?: number;
        updatedReferences?: number;
        assets?: MediaAssetData[];
      };
      if (!res.ok) {
        feedback.setError(json.error || 'Falló la sincronización con Vercel Blob.');
        return;
      }
      if (json.assets) {
        onAssetsChange(
          json.assets.map(a => ({
            ...a,
            createdAt:
              typeof a.createdAt === 'string'
                ? a.createdAt
                : new Date(a.createdAt).toISOString(),
          }))
        );
      }
      if (migrateLocal) {
        feedback.setNotice(
          `Migración completada: ${json.uploadedCount ?? 0} imágenes nuevas subidas a Vercel Blob y ${json.updatedReferences ?? 0} referencias actualizadas en el sitio.`
        );
        router.refresh();
      } else {
        feedback.setNotice(
          `Sincronización completada: ${json.syncedCount ?? 0} archivo(s) nuevos importados desde Vercel Blob.`
        );
      }
    } finally {
      setSyncing(false);
      setMigrating(false);
    }
  }

  async function handleSaveEdit(assetId: number) {
    feedback.clearFeedback();
    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assetId,
          title: editTitle.trim(),
          alt: editAlt.trim(),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        asset?: MediaAssetData;
      };
      if (!res.ok || !json.asset) {
        feedback.setError(json.error || 'No se pudieron actualizar los metadatos.');
        return;
      }
      onAssetsChange(assets.map(a => (a.id === assetId ? json.asset! : a)));
      setEditingId(null);
      feedback.setNotice('Título y texto alternativo actualizados.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    feedback.clearFeedback();
    try {
      const res = await fetch(`/api/admin/media?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        feedback.setError(json.error || 'No se pudo eliminar el recurso.');
        return;
      }
      onAssetsChange(assets.filter(a => a.id !== deleteTarget.id));
      feedback.setNotice(`Recurso "${deleteTarget.filename}" eliminado correctamente.`);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleCopyUrl(asset: MediaAssetData) {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      feedback.setError('No se pudo copiar la URL al portapapeles.');
    }
  }

  return (
    <div className="space-y-6">
      {/* Panel superior de carga y sincronización */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-2xl border border-taupe bg-surface p-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-espresso">
                Subida Directa ({storageProvider})
              </h2>
              <p className="text-xs text-earth">
                Imágenes (JPG, PNG, WEBP, AVIF hasta 10 MB) y Documentos PDF (hasta 15
                MB).
              </p>
            </div>
          </div>

          {!storageConfigured && (
            <p className="rounded-lg border border-gold/50 bg-butter px-3.5 py-2.5 text-xs text-ink">
              Configura <code>BLOB_READ_WRITE_TOKEN</code> en Vercel Storage o{' '}
              <code>.env.local</code> para subir archivos.
            </p>
          )}

          <label
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-umber/40 bg-cream px-4 py-6 text-center transition-colors hover:border-umber hover:bg-butter/40 ${
              uploading || !storageConfigured ? 'cursor-not-allowed opacity-60' : ''
            }`}
          >
            <Upload className="h-6 w-6 text-umber" aria-hidden="true" />
            <span className="text-sm font-semibold text-espresso">
              {uploading
                ? 'Subiendo directamente a Vercel Blob...'
                : 'Haz clic para subir imagen o documento PDF'}
            </span>
            <span className="text-xs text-earth">
              Transferencia directa desde navegador sin pasar por el límite serverless de
              4.5 MB
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif,application/pdf"
              disabled={uploading || !storageConfigured}
              onChange={handleDirectFileUpload}
              className="sr-only"
            />
          </label>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              disabled={syncing || !storageConfigured}
              onClick={() => handleSync(false)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-umber/40 bg-cream px-3 py-2 text-xs font-semibold text-espresso hover:bg-sand disabled:opacity-55"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-umber ${syncing ? 'animate-spin' : ''}`}
                aria-hidden="true"
              />
              {syncing ? 'Sincronizando...' : 'Sincronizar Vercel Blob'}
            </button>

            <button
              type="button"
              disabled={migrating || !storageConfigured}
              onClick={() => handleSync(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-umber px-3 py-2 text-xs font-semibold text-cream hover:bg-espresso disabled:opacity-55"
            >
              <CloudUpload className="h-3.5 w-3.5" aria-hidden="true" />
              {migrating ? 'Migrando imágenes...' : 'Migrar imágenes locales a Blob'}
            </button>
          </div>
        </section>

        {/* Registrar enlaces externos de video */}
        <section className="space-y-4 rounded-2xl border border-taupe bg-surface p-5 shadow-xs">
          <div>
            <h2 className="font-display text-lg font-bold text-espresso">
              Biblioteca de Videos por Enlace
            </h2>
            <p className="text-xs text-earth">
              Registra enlaces de YouTube o Vimeo para usarlos en cualquier proyecto o
              sección sin consumir espacio de almacenamiento.
            </p>
          </div>

          <form onSubmit={handleRegisterVideo} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-espresso">
                Enlace de YouTube o Vimeo (https://) *
              </label>
              <input
                type="url"
                required
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink focus:border-umber"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-espresso">
                Título del video
              </label>
              <input
                type="text"
                value={videoTitle}
                onChange={e => setVideoTitle(e.target.value)}
                placeholder="Ej. Encuentro juvenil en el suroccidente"
                className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink focus:border-umber"
              />
            </div>

            <button
              type="submit"
              disabled={savingVideo}
              className="inline-flex items-center gap-1.5 rounded-lg bg-umber px-4 py-2 text-xs font-semibold text-cream hover:bg-espresso disabled:opacity-60"
            >
              <Video className="h-3.5 w-3.5" aria-hidden="true" />
              {savingVideo ? 'Guardando video...' : 'Guardar enlace de video'}
            </button>
          </form>
        </section>
      </div>

      {/* Grilla de biblioteca */}
      <section className="space-y-5 rounded-2xl border border-taupe bg-surface p-4 shadow-xs sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { key: 'all', label: `Todos (${counts.all})` },
                { key: 'image', label: `Imágenes (${counts.image})` },
                { key: 'video', label: `Videos (${counts.video})` },
                { key: 'pdf', label: `PDFs (${counts.pdf})` },
              ] as const
            ).map(pill => (
              <button
                key={pill.key}
                type="button"
                onClick={() => setFilter(pill.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  filter === pill.key
                    ? 'bg-umber text-cream'
                    : 'border border-taupe bg-cream text-espresso hover:bg-sand'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-earth"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar archivo o alt..."
              className="w-full rounded-lg border border-taupe bg-cream py-1.5 pr-3 pl-9 text-sm text-ink"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-taupe bg-cream p-8 text-center">
            <p className="text-sm font-medium text-espresso">
              No hay recursos registrados en esta vista.
            </p>
            <p className="mt-1 text-xs text-earth">
              Sube archivos arriba o haz clic en “Sincronizar Vercel Blob” para importar
              tus blobs existentes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(asset => {
              const videoParsed =
                asset.assetType === 'video' ? parseVideoEmbed(asset.url) : null;
              const previewUrl =
                asset.assetType === 'image'
                  ? asset.url
                  : videoParsed?.thumbnailUrl || null;
              const isEditing = editingId === asset.id;

              return (
                <article
                  key={asset.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-taupe bg-cream"
                >
                  <div className="relative flex h-40 w-full items-center justify-center overflow-hidden bg-sand">
                    {previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt={asset.alt || asset.title || asset.filename}
                        fill
                        unoptimized={!isNextOptimizableImage(previewUrl)}
                        sizes="(max-width: 640px) 100vw, 320px"
                        className="object-cover"
                      />
                    ) : asset.assetType === 'pdf' ? (
                      <div className="flex flex-col items-center gap-2 text-umber">
                        <FileText className="h-11 w-11" aria-hidden="true" />
                        <span className="rounded-full bg-butter px-2.5 py-0.5 text-[11px] font-bold uppercase">
                          Documento PDF
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-umber">
                        <Video className="h-11 w-11" aria-hidden="true" />
                        <span className="rounded-full bg-butter px-2.5 py-0.5 text-[11px] font-bold uppercase">
                          {videoParsed?.providerLabel || 'Video'}
                        </span>
                      </div>
                    )}

                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-ink/85 px-2.5 py-0.5 text-[11px] font-semibold text-cream">
                      {asset.assetType === 'image' ? (
                        <ImageIcon className="h-3 w-3 text-gold" aria-hidden="true" />
                      ) : asset.assetType === 'pdf' ? (
                        <FileText className="h-3 w-3 text-gold" aria-hidden="true" />
                      ) : (
                        <Video className="h-3 w-3 text-gold" aria-hidden="true" />
                      )}
                      {asset.storageProvider}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col justify-between space-y-3 p-3.5">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          placeholder="Título visible"
                          className="w-full rounded-lg border border-taupe bg-surface px-2.5 py-1.5 text-xs text-ink"
                        />
                        <input
                          type="text"
                          value={editAlt}
                          onChange={e => setEditAlt(e.target.value)}
                          placeholder="Texto alternativo (accesibilidad)"
                          className="w-full rounded-lg border border-taupe bg-surface px-2.5 py-1.5 text-xs text-ink"
                        />
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            disabled={savingEdit}
                            onClick={() => handleSaveEdit(asset.id)}
                            className="rounded-lg bg-umber px-3 py-1 text-xs font-semibold text-cream hover:bg-espresso"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-taupe bg-surface px-3 py-1 text-xs font-semibold text-espresso"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-bold text-espresso">
                          {asset.title || asset.filename}
                        </p>
                        <p className="truncate text-xs text-earth">
                          {asset.alt || 'Sin descripción alt asignada'}
                        </p>
                        <p className="text-[11px] font-medium text-earth">
                          {asset.mimeType}
                          {asset.sizeBytes > 0
                            ? ` · ${formatFileSize(asset.sizeBytes)}`
                            : ''}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 border-t border-taupe/70 pt-2.5">
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(asset)}
                        className="inline-flex items-center gap-1 rounded-lg border border-taupe bg-surface px-2.5 py-1 text-xs font-semibold text-espresso hover:bg-sand"
                      >
                        {copiedId === asset.id ? (
                          <>
                            <Check
                              className="h-3 w-3 text-emerald-700"
                              aria-hidden="true"
                            />
                            Copiada
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" aria-hidden="true" />
                            Copiar URL
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(asset.id);
                          setEditTitle(asset.title || '');
                          setEditAlt(asset.alt || '');
                        }}
                        aria-label={`Editar metadatos de ${asset.filename}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-taupe bg-surface px-2.5 py-1 text-xs font-semibold text-espresso hover:bg-sand"
                      >
                        <Edit3 className="h-3 w-3" aria-hidden="true" />
                        Alt
                      </button>

                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Abrir ${asset.filename}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-taupe bg-surface px-2.5 py-1 text-xs font-semibold text-espresso hover:bg-sand"
                      >
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(asset)}
                        aria-label={`Eliminar ${asset.filename}`}
                        className="ml-auto inline-flex items-center gap-1 rounded-lg border border-red-200 bg-surface px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        variant="danger"
        title="Eliminar recurso multimedia"
        description={`Se eliminará "${deleteTarget?.title || deleteTarget?.filename || ''}" de la biblioteca${
          deleteTarget?.storageProvider === 'vercel-blob'
            ? ' y de tu Store en Vercel Blob'
            : ''
        }. Verifica que ningún proyecto o sección activa dependa de esta URL antes de confirmar.`}
        confirmLabel="Sí, eliminar recurso"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
