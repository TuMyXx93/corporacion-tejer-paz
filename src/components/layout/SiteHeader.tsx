'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { isNextOptimizableImage } from '@/lib/media/embeds';

interface SiteHeaderProps {
  organizationName: string;
  logoUrl: string;
  logoAlt: string;
  initialTone?: 'dark' | 'light';
}

const NAV_LINKS = [
  { href: '/#nuestra-mision', label: 'Misión' },
  { href: '/#areas', label: 'Áreas' },
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/#contacto', label: 'Contáctanos' },
];

export function SiteHeader({
  organizationName,
  logoUrl,
  logoAlt,
  initialTone = 'light',
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<'dark' | 'light'>(initialTone);

  useEffect(() => {
    let rafId = 0;

    function updateTone() {
      rafId = 0;
      const sections = document.querySelectorAll<HTMLElement>('[data-nav-theme]');
      let nextTone: 'dark' | 'light' = initialTone;
      const probeY = 36;

      for (const el of sections) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= probeY && rect.bottom > probeY) {
          const attr = el.getAttribute('data-nav-theme');
          if (attr === 'dark' || attr === 'light') {
            nextTone = attr;
          }
          break;
        }
      }
      setTone(nextTone);
    }

    function scheduleUpdate() {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateTone);
    }

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate, { passive: true });

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [initialTone, pathname]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  const isDark = tone === 'dark';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 backdrop-blur-md backdrop-saturate-150 transition-all duration-300 ${
        isDark
          ? 'border-b border-cream/15 bg-ink/35'
          : 'border-b border-taupe/70 bg-cream/78 shadow-[0_1px_12px_rgba(34,23,12,0.04)]'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className={`flex shrink-0 items-center transition-all duration-300 focus-visible:rounded-md ${
            isDark
              ? 'rounded-lg bg-cream/95 px-2.5 py-1 ring-1 ring-gold/30 shadow-xs backdrop-blur-sm'
              : 'px-0 py-0'
          }`}
          aria-label={organizationName}
        >
          <Image
            src={logoUrl}
            alt={logoAlt}
            width={144}
            height={60}
            loading="eager"
            unoptimized={!isNextOptimizableImage(logoUrl)}
            className="h-8 w-auto object-contain sm:h-9"
          />
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-2.5 md:flex"
        >
          {NAV_LINKS.map(item => {
            const isActive =
              item.href === '/proyectos' && pathname.startsWith('/proyectos');

            const pillClass = isDark
              ? isActive
                ? 'border-gold/80 bg-ink/55 text-cream'
                : 'border-cream/20 bg-ink/30 text-cream hover:border-gold/70 hover:bg-ink/50'
              : isActive
                ? 'border-gold bg-butter text-ink shadow-2xs'
                : 'border-taupe/80 bg-espresso/[0.04] text-espresso hover:border-gold/70 hover:bg-butter/90 hover:text-ink';

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-all ${pillClass}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-lg border transition-colors md:hidden ${
            isDark
              ? 'border-cream/25 bg-ink/35 text-cream hover:bg-ink/55'
              : 'border-taupe bg-surface/85 text-espresso hover:bg-sand'
          }`}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Navegación móvil"
          className={`border-t px-4 py-4 backdrop-blur-md md:hidden ${
            isDark
              ? 'border-cream/15 bg-ink/90 text-cream'
              : 'border-taupe/70 bg-surface/95 text-espresso'
          }`}
        >
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map(item => {
              const isActive =
                item.href === '/proyectos' && pathname.startsWith('/proyectos');
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-lg border px-3.5 py-2.5 text-base font-semibold transition-colors ${
                      isDark
                        ? isActive
                          ? 'border-gold/80 bg-ink/70 text-cream'
                          : 'border-cream/15 bg-ink/40 text-cream hover:bg-ink/60'
                        : isActive
                          ? 'border-gold bg-butter text-ink'
                          : 'border-taupe/70 bg-cream text-espresso hover:bg-sand'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </header>
  );
}
