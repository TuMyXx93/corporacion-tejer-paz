'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Compass,
  ExternalLink,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Inbox,
  LogOut,
  Menu,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import type {
  ActionAreaData,
  MediaAssetData,
  PageSectionData,
  ProjectItemData,
  SiteSettingsData,
} from '@/data/default-content';
import { signOut } from '@/lib/auth/client';
import type { AuthenticatedActor } from '@/lib/auth/guards';
import { isNextOptimizableImage } from '@/lib/media/embeds';
import { ActionAreasTab } from './tabs/ActionAreasTab';
import { MediaLibraryTab } from './tabs/MediaLibraryTab';
import { MessagesTab } from './tabs/MessagesTab';
import { ProjectsTab } from './tabs/ProjectsTab';
import { SectionsTab } from './tabs/SectionsTab';
import { SettingsTab } from './tabs/SettingsTab';
import { UsersTab } from './tabs/UsersTab';
import type {
  AdminFeedbackHandlers,
  AdminTabKey,
  AdminUserRow,
  AuditLogRow,
  ContactMessageRow,
} from './types';

interface AdminDashboardClientProps {
  actor: AuthenticatedActor;
  initialSettings: SiteSettingsData;
  initialSections: PageSectionData[];
  initialActionAreas: ActionAreaData[];
  initialProjects: ProjectItemData[];
  initialMediaAssets: MediaAssetData[];
  initialMessages: ContactMessageRow[];
  initialUsers: AdminUserRow[];
  initialAuditLogs: AuditLogRow[];
  storageProvider: string;
  storageConfigured: boolean;
}

