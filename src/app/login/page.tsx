import { redirect } from 'next/navigation';
import { isStaffAuthenticated } from '@/lib/auth';
import LoginPageClient from './login-client';

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ callback?: string }>;
}) {
  const sp = await searchParams;
  const callback = sp.callback || '/';

  // Already logged in? Skip
  if (await isStaffAuthenticated()) {
    redirect(callback);
  }

  return <LoginPageClient callback={callback} />;
}
