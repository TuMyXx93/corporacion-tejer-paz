'use client';

import { useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import type { MediaAssetData, SiteSettingsData } from '@/data/default-content';
import { isNextOptimizableImage } from '@/lib/media/embeds';
import { MediaPickerModal } from '../MediaPickerModal';
import type { AdminFeedbackHandlers } from '../types';

interface SettingsTabProps {
  settings: SiteSettingsData;
  isSuperadmin: boolean;
  assets: MediaAssetData[];
  storageConfigured: boolean;
  onSettingsChange: (settings: SiteSettingsData) => void;
  onAssetCreated: (asset: MediaAssetData) => void;
  feedback: AdminFeedbackHandlers;
}

export function SettingsTab({
  settings,
  isSuperadmin,
  assets,
  storageConfigured,
  onSettingsChange,
  onAssetCreated,
  feedback,
}: SettingsTabProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [logoPickerOpen, setLogoPickerOpen] = useState(false);

  async function handleSaveSettings(event: FormEvent) {
    event.preventDefault();
    if (!isSuperadmin) return;
    feedback.clearFeedback();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        feedback.setError(json.error || 'No se pudo actualizar la configuración global.');
        return;
      }
      feedback.setNotice('Configuración global guardada y sitio revalidado.');
      router.refresh();
    } catch {
      feedback.setError('Error de conexión al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-taupe bg-surface p-4 shadow-xs sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold text-espresso">
            Configuración Global del Sitio
          </h2>
          <p className="text-xs text-earth">
            Datos institucionales, canales oficiales, SEO y logotipo corporativo.
          </p>
        </div>

        {!isSuperadmin && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-butter px-3 py-1 text-xs font-semibold text-ink">
            <ShieldAlert className="h-3.5 w-3.5 text-umber" aria-hidden="true" />
            Solo lectura (requiere Superadministrador)
          </span>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="settings-org-name"
              className="mb-1 block text-xs font-semibold text-espresso"
            >
              Nombre de la organización
            </label>
            <input
              id="settings-org-name"
              name="organizationName"
              disabled={!isSuperadmin}
              required
              value={settings.organizationName}
              onChange={e =>
                onSettingsChange({ ...settings, organizationName: e.target.value })
              }
              className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink disabled:opacity-65"
            />
          </div>

          <div>
            <label
              htmlFor="settings-contact-email"
              className="mb-1 block text-xs font-semibold text-espresso"
            >
              Correo oficial
            </label>
            <input
              id="settings-contact-email"
              name="contactEmail"
              disabled={!isSuperadmin}
              required
              type="email"
              value={settings.contactEmail}
              onChange={e =>
                onSettingsChange({ ...settings, contactEmail: e.target.value })
              }
              className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink disabled:opacity-65"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-taupe bg-cream p-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="settings-seo-title"
              className="mb-1 block text-xs font-semibold text-espresso"
            >
              Título SEO principal
            </label>
            <input
              id="settings-seo-title"
              name="seoTitle"
              disabled={!isSuperadmin}
              required
              value={settings.seoTitle}
              onChange={e => onSettingsChange({ ...settings, seoTitle: e.target.value })}
              className="w-full rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink disabled:opacity-65"
            />
          </div>

          <div>
            <label
              htmlFor="settings-footer-copyright"
              className="mb-1 block text-xs font-semibold text-espresso"
            >
              Texto de copyright (Footer)
            </label>
            <input
              id="settings-footer-copyright"
              name="footerCopyright"
              disabled={!isSuperadmin}
              required
              value={settings.footerCopyright}
              onChange={e =>
                onSettingsChange({ ...settings, footerCopyright: e.target.value })
              }
              className="w-full rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink disabled:opacity-65"
            />
          </div>

          <div className="sm:col-span-2">
            <label
              htmlFor="settings-seo-description"
              className="mb-1 block text-xs font-semibold text-espresso"
            >
              Descripción SEO (buscadores)
            </label>
            <textarea
              id="settings-seo-description"
              name="seoDescription"
              disabled={!isSuperadmin}
              required
              rows={2}
              value={settings.seoDescription}
              onChange={e =>
                onSettingsChange({ ...settings, seoDescription: e.target.value })
              }
              className="w-full rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink disabled:opacity-65"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 rounded-xl border border-taupe bg-cream p-4">
            <p className="text-xs font-semibold text-espresso">Teléfonos de contacto</p>
            {settings.phones.map((phone, idx) => (
              <div key={`setting-phone-${idx}`} className="flex items-center gap-2">
                <input
                  id={`settings-phone-${idx}`}
                  name={`phone-${idx}`}
                  aria-label={`Teléfono de contacto ${idx + 1}`}
                  disabled={!isSuperadmin}
                  value={phone}
                  onChange={e => {
                    const next = settings.phones.map((p, i) =>
                      i === idx ? e.target.value : p
                    );
                    onSettingsChange({ ...settings, phones: next });
                  }}
                  className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-1.5 text-sm text-ink disabled:opacity-65"
                />
                {isSuperadmin && settings.phones.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      onSettingsChange({
                        ...settings,
                        phones: settings.phones.filter((_, i) => i !== idx),
                      })
                    }
                    aria-label="Eliminar teléfono"
                    className="rounded-lg border border-red-200 p-1.5 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
            {isSuperadmin && settings.phones.length < 5 && (
              <div className="flex gap-2 pt-1">
                <input
                  id="settings-new-phone"
                  name="newPhone"
                  aria-label="Nuevo teléfono de contacto"
                  type="text"
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value)}
                  placeholder="Agregar teléfono..."
                  className="min-w-0 flex-1 rounded-lg border border-taupe bg-surface px-3 py-1.5 text-sm text-ink"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newPhone.trim().length < 7) return;
                    onSettingsChange({
                      ...settings,
                      phones: [...settings.phones, newPhone.trim()],
                    });
                    setNewPhone('');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-umber/40 bg-surface px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Añadir
                </button>
              </div>
            )}
          </div>

          <div className="space-y-3 rounded-xl border border-taupe bg-cream p-4">
            <div>
              <label
                htmlFor="settings-instagram-handle"
                className="mb-1 block text-xs font-semibold text-espresso"
              >
                Usuario de Instagram
              </label>
              <input
                id="settings-instagram-handle"
                name="instagramHandle"
                disabled={!isSuperadmin}
                required
                value={settings.instagramHandle}
                onChange={e =>
                  onSettingsChange({ ...settings, instagramHandle: e.target.value })
                }
                className="w-full rounded-lg border border-taupe bg-surface px-3 py-1.5 text-sm text-ink disabled:opacity-65"
              />
            </div>

            <div>
              <label
                htmlFor="settings-instagram-url"
                className="mb-1 block text-xs font-semibold text-espresso"
              >
                URL de Instagram
              </label>
              <input
                id="settings-instagram-url"
                name="instagramUrl"
                disabled={!isSuperadmin}
                required
                type="url"
                value={settings.instagramUrl}
                onChange={e =>
                  onSettingsChange({ ...settings, instagramUrl: e.target.value })
                }
                className="w-full rounded-lg border border-taupe bg-surface px-3 py-1.5 text-sm text-ink disabled:opacity-65"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="settings-quote-text"
            className="mb-1 block text-xs font-semibold text-espresso"
          >
            Cita institucional
          </label>
          <textarea
            id="settings-quote-text"
            name="quoteText"
            disabled={!isSuperadmin}
            required
            rows={2}
            value={settings.quoteText}
            onChange={e => onSettingsChange({ ...settings, quoteText: e.target.value })}
            className="w-full rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink disabled:opacity-65"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-taupe bg-cream p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-espresso">
              Logotipo oficial (cabecera y pie de página)
            </span>
            {isSuperadmin && (
              <button
                type="button"
                onClick={() => setLogoPickerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-umber/40 bg-surface px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
              >
                <ImageIcon className="h-3.5 w-3.5 text-umber" aria-hidden="true" />
                Elegir o subir logo
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {settings.logoUrl && (
              <div className="relative h-16 w-36 shrink-0 overflow-hidden rounded-lg border border-taupe bg-surface p-2">
                <Image
                  src={settings.logoUrl}
                  alt={settings.logoAlt}
                  fill
                  unoptimized={!isNextOptimizableImage(settings.logoUrl)}
                  sizes="144px"
                  className="object-contain p-1"
                />
              </div>
            )}

            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                id="settings-logo-url"
                name="logoUrl"
                aria-label="URL del logotipo oficial"
                disabled={!isSuperadmin}
                required
                value={settings.logoUrl}
                onChange={e => onSettingsChange({ ...settings, logoUrl: e.target.value })}
                className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink disabled:opacity-65"
              />
              <input
                id="settings-logo-alt"
                name="logoAlt"
                aria-label="Texto alternativo del logotipo oficial"
                disabled={!isSuperadmin}
                required
                value={settings.logoAlt}
                onChange={e => onSettingsChange({ ...settings, logoAlt: e.target.value })}
                className="w-full min-w-0 rounded-lg border border-taupe bg-surface px-3 py-2 text-sm text-ink disabled:opacity-65"
              />
            </div>
          </div>
        </div>

        {isSuperadmin && (
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-umber px-6 py-2.5 text-sm font-semibold text-cream hover:bg-espresso disabled:opacity-60"
          >
            {saving ? 'Guardando configuración...' : 'Guardar configuración global'}
          </button>
        )}
      </form>

      <MediaPickerModal
        open={logoPickerOpen}
        mode="image"
        assets={assets}
        storageConfigured={storageConfigured}
        onAssetCreated={onAssetCreated}
        onSelect={asset =>
          onSettingsChange({
            ...settings,
            logoUrl: asset.url,
            logoAlt: asset.alt || settings.logoAlt,
          })
        }
        onClose={() => setLogoPickerOpen(false)}
      />
    </section>
  );
}
