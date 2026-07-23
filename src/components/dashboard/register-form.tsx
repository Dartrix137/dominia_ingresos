'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { EVENT_CONFIG } from '@/lib/constants';

export function RegisterForm({ onCreated }: { onCreated: () => void }) {
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
