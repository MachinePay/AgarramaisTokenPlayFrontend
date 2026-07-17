import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { apiRequest, ApiError } from "@/lib/api";
import type { PrivacyRequest, PrivacyRequestType, UserPrivacyData } from "@/lib/types";

const requestTypeLabels: Record<PrivacyRequestType, string> = {
  ACCESS: "Acesso aos dados",
  CORRECTION: "Correcao de dados",
  DELETION: "Exclusao ou anonimizacao",
  CONSENT_REVOCATION: "Revogacao de consentimento",
  OTHER: "Outro pedido",
};

const statusLabels: Record<PrivacyRequest["status"], string> = {
  OPEN: "Aberto",
  IN_REVIEW: "Em analise",
  COMPLETED: "Concluido",
  REJECTED: "Recusado",
};

function formatDate(value: string | null): string {
  if (!value) return "Nao registrado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function maskCpf(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 4) return "***";
  return `***.***.***-${digits.slice(-2)}`;
}

export function MinhaPrivacidadePage() {
  const [data, setData] = useState<UserPrivacyData | null>(null);
  const [type, setType] = useState<PrivacyRequestType>("ACCESS");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<UserPrivacyData>("/users/me/privacy")
      .then(setData)
      .catch(() => setError("Nao foi possivel carregar seus dados de privacidade."))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    if (!data) return [];
    return [
      { label: "Compras recentes", value: data.user.transactions.length },
      { label: "Jogadas recentes", value: data.user.gameplayLogs.length },
      { label: "Pedidos recentes", value: data.user.productOrders.length },
      { label: "Solicitacoes LGPD", value: data.user.privacyRequests.length },
    ];
  }, [data]);

  async function submitRequest(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setSaving(true);
    try {
      const created = await apiRequest<PrivacyRequest>("/users/me/privacy-requests", {
        method: "POST",
        body: { type, message },
      });
      setData((current) =>
        current
          ? {
              ...current,
              user: { ...current.user, privacyRequests: [created, ...current.user.privacyRequests] },
            }
          : current,
      );
      setMessage("");
      setType("ACCESS");
      setFeedback("Solicitacao registrada. A equipe ira analisar e responder pelo canal oficial.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel registrar a solicitacao.");
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
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-yellow">LGPD</p>
          <h1 className="mt-2 text-3xl font-black text-white">Minha privacidade</h1>
          <p className="mt-2 text-sm font-medium text-white/65">
            Consulte seus dados principais e registre pedidos sobre privacidade.
          </p>
        </div>
      </section>

      {loading && (
        <div className="rounded-3xl bg-white/85 p-8 text-center text-sm font-bold text-gray-500 shadow-sm">
          Carregando dados...
        </div>
      )}

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
      {feedback && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{feedback}</p>}

      {data && (
        <>
          <section className="grid grid-cols-2 gap-2">
            {summary.map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/90 p-4 text-center shadow-sm">
                <p className="text-2xl font-black text-brand-black">{item.value}</p>
                <p className="text-[11px] font-black uppercase text-gray-500">{item.label}</p>
              </div>
            ))}
          </section>

          <section className="rounded-3xl bg-white/90 p-5 shadow-sm">
            <h2 className="text-xl font-black text-brand-black">Dados cadastrais</h2>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-gray-600">
              <p>Nome: {data.user.name}</p>
              <p>E-mail: {data.user.email}</p>
              <p>CPF: {maskCpf(data.user.cpf)}</p>
              <p>Telefone: {data.user.phone || "Nao informado"}</p>
              <p>Aceite de privacidade: {formatDate(data.user.privacyAcceptedAt)}</p>
              <p>Versao aceita: {data.user.privacyVersion || "Nao registrada"}</p>
            </div>
            <p className="mt-3 text-xs font-semibold text-gray-500">{data.notice}</p>
          </section>

          <section className="rounded-3xl bg-white/90 p-5 shadow-sm">
            <h2 className="text-xl font-black text-brand-black">Nova solicitacao LGPD</h2>
            <form onSubmit={submitRequest} className="mt-4 grid gap-3">
              <select
                value={type}
                onChange={(event) => setType(event.target.value as PrivacyRequestType)}
                className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm font-bold outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/25"
              >
                {Object.entries(requestTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <textarea
                required
                minLength={10}
                maxLength={2000}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-32 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 text-sm font-bold outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/25"
                placeholder="Descreva o que voce precisa."
              />
              <button
                type="submit"
                disabled={saving}
                className="rounded-2xl bg-gradient-to-r from-brand-yellow to-orange-400 px-4 py-3 text-sm font-black text-brand-black shadow-[0_14px_26px_rgba(245,158,11,0.24)] disabled:opacity-60"
              >
                {saving ? "Enviando..." : "Registrar solicitacao"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl bg-white/90 p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-black text-brand-black">Historico de solicitacoes</h2>
              <Link to="/privacidade" className="text-sm font-black text-orange-700">
                Politica
              </Link>
            </div>
            <div className="mt-4 grid gap-3">
              {data.user.privacyRequests.length === 0 && (
                <p className="text-sm font-semibold text-gray-500">Nenhuma solicitacao registrada ainda.</p>
              )}
              {data.user.privacyRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-amber-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-brand-black">{requestTypeLabels[request.type]}</p>
                      <p className="text-xs font-semibold text-gray-500">{formatDate(request.createdAt)}</p>
                    </div>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-orange-700">
                      {statusLabels[request.status]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-gray-600">{request.message}</p>
                  {request.response && (
                    <p className="mt-2 rounded-2xl bg-slate-50 px-3 py-2 text-sm font-semibold text-gray-600">
                      Resposta: {request.response}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
