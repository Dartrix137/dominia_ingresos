import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/attendees/[id]/revert
 * Reverts (undoes) the most recent active check-in for the attendee.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const attendee = await db.attendee.findUnique({
    where: { id },
    include: {
      checkIns: {
        where: { revertedAt: null },
        orderBy: { checkedAt: 'desc' },
        take: 1,
      },
    },
  });
  if (!attendee) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  const activeCheckIn = attendee.checkIns[0];
  if (!activeCheckIn) {
    return NextResponse.json({ ok: true, wasCheckedIn: false });
  }

  await db.checkIn.update({
    where: { id: activeCheckIn.id },
    data: { revertedAt: new Date() },
  });

  return NextResponse.json({ ok: true, wasCheckedIn: true });
}
