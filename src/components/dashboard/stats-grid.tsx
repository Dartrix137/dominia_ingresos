'use client';

import { Card } from '@/components/ui/card';
import { Users, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import type { Stats } from './types';

export function StatsGrid({ stats }: { stats: Stats | null }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Card key={i} className="bg-zinc-950 border-zinc-800 p-4 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  const cards = [
    { label: 'Total registrados', value: stats.total, icon: Users, color: 'text-white' },
    { label: 'Ingresados', value: stats.checkedIn, icon: CheckCircle2, color: 'text-[#00FF88]' },
    { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'text-yellow-400' },
    {
      label: '% ingreso',
      value: stats.total === 0 ? '0%' : `${Math.round((stats.checkedIn / stats.total) * 100)}%`,
      icon: TrendingUp,
      color: 'text-[#8B00FF]',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <Card key={i} className="bg-zinc-950 border-zinc-800 p-4 flex items-center gap-3">
          <c.icon className={c.color} size={28} />
          <div>
            <div className="text-zinc-500 text-[10px] tracking-wider uppercase">{c.label}</div>
            <div className={`text-2xl font-black ${c.color}`}>{c.value}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
