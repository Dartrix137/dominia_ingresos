'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScanLine, Upload, Search, RefreshCw, Users, UserPlus } from 'lucide-react';
import { EVENT_CONFIG } from '@/lib/constants';
import type { Attendee, Stats } from '@/components/dashboard/types';
import { StatsGrid } from '@/components/dashboard/stats-grid';
import { HourlyChart } from '@/components/dashboard/hourly-chart';
import { AttendeeRow } from '@/components/dashboard/attendee-row';
import { RegisterForm } from '@/components/dashboard/register-form';
import { ImportCsv } from '@/components/dashboard/import-csv';

export default function DashboardClient() {
  const router = useRouter();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [localityFilter, setLocalityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (localityFilter !== 'all') params.set('locality', localityFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/attendees?${params.toString()}`),
        fetch('/api/stats'),
      ]);
      if (listRes.ok) {
        const data = await listRes.json();
        setAttendees(data.attendees);
      }
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, localityFilter, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="min-h-screen bg-black text-zinc-100">
      {/* Top bar */}
      <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="text-[9px] tracking-widest text-zinc-500">WELCOME TO</div>
              <div className="text-white font-black text-lg leading-none tracking-tight">
                LSD
                <span className="ml-2 text-[10px] font-normal text-zinc-500">La Sucursal Digital</span>
              </div>
            </div>
            <Badge className="bg-[#00FF88] text-black hover:bg-[#00cc6f] ml-2">DOMINIA 1.0</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => router.push('/scan')}
              className="bg-[#00FF88] text-black hover:bg-[#00cc6f] font-bold"
            >
              <ScanLine className="mr-2" size={18} />
              Escanear
            </Button>
            <Button variant="ghost" size="icon" onClick={() => load()} title="Refrescar">
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats cards */}
        <StatsGrid stats={stats} />

        {/* Hourly chart */}
        <HourlyChart stats={stats} />

        {/* Main tabs: Lista, Registrar, Importar */}
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="list" className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black">
              <Users className="mr-2" size={16} />
              Lista ({attendees.length})
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black">
              <UserPlus className="mr-2" size={16} />
              Registrar
            </TabsTrigger>
            <TabsTrigger value="import" className="data-[state=active]:bg-[#00FF88] data-[state=active]:text-black">
              <Upload className="mr-2" size={16} />
              Importar CSV
            </TabsTrigger>
          </TabsList>

          {/* List tab */}
          <TabsContent value="list" className="mt-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                <Input
                  placeholder="Buscar por nombre o cédula..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-zinc-900 border-zinc-800 text-white"
                />
              </div>
              <Select value={localityFilter} onValueChange={setLocalityFilter}>
                <SelectTrigger className="w-full sm:w-44 bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue placeholder="Localidad" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">Todas las localidades</SelectItem>
                  {EVENT_CONFIG.localities.map((l) => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-zinc-900 border-zinc-800 text-white">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="in">Ingresados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className="bg-zinc-950 border-zinc-800 p-0 overflow-hidden">
              <div className="max-h-[60vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-zinc-900 text-zinc-400">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Nombre</th>
                      <th className="text-left px-4 py-2 font-medium hidden sm:table-cell">Cédula</th>
                      <th className="text-left px-4 py-2 font-medium">Localidad</th>
                      <th className="text-left px-4 py-2 font-medium">Estado</th>
                      <th className="text-right px-4 py-2 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.length === 0 && !loading && (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-zinc-500">
                          No hay asistentes que coincidan con los filtros.
                        </td>
                      </tr>
                    )}
                    {attendees.map((a) => (
                      <AttendeeRow key={a.id} attendee={a} onChanged={load} />
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* Register tab */}
          <TabsContent value="register" className="mt-4">
            <RegisterForm onCreated={load} />
          </TabsContent>

          {/* Import tab */}
          <TabsContent value="import" className="mt-4">
            <ImportCsv onImported={load} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
