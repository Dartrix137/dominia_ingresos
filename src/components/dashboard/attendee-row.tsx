'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Download, Edit, Trash2, CheckCircle2, Clock } from 'lucide-react';
import type { Attendee } from './types';
import { EditDialog } from './edit-dialog';

export function AttendeeRow({ attendee, onChanged }: { attendee: Attendee; onChanged: () => void }) {
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
