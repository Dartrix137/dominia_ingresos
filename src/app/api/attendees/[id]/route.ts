import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { isStaffAuthenticated } from '@/lib/auth';
import { EVENT_CONFIG, type Locality } from '@/lib/constants';

function normalizeLocality(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  for (const loc of EVENT_CONFIG.localities) {
    if (loc.toLowerCase() === trimmed) return loc;
  }
  return null;
}

/** DELETE /api/attendees/[id] — remove an attendee */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  try {
    await db.attendee.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'No encontrado' }, { status: 404 });
  }
}

/** PATCH /api/attendees/[id] — edit name, cedula, locality */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await isStaffAuthenticated())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const { id } = await params;
  try {
    const body = await req.json();
    const { fullName, cedula, locality } = body;

    const data: {
      fullName?: string;
      cedula?: string;
      locality?: string;
    } = {};

    if (typeof fullName === 'string' && fullName.trim()) data.fullName = fullName.trim();
    if (typeof cedula === 'string' && cedula.trim()) {
      // Check cedula isn't used by another attendee
      const other = await db.attendee.findUnique({ where: { cedula: cedula.trim() } });
      if (other && other.id !== id) {
        return NextResponse.json(
          { error: `Cédula ya registrada para otro asistente: ${cedula.trim()}` },
          { status: 409 },
        );
      }
      data.cedula = cedula.trim();
    }
    if (typeof locality === 'string' && locality.trim()) {
      const norm = normalizeLocality(locality);
      if (!norm) {
        return NextResponse.json(
          { error: 'Localidad inválida' },
          { status: 400 },
        );
      }
      data.locality = norm as Locality;
    }

    const updated = await db.attendee.update({ where: { id }, data });
    return NextResponse.json({ attendee: updated });
  } catch (e) {
    console.error('Update attendee error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
