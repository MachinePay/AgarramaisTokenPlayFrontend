import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "@/lib/api";
import type { Campaign, CreditPackage } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";

export function LandingPage() {
  const token = useAuthStore((state) => state.token);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiRequest<CreditPackage[]>("/packages/home").catch(() => []),
      apiRequest<Campaign[]>("/campaigns/active").catch(() => []),
    ])
      .then(([packagesData, campaignsData]) => {
        setPackages(packagesData);
        setCampaigns(campaignsData);
      })
      .finally(() => setLoading(false));
  }, []);

  const startPath = token ? "/inicio" : "/entrar";
  const activeCampaign = campaigns[0];

  return (
    <div className="app-viewport landing-shell min-h-dvh overflow-hidden bg-[#060814] text-white">
      <section className="landing-hero relative min-h-dvh px-5 pb-7 pt-7">
        <div className="landing-spot landing-spot--yellow" />
        <div className="landing-spot landing-spot--orange" />
        <div className="landing-spot landing-spot--blue" />

        <header className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-yellow to-orange-400 text-3xl shadow-[0_16px_34px_rgba(245,158,11,0.34)]">
              🧸
            </div>
            <div>
              <p className="text-xl font-black leading-tight text-white drop-shadow">Agarra Mais</p>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-brand-yellow">Token Play</p>
            </div>
          </div>
          <Link
            to="/entrar"
            className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white ring-1 ring-white/15"
          >
            Entrar
          </Link>
        </header>

        <div className="relative mt-12">
          <div className="inline-flex rounded-full bg-brand-yellow px-3 py-1 text-xs font-black uppercase text-brand-black">
            Pacotes com desconto e bônus
          </div>
          <h1 className="mt-5 text-5xl font-black leading-[0.9] tracking-tight">
            Compre fichas e jogue agora.
          </h1>
          <p className="mt-4 max-w-sm text-base font-semibold text-white/78">
            Aproveite pacotes criados para dar mais chances de pegar prêmios nas máquinas online.
          </p>
        </div>

        <div className="relative mt-7 grid grid-cols-3 gap-2">
          <LandingStat value="Pix" label="Pagamento rápido" />
          <LandingStat value="+Bônus" label="Pacotes especiais" />
          <LandingStat value="Online" label="Máquinas ao vivo" />
        </div>

        <div className="relative mt-7">
          <Link
            to={startPath}
            className="landing-cta flex w-full items-center justify-center rounded-[1.5rem] bg-gradient-to-r from-brand-yellow to-orange-400 px-5 py-5 text-xl font-black uppercase tracking-wide text-brand-black shadow-[0_20px_44px_rgba(245,158,11,0.38)]"
          >
            Comece agora
          </Link>
          <p className="mt-3 text-center text-xs font-semibold text-white/50">
            Crie sua conta, compre fichas e escolha onde jogar.
          </p>
        </div>

        <section className="relative mt-8 rounded-[2rem] border border-white/10 bg-slate-900/88 p-4 text-white shadow-[0_24px_60px_rgba(0,0,0,0.38)] backdrop-blur">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-brand-yellow">Ofertas na tela inicial</p>
              <h2 className="text-2xl font-black text-white">Pacotes em destaque</h2>
            </div>
            {activeCampaign && (
              <span className="rounded-full bg-brand-yellow px-3 py-1 text-[11px] font-black uppercase text-brand-black">
                {activeCampaign.name}
              </span>
            )}
          </div>

          {loading && (
            <div className="mt-4 rounded-2xl bg-white/10 px-4 py-6 text-center text-sm font-bold text-white/65">
              Carregando ofertas...
            </div>
          )}

          {!loading && packages.length === 0 && (
            <div className="mt-4 rounded-2xl bg-brand-yellow/12 px-4 py-5 text-sm font-bold text-brand-yellow ring-1 ring-brand-yellow/20">
              Cadastre pacotes no admin e marque "Mostrar na tela inicial" para eles aparecerem aqui.
            </div>
          )}

          <div className="mt-4 grid gap-3">
            {packages.map((creditPackage) => (
              <div
                key={creditPackage.id}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#050712] to-slate-800 p-4 text-white shadow-[0_16px_32px_rgba(0,0,0,0.24)]"
              >
                <span aria-hidden className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-yellow/20" />
                <div className="relative flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase text-brand-yellow">
                      {creditPackage.isPopular ? "Mais procurado" : "Pacote especial"}
                    </p>
                    <h3 className="mt-1 text-xl font-black">{creditPackage.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-white/60">
                      {creditPackage.baseCredits + creditPackage.bonusCredits} fichas
                      {creditPackage.bonusCredits > 0 ? `, +${creditPackage.bonusCredits} bônus` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase text-white/50">Por</p>
                    <p className="text-2xl font-black text-brand-yellow">
                      R$ {Number(creditPackage.amountBrl).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}

function LandingStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/75 px-2 py-3 text-center shadow-[0_14px_28px_rgba(0,0,0,0.22)]">
      <p className="text-sm font-black text-brand-yellow">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase leading-tight text-white/70">{label}</p>
    </div>
  );
}
