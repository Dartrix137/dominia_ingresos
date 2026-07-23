import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Locality } from '@/lib/constants';
import { idParamSchema, normalizeLocality, updateAttendeeSchema } from '@/lib/validation';

/** DELETE /api/attendees/[id] — remove an attendee */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!idParamSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }
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
  const { id } = await params;
  if (!idParamSchema.safeParse(id).success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }
  try {
    const parsed = updateAttendeeSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }
    const { fullName, cedula, locality } = parsed.data;

    const data: {
      fullName?: string;
      cedula?: string;
      locality?: Locality;
    } = {};

    if (fullName) data.fullName = fullName;
    if (cedula) {
      const other = await db.attendee.findUnique({ where: { cedula } });
      if (other && other.id !== id) {
        return NextResponse.json(
          { error: `Cédula ya registrada para otro asistente: ${cedula}` },
          { status: 409 },
        );
      }
      data.cedula = cedula;
    }
    if (locality) {
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
