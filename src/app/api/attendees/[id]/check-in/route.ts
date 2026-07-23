import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { idParamSchema } from '@/lib/validation';

/**
 * POST /api/attendees/[id]/check-in
 * Marks the attendee as having entered the event.
 *
 * Concurrency: relies on the @@unique([attendeeId, active]) constraint in
 * the schema to make the check-in atomic at the database level. Two
 * simultaneous requests for the same attendee will race to `create`, and
 * whichever loses gets a unique-constraint violation instead of silently
 * creating a duplicate active check-in — no read-then-write window.
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

  try {
    const checkIn = await db.checkIn.create({
      data: { attendeeId: id, active: true },
    });
    return NextResponse.json({
      ok: true,
      alreadyCheckedIn: false,
      checkedInAt: checkIn.checkedAt,
    });
  } catch (e) {
    const isDuplicateActiveCheckIn =
      e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
    if (!isDuplicateActiveCheckIn) throw e;

    const activeCheckIn = await db.checkIn.findFirst({
      where: { attendeeId: id, active: true },
    });
    return NextResponse.json({
      ok: true,
      alreadyCheckedIn: true,
      checkedInAt: activeCheckIn?.checkedAt ?? null,
    });
  }
}