export function AdminDashboardClient({
  actor,
  initialSettings,
  initialSections,
  initialActionAreas,
  initialProjects,
  initialMediaAssets,
  initialMessages,
  initialUsers,
  initialAuditLogs,
  storageProvider,
  storageConfigured,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const isSuperadmin = actor.role === 'superadmin';

  const [activeTab, setActiveTab] = useState<AdminTabKey>('sections');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const [sections, setSections] = useState<PageSectionData[]>(initialSections);
  const [actionAreas, setActionAreas] = useState<ActionAreaData[]>(initialActionAreas);
  const [projects, setProjects] = useState<ProjectItemData[]>(initialProjects);
  const [assets, setAssets] = useState<MediaAssetData[]>(initialMediaAssets);
  const [messages, setMessages] = useState<ContactMessageRow[]>(initialMessages);
  const [settings, setSettings] = useState<SiteSettingsData>(initialSettings);
  const [users, setUsers] = useState<AdminUserRow[]>(initialUsers);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>(initialAuditLogs);

  const unreadCount = messages.filter(m => m.status === 'new').length;
  const activeMessageCount = messages.filter(m => m.status !== 'archived').length;

  const feedback: AdminFeedbackHandlers = {
    setNotice: (msg: string) => {
      setError('');
      setNotice(msg);
    },
    setError: (msg: string) => {
      setNotice('');
      setError(msg);
    },
    clearFeedback: () => {
      setNotice('');
      setError('');
    },
  };

  function handleAssetCreated(asset: MediaAssetData) {
    setAssets(prev => [asset, ...prev.filter(a => a.id !== asset.id)]);
  }

  async function handleLogout() {
    await signOut();
    router.push('/admin/login');
    router.refresh();
  }

  const navItems: Array<{
    key: AdminTabKey;
    label: string;
    icon: typeof FileText;
    badge?: string | number;
    badgeUrgent?: boolean;
    hidden?: boolean;
  }> = [
    { key: 'sections', label: 'Secciones', icon: FileText },
    {
      key: 'areas',
      label: 'Áreas de Acción',
      icon: Compass,
      badge: actionAreas.length,
    },
    {
      key: 'projects',
      label: 'Proyectos',
      icon: FolderKanban,
      badge: projects.length,
    },
    {
      key: 'media',
      label: 'Multimedia',
      icon: ImageIcon,
      badge: assets.length,
    },
    {
      key: 'messages',
      label: 'Mensajes',
      icon: Inbox,
      badge: unreadCount > 0 ? `${unreadCount} nuevo` : activeMessageCount,
      badgeUrgent: unreadCount > 0,
    },
    { key: 'settings', label: 'Configuración', icon: Settings },
    {
      key: 'users',
      label: 'Usuarios y Roles',
      icon: Users,
      badge: users.length,
      hidden: !isSuperadmin,
    },
  ];

  const visibleNavItems = navItems.filter(item => !item.hidden);

  function selectTab(key: AdminTabKey) {
    feedback.clearFeedback();
    setActiveTab(key);
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-sand/50 text-ink">
      {/* Cabecera compacta institucional */}
      <header className="sticky top-0 z-30 border-b border-taupe bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(v => !v)}
              aria-expanded={mobileMenuOpen}
              aria-label={
                mobileMenuOpen
                  ? 'Cerrar menú administrativo'
                  : 'Abrir menú administrativo'
              }
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-taupe bg-cream text-espresso hover:bg-sand lg:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            <Image
              src={settings.logoUrl}
              alt={settings.logoAlt}
              width={110}
              height={46}
              unoptimized={!isNextOptimizableImage(settings.logoUrl)}
              className="hidden h-9 w-auto shrink-0 object-contain sm:block"
            />

            <div className="min-w-0">
              <p className="truncate text-[11px] font-bold tracking-wider text-umber uppercase">
                Panel Administrativo · Tejer Paz
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate font-display text-base font-bold text-espresso sm:text-lg">
                  Hola, {actor.name}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-ink uppercase">
                  <Shield className="h-3 w-3" aria-hidden="true" />
                  {isSuperadmin ? 'Superadmin' : 'Admin'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-taupe bg-cream px-3 py-2 text-xs font-semibold text-espresso hover:bg-sand"
            >
              <ExternalLink className="h-3.5 w-3.5 text-umber" aria-hidden="true" />
              <span className="hidden sm:inline">Ver sitio público</span>
              <span className="sm:hidden">Sitio</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg bg-espresso px-3 py-2 text-xs font-semibold text-cream hover:bg-umber"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Menú desplegable en móvil */}
        {mobileMenuOpen && (
          <nav
            aria-label="Menú administrativo móvil"
            className="border-t border-taupe bg-surface px-4 py-3 lg:hidden"
          >
            <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {visibleNavItems.map(item => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <li key={item.key}>
                    <button
                      type="button"
                      onClick={() => selectTab(item.key)}
                      className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                        active
                          ? 'bg-umber text-cream'
                          : 'bg-cream text-espresso hover:bg-sand'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{item.label}</span>
                      </span>
                      {item.badge !== undefined && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            active
                              ? 'bg-surface/20 text-cream'
                              : item.badgeUrgent
                                ? 'bg-red-100 text-red-900'
                                : 'bg-sand text-espresso'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </header>

      {/* Contenedor principal con barra lateral desktop y píldoras móviles */}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:items-start lg:py-8">
        {/* Sidebar Desktop */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav
            aria-label="Secciones del panel administrativo"
            className="sticky top-24 space-y-1.5 rounded-2xl border border-taupe bg-surface p-3 shadow-xs"
          >
            <p className="px-3 pt-1 pb-2 text-[11px] font-bold tracking-wider text-earth uppercase">
              Módulos de Gestión
            </p>
            {visibleNavItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => selectTab(item.key)}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold transition-colors ${
                    active
                      ? 'bg-umber text-cream shadow-2xs'
                      : 'text-espresso hover:bg-sand'
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        active
                          ? 'bg-cream/20 text-cream'
                          : item.badgeUrgent
                            ? 'bg-red-100 text-red-900'
                            : 'bg-cream text-earth'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Píldoras horizontales en móvil/tablet */}
        <nav
          aria-label="Navegación rápida administrativa"
          className="flex gap-2 overflow-x-auto pb-1 lg:hidden"
        >
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => selectTab(item.key)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-umber text-cream'
                    : 'border border-taupe bg-surface text-espresso hover:bg-sand'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active
                        ? 'bg-cream/20 text-cream'
                        : item.badgeUrgent
                          ? 'bg-red-100 text-red-900'
                          : 'bg-sand text-espresso'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Contenido principal */}
        <main id="contenido-principal" className="min-w-0 flex-1 space-y-5">
          {notice && (
            <div
              role="status"
              className="rounded-xl border border-emerald-700/30 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-950 shadow-2xs"
            >
              {notice}
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-700/30 bg-red-50 px-4 py-3 text-sm font-medium text-red-950 shadow-2xs"
            >
              {error}
            </div>
          )}

          {activeTab === 'sections' && (
            <SectionsTab
              sections={sections}
              assets={assets}
              storageConfigured={storageConfigured}
              onSectionsChange={setSections}
              onAssetCreated={handleAssetCreated}
              feedback={feedback}
            />
          )}

          {activeTab === 'areas' && (
            <ActionAreasTab
              actionAreas={actionAreas}
              assets={assets}
              storageConfigured={storageConfigured}
              onActionAreasChange={setActionAreas}
              onAssetCreated={handleAssetCreated}
              feedback={feedback}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsTab
              projects={projects}
              assets={assets}
              storageConfigured={storageConfigured}
              onProjectsChange={setProjects}
              onAssetCreated={handleAssetCreated}
              feedback={feedback}
            />
          )}

          {activeTab === 'media' && (
            <MediaLibraryTab
              assets={assets}
              storageProvider={storageProvider}
              storageConfigured={storageConfigured}
              onAssetsChange={setAssets}
              feedback={feedback}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesTab
              messages={messages}
              onMessagesChange={setMessages}
              feedback={feedback}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={settings}
              isSuperadmin={isSuperadmin}
              assets={assets}
              storageConfigured={storageConfigured}
              onSettingsChange={setSettings}
              onAssetCreated={handleAssetCreated}
              feedback={feedback}
            />
          )}

          {activeTab === 'users' && isSuperadmin && (
            <UsersTab
              actorId={actor.id}
              users={users}
              auditLogs={auditLogs}
              onUsersChange={setUsers}
              onAuditLogsChange={setAuditLogs}
              feedback={feedback}
            />
          )}
        </main>
      </div>
    </div>
  );
}
