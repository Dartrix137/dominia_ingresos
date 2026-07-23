'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Upload, Download } from 'lucide-react';

export function ImportCsv({ onImported }: { onImported: () => void }) {
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
