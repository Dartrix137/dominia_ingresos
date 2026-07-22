'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScanLine, Camera, CameraOff, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ScanClient() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const containerId = 'qr-reader';

  const stop = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const start = async () => {
    setError(null);
    setLastResult(null);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(containerId, {
        verbose: false,
      });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          setLastResult(decodedText);
          void stop();
          // Navigate to the verification page
          // The decoded text may be a full URL like https://host/v/uuid or just /v/uuid
          try {
            const url = new URL(decodedText, window.location.origin);
            const path = url.pathname + url.search;
            if (path.startsWith('/v/')) {
              router.push(path);
            } else {
              // Try treating it as the UUID directly
              router.push(`/v/${decodedText}`);
            }
          } catch {
            router.push(`/v/${decodedText}`);
          }
        },
        () => {
          /* per-frame error — ignore */
        },
      );
      setScanning(true);
    } catch (e) {
      console.error(e);
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
      toast.error('Cámara no disponible');
    }
  };

  useEffect(() => {
    return () => {
      void stop();
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-4">
          <ScanLine className="mx-auto text-[#00FF88] mb-2" size={40} />
          <h1 className="text-white text-2xl font-black tracking-tight">ESCANEAR QR</h1>
          <p className="text-zinc-500 text-xs tracking-wider">
            DOMINIA 1.0 — Verificación de ingreso
          </p>
        </div>

        <Card className="bg-zinc-950 border-zinc-800 p-4">
          <div
            id={containerId}
            className="w-full aspect-square bg-black rounded-md overflow-hidden flex items-center justify-center relative"
          >
            {!scanning && (
              <div className="text-zinc-600 text-center p-6">
                <Camera className="mx-auto mb-3" size={48} />
                <p className="text-sm">
                  Presiona <span className="text-[#00FF88] font-bold">Iniciar cámara</span> para
                  escanear el QR del asistente.
                </p>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-60 border-2 border-[#00FF88] rounded-md" />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-60 h-0.5 bg-[#00FF88] animate-pulse" />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-md flex items-start gap-2">
              <XCircle className="text-red-500 shrink-0 mt-0.5" size={16} />
              <p className="text-red-300 text-xs">{error}</p>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2">
            {!scanning ? (
              <Button
                onClick={start}
                className="w-full bg-[#00FF88] text-black hover:bg-[#00cc6f] font-bold"
              >
                <Camera className="mr-2" size={18} />
                INICIAR CÁMARA
              </Button>
            ) : (
              <Button
                onClick={stop}
                variant="outline"
                className="w-full border-zinc-700 text-zinc-200 hover:bg-zinc-900"
              >
                <CameraOff className="mr-2" size={18} />
                DETENER
              </Button>
            )}
            <Button
              variant="ghost"
              className="w-full text-zinc-400 hover:text-zinc-200"
              onClick={() => router.push('/')}
            >
              Volver al panel
            </Button>
          </div>
        </Card>

        {lastResult && (
          <p className="text-center text-xs text-zinc-500 mt-3 font-mono truncate">
            Última lectura: {lastResult}
          </p>
        )}
      </div>
    </div>
  );
}
