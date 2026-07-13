import { BrandMark } from "@/components/ui/BrandMark";

/**
 * Estado de transicao exibido enquanto o backend desconta os creditos e
 * dispara os pulsos na CompactPay. Substitui o conteudo do modal.
 */
export function TelemetryLoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-16">
      <BrandMark size={88} />
      <p className="text-center text-base font-semibold text-brand-black">
        Liberando a máquina...
        <br />
        Prepare-se para jogar!
      </p>
    </div>
  );
}
