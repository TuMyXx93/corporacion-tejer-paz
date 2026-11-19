'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import type { MediaAssetData, PageSectionData } from '@/data/default-content';
import { isNextOptimizableImage } from '@/lib/media/embeds';
import { MediaGalleryEditor } from '../MediaGalleryEditor';
import { MediaPickerModal } from '../MediaPickerModal';
import type { AdminFeedbackHandlers } from '../types';

interface SectionsTabProps {
  sections: PageSectionData[];
  assets: MediaAssetData[];
  storageConfigured: boolean;
  onSectionsChange: (sections: PageSectionData[]) => void;
  onAssetCreated: (asset: MediaAssetData) => void;
  feedback: AdminFeedbackHandlers;
}

const SECTION_LABELS: Record<string, string> = {
  hero: 'Portada principal (Hero)',
  mission: 'Nuestra Misión',
  community_impact: 'Impacto Comunitario',
  contact_intro: 'Introducción de Contacto',
  projects_intro: 'Portada de Proyectos',
  projects_impact: 'Impacto en Comunidades (Proyectos)',
};

export function SectionsTab({
  sections,
  assets,
  storageConfigured,
  onSectionsChange,
  onAssetCreated,
  feedback,
}: SectionsTabProps) {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState(sections[0]?.key || 'hero');
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [newBullet, setNewBullet] = useState('');

  const activeSection = sections.find(s => s.key === selectedKey) ?? sections[0];

  if (!activeSection) return null;

  function patchActive(partial: Partial<PageSectionData>) {
    onSectionsChange(
      sections.map(s => (s.key === activeSection.key ? { ...s, ...partial } : s))
    );
  }

  async function handleSaveSection(event: FormEvent) {
    event.preventDefault();
    feedback.clearFeedback();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/sections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activeSection),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        feedback.setError(json.error || 'No se pudo actualizar la sección.');
        return;
      }
      feedback.setNotice(
        `Sección "${SECTION_LABELS[activeSection.key] || activeSection.key}" actualizada y caché pública revalidada.`
      );
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const showCtas =
    activeSection.key === 'hero' ||
    Boolean(activeSection.ctaPrimaryLabel) ||
    Boolean(activeSection.ctaSecondaryLabel);

  const showItems =
    activeSection.key === 'projects_impact' || activeSection.items.length > 0;

  return (
    <section className="min-w-0 space-y-6 rounded-2xl border border-taupe bg-surface p-4 shadow-xs sm:p-6">
      <div className="flex flex-col gap-3 border-b border-taupe pb-4">
        <div className="min-w-0">
          <h2 className="font-display text-xl font-bold text-espresso">
            Editor de Secciones
          </h2>
          <p className="text-xs text-earth">
            Edita textos, visibilidad, imagen principal, galería mixta y documentos PDF.
          </p>
        </div>

        {/* Móvil: desplegable limpio; Tablet/Escritorio: píldoras de sección */}
        <div className="w-full min-w-0 md:hidden">
          <label htmlFor="section-selector" className="sr-only">
            Seleccionar sección
          </label>
          <select
            id="section-selector"
            aria-label="Seleccionar sección"
            value={selectedKey}
            onChange={e => {
              feedback.clearFeedback();
              setSelectedKey(e.target.value);
            }}
            className="w-full max-w-full min-w-0 truncate rounded-lg border border-taupe bg-cream px-3 py-2 text-sm font-medium text-ink focus:border-umber"
          >
            {sections.map(s => (
              <option key={s.key} value={s.key}>
                {SECTION_LABELS[s.key] || s.key} — {s.title}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden flex-wrap gap-1.5 md:flex">
          {sections.map(s => {
            const selected = s.key === activeSection.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => {
                  feedback.clearFeedback();
                  setSelectedKey(s.key);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  selected
                    ? 'bg-umber text-cream'
                    : 'border border-taupe bg-cream text-espresso hover:bg-sand'
                }`}
              >
                {SECTION_LABELS[s.key] || s.key}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSaveSection} className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-taupe bg-cream px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium text-espresso">
            {activeSection.isVisible ? (
              <Eye className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            ) : (
              <EyeOff className="h-4 w-4 text-earth" aria-hidden="true" />
            )}
            <span>Visibilidad en el sitio público</span>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-espresso">
            <input
              type="checkbox"
              checked={activeSection.isVisible}
              onChange={e => patchActive({ isVisible: e.target.checked })}
              className="h-4 w-4 accent-umber"
            />
            {activeSection.isVisible ? 'Visible al público' : 'Oculta temporalmente'}
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-semibold text-espresso">
              Título
            </label>
            <input
              type="text"
              required
              value={activeSection.title}
              onChange={e => patchActive({ title: e.target.value })}
              className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink focus:border-umber"
            />
          </div>

          <div className="min-w-0">
            <label className="mb-1.5 block text-sm font-semibold text-espresso">
              Subtítulo
            </label>
            <input
              type="text"
              value={activeSection.subtitle}
              onChange={e => patchActive({ subtitle: e.target.value })}
              className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink focus:border-umber"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-espresso">
            Texto principal
          </label>
          <textarea
            rows={5}
            value={activeSection.body}
            onChange={e => patchActive({ body: e.target.value })}
            className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink focus:border-umber"
          />
        </div>

        {showCtas && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-taupe bg-cream p-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-espresso">
                Botón principal (texto)
              </label>
              <input
                type="text"
                value={activeSection.ctaPrimaryLabel || ''}
                onChange={e => patchActive({ ctaPrimaryLabel: e.target.value || null })}
                className="w-full rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-espresso">
                Botón principal (enlace)
              </label>
              <input
                type="text"
                value={activeSection.ctaPrimaryHref || ''}
                onChange={e => patchActive({ ctaPrimaryHref: e.target.value || null })}
                className="w-full rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-espresso">
                Botón secundario (texto)
              </label>
              <input
                type="text"
                value={activeSection.ctaSecondaryLabel || ''}
                onChange={e => patchActive({ ctaSecondaryLabel: e.target.value || null })}
                className="w-full rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-espresso">
                Botón secundario (enlace)
              </label>
              <input
                type="text"
                value={activeSection.ctaSecondaryHref || ''}
                onChange={e => patchActive({ ctaSecondaryHref: e.target.value || null })}
                className="w-full rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink"
              />
            </div>
          </div>
        )}

        {showItems && (
          <div className="space-y-3 rounded-xl border border-taupe bg-cream p-4">
            <p className="text-xs font-bold tracking-wider text-umber uppercase">
              Indicadores / puntos clave
            </p>
            <div className="space-y-2">
              {activeSection.items.map((item, idx) => (
                <div key={`${item}-${idx}`} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={e => {
                      const next = activeSection.items.map((val, i) =>
                        i === idx ? e.target.value : val
                      );
                      patchActive({ items: next });
                    }}
                    className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-1.5 text-sm text-ink"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      patchActive({
                        items: activeSection.items.filter((_, i) => i !== idx),
                      })
                    }
                    aria-label="Eliminar indicador"
                    className="rounded-lg border border-red-200 p-2 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newBullet}
                onChange={e => setNewBullet(e.target.value)}
                placeholder="Nuevo punto destacado..."
                className="min-w-0 flex-1 rounded-lg border border-taupe bg-surface px-3 py-1.5 text-sm text-ink"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newBullet.trim()) return;
                  patchActive({ items: [...activeSection.items, newBullet.trim()] });
                  setNewBullet('');
                }}
                className="inline-flex items-center gap-1 rounded-lg border border-umber/40 bg-surface px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Añadir punto
              </button>
            </div>
          </div>
        )}

        {/* Imagen de portada */}
        <div className="space-y-3 rounded-xl border border-taupe bg-cream p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-semibold text-espresso">
              Imagen principal de la sección
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-umber/40 bg-surface px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
              >
                <ImageIcon className="h-3.5 w-3.5 text-umber" aria-hidden="true" />
                Elegir o subir imagen
              </button>
              {activeSection.imageUrl && (
                <button
                  type="button"
                  onClick={() => patchActive({ imageUrl: null, imageAlt: null })}
                  className="rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                >
                  Quitar imagen
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {activeSection.imageUrl && (
              <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl border border-taupe bg-sand sm:w-44">
                <Image
                  src={activeSection.imageUrl}
                  alt={activeSection.imageAlt || activeSection.title}
                  fill
                  loading="eager"
                  unoptimized={!isNextOptimizableImage(activeSection.imageUrl)}
                  sizes="176px"
                  className="object-cover"
                />
              </div>
            )}

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-espresso">
                  URL de Imagen
                </label>
                <input
                  type="text"
                  value={activeSection.imageUrl || ''}
                  onChange={e => patchActive({ imageUrl: e.target.value || null })}
                  className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink"
                />
              </div>
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-semibold text-espresso">
                  Texto alternativo (alt)
                </label>
                <input
                  type="text"
                  value={activeSection.imageAlt || ''}
                  onChange={e => patchActive({ imageAlt: e.target.value || null })}
                  className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Galería Mixta + Documentos PDF */}
        <MediaGalleryEditor
          mediaItems={activeSection.mediaItems}
          documents={activeSection.documents}
          assets={assets}
          storageConfigured={storageConfigured}
          onMediaChange={mediaItems => patchActive({ mediaItems })}
          onDocumentsChange={documents => patchActive({ documents })}
          onAssetCreated={onAssetCreated}
        />

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-umber px-6 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-espresso disabled:opacity-60"
        >
          {saving ? 'Guardando cambios...' : 'Guardar cambios de sección'}
        </button>
      </form>

      <MediaPickerModal
        open={pickerOpen}
        mode="image"
        assets={assets}
        storageConfigured={storageConfigured}
        onAssetCreated={onAssetCreated}
        onSelect={asset => {
          patchActive({
            imageUrl: asset.url,
            imageAlt: activeSection.imageAlt || asset.alt || asset.title || '',
          });
        }}
        onClose={() => setPickerOpen(false)}
      />
    </section>
  );
}
