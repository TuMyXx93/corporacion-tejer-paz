'use client';

import { useRef, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Edit3, Eye, EyeOff, Image as ImageIcon, Plus, Trash2, X } from 'lucide-react';
import type { ActionAreaData, MediaAssetData } from '@/data/default-content';
import { isNextOptimizableImage } from '@/lib/media/embeds';
import { ConfirmDialog } from '../ConfirmDialog';
import { MediaPickerModal } from '../MediaPickerModal';
import type { AdminFeedbackHandlers } from '../types';

interface ActionAreasTabProps {
  actionAreas: ActionAreaData[];
  assets: MediaAssetData[];
  storageConfigured: boolean;
  onActionAreasChange: (areas: ActionAreaData[]) => void;
  onAssetCreated: (asset: MediaAssetData) => void;
  feedback: AdminFeedbackHandlers;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ActionAreasTab({
  actionAreas,
  assets,
  storageConfigured,
  onActionAreasChange,
  onAssetCreated,
  feedback,
}: ActionAreasTabProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(
    assets.find(a => a.assetType === 'image')?.url ||
      '/images/area-juventudes-que-protegen-paloma-tejida.jpg'
  );
  const [imageAlt, setImageAlt] = useState('');
  const [href, setHref] = useState('/proyectos');
  const [sortOrder, setSortOrder] = useState(actionAreas.length + 1);
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ActionAreaData | null>(null);
  const [deleting, setDeleting] = useState(false);

  function resetForm() {
    setEditingId(null);
    setSlugTouched(false);
    setTitle('');
    setSlug('');
    setDescription('');
    setImageAlt('');
    setHref('/proyectos');
    setSortOrder(actionAreas.length + 1);
    setIsActive(true);
  }

  function startEdit(area: ActionAreaData) {
    feedback.clearFeedback();
    setEditingId(area.id);
    setSlugTouched(true);
    setTitle(area.title);
    setSlug(area.slug);
    setDescription(area.description);
    setImageUrl(area.imageUrl);
    setImageAlt(area.imageAlt);
    setHref(area.href);
    setSortOrder(area.sortOrder);
    setIsActive(area.isActive);
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
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        imageAlt: imageAlt.trim(),
        href: href.trim() || '/proyectos',
        sortOrder: Number(sortOrder) || 0,
        isActive,
      };

      const res = await fetch('/api/admin/action-areas', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        actionArea?: ActionAreaData;
      };

      if (!res.ok || !json.actionArea) {
        feedback.setError(json.error || 'No se pudo guardar el área de acción.');
        return;
      }

      if (editingId) {
        onActionAreasChange(
          actionAreas.map(a => (a.id === editingId ? json.actionArea! : a))
        );
        feedback.setNotice(`Área "${json.actionArea.title}" actualizada correctamente.`);
      } else {
        onActionAreasChange([...actionAreas, json.actionArea]);
        feedback.setNotice(`Área "${json.actionArea.title}" creada correctamente.`);
      }
      resetForm();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(area: ActionAreaData) {
    feedback.clearFeedback();
    const res = await fetch('/api/admin/action-areas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: area.id, isActive: !area.isActive }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      actionArea?: ActionAreaData;
    };
    if (!res.ok || !json.actionArea) {
      feedback.setError(json.error || 'No se pudo cambiar la visibilidad.');
      return;
    }
    onActionAreasChange(actionAreas.map(a => (a.id === area.id ? json.actionArea! : a)));
    feedback.setNotice(
      json.actionArea.isActive
        ? `Área "${area.title}" activada en la página de inicio.`
        : `Área "${area.title}" ocultada del inicio público.`
    );
    router.refresh();
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    feedback.clearFeedback();
    try {
      const res = await fetch(`/api/admin/action-areas?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        feedback.setError(json.error || 'No se pudo eliminar el área de acción.');
        return;
      }
      onActionAreasChange(actionAreas.filter(a => a.id !== deleteTarget.id));
      if (editingId === deleteTarget.id) resetForm();
      feedback.setNotice(`Área "${deleteTarget.title}" eliminada definitivamente.`);
      setDeleteTarget(null);
      router.refresh();
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
              Áreas de Acción ({actionAreas.length})
            </h2>
            <p className="text-xs text-earth">
              Administra las líneas estratégicas visibles en la portada principal.
            </p>
          </div>
        </div>

        <div className="mt-5 divide-y divide-taupe">
          {actionAreas.map(area => (
            <article
              key={area.id}
              className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full border-2 border-butter ring-1 ring-gold/50 bg-sand">
                  <Image
                    src={area.imageUrl}
                    alt={area.imageAlt}
                    fill
                    unoptimized={!isNextOptimizableImage(area.imageUrl)}
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-sand px-2 py-0.5 text-[11px] font-bold text-umber">
                      Orden {area.sortOrder}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        area.isActive
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      {area.isActive ? 'Activa' : 'Oculta'}
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-base font-bold text-espresso">
                    {area.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-earth">
                    {area.description}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(area)}
                  className="inline-flex items-center gap-1 rounded-lg border border-taupe bg-cream px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
                >
                  {area.isActive ? (
                    <>
                      <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                      Ocultar
                    </>
                  ) : (
                    <>
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Activar
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(area)}
                  className="inline-flex items-center gap-1 rounded-lg border border-umber/40 bg-surface px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
                >
                  <Edit3 className="h-3.5 w-3.5 text-umber" aria-hidden="true" />
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(area)}
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
        className="space-y-4 rounded-2xl border border-taupe bg-surface p-4 shadow-xs sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-bold text-espresso">
            {editingId ? `Editar área: ${title}` : 'Agregar nueva área de acción'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-lg border border-taupe bg-cream px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-espresso">
              Título *
            </label>
            <input
              required
              value={title}
              onChange={e => {
                const nextTitle = e.target.value;
                setTitle(nextTitle);
                if (!editingId && !slugTouched) {
                  setSlug(toSlug(nextTitle));
                }
              }}
              placeholder="Ej. Juventudes que protegen"
              className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-espresso">
              Orden
            </label>
            <input
              type="number"
              min={0}
              max={999}
              value={sortOrder}
              onChange={e => setSortOrder(Number(e.target.value))}
              className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-espresso">
              Slug identificador *
            </label>
            <input
              required
              value={slug}
              onChange={e => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
              placeholder="juventudes-que-protegen"
              className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-espresso">
              Enlace de botón “Saber más” *
            </label>
            <input
              required
              value={href}
              onChange={e => setHref(e.target.value)}
              placeholder="/proyectos#cultura-de-paz"
              className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-espresso">
            Descripción (mín. 10 caracteres) *
          </label>
          <textarea
            required
            rows={3}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe el alcance y propósito territorial del área..."
            className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-taupe bg-cream p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-espresso">
              Fotografía representativa
            </span>
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-umber/40 bg-surface px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
            >
              <ImageIcon className="h-3.5 w-3.5 text-umber" aria-hidden="true" />
              Elegir o subir foto
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {imageUrl && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-butter bg-sand">
                <Image
                  src={imageUrl}
                  alt={imageAlt || title || 'Vista previa'}
                  fill
                  unoptimized={!isNextOptimizableImage(imageUrl)}
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                required
                placeholder="URL de imagen"
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink"
              />
              <input
                required
                placeholder="Texto alternativo descriptivo (alt)"
                value={imageAlt}
                onChange={e => setImageAlt(e.target.value)}
                className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink"
              />
            </div>
          </div>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-espresso">
          <input
            type="checkbox"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="h-4 w-4 accent-umber"
          />
          Área visible en la página principal
        </label>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-umber px-5 py-2.5 text-sm font-semibold text-cream hover:bg-espresso disabled:opacity-60"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>
              {saving
                ? 'Guardando...'
                : editingId
                  ? 'Guardar cambios del área'
                  : 'Crear área de acción'}
            </span>
          </button>
        </div>
      </form>

      <MediaPickerModal
        open={pickerOpen}
        mode="image"
        assets={assets}
        storageConfigured={storageConfigured}
        onAssetCreated={onAssetCreated}
        onSelect={asset => {
          setImageUrl(asset.url);
          if (!imageAlt && asset.alt) setImageAlt(asset.alt);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        variant="danger"
        title="Eliminar área de acción"
        description={`Esta acción eliminará permanentemente "${deleteTarget?.title || ''}" de la portada y de la base de datos. Si solo quieres ocultarla temporalmente, usa el botón Ocultar.`}
        confirmLabel="Sí, eliminar área"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
