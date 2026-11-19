import Link from 'next/link';
import type { SiteSettingsData } from '@/data/default-content';

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
    <footer className="border-t border-taupe/60 bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-center sm:flex-row sm:px-6 sm:text-left lg:px-8">
        <p className="text-sm text-espresso/90">{settings.footerCopyright}</p>

        <div className="flex items-center gap-5">
          <a
            href={settings.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram ${settings.instagramHandle}`}
            className="inline-flex items-center gap-2 rounded-full border border-umber/40 px-3.5 py-1.5 text-sm font-medium text-espresso transition-colors hover:bg-sand"
          >
            <InstagramIcon className="h-4 w-4 text-umber" />
            <span>{settings.instagramHandle}</span>
          </a>

          <Link
            href="/admin"
            className="text-xs font-medium text-espresso/85 underline-offset-4 transition-colors hover:text-espresso hover:underline"
          >
            Acceso institucional
          </Link>
        </div>
      </div>
    </footer>
  );
}
