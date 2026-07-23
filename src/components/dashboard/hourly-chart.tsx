'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, Crown, Ticket } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { Stats } from './types';

export function HourlyChart({ stats }: { stats: Stats | null }) {
  if (!stats) return null;

  const data = stats.hourly.map((h) => ({
    hour: `${h.hour}h`,
    count: h.count,
  }));

  const peak = stats.peakHour;

  return (
    <Card className="bg-zinc-950 border-zinc-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-zinc-200 font-bold text-sm">Ingresos por hora</h3>
          <p className="text-zinc-500 text-xs">
            {peak
              ? `Hora pico: ${peak.hour.toString().padStart(2, '0')}:00 (${peak.count} ingresos)`
              : 'Aún no hay ingresos registrados'}
          </p>
        </div>
        <TrendingUp className="text-[#8B00FF]" size={20} />
      </div>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis dataKey="hour" stroke="#52525b" tick={{ fontSize: 10 }} interval={2} />
            <YAxis stroke="#52525b" tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0a',
                border: '1px solid #27272a',
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#a1a1aa' }}
            />
            <Bar dataKey="count" fill="#00FF88" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-locality breakdown */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
        {Object.entries(stats.perLocality).map(([loc, data]) => (
          <div
            key={loc}
            className="bg-black/50 border border-zinc-800 rounded-md p-3 flex items-center gap-2"
          >
            {loc === 'VIP' ? (
              <Crown className="text-yellow-400" size={16} />
            ) : (
              <Ticket className="text-zinc-400" size={16} />
            )}
            <div className="flex-1">
              <div className="text-[10px] text-zinc-500 tracking-wider uppercase">{loc}</div>
              <div className="text-sm text-white">
                <span className="text-[#00FF88] font-bold">{data.checkedIn}</span>
                <span className="text-zinc-500"> / {data.total}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
