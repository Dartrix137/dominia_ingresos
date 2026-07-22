import { redirect } from 'next/navigation';
import { isStaffAuthenticated } from '@/lib/auth';
import DashboardClient from './dashboard-client';

export default async function Home() {
  if (!(await isStaffAuthenticated())) {
    redirect('/login?callback=/');
  }
  return <DashboardClient />;
}
