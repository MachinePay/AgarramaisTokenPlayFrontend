import { useEffect, useRef, useState } from "react";

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
    let frameId = 0;
    let stream: MediaStream | null = null;

    async function startScanner() {
      setError(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Este navegador nao liberou acesso a camera.");
        return;
      }

      const BarcodeDetectorCtor = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        setError("Leitor de QR Code nao suportado neste navegador. Tente pelo Chrome no celular.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });

        const video = videoRef.current;
        if (!video || !active) return;

        video.srcObject = stream;
        await video.play();

        const detector = new BarcodeDetectorCtor({ formats: ["qr_code"] });

        const scan = async () => {
          if (!active || !videoRef.current) return;

          if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const codes = await detector.detect(video).catch(() => []);
            const value = codes[0]?.rawValue;
            if (value) {
              const accepted = onScan(value);
              if (accepted) {
                active = false;
                return;
              }
              setError("QR Code nao reconhecido para esta plataforma.");
            }
          }

          frameId = window.requestAnimationFrame(scan);
        };

        frameId = window.requestAnimationFrame(scan);
      } catch {
        setError("Nao foi possivel abrir a camera. Verifique a permissao do navegador.");
      }
    }

    startScanner();

    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
      stream?.getTracks().forEach((track) => track.stop());
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
