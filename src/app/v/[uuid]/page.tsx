import { db } from '@/lib/db';
import VerifyClient from './verify-client';

/**
 * Public verification page (scanned QR lands here).
 *
 * No authentication required — anyone who scans the QR will see the
 * attendee's data and check-in status, and the "MARCAR INGRESO" /
 * "REVERTIR INGRESO" buttons are enabled for everyone.
 */
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;

  const attendee = await db.attendee.findUnique({
    where: { uuid },
    include: {
      checkIns: {
        where: { revertedAt: null },
        orderBy: { checkedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!attendee) {
    return <VerifyClient notFound />;
  }

  const activeCheckIn = attendee.checkIns[0];

  return (
    <VerifyClient
      attendee={{
        id: attendee.id,
        fullName: attendee.fullName,
        cedula: attendee.cedula,
        locality: attendee.locality,
      }}
      status={activeCheckIn ? 'in' : 'pending'}
      checkedInAt={activeCheckIn?.checkedAt ? activeCheckIn.checkedAt.toISOString() : null}
    />
  );
}
