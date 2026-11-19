'use client';

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface ResponsiveSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface ResponsiveSelectProps {
  id?: string;
  value: string;
  options: ResponsiveSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  triggerClassName?: string;
}

/**
 * Accessible custom listbox constrained to its trigger width so long option
 * labels wrap cleanly instead of overflowing compact mobile viewports.
 */
export function ResponsiveSelect({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  ariaLabelledBy,
  triggerClassName = 'bg-cream',
}: ResponsiveSelectProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const selectedIndex = options.findIndex(opt => opt.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : options[0];

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  function focusOption(index: number) {
    if (options.length === 0) return;
    const bounded = ((index % options.length) + options.length) % options.length;
    requestAnimationFrame(() => {
      optionRefs.current[bounded]?.focus();
    });
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (options.length === 0) return;

    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        focusOption(selectedIndex >= 0 ? selectedIndex : 0);
        return;
      }
      const focusedIdx = optionRefs.current.findIndex(
        el => el === document.activeElement
      );
      focusOption(focusedIdx >= 0 ? focusedIdx + 1 : 0);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        focusOption(selectedIndex >= 0 ? selectedIndex : options.length - 1);
        return;
      }
      const focusedIdx = optionRefs.current.findIndex(
        el => el === document.activeElement
      );
      focusOption(focusedIdx >= 0 ? focusedIdx - 1 : options.length - 1);
      return;
    }

    if (open && event.key === 'Home') {
      event.preventDefault();
      focusOption(0);
      return;
    }

    if (open && event.key === 'End') {
      event.preventDefault();
      focusOption(options.length - 1);
    }
  }

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} className="relative w-full min-w-0">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        onClick={() => setOpen(v => !v)}
        className={`flex w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-taupe px-3 py-2 text-left text-sm text-ink transition-colors hover:border-umber/60 focus-visible:border-umber ${triggerClassName}`}
      >
        <span className="min-w-0 flex-1 truncate font-medium">
          {selectedOption?.label || 'Seleccionar...'}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-earth transition-transform duration-150 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-taupe bg-surface p-1 shadow-xl"
        >
          {options.map((opt, idx) => {
            const selected = opt.value === selectedOption?.value;
            return (
              <li key={opt.value} role="none">
                <button
                  ref={el => {
                    optionRefs.current[idx] = el;
                  }}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                    triggerRef.current?.focus();
                  }}
                  className={`flex w-full items-start justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm whitespace-normal break-words transition-colors ${
                    selected ? 'bg-umber text-cream' : 'text-espresso hover:bg-sand'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block leading-snug font-semibold">{opt.label}</span>
                    {opt.description && (
                      <span
                        className={`mt-0.5 block text-xs leading-snug ${
                          selected ? 'text-cream/85' : 'text-earth'
                        }`}
                      >
                        {opt.description}
                      </span>
                    )}
                  </span>
                  {selected && (
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
