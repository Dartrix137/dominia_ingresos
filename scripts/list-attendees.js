const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const attendees = await db.attendee.findMany();
  console.log(JSON.stringify(attendees, null, 2));
  await db.$disconnect();
})();
