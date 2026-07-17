import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { ApiError } from "@/lib/api";

export function AceitePrivacidadePage() {
  const navigate = useNavigate();
  const acceptPrivacyPolicy = useAuthStore((state) => state.acceptPrivacyPolicy);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitAcceptance() {
    if (!accepted) {
      setError("Voce precisa confirmar a leitura para continuar.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await acceptPrivacyPolicy();
      navigate("/inicio", { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel registrar o aceite.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 px-4 py-5">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-[0_22px_55px_rgba(15,23,42,0.22)]">
        <span aria-hidden className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-brand-yellow/30" />
        <span aria-hidden className="absolute -bottom-14 left-10 h-28 w-28 rounded-full bg-orange-500/20" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-yellow">Atualizacao LGPD</p>
          <h1 className="mt-2 text-3xl font-black text-white">Confirme sua privacidade</h1>
          <p className="mt-2 text-sm font-medium text-white/65">
            Para continuar usando sua conta, precisamos registrar seu aceite atual da Politica de Privacidade e dos Termos.
          </p>
        </div>
      </section>

      <section className="rounded-3xl bg-white/90 p-5 shadow-sm">
        <h2 className="text-xl font-black text-brand-black">Documentos vigentes</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-600">
          Seus dados sao usados para operar conta, fichas, pontos, jogadas, pedidos, pagamentos e atendimento.
          Voce pode acessar seus dados e abrir solicitacoes LGPD em Minha Privacidade.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link to="/privacidade" className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm font-black text-orange-700">
            Politica de Privacidade
          </Link>
          <Link to="/termos" className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-sm font-black text-orange-700">
            Termos de Uso
          </Link>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm font-bold leading-relaxed text-gray-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-orange-500"
          />
          <span>Li e aceito a Politica de Privacidade e os Termos de Uso vigentes.</span>
        </label>

        {error && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}

        <button
          type="button"
          disabled={saving || !accepted}
          onClick={() => void submitAcceptance()}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-brand-yellow to-orange-400 px-4 py-4 text-base font-black text-brand-black shadow-[0_14px_26px_rgba(245,158,11,0.24)] disabled:opacity-60"
        >
          {saving ? "Registrando..." : "Aceitar e continuar"}
        </button>
      </section>
    </div>
  );
}
