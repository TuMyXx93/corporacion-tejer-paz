import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
import { DEFAULT_SITE_SETTINGS } from '@/data/default-content';
import { isDatabaseConfigured } from '@/db';
import { getServerActor } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Acceso Administrativo',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const actor = await getServerActor();
  if (actor) {
    redirect('/admin');
  }

  return (
    <main
      id="contenido-principal"
      className="flex min-h-screen items-center justify-center bg-sand/70 px-4 py-12"
    >
      <div className="w-full max-w-md rounded-2xl border border-taupe border-t-4 border-t-gold bg-surface p-7 shadow-sm sm:p-8">
        <div className="mb-5 flex justify-center">
          <Image
            src={DEFAULT_SITE_SETTINGS.logoUrl}
            alt={DEFAULT_SITE_SETTINGS.logoAlt}
            width={160}
            height={68}
            loading="eager"
            className="h-14 w-auto object-contain"
          />
        </div>

        <p className="text-xs font-bold tracking-wider text-umber uppercase">
          Corporación Tejer Paz
        </p>
        <h1 className="mt-1.5 font-display text-2xl font-bold text-espresso">
          Panel Administrativo
        </h1>
        <p className="mt-2 text-sm text-earth">
          Acceso restringido para roles{' '}
          <strong className="text-ink">Superadministrador</strong> y{' '}
          <strong className="text-ink">Administrador</strong>.
        </p>

        <div className="mt-6">
          <AdminLoginForm dbConfigured={isDatabaseConfigured()} />
        </div>

        <div className="mt-6 border-t border-taupe pt-4 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-umber underline-offset-4 hover:text-espresso hover:underline"
          >
            Volver al sitio público
          </Link>
        </div>
      </div>
    </main>
  );
}
