'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export default function LoginPageClient({ callback }: { callback: string }) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Error al iniciar sesión');
        return;
      }
      toast.success('Acceso concedido');
      router.push(callback);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <Card className="bg-zinc-950 border-zinc-800 max-w-sm w-full p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="text-center mb-4">
            <div className="text-zinc-400 text-[10px] tracking-widest">WELCOME TO</div>
            <div className="text-white font-black text-3xl tracking-tight">LSD</div>
            <div className="text-zinc-500 text-[10px] tracking-wider">La Sucursal Digital</div>
          </div>
          <Lock className="text-[#00FF88] mb-3" size={32} />
          <h1 className="text-white text-xl font-bold tracking-tight">Acceso Staff</h1>
          <p className="text-zinc-500 text-xs mt-1 text-center">
            DOMINIA 1.0 — Ingresa el PIN compartido
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin" className="text-zinc-300 text-xs tracking-wider">
              PIN
            </Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="bg-black border-zinc-700 text-white text-center text-2xl tracking-[0.5em] font-mono"
              placeholder="••••"
              autoFocus
              required
            />
          </div>
          <Button
            type="submit"
            disabled={busy || pin.length < 1}
            className="w-full bg-[#00FF88] text-black hover:bg-[#00cc6f] font-bold"
          >
            {busy ? 'Verificando...' : 'INGRESAR'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
