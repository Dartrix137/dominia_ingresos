import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isStaffAuthenticated } from '@/lib/auth';

/**
 * POST /api/attendees/[id]/check-in
 * Marks the attendee as having entered the event.
 * Returns whether the attendee was already checked in.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
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
  if (activeCheckIn) {
    return NextResponse.json({
      ok: true,
      alreadyCheckedIn: true,
      checkedInAt: activeCheckIn.checkedAt,
    });
  }

  const checkIn = await db.checkIn.create({
    data: { attendeeId: attendee.id },
  });

  return NextResponse.json({
    ok: true,
    alreadyCheckedIn: false,
    checkedInAt: checkIn.checkedAt,
  });
}
