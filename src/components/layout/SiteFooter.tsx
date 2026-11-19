import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';
import type { SiteSettingsData } from '@/data/default-content';
import { formatTelHref } from '@/lib/format';
import { isNextOptimizableImage } from '@/lib/media/embeds';

interface SiteFooterProps {
  settings: SiteSettingsData;
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function SiteFooter({ settings }: SiteFooterProps) {
  return (
    <footer data-nav-theme="light" className="border-t border-taupe bg-sand">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="space-y-3 md:col-span-5">
            <Image
              src={settings.logoUrl}
              alt={settings.logoAlt}
              width={144}
              height={60}
              unoptimized={!isNextOptimizableImage(settings.logoUrl)}
              className="h-12 w-auto object-contain"
            />
            <p className="max-w-sm text-sm leading-relaxed text-espresso">
              Promovemos la construcción de paz, la defensa de los derechos humanos y la
              protección integral de la vida en los territorios.
            </p>
          </div>

          <div className="space-y-3 md:col-span-3">
            <p className="text-xs font-bold tracking-wider text-umber uppercase">
              Navegación
            </p>
            <ul className="space-y-2 text-sm font-medium text-espresso">
              <li>
                <Link
                  href="/#nuestra-mision"
                  className="hover:text-umber hover:underline"
                >
                  Nuestra Misión
                </Link>
              </li>
              <li>
                <Link href="/#areas" className="hover:text-umber hover:underline">
                  Áreas de Acción
                </Link>
              </li>
              <li>
                <Link href="/proyectos" className="hover:text-umber hover:underline">
                  Proyectos e Iniciativas
                </Link>
              </li>
              <li>
                <Link href="/#contacto" className="hover:text-umber hover:underline">
                  Contacto
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4 md:col-span-4">
            <p className="text-xs font-bold tracking-wider text-umber uppercase">
              Canales Directos
            </p>
            <div className="space-y-2.5 text-sm text-espresso">
              <a
                href={`mailto:${settings.contactEmail}`}
                className="flex items-center gap-2 font-medium break-all hover:text-umber hover:underline"
              >
                <Mail className="h-4 w-4 shrink-0 text-umber" aria-hidden="true" />
                <span>{settings.contactEmail}</span>
              </a>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <Phone className="h-4 w-4 shrink-0 text-umber" aria-hidden="true" />
                {settings.phones.map(phone => (
                  <a
                    key={phone}
                    href={formatTelHref(phone)}
                    className="font-medium hover:text-umber hover:underline"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold tracking-wider text-earth uppercase">
                Síguenos
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Instagram ${settings.instagramHandle}`}
                  title={`Instagram (${settings.instagramHandle})`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-taupe bg-surface text-espresso shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-gold hover:bg-butter hover:text-umber"
                >
                  <InstagramIcon className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-taupe pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-sm text-espresso">{settings.footerCopyright}</p>
          <Link
            href="/admin"
            className="text-xs font-semibold text-umber underline-offset-4 transition-colors hover:text-espresso hover:underline"
          >
            Acceso institucional
          </Link>
        </div>
      </div>
    </footer>
  );
}
