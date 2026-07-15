import { useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import type { Machine, PlayMachineResult } from "@/lib/types";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { ConfettiBurst } from "@/components/ui/ConfettiBurst";
import { TelemetryLoadingScreen } from "@/components/machines/TelemetryLoadingScreen";

type Step = "confirm" | "loading" | "success" | "error";

type PlayActivationModalProps = {
  machine: Machine;
  creditBalance: number;
  onClose: () => void;
  /** Chamado apos uma jogada aprovada, para o pai atualizar saldo/lista de maquinas. */
  onPlaySuccess: () => void;
};

export function PlayActivationModal({
  machine,
  creditBalance,
  onClose,
  onPlaySuccess,
}: PlayActivationModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [step, setStep] = useState<Step>("confirm");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<PlayMachineResult | null>(null);

  const totalCost = machine.costPerGame * quantity;
  const insufficientBalance = totalCost > creditBalance;

  async function handleConfirm() {
    setStep("loading");
    try {
      const playResult = await apiRequest<PlayMachineResult>("/machines/play", {
        method: "POST",
        body: { machineId: machine.id, quantity },
      });
      setResult(playResult);
      setStep("success");
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "Falha ao liberar a máquina");
      setStep("error");
    }
  }

  function handleCloseAfterPlay() {
    onPlaySuccess();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center">
      <div className="relative w-full max-w-sm animate-modal-pop overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        {step === "confirm" && (
          <div className="flex flex-col gap-5 px-6 py-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-brand-black">{machine.name}</h2>
                <p className="text-sm text-gray-500">Saldo atual: {creditBalance} Fichas</p>
              </div>
              <button
                type="button"
                aria-label="Fechar"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-2xl leading-none text-gray-400 transition-transform duration-150 active:scale-90"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-soft px-4 py-5">
              <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Quantidade de jogadas
              </span>
              <QuantityStepper value={quantity} onChange={setQuantity} />
              <span className="text-sm font-semibold text-brand-black">
                Custo total: {totalCost} Fichas
              </span>
            </div>

            {insufficientBalance && (
              <p className="text-center text-sm font-medium text-red-600">
                Saldo insuficiente para essa quantidade de jogadas.
              </p>
            )}

            <button
              type="button"
              disabled={insufficientBalance}
              onClick={handleConfirm}
              className={`w-full rounded-xl bg-brand-yellow py-3.5 text-base font-bold text-brand-black transition-all duration-150 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${
                insufficientBalance ? "" : "animate-pulse-glow"
              }`}
            >
              Confirmar e Iniciar Jogada 🕹️
            </button>
          </div>
        )}

        {step === "loading" && <TelemetryLoadingScreen />}

        {step === "success" && result && (
          <div className="flex flex-col items-center gap-4 px-6 py-10">
            <ConfettiBurst />
            <span className="text-4xl">🎉</span>
            <p className="text-center text-base font-bold text-brand-black">
              Máquina Liberada! Boa sorte! 🧸
            </p>
            <p className="text-center text-sm text-gray-500">
              {result.creditsDebited} fichas debitadas · saldo restante: {result.remainingBalance}
            </p>
            <button
              type="button"
              onClick={handleCloseAfterPlay}
              className="w-full rounded-xl bg-brand-yellow py-3.5 text-base font-bold text-brand-black transition-transform duration-150 active:scale-[0.98]"
            >
              Fechar
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-4 px-6 py-10">
            <span className="text-4xl">⚠️</span>
            <p className="text-center text-sm font-medium text-red-600">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setStep("confirm")}
              className="w-full rounded-xl border border-brand-black py-3.5 text-base font-bold text-brand-black transition-transform duration-150 active:scale-[0.98]"
            >
              Tentar novamente
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
