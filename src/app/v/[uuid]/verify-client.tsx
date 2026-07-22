'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, Undo2, LogIn } from 'lucide-react';

type Attendee = {
  id: string;
  fullName: string;
  cedula: string;
  locality: string;
};

export default function VerifyClient(props: {
  attendee?: Attendee;
  status?: 'pending' | 'in';
  checkedInAt?: string | null;
  notFound?: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'in'>(props.status ?? 'pending');
  const [checkedInAt, setCheckedInAt] = useState<string | null>(props.checkedInAt ?? null);
  const [busy, setBusy] = useState(false);

  if (props.notFound) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="bg-zinc-950 border-red-500/40 max-w-md w-full p-8 text-center">
          <XCircle className="mx-auto text-red-500 mb-4" size={72} />
          <h1 className="text-3xl font-black tracking-tight text-red-500 neon-text-red mb-2">
            ACCESO DENEGADO
          </h1>
          <p className="text-zinc-400 text-sm">
            El código escaneado no corresponde a ningún registro válido en el sistema.
          </p>
          <Button
            variant="outline"
            className="mt-6 border-zinc-700 text-zinc-300 hover:bg-zinc-900"
            onClick={() => router.push('/scan')}
          >
            Escanear otro QR
          </Button>
        </Card>
      </div>
    );
  }

  const a = props.attendee!;

  const handleCheckIn = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/attendees/${a.id}/check-in`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setStatus('in');
        setCheckedInAt(data.checkedInAt);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleRevert = async () => {
    if (!confirm('¿Revertir el ingreso de este asistente?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/attendees/${a.id}/revert`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setStatus('pending');
        setCheckedInAt(null);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 sm:p-6">
      <Card className="bg-zinc-950 border-zinc-800 max-w-md w-full overflow-hidden">
        {/* Header band */}
        <div className="bg-black px-4 py-3 flex items-center justify-between border-b border-zinc-800">
          <div className="text-white font-bold text-xs tracking-widest">WELCOME TO</div>
          <div className="text-right">
            <div className="text-white font-black text-xl leading-none">LSD</div>
            <div className="text-zinc-400 text-[8px] tracking-wider">La Sucursal Digital</div>
          </div>
        </div>

        {/* Status banner */}
        <div
          className={`px-4 py-6 text-center ${
            status === 'in' ? 'bg-green-500/10' : 'bg-yellow-500/10'
          }`}
        >
          {status === 'in' ? (
            <CheckCircle2 className="mx-auto text-green-500 mb-2" size={64} />
          ) : (
            <Clock className="mx-auto text-yellow-500 mb-2" size={64} />
          )}
          <div
            className={`text-2xl font-black tracking-tight ${
              status === 'in' ? 'text-green-500 neon-text-green' : 'text-yellow-500 neon-text-yellow'
            }`}
          >
            {status === 'in' ? 'REGISTRADO ✓' : 'PENDIENTE DE INGRESO'}
          </div>
          {status === 'in' && checkedInAt && (
            <div className="text-xs text-green-400 mt-1">
              Ingresó a las {new Date(checkedInAt).toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>

        {/* Attendee info */}
        <div className="px-6 py-5 space-y-4 bg-black">
          <div className="text-center">
            <div className="text-zinc-100 text-2xl font-black uppercase tracking-tight">
              {a.fullName}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="bg-[#00FF88] text-black text-[10px] font-bold px-3 py-1 rounded-full tracking-wider">
              Numero de Identidad
            </div>
          </div>

          <div className="text-center font-mono text-2xl text-white tracking-wider">
            {a.cedula}
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-[#8B00FF] to-transparent" />

          <div className="flex justify-center">
            <div className="bg-[#00FF88] text-black text-[10px] font-bold px-3 py-1 rounded-full tracking-wider">
              Localidad
            </div>
          </div>

          <div className="text-center text-white font-black text-3xl uppercase tracking-wide">
            {a.locality}
          </div>
        </div>

        {/* Action bar */}
        <div className="bg-black px-4 py-4 border-t border-zinc-800 flex flex-col gap-2">
          {status === 'pending' ? (
            <Button
              onClick={handleCheckIn}
              disabled={busy}
              className="w-full bg-[#00FF88] text-black hover:bg-[#00cc6f] font-bold"
            >
              <LogIn className="mr-2" size={18} />
              MARCAR INGRESO
            </Button>
          ) : (
            <Button
              onClick={handleRevert}
              disabled={busy}
              variant="outline"
              className="w-full border-red-500/40 text-red-400 hover:bg-red-500/10"
            >
              <Undo2 className="mr-2" size={18} />
              REVERTIR INGRESO
            </Button>
          )}
          <Button
            variant="ghost"
            className="w-full text-zinc-400 hover:text-zinc-200"
            onClick={() => router.push('/scan')}
          >
            Escanear otro QR
          </Button>
        </div>

        <div className="bg-black px-4 py-2 text-center border-t border-zinc-900">
          <div className="text-[10px] text-zinc-500 font-mono tracking-wider">
            DOMINIA 1.0 | Teatro San Fernando | Cali 05 agosto
          </div>
        </div>
      </Card>
    </div>
  );
}
