'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary';
  requireConfirmText?: string;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonValue?: string;
  onReasonChange?: (value: string) => void;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  if (!props.open) return null;
  return <ConfirmDialogInner {...props} />;
}

function ConfirmDialogInner({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  requireConfirmText,
  reasonLabel,
  reasonPlaceholder,
  reasonValue,
  onReasonChange,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [typedText, setTypedText] = useState('');

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loading, onCancel]);

  const confirmDisabled =
    loading || (Boolean(requireConfirmText) && typedText.trim() !== requireConfirmText);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-xs"
      onClick={() => {
        if (!loading) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-taupe bg-surface p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                variant === 'danger' ? 'bg-red-100 text-red-700' : 'bg-butter text-umber'
              }`}
            >
              {variant === 'danger' ? (
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              ) : (
                <ShieldAlert className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div>
              <h2
                id="confirm-dialog-title"
                className="font-display text-lg font-bold text-espresso"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-description"
                className="mt-1.5 text-sm leading-relaxed text-earth"
              >
                {description}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            aria-label="Cerrar confirmación"
            className="rounded-lg p-1.5 text-earth hover:bg-sand hover:text-espresso disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {onReasonChange && (
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold text-espresso">
              {reasonLabel || 'Motivo (opcional)'}
            </label>
            <input
              type="text"
              value={reasonValue ?? ''}
              onChange={e => onReasonChange(e.target.value)}
              placeholder={reasonPlaceholder || 'Especifica un motivo...'}
              className="w-full rounded-lg border border-taupe bg-cream px-3 py-2 text-sm text-ink focus:border-umber"
            />
          </div>
        )}

        {requireConfirmText && (
          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold text-espresso">
              Escribe <code className="rounded bg-sand px-1">{requireConfirmText}</code>{' '}
              para confirmar:
            </label>
            <input
              type="text"
              value={typedText}
              onChange={e => setTypedText(e.target.value)}
              className="w-full rounded-lg border border-taupe bg-cream px-3 py-2 text-sm text-ink focus:border-umber"
            />
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-lg border border-taupe bg-surface px-4 py-2 text-sm font-semibold text-espresso hover:bg-sand disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-cream transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
              variant === 'danger'
                ? 'bg-red-700 hover:bg-red-800'
                : 'bg-umber hover:bg-espresso'
            }`}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
