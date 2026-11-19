'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { isNextOptimizableImage } from '@/lib/media/embeds';

interface SiteHeaderProps {
  organizationName: string;
  logoUrl: string;
  logoAlt: string;
}

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/#nuestra-mision', label: 'Misión' },
  { href: '/#areas', label: 'Áreas' },
  { href: '/proyectos', label: 'Proyectos' },
];

export function SiteHeader({ organizationName, logoUrl, logoAlt }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-taupe bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-3 focus-visible:rounded-md"
          aria-label={organizationName}
        >
          <Image
            src={logoUrl}
            alt={logoAlt}
            width={144}
            height={60}
            priority
            unoptimized={!isNextOptimizableImage(logoUrl)}
            className="h-11 w-auto object-contain sm:h-12"
          />
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-7 md:flex"
        >
          {NAV_LINKS.map(item => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : item.href === '/proyectos' && pathname.startsWith('/proyectos');
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`text-sm font-semibold transition-colors hover:text-umber lg:text-base ${
                  isActive
                    ? 'border-b-2 border-gold pb-1 text-espresso'
                    : 'text-espresso/85'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/#contacto"
            className="inline-flex items-center justify-center rounded-lg bg-umber px-4 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-espresso"
          >
            Contáctanos
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-taupe bg-cream text-espresso transition-colors hover:bg-sand md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Navegación móvil"
          className="border-t border-taupe bg-surface px-4 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-1.5">
            {NAV_LINKS.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3.5 py-2.5 text-base font-medium text-espresso hover:bg-sand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-2">
              <Link
                href="/#contacto"
                onClick={() => setOpen(false)}
                className="block rounded-lg bg-umber px-4 py-2.5 text-center text-base font-semibold text-cream hover:bg-espresso"
              >
                Contáctanos
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
