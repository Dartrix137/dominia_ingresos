import { z } from 'zod';
import { EVENT_CONFIG } from './constants';

/**
 * Case-insensitive match against EVENT_CONFIG.localities, returning the
 * canonical casing (e.g. "vip" -> "VIP"). Shared across every route that
 * accepts a locality from user input (single-create, PATCH, CSV import).
 */
export function normalizeLocality(input: string): string | null {
  const trimmed = input.trim().toLowerCase();
  for (const loc of EVENT_CONFIG.localities) {
    if (loc.toLowerCase() === trimmed) return loc;
  }
  return null;
}

export const idParamSchema = z.cuid({ error: 'ID inválido' });
export const uuidParamSchema = z.uuid({ error: 'UUID inválido' });

export const createAttendeeSchema = z.object({
  fullName: z.string().trim().min(1, 'Nombre requerido').max(200),
  cedula: z.string().trim().min(1, 'Cédula requerida').max(50),
  locality: z.string().min(1, 'Localidad requerida'),
  withPdf: z.boolean().optional(),
});

export const updateAttendeeSchema = z.object({
  fullName: z.string().trim().min(1).max(200).optional(),
  cedula: z.string().trim().min(1).max(50).optional(),
  locality: z.string().min(1).optional(),
});
