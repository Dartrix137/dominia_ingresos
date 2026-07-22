'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ScanLine, UserPlus, Upload, Search, Download, Edit, Trash2,
  RefreshCw, Users, CheckCircle2, Clock, TrendingUp, Crown, Ticket,
} from 'lucide-react';
import { EVENT_CONFIG } from '@/lib/constants';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

type Attendee = {
  id: string;
  uuid: string;
  fullName: string;
  cedula: string;
  locality: string;
  status: 'pending' | 'in';
  checkedInAt: string | null;
  createdAt: string;
};

type Stats = {
  total: number;
  checkedIn: number;
  pending: number;
  perLocality: Record<string, { total: number; checkedIn: number; pending: number }>;
  hourly: Array<{ hour: number; count: number }>;
  peakHour: { hour: number; count: number } | null;
};

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

/* ---------- Stats Grid ---------- */
function StatsGrid({ stats }: { stats: Stats | null }) {
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

/* ---------- Hourly Chart ---------- */
function HourlyChart({ stats }: { stats: Stats | null }) {
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

/* ---------- Attendee Row ---------- */
function AttendeeRow({ attendee, onChanged }: { attendee: Attendee; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const downloadPdf = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/pdf/${attendee.id}`);
      if (!res.ok) throw new Error('Error al generar PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${attendee.cedula}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!confirm(`¿Eliminar a ${attendee.fullName}? Esta acción no se puede deshacer.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/attendees/${attendee.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success('Asistente eliminado');
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-t border-zinc-800 hover:bg-zinc-900/40">
      <td className="px-4 py-2.5 text-white">
        <div className="font-medium">{attendee.fullName}</div>
      </td>
      <td className="px-4 py-2.5 font-mono text-zinc-300 hidden sm:table-cell">{attendee.cedula}</td>
      <td className="px-4 py-2.5">
        <Badge
          variant="outline"
          className={
            attendee.locality === 'VIP'
              ? 'border-yellow-500/40 text-yellow-400'
              : 'border-zinc-700 text-zinc-300'
          }
        >
          {attendee.locality}
        </Badge>
      </td>
      <td className="px-4 py-2.5">
        {attendee.status === 'in' ? (
          <Badge className="bg-[#00FF88] text-black hover:bg-[#00cc6f]">
            <CheckCircle2 className="mr-1" size={12} />
            Ingresó
          </Badge>
        ) : (
          <Badge variant="outline" className="border-yellow-500/40 text-yellow-400">
            <Clock className="mr-1" size={12} />
            Pendiente
          </Badge>
        )}
        {attendee.status === 'in' && attendee.checkedInAt && (
          <div className="text-[10px] text-zinc-500 mt-0.5">
            {new Date(attendee.checkedInAt).toLocaleString('es-CO', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: '2-digit',
            })}
          </div>
        )}
      </td>
      <td className="px-4 py-2.5 text-right">
        <div className="inline-flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={downloadPdf}
            disabled={busy}
            title="Descargar PDF"
            className="h-8 w-8 text-zinc-400 hover:text-white"
          >
            <Download size={16} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(true)}
            disabled={busy}
            title="Editar"
            className="h-8 w-8 text-zinc-400 hover:text-white"
          >
            <Edit size={16} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={del}
            disabled={busy}
            title="Eliminar"
            className="h-8 w-8 text-zinc-400 hover:text-red-400"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </td>
      <EditDialog
        open={editing}
        onOpenChange={setEditing}
        attendee={attendee}
        onSaved={() => {
          setEditing(false);
          onChanged();
        }}
      />
    </tr>
  );
}

/* ---------- Edit Dialog ---------- */
function EditDialog({
  open,
  onOpenChange,
  attendee,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  attendee: Attendee;
  onSaved: () => void;
}) {
  const [fullName, setFullName] = useState(attendee.fullName);
  const [cedula, setCedula] = useState(attendee.cedula);
  const [locality, setLocality] = useState(attendee.locality);
  const [busy, setBusy] = useState(false);

  // Reset when opened
  useEffect(() => {
    if (open) {
      setFullName(attendee.fullName);
      setCedula(attendee.cedula);
      setLocality(attendee.locality);
    }
  }, [open, attendee]);

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/attendees/${attendee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, cedula, locality }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Error al guardar');
        return;
      }
      toast.success('Cambios guardados');
      onSaved();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle>Editar asistente</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-zinc-300 text-xs">Nombre completo</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white mt-1"
            />
          </div>
          <div>
            <Label className="text-zinc-300 text-xs">Cédula</Label>
            <Input
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white mt-1 font-mono"
            />
          </div>
          <div>
            <Label className="text-zinc-300 text-xs">Localidad</Label>
            <Select value={locality} onValueChange={setLocality}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800">
                {EVENT_CONFIG.localities.map((l) => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" className="text-zinc-400">Cancelar</Button>
          </DialogClose>
          <Button
            onClick={save}
            disabled={busy}
            className="bg-[#00FF88] text-black hover:bg-[#00cc6f]"
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Register Form ---------- */
function RegisterForm({ onCreated }: { onCreated: () => void }) {
  const [fullName, setFullName] = useState('');
  const [cedula, setCedula] = useState('');
  const [locality, setLocality] = useState<string>('VIP');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, cedula, locality, withPdf: true }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error || 'Error al registrar');
        return;
      }
      // PDF returned as binary
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${cedula}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Asistente registrado y PDF generado');
      setFullName('');
      setCedula('');
      onCreated();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="bg-zinc-950 border-zinc-800 p-6 max-w-lg">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus className="text-[#00FF88]" size={20} />
        <h2 className="text-zinc-100 font-bold">Registrar nuevo asistente</h2>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label className="text-zinc-300 text-xs">Nombre completo</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ej: Johnny Paz"
            required
            className="bg-zinc-900 border-zinc-800 text-white mt-1"
          />
        </div>
        <div>
          <Label className="text-zinc-300 text-xs">Número de cédula</Label>
          <Input
            value={cedula}
            onChange={(e) => setCedula(e.target.value)}
            placeholder="Ej: 1144058864"
            required
            className="bg-zinc-900 border-zinc-800 text-white mt-1 font-mono"
          />
        </div>
        <div>
          <Label className="text-zinc-300 text-xs">Localidad</Label>
          <Select value={locality} onValueChange={setLocality}>
            <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-800">
              {EVENT_CONFIG.localities.map((l) => (
                <SelectItem key={l} value={l}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-[#00FF88] text-black hover:bg-[#00cc6f] font-bold"
        >
          {busy ? 'Generando...' : 'REGISTRAR Y DESCARGAR PDF'}
        </Button>
      </form>
      <p className="text-[10px] text-zinc-500 mt-3">
        Se generará automáticamente un PDF con el QR único del asistente.
      </p>
    </Card>
  );
}

/* ---------- Import CSV ---------- */
function ImportCsv({ onImported }: { onImported: () => void }) {
  const [csvText, setCsvText] = useState('');
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: Array<{ row: number; reason: string; raw: string }>;
    attendees: Array<{ id: string; cedula: string; fullName: string; locality: string }>;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const sample = `fullName,cedula,locality
Johnny Paz,1144058864,VIP
Maria Lopez,1234567890,General Baja
Carlos Ruiz,9876543210,General Alta`;

  const submit = async () => {
    if (!csvText.trim()) {
      toast.error('Pega el contenido del CSV primero');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/attendees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: csvText,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Error al importar');
        return;
      }
      setResult(data);
      toast.success(`${data.created} asistentes registrados`);
      onImported();
    } finally {
      setBusy(false);
    }
  };

  const downloadAllPdfs = async () => {
    if (!result?.attendees?.length) return;
    toast.info(`Descargando ${result.attendees.length} PDFs...`);
    for (const a of result.attendees) {
      try {
        const res = await fetch(`/api/pdf/${a.id}`);
        if (!res.ok) continue;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-${a.cedula}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        // small delay so browser doesn't block sequential downloads
        await new Promise((r) => setTimeout(r, 250));
      } catch {
        /* skip */
      }
    }
    toast.success('Descarga completa');
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCsvText(String(ev.target?.result || ''));
    reader.readAsText(file);
  };

  return (
    <Card className="bg-zinc-950 border-zinc-800 p-6 max-w-3xl">
      <div className="flex items-center gap-2 mb-4">
        <Upload className="text-[#00FF88]" size={20} />
        <h2 className="text-zinc-100 font-bold">Importar asistentes desde CSV</h2>
      </div>

      <div className="space-y-3">
        <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3 text-xs">
          <div className="text-zinc-400 mb-2">
            Formato requerido (CSV con encabezado):
          </div>
          <pre className="text-zinc-500 font-mono whitespace-pre-wrap">{sample}</pre>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="file"
            accept=".csv,text/csv"
            onChange={onFile}
            className="bg-zinc-900 border-zinc-800 text-white file:bg-zinc-800 file:text-white file:border-0 file:mr-3 file:px-3 file:py-1 file:rounded-sm"
          />
        </div>

        <div>
          <Label className="text-zinc-300 text-xs">
            O pega el contenido CSV aquí:
          </Label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={6}
            placeholder={sample}
            className="w-full mt-1 bg-zinc-900 border border-zinc-800 text-white font-mono text-xs rounded-md p-3"
          />
        </div>

        <Button
          onClick={submit}
          disabled={busy}
          className="bg-[#00FF88] text-black hover:bg-[#00cc6f] font-bold"
        >
          {busy ? 'Importando...' : 'IMPORTAR CSV'}
        </Button>
      </div>

      {result && (
        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-md p-3 text-center">
              <div className="text-2xl font-black text-[#00FF88]">{result.created}</div>
              <div className="text-[10px] text-zinc-400 tracking-wider uppercase">Creados</div>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-md p-3 text-center">
              <div className="text-2xl font-black text-red-400">{result.skipped}</div>
              <div className="text-[10px] text-zinc-400 tracking-wider uppercase">Omitidos</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/30 rounded-md p-3">
              <div className="text-red-300 text-xs font-bold mb-2">
                Filas con errores ({result.errors.length}):
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {result.errors.map((e, i) => (
                  <div key={i} className="text-xs text-zinc-400 font-mono">
                    <span className="text-red-400">Fila {e.row}:</span> {e.reason}
                    <div className="text-zinc-600 truncate">{e.raw}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.attendees.length > 0 && (
            <Button
              onClick={downloadAllPdfs}
              variant="outline"
              className="border-zinc-700 text-zinc-200 hover:bg-zinc-900"
            >
              <Download className="mr-2" size={16} />
              Descargar los {result.attendees.length} PDFs
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
