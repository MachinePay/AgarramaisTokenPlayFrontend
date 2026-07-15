import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { apiRequest, ApiError } from "@/lib/api";
import type { CreditPackage } from "@/lib/types";

export function EntrarPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const register = useAuthStore((state) => state.register);
  const loading = useAuthStore((state) => state.loading);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [homePackages, setHomePackages] = useState<CreditPackage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isRegisterMode = mode === "register";

  useEffect(() => {
    apiRequest<CreditPackage[]>("/packages/home")
      .then(setHomePackages)
      .catch(() => setHomePackages([]));
  }, []);

  if (token) {
    return <Navigate to="/inicio" replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      if (isRegisterMode) {
        await register({ name, email, cpf, phone, password });
      } else {
        await login(email, password);
      }
      navigate("/inicio");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : isRegisterMode
            ? "Nao foi possivel criar o cadastro"
            : "Nao foi possivel entrar",
      );
    }
  }

  return (
    <div className="app-viewport min-h-dvh overflow-hidden bg-[linear-gradient(180deg,#080b1a_0%,#111827_46%,#fff7df_46%,#ffffff_100%)]">
      <section className="relative px-5 pb-8 pt-7 text-white">
        <span aria-hidden className="absolute -right-10 top-8 h-36 w-36 rounded-full bg-brand-yellow/25 blur-sm" />
        <span aria-hidden className="absolute right-20 top-0 h-20 w-20 rounded-full bg-orange-500/20 blur-sm" />
        <span aria-hidden className="absolute -left-8 bottom-6 h-24 w-24 rounded-full bg-sky-500/15 blur-sm" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-yellow to-orange-400 text-3xl shadow-[0_14px_34px_rgba(245,158,11,0.32)]">
            🧸
          </div>
          <div>
            <p className="text-2xl font-black leading-tight">Agarra Mais</p>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">Token Play</p>
          </div>
        </div>

        <div className="relative mt-7">
          <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase text-brand-yellow ring-1 ring-white/15">
            Fichas, premios e diversao
          </div>
          <h1 className="mt-4 max-w-[11ch] text-4xl font-black leading-[0.95] tracking-tight">
            Entre e comece a jogar.
          </h1>
          <p className="mt-3 max-w-xs text-sm font-semibold text-white/65">
            Compre fichas em segundos, escolha a loja e tente pegar sua proxima pelucia.
          </p>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2">
          <LoginBenefit icon="🎯" label="Maquinas online" />
          <LoginBenefit icon="💳" label="Pix ou cartao" />
          <LoginBenefit icon="🎁" label="Bonus ativos" />
        </div>
      </section>

      <section className="relative -mt-3 rounded-t-[2rem] bg-white px-5 pb-7 pt-5 shadow-[0_-18px_48px_rgba(15,23,42,0.16)]">
        <div className="mb-5 grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`rounded-xl py-3 text-sm font-black transition-all active:scale-[0.98] ${
              !isRegisterMode
                ? "bg-gradient-to-r from-brand-yellow to-orange-400 text-brand-black shadow-[0_10px_22px_rgba(245,158,11,0.24)]"
                : "text-gray-500"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setError(null);
            }}
            className={`rounded-xl py-3 text-sm font-black transition-all active:scale-[0.98] ${
              isRegisterMode
                ? "bg-gradient-to-r from-brand-yellow to-orange-400 text-brand-black shadow-[0_10px_22px_rgba(245,158,11,0.24)]"
                : "text-gray-500"
            }`}
          >
            Criar cadastro
          </button>
        </div>

        <div className="mb-4 rounded-3xl bg-gradient-to-r from-amber-100 to-orange-100 px-4 py-3">
          <p className="text-xs font-black uppercase text-orange-700">
            {isRegisterMode ? "Novo jogador" : "Bem-vindo de volta"}
          </p>
          <p className="mt-1 text-sm font-bold text-brand-black">
            {isRegisterMode
              ? "Crie sua conta para guardar fichas, nivel e historico de jogadas."
              : "Acesse sua carteira de fichas e veja as promocoes do dia."}
          </p>
        </div>

        {homePackages.length > 0 && (
          <div className="mb-4 flex gap-3 overflow-x-auto pb-1 no-scrollbar">
            {homePackages.slice(0, 3).map((creditPackage) => (
              <div
                key={creditPackage.id}
                className="min-w-[210px] rounded-3xl bg-slate-950 p-4 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]"
              >
                <p className="text-[10px] font-black uppercase text-brand-yellow">
                  {creditPackage.isPopular ? "Oferta destaque" : "Pacote inicial"}
                </p>
                <h2 className="mt-1 truncate text-lg font-black">{creditPackage.name}</h2>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-3xl font-black text-brand-yellow">
                      {creditPackage.baseCredits + creditPackage.bonusCredits}
                    </p>
                    <p className="text-[11px] font-bold uppercase text-white/50">fichas</p>
                  </div>
                  <p className="text-lg font-black">R$ {Number(creditPackage.amountBrl).toFixed(2)}</p>
                </div>
                {creditPackage.bonusCredits > 0 && (
                  <p className="mt-2 rounded-full bg-brand-yellow px-3 py-1 text-center text-[11px] font-black uppercase text-brand-black">
                    +{creditPackage.bonusCredits} bonus
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isRegisterMode && (
            <LoginField label="Nome">
              <input
                type="text"
                required
                minLength={2}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={inputClass}
                placeholder="Seu nome"
              />
            </LoginField>
          )}

          <LoginField label="E-mail">
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass}
              placeholder="voce@email.com"
            />
          </LoginField>

          {isRegisterMode && (
            <div className="grid grid-cols-2 gap-3">
              <LoginField label="CPF">
                <input
                  type="text"
                  required
                  minLength={11}
                  maxLength={14}
                  inputMode="numeric"
                  value={cpf}
                  onChange={(event) => setCpf(event.target.value)}
                  className={inputClass}
                  placeholder="000.000.000-00"
                />
              </LoginField>

              <LoginField label="Telefone">
                <input
                  type="tel"
                  required
                  minLength={8}
                  maxLength={20}
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className={inputClass}
                  placeholder="(11) 99999-9999"
                />
              </LoginField>
            </div>
          )}

          <LoginField label="Senha">
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              placeholder="********"
            />
          </LoginField>

          {error && (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="home-cta mt-2 rounded-2xl bg-gradient-to-r from-brand-yellow to-orange-400 py-4 text-base font-black text-brand-black shadow-[0_16px_28px_rgba(245,158,11,0.28)] transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? (isRegisterMode ? "Criando..." : "Entrando...") : isRegisterMode ? "Criar cadastro" : "Entrar e jogar"}
          </button>
        </form>
      </section>
    </div>
  );
}

const inputClass =
  "h-13 w-full rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-base font-bold text-brand-black outline-none transition placeholder:text-gray-400 focus:border-brand-yellow focus:bg-white focus:ring-2 focus:ring-brand-yellow/25";

function LoginField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-black text-brand-black">
      {label}
      {children}
    </label>
  );
}

function LoginBenefit({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 px-2 py-3 text-center ring-1 ring-white/15">
      <p className="text-2xl">{icon}</p>
      <p className="mt-1 text-[10px] font-black uppercase leading-tight text-white/65">{label}</p>
    </div>
  );
}
