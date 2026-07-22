'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScanLine, Camera, CameraOff, XCircle, Keyboard } from 'lucide-react';
import { toast } from 'sonner';

type Html5QrcodeModule = typeof import('html5-qrcode');
type Html5Qrcode = import('html5-qrcode').Html5Qrcode;

export default function ScanClient() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualValue, setManualValue] = useState('');
  const [starting, setStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  // Ref flag to prevent re-entrancy in stop() — avoids race conditions
  // where stop() is called twice in quick succession (e.g. on decode + unmount).
  const stoppingRef = useRef(false);
  const containerId = 'qr-reader';

  const stop = async () => {
    if (stoppingRef.current) return;
    stoppingRef.current = true;
    try {
      if (scannerRef.current) {
        const s = scannerRef.current;
        scannerRef.current = null;
        try {
          // stop() can throw if already stopped — guard it
          if (s.isScanning) {
            await s.stop();
          }
        } catch {
          /* ignore — already stopped */
        }
        try {
          await s.clear();
        } catch {
          /* ignore */
        }
      }
      setScanning(false);
    } finally {
      stoppingRef.current = false;
    }
  };

  /** Navigate to the verification page from a decoded QR payload or manual input */
  const goToVerify = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    try {
      // Could be a full URL (https://host/v/uuid), a path (/v/uuid), or just the UUID
      const url = new URL(trimmed, window.location.origin);
      const path = url.pathname + url.search;
      if (path.startsWith('/v/')) {
        router.push(path);
        return;
      }
    } catch {
      /* not a URL */
    }
    // Treat as UUID directly
    router.push(`/v/${trimmed}`);
  };

  /**
   * Try to start the camera with progressive fallback:
   *  1. Back camera (facingMode: environment) — ideal on mobile
   *  2. Any camera (facingMode: user or first device)
   *  3. Specific deviceId from enumerateDevices
   */
  const start = async () => {
    setError(null);
    setLastResult(null);
    setStarting(true);
    try {
      const mod: Html5QrcodeModule = await import('html5-qrcode');
      const Html5Qrcode = mod.Html5Qrcode;
      const scanner = new Html5Qrcode(containerId, { verbose: false });
      scannerRef.current = scanner;

      const config = { fps: 10, qrbox: { width: 240, height: 240 } };
      const onDecoded = (decodedText: string) => {
        setLastResult(decodedText);
        void stop();
        goToVerify(decodedText);
      };
      const onPerFrameError = () => {
        /* per-frame error — ignore */
      };

      // 1) Try back camera
      try {
        await scanner.start(
          { facingMode: 'environment' },
          config,
          onDecoded,
          onPerFrameError,
        );
        setScanning(true);
        return;
      } catch (errEnv) {
        console.warn('Back camera not available, trying fallback:', errEnv);
      }

      // 2) Try any camera via facingMode: user
      try {
        await scanner.start(
          { facingMode: 'user' },
          config,
          onDecoded,
          onPerFrameError,
        );
        setScanning(true);
        return;
      } catch (errUser) {
        console.warn('Front camera not available, trying device list:', errUser);
      }

      // 3) Enumerate available video devices and try the first one
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          await scanner.start(
            devices[0].id,
            config,
            onDecoded,
            onPerFrameError,
          );
          setScanning(true);
          return;
        }
      } catch (errDevices) {
        console.warn('Device enumeration failed:', errDevices);
      }

      // Nothing worked — explain clearly
      const msg =
        'No se encontró ninguna cámara disponible en este dispositivo. ' +
        'Puedes usar la opción "Ingreso manual" abajo para escribir el código del asistente.';
      setError(msg);
      toast.error('Cámara no disponible');
      // Clean up the scanner instance we created but never started
      try {
        await scanner.clear();
      } catch {
        /* ignore */
      }
      scannerRef.current = null;
    } catch (e) {
      console.error('Scan start error:', e);
      const err = e as { name?: string; message?: string };
      let msg: string;
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        msg =
          'Permiso de cámara denegado. Habilita el acceso a la cámara en tu navegador ' +
          '(ícono de candado en la barra de direcciones) e intenta de nuevo.';
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        msg =
          'No se encontró ninguna cámara en este dispositivo. ' +
          'Usa la opción "Ingreso manual" para escribir el código del asistente.';
      } else if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError') {
        msg =
          'La cámara está siendo usada por otra aplicación. Ciérrala e intenta de nuevo, ' +
          'o usa la opción "Ingreso manual".';
      } else if (err?.name === 'InsecureContextError') {
        msg =
          'La cámara solo funciona en conexiones seguras (HTTPS). ' +
          'Usa la opción "Ingreso manual" como alternativa.';
      } else {
        msg =
          'No se pudo acceder a la cámara. ' +
          'Usa la opción "Ingreso manual" para escribir el código del asistente.';
      }
      setError(msg);
      toast.error('Cámara no disponible');
      // Clean up
      if (scannerRef.current) {
        try {
          await scannerRef.current.clear();
        } catch {
          /* ignore */
        }
        scannerRef.current = null;
      }
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    return () => {
      void stop();
    };
  }, []);

  const submitManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualValue.trim()) return;
    goToVerify(manualValue);
  };

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
          {/*
            Camera viewport — IMPORTANT architecture note:
            The `#qr-reader` div is the mount point used by html5-qrcode, which
            injects its own <video> element inside it. React must NEVER render
            children inside that div, otherwise React's reconciler will try to
            removeChild on nodes that html5-qrcode has already moved/replaced,
            causing "NotFoundError: The object can not be found here" runtime
            errors. So `#qr-reader` is an EMPTY sibling of the React-controlled
            overlays below, not their parent.
          */}
          <div className="relative w-full aspect-square bg-black rounded-md overflow-hidden">
            {/* Scanner mount point — React renders NO children here */}
            <div id={containerId} className="absolute inset-0" />

            {/* React-controlled overlays — siblings of #qr-reader, not children */}
            {!scanning && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-center p-6 pointer-events-none">
                <div>
                  <Camera className="mx-auto mb-3" size={48} />
                  <p className="text-sm">
                    Presiona <span className="text-[#00FF88] font-bold">Iniciar cámara</span> para
                    escanear el QR del asistente.
                  </p>
                </div>
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

          {/* Camera controls */}
          <div className="mt-4 flex flex-col gap-2">
            {!scanning ? (
              <Button
                onClick={start}
                disabled={starting}
                className="w-full bg-[#00FF88] text-black hover:bg-[#00cc6f] font-bold"
              >
                <Camera className="mr-2" size={18} />
                {starting ? 'INICIANDO...' : 'INICIAR CÁMARA'}
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

            {/* Toggle manual entry */}
            <Button
              variant="ghost"
              className="w-full text-zinc-400 hover:text-zinc-200"
              onClick={() => setManualMode((v) => !v)}
            >
              <Keyboard className="mr-2" size={16} />
              {manualMode ? 'Ocultar ingreso manual' : 'Ingreso manual'}
            </Button>

            {manualMode && (
              <form onSubmit={submitManual} className="space-y-2 pt-2 border-t border-zinc-800 mt-2">
                <p className="text-xs text-zinc-500">
                  Pega la URL del QR o escribe el código (UUID) del asistente:
                </p>
                <Input
                  value={manualValue}
                  onChange={(e) => setManualValue(e.target.value)}
                  placeholder="https://.../v/8cd1193f-...  o  8cd1193f-..."
                  className="bg-zinc-900 border-zinc-800 text-white font-mono text-xs"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={!manualValue.trim()}
                  className="w-full bg-[#8B00FF] text-white hover:bg-[#6f00cc] font-bold"
                >
                  VERIFICAR
                </Button>
              </form>
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
