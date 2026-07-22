import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { isStaffAuthenticated } from '@/lib/auth';
import VerifyClient from './verify-client';

/**
 * Public verification page (scanned QR lands here).
 *
 * IMPORTANT: This page requires staff auth. If the staff is not authenticated,
 * they are redirected to login with a callback to this URL. After login, they
 * are returned here automatically. This prevents attendees from "self-checking-in"
 * by scanning their own QR before arriving at the event.
 */
export default async function VerifyPage({
  params,
}: {
  params: Promise<{ uuid: string }>;
}) {
  const { uuid } = await params;
  const authed = await isStaffAuthenticated();

  if (!authed) {
    // Redirect to login with callback
    redirect(`/login?callback=${encodeURIComponent(`/v/${uuid}`)}`);
  }

  // Look up attendee
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
