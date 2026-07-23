import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { idParamSchema } from '@/lib/validation';

/**
 * POST /api/attendees/[id]/revert
 * Reverts (undoes) the active check-in for the attendee, if any.
 *
 * Uses updateMany scoped to active:true so the revert is a single atomic
 * statement — concurrent reverts for the same attendee collapse into one
 * effective update instead of racing on a separate read.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!idParamSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const attendee = await db.attendee.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!attendee) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const { count } = await db.checkIn.updateMany({
    where: { attendeeId: id, active: true },
    data: { active: null, revertedAt: new Date() },
  });

  return NextResponse.json({ ok: true, wasCheckedIn: count > 0 });
}
