import { useEffect, useState } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import { setPendingTransactionId } from "@/lib/checkout";
import type { CreditPackage, Transaction } from "@/lib/types";
import { PackageCard } from "@/components/credits/PackageCard";

export function CreditosPage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<CreditPackage[]>("/packages")
      .then(setPackages)
      .finally(() => setLoading(false));
  }, []);

  async function handleBuy(creditPackage: CreditPackage) {
    setError(null);
    setBuyingPackageId(creditPackage.id);
    try {
      const transaction = await apiRequest<Transaction>("/transactions/checkout", {
        method: "POST",
        body: { packageId: creditPackage.id },
      });

      if (transaction.checkoutUrl) {
        setPendingTransactionId(transaction.id);
        // Redireciona para o Checkout Pro do Mercado Pago: la o cliente
        // escolhe entre cartao (com parcelamento) ou Pix na mesma tela.
        window.location.href = transaction.checkoutUrl;
      } else {
        setError("Nao foi possivel gerar o pagamento. Tente novamente.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel iniciar a compra");
    } finally {
      setBuyingPackageId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-5">
      <div>
        <h1 className="text-xl font-bold text-brand-black">Loja de Créditos</h1>
        <p className="text-sm text-gray-500">Pague com cartão ou Pix via Mercado Pago.</p>
      </div>

      {loading && <p className="py-8 text-center text-sm text-gray-500">Carregando pacotes...</p>}

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex flex-col gap-3">
        {packages.map((creditPackage) => (
          <PackageCard
            key={creditPackage.id}
            creditPackage={creditPackage}
            loading={buyingPackageId === creditPackage.id}
            onBuy={handleBuy}
          />
        ))}
      </div>
    </div>
  );
}
