'use client';

import dynamic from 'next/dynamic';

// Render the dashboard client-side only.
//
// The dashboard uses Radix UI components (Tabs, Select, Dialog) which call
// React.useId() to generate unique IDs. When SSR-ed, the server and client
// can produce different ID sequences (especially across fast refresh / route
// segment changes), causing a hydration mismatch:
//   "A tree hydrated but some attributes of the server rendered HTML
//    didn't match the client properties."
// Skipping SSR for this fully interactive client component eliminates the
// mismatch entirely. The dashboard has no SEO value (it's an internal tool),
// so SSR is not needed here.
const DashboardClient = dynamic(() => import('./dashboard-client'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-zinc-500 text-sm">Cargando panel…</div>
    </div>
  ),
});

export default function DashboardClientLoader() {
  return <DashboardClient />;
}
