// One-off migration: copies rows from the legacy db/custom.db (SQLite)
// into the Postgres database pointed to by DATABASE_URL.
//
// Usage:
//   DATABASE_URL=postgresql://user:pass@host:5432/db bun scripts/migrate-sqlite-to-postgres.mjs [path/to/custom.db]

import { Database } from 'bun:sqlite';
import { PrismaClient } from '@prisma/client';
import path from 'node:path';

const sqlitePath = process.argv[2] || path.join(import.meta.dir, '..', 'db', 'custom.db');
const sqlite = new Database(sqlitePath, { readonly: true });
const pg = new PrismaClient();

const attendees = sqlite.query('SELECT * FROM Attendee').all();
const checkIns = sqlite.query('SELECT * FROM CheckIn').all();

console.log(`Read ${attendees.length} attendees and ${checkIns.length} check-ins from ${sqlitePath}`);

for (const a of attendees) {
  await pg.attendee.create({
    data: {
      id: a.id,
      uuid: a.uuid,
      fullName: a.fullName,
      cedula: a.cedula,
      locality: a.locality,
      createdAt: new Date(a.createdAt),
      updatedAt: new Date(a.updatedAt),
    },
  });
}

for (const c of checkIns) {
  await pg.checkIn.create({
    data: {
      id: c.id,
      attendeeId: c.attendeeId,
      checkedAt: new Date(c.checkedAt),
      revertedAt: c.revertedAt ? new Date(c.revertedAt) : null,
      active: c.active === 1 ? true : null,
      notes: c.notes,
    },
  });
}

const pgAttendees = await pg.attendee.count();
const pgCheckIns = await pg.checkIn.count();
console.log(`Postgres now has ${pgAttendees} attendees and ${pgCheckIns} check-ins`);

await pg.$disconnect();
sqlite.close();
