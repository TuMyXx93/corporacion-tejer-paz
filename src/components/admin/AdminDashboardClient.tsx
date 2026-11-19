'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { upload } from '@vercel/blob/client';
import {
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Inbox,
  LogOut,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import type {
  PageSectionData,
  ProjectItemData,
  SiteSettingsData,
} from '@/data/default-content';
import { signOut } from '@/lib/auth/client';
import type { AuthenticatedActor } from '@/lib/auth/guards';
import { sanitizeUploadFilename } from '@/lib/storage';

interface ContactMessageRow {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  emailSent: boolean;
  createdAt: string;
}

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean | null;
}

interface AdminDashboardClientProps {
  actor: AuthenticatedActor;
  initialSettings: SiteSettingsData;
  initialSections: PageSectionData[];
  initialProjects: ProjectItemData[];
  initialMessages: ContactMessageRow[];
  initialUsers: AdminUserRow[];
  storageProvider: string;
  storageConfigured: boolean;
}

type TabKey = 'sections' | 'projects' | 'media' | 'messages' | 'settings' | 'users';

export function AdminDashboardClient({
  actor,
  initialSettings,
  initialSections,
  initialProjects,
  initialMessages,
  initialUsers,
  storageProvider,
  storageConfigured,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const isSuperadmin = actor.role === 'superadmin';

  const [activeTab, setActiveTab] = useState<TabKey>('sections');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Sections state
  const [sections, setSections] = useState(initialSections);
  const [selectedSectionKey, setSelectedSectionKey] = useState(
    initialSections[0]?.key || 'hero'
  );
  const activeSection = sections.find(s => s.key === selectedSectionKey) ?? sections[0];

  // Projects state
  const [projects, setProjects] = useState(initialProjects);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectSlug, setNewProjectSlug] = useState('');
  const [newProjectNumber, setNewProjectNumber] = useState('04');
  const [newProjectSummary, setNewProjectSummary] = useState('');
  const [newProjectImageUrl, setNewProjectImageUrl] = useState(
    '/images/proyecto-01-escuchar-voz-jovenes.jpg'
  );
  const [newProjectImageAlt, setNewProjectImageAlt] = useState('');

  // Media upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState('');

  // Messages state
  const [messages, setMessages] = useState(initialMessages);

  // Settings state (superadmin write)
  const [settings, setSettings] = useState(initialSettings);

  // Users state (superadmin only)
  const [users, setUsers] = useState(initialUsers);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'superadmin'>('admin');

  function clearFeedback() {
    setNotice('');
    setError('');
  }

  async function handleLogout() {
    await signOut();
    router.push('/admin/login');
    router.refresh();
  }

  async function handleSaveSection(event: FormEvent) {
    event.preventDefault();
    if (!activeSection) return;
    clearFeedback();
    const res = await fetch('/api/admin/sections', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activeSection),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(json.error || 'No se pudo actualizar la sección.');
      return;
    }
    setNotice(`Sección "${activeSection.key}" actualizada y caché pública revalidada.`);
    router.refresh();
  }

  async function handleCreateProject(event: FormEvent) {
    event.preventDefault();
    clearFeedback();
    const res = await fetch('/api/admin/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: newProjectSlug,
        numberLabel: newProjectNumber,
        title: newProjectTitle,
        summary: newProjectSummary,
        description: newProjectSummary,
        imageUrl: newProjectImageUrl,
        imageAlt: newProjectImageAlt,
        sortOrder: projects.length + 1,
        isPublished: true,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      project?: ProjectItemData;
    };
    if (!res.ok || !json.project) {
      setError(json.error || 'No se pudo crear el proyecto.');
      return;
    }
    setProjects(prev => [...prev, json.project!]);
    setNewProjectTitle('');
    setNewProjectSlug('');
    setNewProjectSummary('');
    setNewProjectImageAlt('');
    setNotice('Proyecto creado y publicado correctamente.');
    router.refresh();
  }

  async function handleDirectImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    clearFeedback();
    setUploading(true);
    try {
      const safeName = sanitizeUploadFilename(file.name);
      const blob = await upload(`media/${safeName}`, file, {
        access: 'public',
        handleUploadUrl: '/api/admin/media/upload',
      });
      setUploadedUrl(blob.url);
      setNotice(
        'Imagen subida directamente a Vercel Blob sin pasar por el límite de 4.5 MB.'
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Error al subir la imagen. Verifica BLOB_READ_WRITE_TOKEN.'
      );
    } finally {
      setUploading(false);
    }
  }

  async function handleUpdateMessageStatus(id: number, status: string) {
    clearFeedback();
    const res = await fetch('/api/admin/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      setError('No se pudo actualizar el estado del mensaje.');
      return;
    }
    setMessages(prev => prev.map(m => (m.id === id ? { ...m, status } : m)));
    setNotice('Estado del mensaje actualizado.');
  }

  async function handleSaveSettings(event: FormEvent) {
    event.preventDefault();
    clearFeedback();
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    const json = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setError(json.error || 'No se pudo actualizar la configuración global.');
      return;
    }
    setNotice('Configuración global guardada y sitio revalidado.');
    router.refresh();
  }

  async function handleCreateUser(event: FormEvent) {
    event.preventDefault();
    clearFeedback();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as {
      error?: string;
      user?: AdminUserRow;
    };
    if (!res.ok || !json.user) {
      setError(json.error || 'No se pudo crear el usuario.');
      return;
    }
    setUsers(prev => [json.user!, ...prev]);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNotice(`Usuario ${json.user.email} creado con rol ${json.user.role}.`);
  }

  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: typeof FileText;
    hidden?: boolean;
  }> = [
    { key: 'sections', label: 'Secciones', icon: FileText },
    { key: 'projects', label: 'Proyectos', icon: FolderKanban },
    { key: 'media', label: 'Imágenes', icon: ImageIcon },
    { key: 'messages', label: `Mensajes (${messages.length})`, icon: Inbox },
    { key: 'settings', label: 'Configuración', icon: Settings },
    { key: 'users', label: 'Usuarios y Roles', icon: Users, hidden: !isSuperadmin },
  ];

  return (
    <div className="min-h-screen bg-sand/40 text-espresso">
      <header className="border-b border-taupe bg-cream">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold tracking-wider text-umber uppercase">
              Panel Administrativo · Corporación Tejer Paz
            </p>
            <div className="mt-1 flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-espresso">
                Hola, {actor.name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-xs font-bold text-ink uppercase">
                <Shield className="h-3 w-3" aria-hidden="true" />
                {isSuperadmin ? 'Superadministrador' : 'Administrador'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg border border-umber/40 px-3.5 py-2 text-xs font-semibold text-espresso hover:bg-sand"
            >
              Ver sitio público
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-espresso px-3.5 py-2 text-xs font-semibold text-cream hover:bg-umber"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main id="contenido-principal" className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav
          aria-label="Secciones del panel administrativo"
          className="mb-6 flex flex-wrap gap-2"
        >
          {tabs
            .filter(t => !t.hidden)
            .map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    clearFeedback();
                    setActiveTab(tab.key);
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-umber text-cream'
                      : 'border border-taupe bg-cream text-espresso hover:bg-sand'
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {tab.label}
                </button>
              );
            })}
        </nav>

        {notice && (
          <div
            role="status"
            className="mb-6 rounded-lg border border-emerald-700/30 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
          >
            {notice}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-700/30 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
          >
            {error}
          </div>
        )}

        {/* TAB: SECCIONES */}
        {activeTab === 'sections' && activeSection && (
          <section className="rounded-2xl border border-taupe bg-cream p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Editor de Secciones</h2>
              <select
                aria-label="Seleccionar sección"
                value={selectedSectionKey}
                onChange={e => setSelectedSectionKey(e.target.value)}
                className="rounded-lg border border-espresso/40 bg-white px-3 py-2 text-sm"
              >
                {sections.map(s => (
                  <option key={s.key} value={s.key}>
                    {s.key} — {s.title}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSaveSection} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Título</label>
                <input
                  type="text"
                  value={activeSection.title}
                  onChange={e =>
                    setSections(prev =>
                      prev.map(s =>
                        s.key === activeSection.key ? { ...s, title: e.target.value } : s
                      )
                    )
                  }
                  className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Subtítulo</label>
                <input
                  type="text"
                  value={activeSection.subtitle}
                  onChange={e =>
                    setSections(prev =>
                      prev.map(s =>
                        s.key === activeSection.key
                          ? { ...s, subtitle: e.target.value }
                          : s
                      )
                    )
                  }
                  className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Texto principal</label>
                <textarea
                  rows={5}
                  value={activeSection.body}
                  onChange={e =>
                    setSections(prev =>
                      prev.map(s =>
                        s.key === activeSection.key ? { ...s, body: e.target.value } : s
                      )
                    )
                  }
                  className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">URL de Imagen</label>
                  <input
                    type="text"
                    value={activeSection.imageUrl || ''}
                    onChange={e =>
                      setSections(prev =>
                        prev.map(s =>
                          s.key === activeSection.key
                            ? { ...s, imageUrl: e.target.value || null }
                            : s
                        )
                      )
                    }
                    className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Texto alternativo (alt)
                  </label>
                  <input
                    type="text"
                    value={activeSection.imageAlt || ''}
                    onChange={e =>
                      setSections(prev =>
                        prev.map(s =>
                          s.key === activeSection.key
                            ? { ...s, imageAlt: e.target.value || null }
                            : s
                        )
                      )
                    }
                    className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-umber px-5 py-2.5 text-sm font-semibold text-cream hover:bg-espresso"
              >
                Guardar cambios de sección
              </button>
            </form>
          </section>
        )}

        {/* TAB: PROYECTOS */}
        {activeTab === 'projects' && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-taupe bg-cream p-6">
              <h2 className="font-display text-xl font-bold">Iniciativas publicadas</h2>
              <div className="mt-4 divide-y divide-taupe/60">
                {projects.map(p => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <div>
                      <span className="mr-2 font-display font-bold text-umber">
                        {p.numberLabel}
                      </span>
                      <span className="font-semibold">{p.title}</span>
                      <p className="text-xs text-espresso/75">{p.summary}</p>
                    </div>
                    <span className="rounded-full bg-sand px-2.5 py-1 text-xs font-medium">
                      /{p.slug}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleCreateProject}
              className="space-y-4 rounded-2xl border border-taupe bg-cream p-6"
            >
              <h3 className="font-display text-lg font-bold">Agregar nuevo proyecto</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <input
                  required
                  placeholder="Título del proyecto"
                  value={newProjectTitle}
                  onChange={e => setNewProjectTitle(e.target.value)}
                  className="rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                />
                <input
                  required
                  placeholder="slug-del-proyecto"
                  value={newProjectSlug}
                  onChange={e => setNewProjectSlug(e.target.value)}
                  className="rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                />
                <input
                  required
                  placeholder="04"
                  value={newProjectNumber}
                  onChange={e => setNewProjectNumber(e.target.value)}
                  className="rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                />
              </div>
              <textarea
                rows={3}
                placeholder="Resumen o descripción de la iniciativa"
                value={newProjectSummary}
                onChange={e => setNewProjectSummary(e.target.value)}
                className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="URL de imagen (/images/... o https://...)"
                  value={newProjectImageUrl}
                  onChange={e => setNewProjectImageUrl(e.target.value)}
                  className="rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Descripción accesible (alt) de la fotografía"
                  value={newProjectImageAlt}
                  onChange={e => setNewProjectImageAlt(e.target.value)}
                  className="rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-umber px-5 py-2.5 text-sm font-semibold text-cream hover:bg-espresso"
              >
                Publicar proyecto
              </button>
            </form>
          </section>
        )}

        {/* TAB: MEDIOS */}
        {activeTab === 'media' && (
          <section className="space-y-4 rounded-2xl border border-taupe bg-cream p-6">
            <h2 className="font-display text-xl font-bold">
              Subida Directa de Imágenes ({storageProvider})
            </h2>
            <p className="text-sm text-espresso/80">
              Las imágenes se envían directamente del navegador al Object Storage (hasta
              10 MB), evitando el límite serverless de 4.5 MB de Vercel.
            </p>
            {!storageConfigured && (
              <p className="rounded-lg bg-butter px-4 py-3 text-sm text-ink">
                Configura <code>BLOB_READ_WRITE_TOKEN</code> en Vercel Storage o{' '}
                <code>.env.local</code> para habilitar subidas en vivo.
              </p>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              disabled={uploading || !storageConfigured}
              onChange={handleDirectImageUpload}
              className="block w-full text-sm file:mr-4 file:rounded-lg file:border-0 file:bg-umber file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cream hover:file:bg-espresso"
            />
            {uploading && <p className="text-sm text-umber">Subiendo archivo...</p>}
            {uploadedUrl && (
              <div className="rounded-lg border border-taupe bg-white p-3 text-xs break-all">
                <strong>URL lista para usar en secciones/proyectos:</strong> {uploadedUrl}
              </div>
            )}
          </section>
        )}

        {/* TAB: MENSAJES */}
        {activeTab === 'messages' && (
          <section className="rounded-2xl border border-taupe bg-cream p-6">
            <h2 className="font-display text-xl font-bold">Bandeja de Contacto</h2>
            {messages.length === 0 ? (
              <p className="mt-4 text-sm text-espresso/75">
                Aún no hay mensajes registrados en la base de datos.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {messages.map(m => (
                  <article
                    key={m.id}
                    className="rounded-xl border border-taupe/70 bg-white/80 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {m.firstName} {m.lastName} ·{' '}
                          <span className="font-normal text-umber">{m.email}</span>
                        </p>
                        <p className="text-sm font-medium text-espresso/90">
                          {m.subject}
                        </p>
                      </div>
                      <select
                        aria-label={`Estado del mensaje ${m.id}`}
                        value={m.status}
                        onChange={e => handleUpdateMessageStatus(m.id, e.target.value)}
                        className="rounded-lg border border-espresso/30 bg-cream px-2.5 py-1 text-xs font-semibold"
                      >
                        <option value="new">Nuevo</option>
                        <option value="read">Leído</option>
                        <option value="replied">Respondido</option>
                        <option value="archived">Archivado</option>
                      </select>
                    </div>
                    <p className="mt-2 text-sm text-espresso/85">{m.message}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB: CONFIGURACIÓN */}
        {activeTab === 'settings' && (
          <section className="rounded-2xl border border-taupe bg-cream p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">
                Configuración Global del Sitio
              </h2>
              {!isSuperadmin && (
                <span className="rounded-full bg-sand px-3 py-1 text-xs font-semibold text-espresso">
                  Solo lectura (requiere Superadministrador)
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Nombre de la organización
                  </label>
                  <input
                    disabled={!isSuperadmin}
                    value={settings.organizationName}
                    onChange={e =>
                      setSettings(s => ({ ...s, organizationName: e.target.value }))
                    }
                    className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm disabled:opacity-65"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Correo oficial</label>
                  <input
                    disabled={!isSuperadmin}
                    type="email"
                    value={settings.contactEmail}
                    onChange={e =>
                      setSettings(s => ({ ...s, contactEmail: e.target.value }))
                    }
                    className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm disabled:opacity-65"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">URL de Instagram</label>
                <input
                  disabled={!isSuperadmin}
                  value={settings.instagramUrl}
                  onChange={e =>
                    setSettings(s => ({ ...s, instagramUrl: e.target.value }))
                  }
                  className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm disabled:opacity-65"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Cita institucional
                </label>
                <textarea
                  disabled={!isSuperadmin}
                  rows={2}
                  value={settings.quoteText}
                  onChange={e => setSettings(s => ({ ...s, quoteText: e.target.value }))}
                  className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm disabled:opacity-65"
                />
              </div>
              {isSuperadmin && (
                <button
                  type="submit"
                  className="rounded-lg bg-umber px-5 py-2.5 text-sm font-semibold text-cream hover:bg-espresso"
                >
                  Guardar configuración global
                </button>
              )}
            </form>
          </section>
        )}

        {/* TAB: USUARIOS Y ROLES (EXCLUSIVO SUPERADMIN) */}
        {activeTab === 'users' && isSuperadmin && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-taupe bg-cream p-6">
              <h2 className="font-display text-xl font-bold">
                Gestión de Usuarios y Roles (RBAC)
              </h2>
              <div className="mt-4 divide-y divide-taupe/60">
                {users.map(u => (
                  <div
                    key={u.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{u.name}</p>
                      <p className="text-xs text-espresso/75">{u.email}</p>
                    </div>
                    <span className="rounded-full bg-sand px-3 py-1 text-xs font-bold uppercase">
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form
              onSubmit={handleCreateUser}
              className="space-y-4 rounded-2xl border border-taupe bg-cream p-6"
            >
              <h3 className="font-display text-lg font-bold">
                Crear cuenta de Administrador
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  required
                  placeholder="Nombre completo"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  className="rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                />
                <input
                  required
                  type="email"
                  placeholder="correo@organizacion.org"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                />
                <input
                  required
                  type="password"
                  minLength={10}
                  placeholder="Contraseña inicial (mín. 10 caracteres)"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  className="rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                />
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as 'admin' | 'superadmin')}
                  className="rounded-lg border border-espresso/40 bg-white px-3.5 py-2 text-sm"
                >
                  <option value="admin">Administrador (contenido e inbox)</option>
                  <option value="superadmin">Superadministrador (acceso total)</option>
                </select>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-umber px-5 py-2.5 text-sm font-semibold text-cream hover:bg-espresso"
              >
                Crear usuario
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
