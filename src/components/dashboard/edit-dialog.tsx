'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { EVENT_CONFIG } from '@/lib/constants';
import type { Attendee } from './types';

export function EditDialog({
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
