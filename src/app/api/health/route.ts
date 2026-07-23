import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/health
 * Liveness + DB-connectivity check for container orchestration / uptime
 * monitoring. Returns 503 if the database is unreachable.
 */
export async function GET() {
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', db: 'up' });
  } catch (e) {
    console.error('Health check failed:', e);
    return NextResponse.json({ status: 'error', db: 'down' }, { status: 503 });
  }
}
