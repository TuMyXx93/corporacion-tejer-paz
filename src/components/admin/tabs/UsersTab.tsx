'use client';

import { useState, type FormEvent } from 'react';
import {
  Ban,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  History,
  KeyRound,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { ConfirmDialog } from '../ConfirmDialog';
import type { AdminFeedbackHandlers, AdminUserRow, AuditLogRow } from '../types';

interface UsersTabProps {
  actorId: string;
  users: AdminUserRow[];
  auditLogs: AuditLogRow[];
  onUsersChange: (users: AdminUserRow[]) => void;
  onAuditLogsChange: (logs: AuditLogRow[]) => void;
  feedback: AdminFeedbackHandlers;
}

type UserFilter = 'all' | 'superadmin' | 'admin' | 'active' | 'banned';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'TP';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function UsersTab({
  actorId,
  users,
  auditLogs,
  onUsersChange,
  onAuditLogsChange,
  feedback,
}: UsersTabProps) {
  const [filter, setFilter] = useState<UserFilter>('all');
  const [query, setQuery] = useState('');

  // Create user state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'superadmin'>('admin');
  const [creating, setCreating] = useState(false);

  // Edit user state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'superadmin'>('admin');
  const [savingEdit, setSavingEdit] = useState(false);

  // Password reset state
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [showResetPass, setShowResetPass] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Ban / Delete confirmation
  const [banTarget, setBanTarget] = useState<AdminUserRow | null>(null);
  const [banReasonInput, setBanReasonInput] = useState('');
  const [banLoading, setBanLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminUserRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Audit refresh
  const [refreshingAudit, setRefreshingAudit] = useState(false);

  const filtered = users.filter(u => {
    if (filter === 'superadmin' && u.role !== 'superadmin') return false;
    if (filter === 'admin' && u.role !== 'admin') return false;
    if (filter === 'active' && u.banned) return false;
    if (filter === 'banned' && !u.banned) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  async function refreshAuditLogs() {
    setRefreshingAudit(true);
    try {
      const res = await fetch('/api/admin/audit');
      const json = (await res.json().catch(() => ({}))) as { logs?: AuditLogRow[] };
      if (res.ok && json.logs) {
        onAuditLogsChange(
          json.logs.map(l => ({
            ...l,
            createdAt:
              typeof l.createdAt === 'string'
                ? l.createdAt
                : new Date(l.createdAt).toISOString(),
          }))
        );
      }
    } finally {
      setRefreshingAudit(false);
    }
  }

  async function handleCreateUser(event: FormEvent) {
    event.preventDefault();
    feedback.clearFeedback();
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: AdminUserRow;
      };
      if (!res.ok || !json.user) {
        feedback.setError(json.error || 'No se pudo crear el usuario.');
        return;
      }
      onUsersChange([
        {
          ...json.user,
          createdAt: json.user.createdAt || new Date().toISOString(),
        },
        ...users,
      ]);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      feedback.setNotice(`Usuario ${json.user.email} creado con rol ${json.user.role}.`);
      void refreshAuditLogs();
    } finally {
      setCreating(false);
    }
  }

  async function handleSaveUserEdit(targetId: string) {
    feedback.clearFeedback();
    setSavingEdit(true);
    try {
      const payload =
        targetId === actorId
          ? { userId: targetId, name: editName }
          : { userId: targetId, name: editName, role: editRole };

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: AdminUserRow;
      };
      if (!res.ok || !json.user) {
        feedback.setError(json.error || 'No se pudo actualizar el usuario.');
        return;
      }
      onUsersChange(users.map(u => (u.id === targetId ? json.user! : u)));
      setEditingUserId(null);
      feedback.setNotice(`Cuenta de ${json.user.email} actualizada.`);
      void refreshAuditLogs();
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleSaveResetPassword(targetId: string) {
    feedback.clearFeedback();
    setSavingPassword(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetId,
          newPassword: resetPassword,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        feedback.setError(json.error || 'No se pudo restablecer la contraseña.');
        return;
      }
      setPasswordUserId(null);
      setResetPassword('');
      feedback.setNotice('Contraseña restablecida correctamente.');
      void refreshAuditLogs();
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleConfirmBanToggle() {
    if (!banTarget) return;
    const willBan = !banTarget.banned;
    setBanLoading(true);
    feedback.clearFeedback();
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: banTarget.id,
          banned: willBan,
          ...(willBan && banReasonInput.trim()
            ? { banReason: banReasonInput.trim() }
            : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        user?: AdminUserRow;
      };
      if (!res.ok || !json.user) {
        feedback.setError(json.error || 'No se pudo cambiar el estado de la cuenta.');
        return;
      }
      onUsersChange(users.map(u => (u.id === banTarget.id ? json.user! : u)));
      feedback.setNotice(
        willBan
          ? `Cuenta ${banTarget.email} suspendida y sesiones revocadas.`
          : `Cuenta ${banTarget.email} reactivada.`
      );
      setBanTarget(null);
      setBanReasonInput('');
      void refreshAuditLogs();
    } finally {
      setBanLoading(false);
    }
  }

  async function handleConfirmDeleteUser() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    feedback.clearFeedback();
    try {
      const res = await fetch(
        `/api/admin/users?id=${encodeURIComponent(deleteTarget.id)}`,
        { method: 'DELETE' }
      );
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        feedback.setError(json.error || 'No se pudo eliminar la cuenta.');
        return;
      }
      onUsersChange(users.filter(u => u.id !== deleteTarget.id));
      feedback.setNotice(`Usuario ${deleteTarget.email} eliminado permanentemente.`);
      setDeleteTarget(null);
      void refreshAuditLogs();
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Matriz comparativa de roles */}
      <section className="rounded-2xl border border-gold/45 bg-butter/60 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-umber" aria-hidden="true" />
          <h2 className="font-display text-base font-bold text-espresso">
            Control de Acceso por Roles (RBAC)
          </h2>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-xl border border-taupe bg-surface p-3.5">
            <span className="inline-block rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold text-ink uppercase">
              Superadministrador
            </span>
            <p className="mt-2 leading-relaxed text-espresso">
              Control total: gestiona usuarios y roles, cambia contraseñas, modifica
              configuración global SEO/contacto, revisa registros de auditoría y edita
              todo el contenido público.
            </p>
          </div>
          <div className="rounded-xl border border-taupe bg-surface p-3.5">
            <span className="inline-block rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-bold text-espresso uppercase">
              Administrador
            </span>
            <p className="mt-2 leading-relaxed text-espresso">
              Gestión operativa de secciones, áreas de acción, proyectos, galería
              multimedia, PDFs y bandeja semaforizada de mensajes. Configuración global en
              solo lectura y sin acceso a cuentas ni auditoría.
            </p>
          </div>
        </div>
      </section>

      {/* Lista y búsqueda de usuarios */}
      <section className="space-y-4 rounded-2xl border border-taupe bg-surface p-4 shadow-xs sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-display text-xl font-bold text-espresso">
              Cuentas Registradas ({users.length})
            </h3>
            <p className="text-xs text-earth">
              Edita roles, restablece contraseñas, suspende sesiones o elimina usuarios.
            </p>
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
              placeholder="Buscar por nombre o correo..."
              className="w-full rounded-lg border border-taupe bg-cream py-1.5 pr-3 pl-9 text-sm text-ink"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-taupe pb-3">
          {(
            [
              { key: 'all', label: `Todos (${users.length})` },
              {
                key: 'superadmin',
                label: `Superadmin (${users.filter(u => u.role === 'superadmin').length})`,
              },
              {
                key: 'admin',
                label: `Admin (${users.filter(u => u.role === 'admin').length})`,
              },
              {
                key: 'active',
                label: `Activos (${users.filter(u => !u.banned).length})`,
              },
              {
                key: 'banned',
                label: `Suspendidos (${users.filter(u => u.banned).length})`,
              },
            ] as const
          ).map(pill => (
            <button
              key={pill.key}
              type="button"
              onClick={() => setFilter(pill.key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                filter === pill.key
                  ? 'bg-umber text-cream'
                  : 'border border-taupe bg-cream text-espresso hover:bg-sand'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        <div className="divide-y divide-taupe">
          {filtered.map(u => {
            const isSelf = u.id === actorId;
            const isEditing = editingUserId === u.id;
            const isResettingPass = passwordUserId === u.id;

            return (
              <div key={u.id} className="space-y-3 py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-espresso text-xs font-bold text-cream">
                      {getInitials(u.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-espresso">{u.name}</p>
                        {isSelf && (
                          <span className="rounded-full bg-butter px-2 py-0.5 text-[11px] font-bold text-umber">
                            Tú
                          </span>
                        )}
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                            u.role === 'superadmin'
                              ? 'bg-gold text-ink'
                              : 'bg-sand text-espresso'
                          }`}
                        >
                          {u.role}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                            u.banned
                              ? 'bg-red-100 text-red-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              u.banned ? 'bg-red-600' : 'bg-emerald-600'
                            }`}
                          />
                          {u.banned ? 'Suspendido' : 'Activo'}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs break-all text-earth">{u.email}</p>
                      {u.banned && u.banReason && (
                        <p className="mt-1 text-xs font-medium text-red-800">
                          Motivo: {u.banReason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPasswordUserId(null);
                        setEditingUserId(isEditing ? null : u.id);
                        setEditName(u.name);
                        setEditRole(u.role === 'superadmin' ? 'superadmin' : 'admin');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-taupe bg-cream px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-umber" aria-hidden="true" />
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingUserId(null);
                        setPasswordUserId(isResettingPass ? null : u.id);
                        setResetPassword('');
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-taupe bg-cream px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
                    >
                      <KeyRound className="h-3.5 w-3.5 text-umber" aria-hidden="true" />
                      Clave
                    </button>

                    {!isSelf && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setBanReasonInput('');
                            setBanTarget(u);
                          }}
                          className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                            u.banned
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                              : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                          }`}
                        >
                          {u.banned ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                              Reactivar
                            </>
                          ) : (
                            <>
                              <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                              Suspender
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(u)}
                          aria-label={`Eliminar cuenta ${u.email}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-surface px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="flex flex-col gap-3 rounded-xl border border-taupe bg-cream p-3.5 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-xs font-semibold text-espresso">
                        Nombre completo
                      </label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full rounded-lg border border-taupe bg-surface px-3 py-1.5 text-sm text-ink"
                      />
                    </div>
                    {!isSelf && (
                      <div className="w-full sm:w-52">
                        <label className="mb-1 block text-xs font-semibold text-espresso">
                          Rol RBAC
                        </label>
                        <select
                          value={editRole}
                          onChange={e =>
                            setEditRole(
                              e.target.value === 'superadmin' ? 'superadmin' : 'admin'
                            )
                          }
                          className="w-full rounded-lg border border-taupe bg-surface px-3 py-1.5 text-sm text-ink"
                        >
                          <option value="admin">Administrador</option>
                          <option value="superadmin">Superadministrador</option>
                        </select>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingEdit}
                        onClick={() => handleSaveUserEdit(u.id)}
                        className="rounded-lg bg-umber px-4 py-1.5 text-xs font-semibold text-cream hover:bg-espresso"
                      >
                        {savingEdit ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        className="rounded-lg border border-taupe bg-surface px-3 py-1.5 text-xs font-semibold text-espresso"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}

                {isResettingPass && (
                  <div className="flex flex-col gap-3 rounded-xl border border-gold/50 bg-butter/50 p-3.5 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className="mb-1 block text-xs font-semibold text-espresso">
                        Nueva contraseña (mínimo 10 caracteres)
                      </label>
                      <div className="relative">
                        <input
                          type={showResetPass ? 'text' : 'password'}
                          minLength={10}
                          value={resetPassword}
                          onChange={e => setResetPassword(e.target.value)}
                          placeholder="Ingresa la nueva clave segura..."
                          className="w-full rounded-lg border border-taupe bg-surface py-1.5 pr-9 pl-3 text-sm text-ink"
                        />
                        <button
                          type="button"
                          onClick={() => setShowResetPass(v => !v)}
                          aria-label="Mostrar u ocultar clave"
                          className="absolute top-1/2 right-2 -translate-y-1/2 text-earth hover:text-espresso"
                        >
                          {showResetPass ? (
                            <EyeOff className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={savingPassword || resetPassword.length < 10}
                        onClick={() => handleSaveResetPassword(u.id)}
                        className="rounded-lg bg-umber px-4 py-1.5 text-xs font-semibold text-cream hover:bg-espresso disabled:opacity-55"
                      >
                        {savingPassword ? 'Aplicando...' : 'Actualizar contraseña'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPasswordUserId(null)}
                        className="rounded-lg border border-taupe bg-surface px-3 py-1.5 text-xs font-semibold text-espresso"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Crear nuevo usuario */}
      <form
        onSubmit={handleCreateUser}
        className="space-y-4 rounded-2xl border border-taupe bg-surface p-4 shadow-xs sm:p-6"
      >
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-umber" aria-hidden="true" />
          <h3 className="font-display text-lg font-bold text-espresso">
            Crear cuenta de Administrador
          </h3>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Nombre completo"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
          />
          <input
            required
            type="email"
            placeholder="correo@organizacion.org"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
          />
          <div className="relative">
            <input
              required
              type={showNewPass ? 'text' : 'password'}
              minLength={10}
              placeholder="Contraseña inicial (mín. 10 caracteres)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-taupe bg-cream py-2 pr-10 pl-3.5 text-sm text-ink"
            />
            <button
              type="button"
              onClick={() => setShowNewPass(v => !v)}
              aria-label="Mostrar u ocultar contraseña"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 text-earth hover:text-espresso"
            >
              {showNewPass ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>
          <select
            value={newRole}
            onChange={e =>
              setNewRole(e.target.value === 'superadmin' ? 'superadmin' : 'admin')
            }
            className="w-full min-w-0 rounded-lg border border-taupe bg-cream px-3.5 py-2 text-sm text-ink"
          >
            <option value="admin">Administrador (contenido, medios e inbox)</option>
            <option value="superadmin">Superadministrador (acceso total)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-umber px-5 py-2.5 text-sm font-semibold text-cream hover:bg-espresso disabled:opacity-60"
        >
          {creating ? 'Creando usuario...' : 'Crear usuario'}
        </button>
      </form>

      {/* Registro de Auditoría (solo Superadmin) */}
      <section className="space-y-3 rounded-2xl border border-taupe bg-surface p-4 shadow-xs sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-umber" aria-hidden="true" />
            <h3 className="font-display text-lg font-bold text-espresso">
              Registro de Auditoría Reciente ({auditLogs.length})
            </h3>
          </div>
          <button
            type="button"
            disabled={refreshingAudit}
            onClick={refreshAuditLogs}
            className="inline-flex items-center gap-1.5 rounded-lg border border-taupe bg-cream px-3 py-1.5 text-xs font-semibold text-espresso hover:bg-sand"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshingAudit ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Actualizar
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-earth">Aún no hay eventos registrados.</p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {auditLogs.map(log => (
              <div
                key={log.id}
                className="flex flex-col justify-between gap-1 rounded-lg border border-taupe/70 bg-cream px-3.5 py-2.5 text-xs sm:flex-row sm:items-center"
              >
                <div className="min-w-0">
                  <span className="mr-2 rounded bg-sand px-1.5 py-0.5 font-mono text-[11px] font-semibold text-umber">
                    {log.action}
                  </span>
                  <span className="font-medium text-ink">{log.summary}</span>
                </div>
                <span className="shrink-0 text-[11px] text-earth">
                  {log.actorRole} · {formatDate(log.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={banTarget !== null}
        variant={banTarget?.banned ? 'primary' : 'danger'}
        title={
          banTarget?.banned
            ? 'Reactivar cuenta de usuario'
            : 'Suspender cuenta de usuario'
        }
        description={
          banTarget?.banned
            ? `¿Deseas devolver el acceso administrativo a ${banTarget.email}?`
            : `Al suspender a ${banTarget?.email || ''}, todas sus sesiones activas se cerrarán de inmediato y no podrá ingresar al panel.`
        }
        confirmLabel={banTarget?.banned ? 'Sí, reactivar cuenta' : 'Sí, suspender cuenta'}
        reasonLabel={!banTarget?.banned ? 'Motivo de suspensión (opcional)' : undefined}
        reasonPlaceholder="Ej. Cambio de rol o finalización de periodo..."
        reasonValue={!banTarget?.banned ? banReasonInput : undefined}
        onReasonChange={!banTarget?.banned ? setBanReasonInput : undefined}
        loading={banLoading}
        onConfirm={handleConfirmBanToggle}
        onCancel={() => setBanTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        variant="danger"
        title="Eliminar cuenta permanentemente"
        description={`Se eliminará la cuenta de ${deleteTarget?.name || ''} (${deleteTarget?.email || ''}) y sus sesiones. Los registros históricos de auditoría conservarán la referencia anónima.`}
        confirmLabel="Sí, eliminar usuario"
        loading={deleteLoading}
        onConfirm={handleConfirmDeleteUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
