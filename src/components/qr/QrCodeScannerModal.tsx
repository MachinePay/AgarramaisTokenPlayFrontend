import { useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";

type QrCodeScannerModalProps = {
  open: boolean;
  onClose: () => void;
  onScan: (value: string) => boolean;
};

export function QrCodeScannerModal({ open, onClose, onScan }: QrCodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    if (!open) return;

    let active = true;
    let controls: IScannerControls | null = null;

    async function startScanner() {
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Este navegador nao liberou acesso a camera.");
        return;
      }

      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        const reader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 250,
          delayBetweenScanSuccess: 500,
        });

        controls = await reader.decodeFromConstraints({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        }, videoRef.current ?? undefined, (result, _error, scannerControls) => {
          if (!active || !result) return;

          const accepted = onScan(result.getText());
          if (accepted) {
            active = false;
            scannerControls.stop();
            return;
          }
          setError("QR Code nao reconhecido para esta plataforma.");
        });
      } catch {
        setError("Nao foi possivel abrir a camera. Verifique a permissao do navegador.");
      }
    }

    startScanner();

    return () => {
      active = false;
      controls?.stop();
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [onScan, open]);

  if (!open) return null;

  function submitManualCode() {
    const value = manualCode.trim();
    if (!value) return;
    const accepted = onScan(value);
    if (!accepted) setError("Codigo informado nao e um QR de maquina ou loja.");
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/60 px-4 pb-4 sm:items-center sm:pb-0">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase text-orange-600">QR Code</p>
            <h2 className="text-2xl font-black text-brand-black">Ler maquina</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-gray-100 px-3 py-2 text-sm font-black text-gray-600"
          >
            X
          </button>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl bg-slate-950">
          <video ref={videoRef} muted playsInline className="h-72 w-full object-cover" />
        </div>

        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

        <div className="mt-3 grid gap-2">
          <input
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="Ou cole o link/codigo do QR"
            className="h-11 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 text-sm font-bold text-brand-black outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/25"
          />
          <button
            type="button"
            onClick={submitManualCode}
            className="rounded-2xl bg-gradient-to-r from-brand-yellow to-orange-400 px-4 py-3 text-sm font-black text-brand-black"
          >
            Abrir codigo
          </button>
        </div>
      </div>
    </div>
  );
}
