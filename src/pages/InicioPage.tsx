import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, ApiError } from "@/lib/api";
import { setPendingTransactionId } from "@/lib/checkout";
import type { Campaign, CreditPackage, Store, Transaction } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";
import { useSelectedStoreStore } from "@/store/useSelectedStoreStore";

export function InicioPage() {
  const navigate = useNavigate();
  const navbar = useAuthStore((state) => state.navbar);
  const selectStore = useSelectedStoreStore((state) => state.selectStore);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingPackageId, setBuyingPackageId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiRequest<Campaign[]>("/campaigns/active").catch(() => []),
      apiRequest<CreditPackage[]>("/packages/home").catch(() => []),
      apiRequest<Store[]>("/stores/me").catch(() => []),
    ])
      .then(([campaignsData, packagesData, storesData]) => {
        setCampaigns(campaignsData);
        setPackages(packagesData);
        setStores(storesData);
      })
      .finally(() => setLoading(false));
  }, []);

  const featuredPackage = useMemo(() => {
    const campaignPackage = campaigns.flatMap((campaign) => campaign.packageOverrides)[0];
    if (campaignPackage) {
      return {
        id: campaignPackage.packageId,
        name: campaignPackage.package.name,
        amountBrl: campaignPackage.amountBrl,
        baseCredits: campaignPackage.baseCredits,
        bonusCredits: campaignPackage.bonusCredits,
      };
    }

    const popular = packages.find((creditPackage) => creditPackage.isPopular);
    return popular
      ? {
          id: popular.id,
          name: popular.name,
          amountBrl: popular.amountBrl,
          baseCredits: popular.baseCredits,
          bonusCredits: popular.bonusCredits,
        }
      : null;
  }, [campaigns, packages]);

  const featuredCampaign = campaigns[0] ?? null;
  const firstStore = stores[0] ?? null;

  async function buyPackage(packageId: string) {
    setError(null);
    setBuyingPackageId(packageId);
    try {
      const transaction = await apiRequest<Transaction>("/transactions/checkout", {
        method: "POST",
        body: { packageId },
      });
      if (!transaction.checkoutUrl) {
        setError("Nao foi possivel gerar o pagamento. Tente novamente.");
        return;
      }
      setPendingTransactionId(transaction.id);
      window.location.href = transaction.checkoutUrl;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel iniciar a compra");
    } finally {
      setBuyingPackageId(null);
    }
  }

  function goToFirstStore() {
    if (!firstStore) {
      navigate("/lojas");
      return;
    }
    selectStore(firstStore.id, firstStore.name);
    navigate(`/lojas/${firstStore.id}`);
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <section className="home-hero relative overflow-hidden rounded-[2rem] bg-slate-950 px-5 py-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.32)]">
        <div className="home-hero__glow home-hero__glow--yellow" />
        <div className="home-hero__glow home-hero__glow--orange" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-brand-yellow ring-1 ring-white/15">
            <span aria-hidden>🎯</span>
            Promoções e máquinas online
          </div>
          <h1 className="mt-4 max-w-[13ch] text-4xl font-black leading-[0.95] tracking-tight">
            Sua próxima pelúcia está aqui.
          </h1>
          <p className="mt-3 max-w-xs text-sm font-semibold text-white/65">
            Compre fichas, escolha uma loja e jogue nas máquinas conectadas agora.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <p className="text-2xl font-black text-brand-yellow">{navbar?.creditBalance ?? 0}</p>
              <p className="text-[11px] font-bold uppercase text-white/50">Fichas</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/15">
              <p className="truncate text-base font-black text-white">Nível {navbar?.currentLevelName ?? "Iniciante"}</p>
              <p className="text-[11px] font-bold uppercase text-white/50">{navbar?.progressPercentage ?? 0}% completo</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <Link
              to="/fichas"
              className="home-cta inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-brand-yellow to-orange-400 px-5 py-4 text-base font-black text-brand-black shadow-[0_16px_28px_rgba(245,158,11,0.28)]"
            >
              Comprar fichas agora
            </Link>
            <button
              type="button"
              onClick={goToFirstStore}
              className="home-cta rounded-[1.35rem] border border-brand-yellow/35 bg-gradient-to-r from-brand-yellow via-amber-400 to-orange-400 px-5 py-5 text-xl font-black uppercase tracking-wide text-brand-black shadow-[0_18px_36px_rgba(245,158,11,0.36)] transition active:scale-[0.98]"
            >
              Jogar
            </button>
          </div>
        </div>
      </section>

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

      <section className="grid grid-cols-3 gap-2">
        <MiniStat label="Campanhas" value={String(campaigns.length)} tone="amber" />
        <MiniStat label="Lojas" value={String(stores.length)} tone="blue" />
        <MiniStat label="Pacotes" value={String(packages.length)} tone="green" />
      </section>

      {loading ? (
        <div className="rounded-3xl bg-white/85 p-8 text-center text-sm font-bold text-gray-500 shadow-sm">
          Carregando ofertas...
        </div>
      ) : (
        <>
          <section className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black text-brand-black">Ofertas para jogar hoje</h2>
                <p className="text-sm font-medium text-gray-500">Promoções ativas e bônus para aproveitar.</p>
              </div>
              <Link to="/fichas" className="text-sm font-black text-orange-600">
                Ver loja
              </Link>
            </div>

            {featuredCampaign ? (
              <CampaignCard campaign={featuredCampaign} />
            ) : (
              <div className="rounded-3xl border border-amber-100 bg-white/85 p-5 shadow-sm">
                <p className="text-sm font-black uppercase text-orange-600">Oferta do dia</p>
                <h3 className="mt-1 text-2xl font-black text-brand-black">Fichas avulsas liberadas</h3>
                <p className="mt-2 text-sm font-semibold text-gray-500">
                  Escolha a quantidade de fichas que quiser e comece a jogar em poucos segundos.
                </p>
                <Link
                  to="/fichas"
                  className="mt-4 inline-flex w-full justify-center rounded-2xl bg-brand-black px-4 py-3 text-sm font-black text-white"
                >
                  Comprar fichas
                </Link>
              </div>
            )}

            {featuredPackage && (
              <div className="rounded-3xl bg-gradient-to-br from-emerald-500 to-sky-600 p-5 text-white shadow-[0_18px_42px_rgba(14,165,233,0.22)]">
                <p className="text-xs font-black uppercase text-white/70">Pacote recomendado</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-black">{featuredPackage.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-white/75">
                      {featuredPackage.baseCredits + featuredPackage.bonusCredits} fichas
                      {featuredPackage.bonusCredits > 0 ? ` com +${featuredPackage.bonusCredits} bônus` : ""}
                    </p>
                  </div>
                  <p className="text-2xl font-black">R$ {Number(featuredPackage.amountBrl).toFixed(2)}</p>
                </div>
                <button
                  type="button"
                  disabled={buyingPackageId === featuredPackage.id}
                  onClick={() => buyPackage(featuredPackage.id)}
                  className="mt-4 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-sky-700 transition active:scale-[0.98] disabled:opacity-60"
                >
                  {buyingPackageId === featuredPackage.id ? "Gerando pagamento..." : "Pegar essa oferta"}
                </button>
              </div>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-xl font-black text-brand-black">Comece por uma loja</h2>
              <p className="text-sm font-medium text-gray-500">Escolha a unidade e veja as máquinas disponíveis.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {stores.slice(0, 3).map((store) => (
                <button
                  type="button"
                  key={store.id}
                  onClick={() => {
                    selectStore(store.id, store.name);
                    navigate(`/lojas/${store.id}`);
                  }}
                  className="flex items-center justify-between rounded-3xl bg-white/85 p-4 text-left shadow-sm transition active:scale-[0.98]"
                >
                  <span>
                    <span className="block font-black text-brand-black">{store.name}</span>
                    <span className="block text-sm font-medium text-gray-500">{store.location}</span>
                  </span>
                  <span className="rounded-2xl bg-amber-100 px-3 py-2 text-sm font-black text-orange-700">
                    Jogar
                  </span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: "amber" | "blue" | "green" }) {
  const classes = {
    amber: "bg-amber-100 text-orange-700",
    blue: "bg-sky-100 text-sky-700",
    green: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className={`rounded-2xl px-3 py-3 text-center shadow-sm ${classes[tone]}`}>
      <p className="text-xl font-black">{value}</p>
      <p className="text-[10px] font-black uppercase opacity-70">{label}</p>
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const packageOverride = campaign.packageOverrides[0];
  const machineOverride = campaign.machineOverrides[0];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-yellow via-orange-400 to-orange-600 p-5 text-brand-black shadow-[0_18px_42px_rgba(245,158,11,0.26)]">
      <span aria-hidden className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/20" />
      <span aria-hidden className="absolute -bottom-10 left-8 h-24 w-24 rounded-full bg-white/15" />
      <div className="relative">
        <p className="text-xs font-black uppercase text-brand-black/60">Campanha ativa</p>
        <h3 className="mt-1 text-2xl font-black">{campaign.name}</h3>
        <p className="mt-2 text-sm font-semibold text-brand-black/70">
          {campaign.notes || "Aproveite benefícios especiais por tempo limitado."}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/40 p-3">
            <p className="text-lg font-black">
              {packageOverride
                ? `${packageOverride.baseCredits + packageOverride.bonusCredits} fichas`
                : "Bônus"}
            </p>
            <p className="text-[11px] font-bold uppercase text-brand-black/60">Pacotes</p>
          </div>
          <div className="rounded-2xl bg-white/40 p-3">
            <p className="truncate text-lg font-black">{machineOverride?.machine.name ?? "Máquinas"}</p>
            <p className="text-[11px] font-bold uppercase text-brand-black/60">Destaque</p>
          </div>
        </div>
      </div>
    </div>
  );
}
