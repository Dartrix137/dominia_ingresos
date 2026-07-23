import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EVENT_CONFIG, type Locality } from '@/lib/constants';
import { generateTicketPdf } from '@/lib/pdf';
import { createAttendeeSchema, normalizeLocality } from '@/lib/validation';

/**
 * GET /api/attendees?search=...&locality=...&status=...
 * Returns the list of attendees, optionally filtered.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search')?.trim() || '';
  const locality = searchParams.get('locality')?.trim() || '';
  const status = searchParams.get('status')?.trim() || '';

  const where: {
    OR?: Array<{ fullName?: { contains: string }; cedula?: { contains: string } }>;
    locality?: string;
  } = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { cedula: { contains: search } },
    ];
  }
  if (locality && EVENT_CONFIG.localities.includes(locality as Locality)) {
    where.locality = locality;
  }

  const attendees = await db.attendee.findMany({
    where,
    include: {
      checkIns: {
        where: { revertedAt: null },
        take: 1,
        orderBy: { checkedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const data = attendees.map((a) => {
    const activeCheckIn = a.checkIns[0];
    let derivedStatus: 'pending' | 'in' = 'pending';
    if (activeCheckIn) derivedStatus = 'in';

    return {
      id: a.id,
      uuid: a.uuid,
      fullName: a.fullName,
      cedula: a.cedula,
      locality: a.locality,
      status: derivedStatus,
      checkedInAt: activeCheckIn?.checkedAt ?? null,
      createdAt: a.createdAt,
    };
  });

  const filtered = status
    ? data.filter((a) => a.status === status)
    : data;

  return NextResponse.json({ attendees: filtered });
}

/**
 * POST /api/attendees
 * Create a single attendee. Generates UUID, returns the attendee + PDF buffer.
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = createAttendeeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }
    const { fullName, cedula, locality, withPdf } = parsed.data;

    const normLoc = normalizeLocality(locality);
    if (!normLoc) {
      return NextResponse.json(
        { error: 'Localidad inválida (debe ser VIP, General Baja o General Alta)' },
        { status: 400 },
      );
    }

    // Check for duplicate cedula
    const existing = await db.attendee.findUnique({ where: { cedula } });
    if (existing) {
      return NextResponse.json(
        { error: `Ya existe un asistente con cédula ${cedula}` },
        { status: 409 },
      );
    }

    const attendee = await db.attendee.create({
      data: { fullName, cedula, locality: normLoc },
    });

    // Build verification URL
    const protocol = req.headers.get('x-forwarded-proto') || 'https';
    const host = req.headers.get('host') || 'localhost:3000';
    const qrPayload = `${protocol}://${host}/v/${attendee.uuid}`;

    if (withPdf) {
      const pdf = await generateTicketPdf({ attendee, qrPayload });
      return new NextResponse(pdf, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="ticket-${attendee.cedula}.pdf"`,
        },
      });
    }

    return NextResponse.json({ attendee });
  } catch (e) {
    console.error('Create attendee error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
