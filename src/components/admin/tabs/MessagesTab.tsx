'use client';

import { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Clock,
  Mail,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { formatDateTimeEs } from '@/lib/format';
import { ConfirmDialog } from '../ConfirmDialog';
import type { AdminFeedbackHandlers, ContactMessageRow } from '../types';

interface MessagesTabProps {
  messages: ContactMessageRow[];
  onMessagesChange: (messages: ContactMessageRow[]) => void;
  feedback: AdminFeedbackHandlers;
}

type InboxFilter = 'active' | 'new' | 'read' | 'replied' | 'archived' | 'all';

const STATUS_STYLE: Record<
  string,
  {
    label: string;
    pillClass: string;
    dotClass: string;
    borderLeftClass: string;
  }
> = {
  new: {
    label: 'Nuevo',
    pillClass: 'border border-red-300 bg-red-100 text-red-900',
    dotClass: 'bg-red-600',
    borderLeftClass: 'border-l-red-600',
  },
  read: {
    label: 'Leído',
    pillClass: 'border border-amber-300 bg-amber-100 text-amber-900',
    dotClass: 'bg-amber-500',
    borderLeftClass: 'border-l-amber-500',
  },
  replied: {
    label: 'Respondido',
    pillClass: 'border border-emerald-300 bg-emerald-100 text-emerald-900',
    dotClass: 'bg-emerald-600',
    borderLeftClass: 'border-l-emerald-600',
  },
  archived: {
    label: 'Archivado',
    pillClass: 'border border-taupe bg-sand text-espresso',
    dotClass: 'bg-earth',
    borderLeftClass: 'border-l-earth',
  },
};

export function MessagesTab({ messages, onMessagesChange, feedback }: MessagesTabProps) {
  const [filter, setFilter] = useState<InboxFilter>('active');
  const [query, setQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactMessageRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const counts = {
    active: messages.filter(m => m.status !== 'archived').length,
    new: messages.filter(m => m.status === 'new').length,
    read: messages.filter(m => m.status === 'read').length,
    replied: messages.filter(m => m.status === 'replied').length,
    archived: messages.filter(m => m.status === 'archived').length,
    all: messages.length,
  };

  const filtered = messages.filter(msg => {
    if (filter === 'active' && msg.status === 'archived') return false;
    if (filter !== 'active' && filter !== 'all' && msg.status !== filter) return false;
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      msg.firstName.toLowerCase().includes(q) ||
      msg.lastName.toLowerCase().includes(q) ||
      msg.email.toLowerCase().includes(q) ||
      msg.subject.toLowerCase().includes(q) ||
      msg.message.toLowerCase().includes(q)
    );
  });

  async function handleStatusChange(id: number, status: string) {
    feedback.clearFeedback();
    setUpdatingId(id);
    try {
      const res = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) {
        feedback.setError('No se pudo actualizar el estado del mensaje.');
        return;
      }
      onMessagesChange(messages.map(m => (m.id === id ? { ...m, status } : m)));
      const label = STATUS_STYLE[status]?.label || status;
      feedback.setNotice(`Mensaje marcado como "${label}".`);
    } catch {
      feedback.setError('Error de conexión al actualizar el estado del mensaje.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    feedback.clearFeedback();
    try {
      const res = await fetch(`/api/admin/messages?id=${deleteTarget.id}`, {
        method: 'DELETE',
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        feedback.setError(json.error || 'No se pudo eliminar el mensaje.');
        return;
      }
      onMessagesChange(messages.filter(m => m.id !== deleteTarget.id));
      feedback.setNotice(
        `Mensaje de ${deleteTarget.firstName} eliminado definitivamente.`
      );
      setDeleteTarget(null);
    } catch {
      feedback.setError('Error de conexión al eliminar el mensaje.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-5 rounded-2xl border border-taupe bg-surface p-4 shadow-xs sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-espresso">
            Bandeja Semaforizada de Contacto
          </h2>
          <p className="text-xs text-earth">
            Clasifica mensajes por prioridad, responde directo, archiva o elimina con
            confirmación.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-earth"
            aria-hidden="true"
          />
          <input
            id="messages-search"
            name="messagesSearch"
            aria-label="Buscar mensajes por remitente o asunto"
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar remitente o asunto..."
            className="w-full rounded-lg border border-taupe bg-cream py-1.5 pr-3 pl-9 text-sm text-ink"
          />
        </div>
      </div>

      {/* Pestañas de bandeja + semáforo */}
      <div className="flex flex-wrap gap-2 border-b border-taupe pb-4">
        <button
          type="button"
          onClick={() => setFilter('active')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filter === 'active'
              ? 'bg-espresso text-cream'
              : 'border border-taupe bg-cream text-espresso hover:bg-sand'
          }`}
        >
          Bandeja activa ({counts.active})
        </button>

        <button
          type="button"
          onClick={() => setFilter('new')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filter === 'new'
              ? 'bg-red-700 text-white'
              : 'border border-red-200 bg-red-50 text-red-900 hover:bg-red-100'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-red-500" />
          Nuevos ({counts.new})
        </button>

        <button
          type="button"
          onClick={() => setFilter('read')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filter === 'read'
              ? 'bg-amber-600 text-white'
              : 'border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          Leídos ({counts.read})
        </button>

        <button
          type="button"
          onClick={() => setFilter('replied')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filter === 'replied'
              ? 'bg-emerald-700 text-white'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-600" />
          Respondidos ({counts.replied})
        </button>

        <button
          type="button"
          onClick={() => setFilter('archived')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filter === 'archived'
              ? 'bg-umber text-cream'
              : 'border border-taupe bg-sand/70 text-espresso hover:bg-sand'
          }`}
        >
          <Archive className="h-3.5 w-3.5" aria-hidden="true" />
          Archivados ({counts.archived})
        </button>

        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-umber text-cream'
              : 'border border-taupe bg-cream text-espresso hover:bg-sand'
          }`}
        >
          Todos ({counts.all})
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-taupe bg-cream p-8 text-center">
          <p className="text-sm font-medium text-espresso">
            No hay mensajes en esta carpeta.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(msg => {
            const style = STATUS_STYLE[msg.status] ?? STATUS_STYLE.new;
            const busy = updatingId === msg.id;

            return (
              <article
                key={msg.id}
                className={`rounded-xl border border-taupe border-l-4 bg-cream p-4 shadow-2xs sm:p-5 ${style.borderLeftClass}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${style.pillClass}`}
                      >
                        <span className={`h-2 w-2 rounded-full ${style.dotClass}`} />
                        {style.label}
                      </span>
                      <span className="text-xs text-earth">
                        {formatDateTimeEs(msg.createdAt)}
                      </span>
                      {msg.emailSent && (
                        <span className="rounded-full bg-butter px-2 py-0.5 text-[11px] font-semibold text-umber">
                          Notificado vía correo
                        </span>
                      )}
                    </div>

                    <p className="text-base font-bold text-espresso">
                      {msg.firstName} {msg.lastName}{' '}
                      <span className="font-normal break-all text-umber">
                        · {msg.email}
                      </span>
                    </p>
                    <p className="text-sm font-semibold text-ink">{msg.subject}</p>
                  </div>

                  <a
                    href={`mailto:${msg.email}?subject=${encodeURIComponent(`Re: ${msg.subject}`)}`}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-umber px-3.5 py-2 text-xs font-semibold text-cream transition-colors hover:bg-espresso"
                  >
                    <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                    Responder
                  </a>
                </div>

                <p className="mt-3 rounded-lg border border-taupe/70 bg-surface p-3.5 text-sm leading-relaxed break-words whitespace-pre-line text-ink">
                  {msg.message}
                </p>

                {/* Botonera semaforizada + archivar + eliminar */}
                <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      disabled={busy || msg.status === 'new'}
                      onClick={() => handleStatusChange(msg.id, 'new')}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        msg.status === 'new'
                          ? 'bg-red-700 text-white'
                          : 'border border-red-200 bg-surface text-red-800 hover:bg-red-50'
                      }`}
                    >
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      Nuevo
                    </button>

                    <button
                      type="button"
                      disabled={busy || msg.status === 'read'}
                      onClick={() => handleStatusChange(msg.id, 'read')}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        msg.status === 'read'
                          ? 'bg-amber-600 text-white'
                          : 'border border-amber-200 bg-surface text-amber-900 hover:bg-amber-50'
                      }`}
                    >
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      Leído
                    </button>

                    <button
                      type="button"
                      disabled={busy || msg.status === 'replied'}
                      onClick={() => handleStatusChange(msg.id, 'replied')}
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                        msg.status === 'replied'
                          ? 'bg-emerald-700 text-white'
                          : 'border border-emerald-200 bg-surface text-emerald-900 hover:bg-emerald-50'
                      }`}
                    >
                      <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                      Respondido
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {msg.status === 'archived' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleStatusChange(msg.id, 'read')}
                        className="inline-flex items-center gap-1 rounded-lg border border-taupe bg-surface px-3 py-1 text-xs font-semibold text-espresso hover:bg-sand"
                      >
                        <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                        Restaurar a bandeja
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleStatusChange(msg.id, 'archived')}
                        className="inline-flex items-center gap-1 rounded-lg border border-taupe bg-surface px-3 py-1 text-xs font-semibold text-espresso hover:bg-sand"
                      >
                        <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                        Archivar
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDeleteTarget(msg)}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-surface px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        variant="danger"
        title="Eliminar mensaje de contacto"
        description={`Se eliminará permanentemente el mensaje "${deleteTarget?.subject || ''}" de ${deleteTarget?.firstName || ''} ${deleteTarget?.lastName || ''}. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar mensaje"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}
