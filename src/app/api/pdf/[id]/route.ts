import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isStaffAuthenticated } from '@/lib/auth';
import { generateTicketPdf } from '@/lib/pdf';

/**
 * GET /api/pdf/[id]
 * Generates and returns the ticket PDF for an attendee by their internal ID.
 * Requires staff session.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;

  const attendee = await db.attendee.findUnique({ where: { id } });
  if (!attendee) {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }

  // Build verification URL
  const protocol = req.headers.get('x-forwarded-proto') || 'https';
  const host = req.headers.get('host') || 'localhost:3000';
  const qrPayload = `${protocol}://${host}/v/${attendee.uuid}`;

  const pdf = await generateTicketPdf({ attendee, qrPayload });

  return new NextResponse(pdf, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${attendee.cedula}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
