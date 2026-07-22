import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EVENT_CONFIG, type Locality } from '@/lib/constants';
import Papa from 'papaparse';

function normalizeLocality(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  for (const loc of EVENT_CONFIG.localities) {
    if (loc.toLowerCase() === trimmed) return loc;
  }
  return null;
}

type ParsedRow = {
  fullName: string;
  cedula: string;
  locality: string;
  _rowNumber: number;
};

type ImportResult = {
  created: number;
  skipped: number;
  errors: Array<{ row: number; reason: string; raw: string }>;
  attendees: Array<{
    id: string;
    uuid: string;
    fullName: string;
    cedula: string;
    locality: string;
  }>;
};

/**
 * POST /api/attendees/import
 * Accepts a CSV body (text/csv) with columns: fullName, cedula, locality.
 * Header row is required. Returns a per-row report.
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('text/csv') && !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type debe ser text/csv' },
        { status: 400 },
      );
    }

    const rawBody = await req.text();

    let csvText = rawBody;
    if (contentType.includes('application/json')) {
      try {
        const j = JSON.parse(rawBody);
        csvText = j.csv || '';
      } catch {
        return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
      }
    }

    if (!csvText.trim()) {
      return NextResponse.json({ error: 'CSV vacío' }, { status: 400 });
    }

    // Header mapping accepts various common column names
    const HEADER_MAP: Record<string, keyof ParsedRow> = {
      fullname: 'fullName',
      'full name': 'fullName',
      nombre: 'fullName',
      'nombre completo': 'fullName',
      name: 'fullName',
      cedula: 'cedula',
      documento: 'cedula',
      'numero de identidad': 'cedula',
      'numero identidad': 'cedula',
      id: 'cedula',
      locality: 'locality',
      localidad: 'locality',
      ubicacion: 'locality',
    };

    const parsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return NextResponse.json(
        { error: 'No se pudieron leer filas del CSV', details: parsed.errors },
        { status: 400 },
      );
    }

    const rows: ParsedRow[] = parsed.data.map((r, idx) => {
      const normalized: Partial<ParsedRow> = {};
      for (const [key, value] of Object.entries(r)) {
        const mapped = HEADER_MAP[key];
        if (mapped) {
          normalized[mapped] = (value || '').toString().trim();
        }
      }
      return {
        fullName: normalized.fullName || '',
        cedula: normalized.cedula || '',
        locality: normalized.locality || '',
        _rowNumber: idx + 2,
      };
    });

    // Pre-fetch all existing cedulas in the file (for in-file dedup detection)
    const cedulasInFile = rows.map((r) => r.cedula);
    const existing = await db.attendee.findMany({
      where: { cedula: { in: cedulasInFile.filter(Boolean) } },
      select: { cedula: true },
    });
    const existingSet = new Set(existing.map((e) => e.cedula));
    const seenInFile = new Set<string>();

    const result: ImportResult = {
      created: 0,
      skipped: 0,
      errors: [],
      attendees: [],
    };

    for (const row of rows) {
      const raw = `${row.fullName},${row.cedula},${row.locality}`;

      if (!row.fullName || !row.cedula || !row.locality) {
        result.errors.push({
          row: row._rowNumber,
          reason: 'Faltan campos (nombre, cédula o localidad)',
          raw,
        });
        result.skipped++;
        continue;
      }

      const normLoc = normalizeLocality(row.locality);
      if (!normLoc) {
        result.errors.push({
          row: row._rowNumber,
          reason: `Localidad inválida: "${row.locality}" (debe ser VIP, General Baja o General Alta)`,
          raw,
        });
        result.skipped++;
        continue;
      }

      if (seenInFile.has(row.cedula)) {
        result.errors.push({
          row: row._rowNumber,
          reason: `Cédula duplicada dentro del archivo: ${row.cedula}`,
          raw,
        });
        result.skipped++;
        continue;
      }

      if (existingSet.has(row.cedula)) {
        result.errors.push({
          row: row._rowNumber,
          reason: `Cédula ya existe en la base de datos: ${row.cedula}`,
          raw,
        });
        result.skipped++;
        continue;
      }

      seenInFile.add(row.cedula);

      try {
        const attendee = await db.attendee.create({
          data: {
            fullName: row.fullName,
            cedula: row.cedula,
            locality: normLoc,
          },
        });
        result.created++;
        result.attendees.push({
          id: attendee.id,
          uuid: attendee.uuid,
          fullName: attendee.fullName,
          cedula: attendee.cedula,
          locality: attendee.locality,
        });
      } catch (e) {
        result.errors.push({
          row: row._rowNumber,
          reason: `Error al crear: ${(e as Error).message}`,
          raw,
        });
        result.skipped++;
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error('Import error:', e);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
