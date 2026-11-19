'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth/client';

interface AdminLoginFormProps {
  dbConfigured: boolean;
}

export function AdminLoginForm({ dbConfigured }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        setError(result.error.message || 'Credenciales inválidas.');
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('No se pudo conectar con el servicio de autenticación.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!dbConfigured && (
        <div
          role="alert"
          className="rounded-lg border border-amber-700/30 bg-butter/80 px-4 py-3 text-sm text-ink"
        >
          <strong>Entorno demo sin base de datos conectada:</strong> configura{' '}
          <code>DATABASE_URL</code> y <code>BETTER_AUTH_SECRET</code> en{' '}
          <code>.env.local</code> o Vercel y ejecuta{' '}
          <code>
            pnpm run db:push &amp;&amp; pnpm run db:seed &amp;&amp; pnpm run
            admin:bootstrap
          </code>
          .
        </div>
      )}

      <div>
        <label
          htmlFor="admin-email"
          className="mb-1.5 block text-sm font-medium text-espresso"
        >
          Correo institucional
        </label>
        <input
          id="admin-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2.5 text-base text-espresso"
        />
      </div>

      <div>
        <label
          htmlFor="admin-password"
          className="mb-1.5 block text-sm font-medium text-espresso"
        >
          Contraseña
        </label>
        <input
          id="admin-password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="w-full rounded-lg border border-espresso/40 bg-white px-3.5 py-2.5 text-base text-espresso"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || !dbConfigured}
        className="w-full rounded-lg bg-umber px-5 py-3 text-sm font-semibold text-cream transition-colors hover:bg-espresso disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Ingresando...' : 'Iniciar sesión'}
      </button>
    </form>
  );
}
