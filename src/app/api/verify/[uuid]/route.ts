import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { uuidParamSchema } from '@/lib/validation';

/**
 * GET /api/verify/[uuid]
 * Verifies a ticket by its public UUID.
 *
 * Returns:
 *   - 200 { valid: true, attendee, status: 'pending' | 'in', checkedInAt }
 *   - 404 { valid: false, error: 'Registro no encontrado' }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uuid: string }> },
) {
  const limit = rateLimit(`verify:${getClientIp(req)}`, 30, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { valid: false, error: 'Demasiadas solicitudes, intenta de nuevo en un momento' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } },
    );
  }

  const { uuid } = await params;
  if (!uuidParamSchema.safeParse(uuid).success) {
    return NextResponse.json({ valid: false, error: 'UUID inválido' }, { status: 400 });
  }

  const attendee = await db.attendee.findUnique({
    where: { uuid },
    include: {
      checkIns: {
        where: { revertedAt: null },
        orderBy: { checkedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!attendee) {
    return NextResponse.json(
      { valid: false, error: 'Registro no encontrado' },
      { status: 404 },
    );
  }

  const activeCheckIn = attendee.checkIns[0];
  return NextResponse.json({
    valid: true,
    attendee: {
      id: attendee.id,
      fullName: attendee.fullName,
      cedula: attendee.cedula,
      locality: attendee.locality,
      createdAt: attendee.createdAt,
    },
    status: activeCheckIn ? 'in' : 'pending',
    checkedInAt: activeCheckIn?.checkedAt ?? null,
  });
}
