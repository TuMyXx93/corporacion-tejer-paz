import { existsSync } from 'node:fs';
import { eq } from 'drizzle-orm';
import { requireDb } from './index';
import { user } from './schema';
import { getAuth } from '../lib/auth';

for (const envFile of ['.env.local', '.env']) {
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
}

async function bootstrapSuperadmin() {
  const email = process.env.BOOTSTRAP_SUPERADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_SUPERADMIN_PASSWORD;
  const name =
    process.env.BOOTSTRAP_SUPERADMIN_NAME?.trim() || 'Superadministrador Tejer Paz';

  if (!email || !password) {
    console.error(
      'Define BOOTSTRAP_SUPERADMIN_EMAIL y BOOTSTRAP_SUPERADMIN_PASSWORD en .env.local antes de ejecutar pnpm run admin:bootstrap.'
    );
    process.exit(1);
  }

  if (password.length < 10) {
    console.error('La contraseña de superadmin debe tener al menos 10 caracteres.');
    process.exit(1);
  }

  const db = requireDb();
  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);

  if (existing.length > 0) {
    await db
      .update(user)
      .set({ role: 'superadmin', emailVerified: true, banned: false })
      .where(eq(user.id, existing[0].id));
    console.log(`Usuario existente promovido a superadmin: ${email}`);
    return;
  }

  const auth = getAuth();
  const created = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
    },
  });

  if (!created?.user?.id) {
    throw new Error('No se pudo crear el usuario inicial en Better Auth.');
  }

  await db
    .update(user)
    .set({ role: 'superadmin', emailVerified: true })
    .where(eq(user.id, created.user.id));

  console.log(`Superadmin inicial creado correctamente: ${email}`);
}

bootstrapSuperadmin().catch(err => {
  console.error('Error en admin:bootstrap:', err);
  process.exit(1);
});
