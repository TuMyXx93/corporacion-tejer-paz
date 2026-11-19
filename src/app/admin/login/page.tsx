import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminLoginForm } from '@/components/admin/AdminLoginForm';
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
      className="flex min-h-screen items-center justify-center bg-sand/60 px-4 py-12"
    >
      <div className="w-full max-w-md rounded-2xl border border-taupe bg-cream p-8 shadow-sm">
        <p className="text-xs font-semibold tracking-wider text-umber uppercase">
          Corporación Tejer Paz
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-espresso">
          Panel Administrativo
        </h1>
        <p className="mt-2 text-sm text-espresso/80">
          Acceso restringido para roles <strong>Superadministrador</strong> y{' '}
          <strong>Administrador</strong>.
        </p>

        <div className="mt-6">
          <AdminLoginForm dbConfigured={isDatabaseConfigured()} />
        </div>

        <div className="mt-6 border-t border-taupe/60 pt-4 text-center">
          <Link
            href="/"
            className="text-sm font-medium text-umber underline-offset-4 hover:underline"
          >
            Volver al sitio público
          </Link>
        </div>
      </div>
    </main>
  );
}
