'use client';

import { useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Film,
  Image as ImageIcon,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import type { MediaAssetData, ProjectItemData } from '@/data/default-content';
import { toSlug } from '@/lib/format';
import {
  isNextOptimizableImage,
  type DocumentAttachment,
  type GalleryMediaItem,
} from '@/lib/media/embeds';
import { ConfirmDialog } from '../ConfirmDialog';
import { MediaGalleryEditor } from '../MediaGalleryEditor';
import { MediaPickerModal } from '../MediaPickerModal';
import type { AdminFeedbackHandlers } from '../types';

interface ProjectsTabProps {
  projects: ProjectItemData[];
  assets: MediaAssetData[];
  storageConfigured: boolean;
  onProjectsChange: (projects: ProjectItemData[]) => void;
  onAssetCreated: (asset: MediaAssetData) => void;
  feedback: AdminFeedbackHandlers;
}

export function ProjectsTab({
  projects,
  assets,
  storageConfigured,
  onProjectsChange,
  onAssetCreated,
  feedback,
}: ProjectsTabProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const nextNumber = String(projects.length + 1).padStart(2, '0');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [numberLabel, setNumberLabel] = useState(nextNumber);
  const [sortOrder, setSortOrder] = useState(projects.length + 1);
  const [isPublished, setIsPublished] = useState(true);
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(
    assets.find(a => a.assetType === 'image')?.url ||
      '/images/proyecto-01-escuchar-voz-jovenes.jpg'
  );
  const [imageAlt, setImageAlt] = useState('');
  const [mediaItems, setMediaItems] = useState<GalleryMediaItem[]>([]);
  const [documents, setDocuments] = useState<DocumentAttachment[]>([]);

  const [saving, setSaving] = useState(false);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProjectItemData | null>(null);
  const [deleting, setDeleting] = useState(false);

  function resetForm(currentCount = projects.length) {
    setEditingId(null);
    setSlugTouched(false);
    setTitle('');
    setSlug('');
    setNumberLabel(String(currentCount + 1).padStart(2, '0'));
    setSortOrder(currentCount + 1);
    setIsPublished(true);
    setSummary('');
    setDescription('');
    setImageAlt('');
    setMediaItems([]);
    setDocuments([]);
  }

  function startEdit(project: ProjectItemData) {
    feedback.clearFeedback();
    setEditingId(project.id);
    setSlugTouched(true);
    setTitle(project.title);
    setSlug(project.slug);
    setNumberLabel(project.numberLabel);
    setSortOrder(project.sortOrder);
    setIsPublished(project.isPublished);
    setSummary(project.summary);
    setDescription(project.description);
    setImageUrl(project.imageUrl);
    setImageAlt(project.imageAlt);
    setMediaItems(project.mediaItems || []);
    setDocuments(project.documents || []);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    feedback.clearFeedback();
    setSaving(true);
    try {
      const payload = {
        ...(editingId ? { id: editingId } : {}),
        slug: slug.trim(),
        numberLabel: numberLabel.trim(),
        title: title.trim(),
        summary: summary.trim(),
        description: description.trim() || summary.trim(),
        imageUrl: imageUrl.trim(),
        imageAlt: imageAlt.trim(),
        mediaItems,
        documents,
        sortOrder: Number(sortOrder) || 0,
        isPublished,
      };

      const res = await fetch('/api/admin/projects', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        project?: ProjectItemData;
      };

      if (!res.ok || !json.project) {
        feedback.setError(json.error || 'No se pudo guardar el proyecto.');
        return;
      }

      const savedProject: ProjectItemData = {
        ...json.project,
        mediaItems: json.project.mediaItems ?? [],
        documents: json.project.documents ?? [],
      };

      if (editingId) {
        onProjectsChange(projects.map(p => (p.id === editingId ? savedProject : p)));
        feedback.setNotice(
          `Proyecto "${savedProject.title}" actualizado y publicado en caché.`
        );
        resetForm(projects.length);
      } else {
        const updatedList = [...projects, savedProject];
        onProjectsChange(updatedList);
        feedback.setNotice(`Proyecto "${savedProject.title}" creado correctamente.`);
        resetForm(updatedList.length);
      }
      router.refresh();
    } catch {
      feedback.setError('Error de conexión con el servidor al guardar el proyecto.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(project: ProjectItemData) {
    feedback.clearFeedback();
    try {
      const res = await fetch('/api/admin/projects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: project.id, isPublished: !project.isPublished }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        project?: ProjectItemData;
      };
      if (!res.ok || !json.project) {
        feedback.setError(json.error || 'No se pudo actualizar el estado del proyecto.');
        return;
      }
      onProjectsChange(
        projects.map(p =>
          p.id === project.id
            ? {
                ...json.project!,
                mediaItems: json.project!.mediaItems ?? [],
                documents: json.project!.documents ?? [],
              }
            : p
        )
      );
      feedback.setNotice(
        json.project.isPublished
          ? `Proyecto "${project.title}" publicado en el sitio.`
          : `Proyecto "${project.title}" movido a borrador oculto.`
      );
      router.refresh();
    } catch {
      feedback.setError('Error de conexión al cambiar el estado del proyecto.');
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    feedback.clearFeedback();
    try {
      const res = await fetch(`/api/admin/projects?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        feedback.setError(json.error || 'No se pudo eliminar el proyecto.');
        return;
      }
      const remaining = projects.filter(p => p.id !== deleteTarget.id);
      onProjectsChange(remaining);
      if (editingId === deleteTarget.id) resetForm(remaining.length);
      feedback.setNotice(`Proyecto "${deleteTarget.title}" eliminado permanentemente.`);
      setDeleteTarget(null);
      router.refresh();
    } catch {
      feedback.setError('Error de conexión con el servidor al eliminar el proyecto.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-taupe bg-surface p-4 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-bold text-espresso">
              Proyectos e Iniciativas ({projects.length})
            </h2>
            <p className="text-xs text-earth">
              Edita contenido, publica u oculta iniciativas, adjunta galerías o elimina
              con confirmación segura.
            </p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-taupe">
          {projects.map(project => (
            <article
              key={project.id}
              className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-taupe bg-sand">
                  <Image
                    src={project.imageUrl}
                    alt={project.imageAlt}
                    fill
                    unoptimized={!isNextOptimizableImage(project.imageUrl)}
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-gold/50 bg-butter px-2.5 py-0.5 font-display text-xs font-bold text-umber">
                      {project.numberLabel}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        project.isPublished
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          project.isPublished ? 'bg-emerald-600' : 'bg-amber-600'
                        }`}
                      />
                      {project.isPublished ? 'Publicado' : 'Borrador'}
                    </span>
                    {(project.mediaItems?.length || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium text-espresso">
                        <Film className="h-3 w-3 text-umber" aria-hidden="true" />
                        {project.mediaItems.length} en galería
                      </span>
                    )}
                    {(project.documents?.length || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sand px-2 py-0.5 text-[11px] font-medium text-espresso">
                        <FileText className="h-3 w-3 text-umber" aria-hidden="true" />
                        {project.documents.length} PDF
                      </span>
                    )}
                  </div>

                  <h3 className="mt-1.5 font-display text-base font-bold text-espresso">
                    {project.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-earth">
                    {project.summary || project.description}
                  </p>
                  <p className="mt-1 text-[11px] font-medium text-earth">
                    /{project.slug}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleTogglePublish(project)}
                  className="inline-flex items-center gap-1 rounded-lg border border-taupe bg-cream px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
                >
                  {project.isPublished ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                      Pasar a borrador
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Publicar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(project)}
                  className="inline-flex items-center gap-1 rounded-lg border border-umber/40 bg-surface px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
                >
                  <Edit3 className="h-3.5 w-3.5 text-umber" aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(project)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="space-y-5 rounded-2xl border border-taupe bg-surface p-4 shadow-xs sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-espresso">
            {editingId ? `Editar proyecto: ${title}` : 'Agregar nuevo proyecto'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={() => resetForm(projects.length)}
              className="inline-flex items-center gap-1 rounded-lg border border-taupe bg-cream px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="project-title"
              className="mb-1 block text-xs font-semibold text-espresso"
            >
              Título del proyecto *
            </label>
            <input
              id="project-title"
              name="title"
              required
              placeholder="Ej. Llamado a la paz"
              value={title}
              onChange={e => {
                const nextTitle = e.target.value;
                setTitle(nextTitle);
                if (!editingId && !slugTouched) {
                  setSlug(toSlug(nextTitle));
                }
              }}
              className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
            />
          </div>

          <div>
            <label
              htmlFor="project-slug"
              className="mb-1 block text-xs font-semibold text-espresso"
            >
              Slug URL *
            </label>
            <input
              id="project-slug"
              name="slug"
              required
              placeholder="llamado-a-la-paz"
              value={slug}
              onChange={e => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label
                htmlFor="project-number-label"
                className="mb-1 block text-xs font-semibold text-espresso"
              >
                Número *
              </label>
              <input
                id="project-number-label"
                name="numberLabel"
                required
                placeholder="04"
                value={numberLabel}
                onChange={e => setNumberLabel(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-3 py-2 text-sm text-ink"
              />
            </div>
            <div>
              <label
                htmlFor="project-sort-order"
                className="mb-1 block text-xs font-semibold text-espresso"
              >
                Orden
              </label>
              <input
                id="project-sort-order"
                name="sortOrder"
                type="number"
                min={0}
                max={999}
                value={sortOrder}
                onChange={e => setSortOrder(Number(e.target.value))}
                className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-3 py-2 text-sm text-ink"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="project-summary"
              className="mb-1 block text-xs font-semibold text-espresso"
            >
              Resumen breve
            </label>
            <input
              id="project-summary"
              name="summary"
              placeholder="Resumen en una línea para listados"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
            />
          </div>

          <div className="flex items-end pb-2">
            <label
              htmlFor="project-is-published"
              className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-espresso"
            >
              <input
                id="project-is-published"
                name="isPublished"
                type="checkbox"
                checked={isPublished}
                onChange={e => setIsPublished(e.target.checked)}
                className="h-4 w-4 accent-umber"
              />
              Visible en la página pública de Proyectos
            </label>
          </div>
        </div>

        <div>
          <label
            htmlFor="project-description"
            className="mb-1 block text-xs font-semibold text-espresso"
          >
            Descripción completa de la iniciativa
          </label>
          <textarea
            id="project-description"
            name="description"
            rows={4}
            placeholder="Describe el impacto, territorios y logros del proyecto..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-taupe bg-cream p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-espresso">
              Imagen de portada del proyecto *
            </span>
            <button
              type="button"
              onClick={() => setCoverPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-umber/40 bg-surface px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
            >
              <ImageIcon className="h-3.5 w-3.5 text-umber" aria-hidden="true" />
              Elegir o subir imagen
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {imageUrl && (
              <div className="relative h-24 w-full shrink-0 overflow-hidden rounded-xl border border-taupe bg-sand sm:w-36">
                <Image
                  src={imageUrl}
                  alt={imageAlt || title || 'Portada del proyecto'}
                  fill
                  unoptimized={!isNextOptimizableImage(imageUrl)}
                  sizes="144px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                id="project-image-url"
                name="imageUrl"
                aria-label="URL de imagen de portada del proyecto"
                required
                placeholder="URL de imagen (/images/... o https://...)"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink"
              />
              <input
                id="project-image-alt"
                name="imageAlt"
                aria-label="Descripción accesible (alt) de la fotografía"
                required
                placeholder="Descripción accesible (alt) de la fotografía *"
                value={imageAlt}
                onChange={e => setImageAlt(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink"
              />
            </div>
          </div>
        </div>

        {/* Galería Mixta + PDF */}
        <MediaGalleryEditor
          mediaItems={mediaItems}
          documents={documents}
          assets={assets}
          storageConfigured={storageConfigured}
          onMediaChange={setMediaItems}
          onDocumentsChange={setDocuments}
          onAssetCreated={onAssetCreated}
        />

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-umber px-6 py-2.5 text-sm font-semibold text-cream hover:bg-espresso disabled:opacity-60"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>
            {saving
              ? 'Guardando...'
              : editingId
                ? 'Guardar cambios del proyecto'
                : 'Publicar proyecto'}
          </span>
        </button>
      </form>

      <MediaPickerModal
        open={coverPickerOpen}
        mode="image"
        assets={assets}
        storageConfigured={storageConfigured}
        onAssetCreated={onAssetCreated}
        onSelect={asset => {
          setImageUrl(asset.url);
          if (!imageAlt && asset.alt) setImageAlt(asset.alt);
        }}
        onClose={() => setCoverPickerOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        variant="danger"
        title="Confirmar eliminación de proyecto"
        description={`Esta acción eliminará permanentemente el proyecto "${deleteTarget?.title || ''}" de la página pública y de la base de datos. Si fue un error o prefieres ocultarlo sin perder información, usa "Pasar a borrador".`}
        confirmLabel="Sí, eliminar proyecto"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
