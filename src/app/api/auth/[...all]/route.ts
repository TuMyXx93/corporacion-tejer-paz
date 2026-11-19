import { NextResponse } from 'next/server';
import { toNextJsHandler } from 'better-auth/next-js';
import { isDatabaseConfigured } from '@/db';
import { getAuth } from '@/lib/auth';

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Base de datos no configurada para autenticación.' },
      { status: 503 }
    );
  }
  const handler = toNextJsHandler(getAuth().handler);
  return handler.GET(request);
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: 'Base de datos no configurada para autenticación.' },
      { status: 503 }
    );
  }
  const handler = toNextJsHandler(getAuth().handler);
  return handler.POST(request);
}
