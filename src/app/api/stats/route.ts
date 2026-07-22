import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/stats
 * Returns live stats for the dashboard:
 *   - total, checkedIn, pending counts
 *   - per-locality breakdown (total + checkedIn)
 *   - hourly check-in distribution (for "hora pico" chart)
 */
export async function GET() {
  const total = await db.attendee.count();
  const localities = ['VIP', 'General Baja', 'General Alta'] as const;

  const activeCheckIns = await db.checkIn.findMany({
    where: { revertedAt: null },
    include: { attendee: { select: { locality: true } } },
  });

  const checkedIn = activeCheckIns.length;
  const pending = total - checkedIn;

  const perLocality: Record<string, { total: number; checkedIn: number; pending: number }> = {};
  for (const loc of localities) {
    perLocality[loc] = { total: 0, checkedIn: 0, pending: 0 };
  }

  const allAttendees = await db.attendee.findMany({ select: { locality: true } });
  for (const a of allAttendees) {
    if (perLocality[a.locality]) perLocality[a.locality].total++;
  }
  for (const c of activeCheckIns) {
    if (perLocality[c.attendee.locality]) perLocality[c.attendee.locality].checkedIn++;
  }
  for (const loc of localities) {
    perLocality[loc].pending = perLocality[loc].total - perLocality[loc].checkedIn;
  }

  const hourly: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourly[h] = 0;
  for (const c of activeCheckIns) {
    const h = c.checkedAt.getHours();
    hourly[h]++;
  }

  const peakHour = Object.entries(hourly).reduce(
    (best, [h, count]) => (count > best.count ? { hour: Number(h), count } : best),
    { hour: 0, count: 0 },
  );

  return NextResponse.json({
    total,
    checkedIn,
    pending,
    perLocality,
    hourly: Object.entries(hourly).map(([hour, count]) => ({ hour: Number(hour), count })),
    peakHour: peakHour.count > 0 ? peakHour : null,
  });
}
