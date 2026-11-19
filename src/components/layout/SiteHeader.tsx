'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

interface SiteHeaderProps {
  organizationName: string;
  logoUrl: string;
  logoAlt: string;
}

const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/proyectos', label: 'Proyectos' },
  { href: '/#contacto', label: 'Contacto' },
];

export function SiteHeader({ organizationName, logoUrl, logoAlt }: SiteHeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-taupe/50 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-3 focus-visible:rounded-md"
          aria-label={organizationName}
        >
          <Image
            src={logoUrl}
            alt={logoAlt}
            width={136}
            height={57}
            priority
            className="h-11 w-auto object-contain sm:h-12"
          />
        </Link>

        <nav
          aria-label="Navegación principal"
          className="hidden items-center gap-8 md:flex"
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
                className={`text-base font-medium transition-colors hover:text-umber ${
                  isActive
                    ? 'border-b-2 border-umber pb-1 text-espresso'
                    : 'text-espresso/85'
                }`}
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
          className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-taupe text-espresso transition-colors hover:bg-sand md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Navegación móvil"
          className="border-t border-taupe/60 bg-cream px-4 py-4 md:hidden"
        >
          <ul className="flex flex-col gap-2">
            {NAV_LINKS.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-base font-medium text-espresso hover:bg-sand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
