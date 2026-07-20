import { useEffect, useState, type FormEvent } from "react";
import { apiRequest, ApiError } from "@/lib/api";
import type { UserProfile } from "@/lib/types";
import { useAuthStore } from "@/store/useAuthStore";

type ProfileForm = Omit<UserProfile, "id">;

const emptyForm: ProfileForm = {
  name: "",
  email: "",
  cpf: "",
  phone: "",
  addressZipCode: "",
  addressStreet: "",
  addressNumber: "",
  addressComplement: "",
  addressNeighborhood: "",
  addressCity: "",
  addressState: "",
};

function toForm(profile: UserProfile): ProfileForm {
  return {
    name: profile.name,
    email: profile.email,
    cpf: profile.cpf,
    phone: profile.phone ?? "",
    addressZipCode: profile.addressZipCode ?? "",
    addressStreet: profile.addressStreet ?? "",
    addressNumber: profile.addressNumber ?? "",
    addressComplement: profile.addressComplement ?? "",
    addressNeighborhood: profile.addressNeighborhood ?? "",
    addressCity: profile.addressCity ?? "",
    addressState: profile.addressState ?? "",
  };
}

export function MeuCadastroPage() {
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchNavbarSummary = useAuthStore((state) => state.fetchNavbarSummary);

  useEffect(() => {
    apiRequest<UserProfile>("/users/me/profile")
      .then((profile) => setForm(toForm(profile)))
      .catch(() => setError("Nao foi possivel carregar seu cadastro."))
      .finally(() => setLoading(false));
  }, []);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setFeedback(null);
    setSaving(true);

    try {
      const profile = await apiRequest<UserProfile>("/users/me/profile", {
        method: "PUT",
        body: form,
      });
      setForm(toForm(profile));
      await fetchNavbarSummary();
      setFeedback("Cadastro atualizado com sucesso.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Nao foi possivel salvar seu cadastro.");
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
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-yellow">Minha conta</p>
          <h1 className="mt-2 text-3xl font-black text-white">Meu cadastro</h1>
          <p className="mt-2 text-sm font-medium text-white/65">
            Atualize suas informacoes e deixe seu endereco pronto para calculo de frete.
          </p>
        </div>
      </section>

      {loading && (
        <div className="rounded-3xl bg-white/85 p-8 text-center text-sm font-bold text-gray-500 shadow-sm">
          Carregando cadastro...
        </div>
      )}

      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p>}
      {feedback && <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{feedback}</p>}

      {!loading && (
        <form onSubmit={handleSubmit} className="grid gap-4">
          <section className="rounded-3xl bg-white/90 p-5 shadow-sm">
            <h2 className="text-xl font-black text-brand-black">Informacoes pessoais</h2>
            <div className="mt-4 grid gap-3">
              <TextField label="Nome" value={form.name} onChange={(value) => updateField("name", value)} required />
              <TextField label="E-mail" type="email" value={form.email} onChange={(value) => updateField("email", value)} required />
              <TextField label="CPF" value={form.cpf} onChange={(value) => updateField("cpf", value)} required />
              <TextField label="Telefone" value={form.phone ?? ""} onChange={(value) => updateField("phone", value)} />
            </div>
          </section>

          <section className="rounded-3xl bg-white/90 p-5 shadow-sm">
            <h2 className="text-xl font-black text-brand-black">Endereco para entrega</h2>
            <div className="mt-4 grid gap-3">
              <TextField label="CEP" value={form.addressZipCode ?? ""} onChange={(value) => updateField("addressZipCode", value)} />
              <TextField label="Rua / Avenida" value={form.addressStreet ?? ""} onChange={(value) => updateField("addressStreet", value)} />
              <div className="grid grid-cols-[0.8fr_1.2fr] gap-3">
                <TextField label="Numero" value={form.addressNumber ?? ""} onChange={(value) => updateField("addressNumber", value)} />
                <TextField label="Complemento" value={form.addressComplement ?? ""} onChange={(value) => updateField("addressComplement", value)} />
              </div>
              <TextField label="Bairro" value={form.addressNeighborhood ?? ""} onChange={(value) => updateField("addressNeighborhood", value)} />
              <div className="grid grid-cols-[1fr_5rem] gap-3">
                <TextField label="Cidade" value={form.addressCity ?? ""} onChange={(value) => updateField("addressCity", value)} />
                <TextField
                  label="UF"
                  maxLength={2}
                  value={form.addressState ?? ""}
                  onChange={(value) => updateField("addressState", value.toUpperCase())}
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="rounded-2xl bg-gradient-to-r from-brand-yellow to-orange-400 px-4 py-4 text-sm font-black uppercase tracking-wide text-brand-black shadow-[0_14px_26px_rgba(245,158,11,0.24)] transition active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar cadastro"}
          </button>
        </form>
      )}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-xs font-black uppercase text-gray-500">{label}</span>
      <input
        type={type}
        required={required}
        maxLength={maxLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border border-amber-100 bg-amber-50/60 px-4 text-sm font-bold text-brand-black outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/25"
      />
    </label>
  );
}
