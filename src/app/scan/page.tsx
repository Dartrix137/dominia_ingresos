import { redirect } from 'next/navigation';
import { isStaffAuthenticated } from '@/lib/auth';
import ScanClient from './scan-client';

export default async function ScanPage() {
  if (!(await isStaffAuthenticated())) {
    redirect('/login?callback=/scan');
  }
  return <ScanClient />;
}
